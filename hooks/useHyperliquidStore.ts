'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ProcessedTicker,
  RSIData,
  FundingRateData,
  MarketCapData,
  HyperliquidRawTicker,
} from '@/lib/types';
import { HyperliquidDataManager } from '@/lib/api/hyperliquid-data-manager';
import { fetchHyperliquidRSIBatch } from '@/lib/api/hyperliquid-rsi';
import { fetchHyperliquidSpotSymbols } from '@/lib/api/hyperliquid-rest';
import { fetchMarketCapData } from '@/lib/api/coingecko';
import { isMemeToken, getRsiSignal } from '@/lib/utils';
import { TIMING } from '@/lib/constants';
import {
  getHlRsiCache,
  setHlRsiCache,
  getMarketCapCache,
  setMarketCapCache,
  checkVersionAndClearCache,
  getHlFavoritesCache,
  setHlFavoritesCache,
  getHlColumnsCache,
  setHlColumnsCache,
  getHlColumnOrderCache,
  setHlColumnOrderCache,
} from '@/lib/cache';
import { DEFAULT_COLUMN_ORDER, getDefaultColumns } from '@/lib/defaults';
import { ColumnVisibility, ColumnKey, Filters, SortConfig } from '@/lib/types';
import { FIXED_COLUMNS } from '@/lib/constants';
import { isMobile } from '@/lib/utils';
import { usePagination } from './usePagination';

export function useHyperliquidStore() {
  // Core data
  const [tickers, setTickers] = useState<Map<string, ProcessedTicker>>(new Map());
  const [rsiData, setRsiData] = useState<Map<string, RSIData>>(new Map());
  const [fundingRateData, setFundingRateData] = useState<Map<string, FundingRateData>>(new Map());
  const [marketCapData, setMarketCapData] = useState<Map<string, MarketCapData>>(new Map());
  const [spotSymbols, setSpotSymbols] = useState<Set<string>>(new Set());

  // UI State - Manage internally instead of using composed hooks
  const [columns, setColumns] = useState<ColumnVisibility>(getDefaultColumns(isMobile()));
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_COLUMN_ORDER);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>({});
  const [sort, setSort] = useState<SortConfig>({ column: 'rank', direction: 'asc' });
  const [view, setViewState] = useState<'market' | 'favorites'>('market');
  const [searchTerm, setSearchTermInternal] = useState('');

  // Pagination
  const paginationHook = usePagination();

  // Status
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('live');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rsiProgress, setRsiProgress] = useState('');
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Refs for WebSocket and intervals
  const dataManagerRef = useRef<HyperliquidDataManager | null>(null);
  const isFetchingRsiRef = useRef(false);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Save RSI data to cache (debounced)
  const saveRsiCacheTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveRsiCacheDebounced = useCallback((rsiMap: Map<string, RSIData>) => {
    if (saveRsiCacheTimeoutRef.current) {
      clearTimeout(saveRsiCacheTimeoutRef.current);
    }
    saveRsiCacheTimeoutRef.current = setTimeout(() => {
      setHlRsiCache(rsiMap);
    }, TIMING.RSI_CACHE_SAVE_DEBOUNCE);
  }, []);

  // Load caches on mount
  useEffect(() => {
    const cachedRsi = getHlRsiCache();
    if (cachedRsi && cachedRsi.size > 0) {
      setRsiData(cachedRsi);
    }

    const savedFavorites = getHlFavoritesCache();
    if (savedFavorites.length > 0) {
      setFavorites(savedFavorites);
    }

    const savedColumnOrder = getHlColumnOrderCache();
    if (savedColumnOrder && Array.isArray(savedColumnOrder)) {
      const savedSet = new Set(savedColumnOrder);
      const defaultSet = new Set(DEFAULT_COLUMN_ORDER);

      const mergedOrder = savedColumnOrder.filter((col) => defaultSet.has(col as ColumnKey));
      const fixedCols = FIXED_COLUMNS as readonly ColumnKey[];
      const newColumns = DEFAULT_COLUMN_ORDER.filter(col =>
        !savedSet.has(col) && !fixedCols.includes(col)
      );

      const nonFixedPart = mergedOrder.filter((col) => !fixedCols.includes(col as ColumnKey));
      const finalOrder: ColumnKey[] = [...fixedCols, ...nonFixedPart as ColumnKey[], ...newColumns];

      setColumnOrder(finalOrder);
      setHlColumnOrderCache(finalOrder);
    }

    const savedColumns = getHlColumnsCache<ColumnVisibility>();
    if (savedColumns) {
      setColumns(savedColumns);
    } else {
      const defaultCols = getDefaultColumns(isMobile());
      setColumns(defaultCols);
    }
  }, []);

  // Update RSI data for single instrument
  const updateRsiData = useCallback((instId: string, data: RSIData) => {
    setRsiData(prev => {
      const newMap = new Map(prev);
      newMap.set(instId, data);
      saveRsiCacheDebounced(newMap);
      return newMap;
    });
  }, [saveRsiCacheDebounced]);

  // Extract funding rates from ticker rawData
  const extractFundingRates = useCallback((tickerMap: Map<string, ProcessedTicker>) => {
    const fundingRates = new Map<string, FundingRateData>();

    tickerMap.forEach((ticker, instId) => {
      if (ticker.rawData) {
        const hlData = ticker.rawData as HyperliquidRawTicker;
        if (hlData.funding !== undefined) {
          const fundingRate = parseFloat(hlData.funding) || 0;
          fundingRates.set(instId, {
            fundingRate,
            nextFundingRate: fundingRate,
            fundingTime: Date.now(),
            nextFundingTime: Date.now() + 3600 * 1000,
            settlementInterval: 1, // Hyperliquid settlement is 1 hour
            lastUpdated: Date.now(),
          });
        }
      }
    });

    setFundingRateData(fundingRates);
  }, []);

  // Get sorted instrument IDs by market cap rank
  const getSortedInstIds = useCallback((tickerMap: Map<string, ProcessedTicker>) => {
    return Array.from(tickerMap.values())
      .sort((a, b) => {
        const rankA = marketCapData.get(a.baseSymbol)?.rank ?? 9999;
        const rankB = marketCapData.get(b.baseSymbol)?.rank ?? 9999;
        return rankA - rankB;
      })
      .map(t => t.instId);
  }, [marketCapData]);

  // Fetch RSI for all items (initial load)
  const fetchRsiForVisible = useCallback(async (tickerMap: Map<string, ProcessedTicker>) => {
    if (isFetchingRsiRef.current) return;
    isFetchingRsiRef.current = true;

    try {
      const instIds = getSortedInstIds(tickerMap);
      await fetchHyperliquidRSIBatch(
        instIds,
        rsiData,
        setRsiProgress,
        updateRsiData
      );
    } finally {
      isFetchingRsiRef.current = false;
    }
  }, [getSortedInstIds, rsiData, updateRsiData]);

  // Fetch RSI for specific tier only
  const fetchRsiForTier = useCallback(async (
    tickerMap: Map<string, ProcessedTicker>,
    tier: 'top50' | 'tier2' | 'tier3'
  ) => {
    if (isFetchingRsiRef.current) return;
    isFetchingRsiRef.current = true;

    try {
      const instIds = getSortedInstIds(tickerMap);
      await fetchHyperliquidRSIBatch(
        instIds,
        rsiData,
        setRsiProgress,
        updateRsiData,
        tier
      );
    } finally {
      isFetchingRsiRef.current = false;
    }
  }, [getSortedInstIds, rsiData, updateRsiData]);

  // Market cap cache helpers
  const saveMarketCapCacheLocal = useCallback((data: Map<string, MarketCapData>) => {
    setMarketCapCache(data);
  }, []);

  const loadMarketCapCacheLocal = useCallback((): Map<string, MarketCapData> | null => {
    return getMarketCapCache();
  }, []);

  // Initialize Hyperliquid data manager
  const initialize = useCallback(async () => {
    // Check app version and clear data cache if version changed
    checkVersionAndClearCache();

    // Try to load cached market cap first for instant display
    const cachedMarketCap = loadMarketCapCacheLocal();
    if (cachedMarketCap) {
      setMarketCapData(cachedMarketCap);
    }

    // Fetch spot symbols (which perp tokens have spot trading on Hyperliquid)
    fetchHyperliquidSpotSymbols().then((spotData: Set<string>) => {
      console.log(`[Hyperliquid] Received ${spotData.size} spot symbols`);
      setSpotSymbols(spotData);
    }).catch((error: unknown) => {
      console.error('[Hyperliquid] Failed to fetch spot symbols:', error);
    });

    // Fetch CoinGecko data separately (slower, shouldn't block HL data)
    fetchMarketCapData().then((marketCap: Map<string, MarketCapData>) => {
      console.log(`[MarketCap] Received ${marketCap.size} coins from CoinGecko`);
      setMarketCapData(marketCap);
      saveMarketCapCacheLocal(marketCap);
    }).catch((error: unknown) => {
      console.error('[MarketCap] Failed to fetch:', error);
    });

    // Initialize Hyperliquid data manager
    const handleTickerUpdate = (newTickers: Map<string, ProcessedTicker>) => {
      setTickers(newTickers);
      // Extract funding rates from ticker data on each update
      extractFundingRates(newTickers);
    };

    const handleStatusUpdate = (newStatus: 'connecting' | 'live' | 'error', time?: Date) => {
      setStatus(newStatus);
      if (time) setLastUpdate(time);
    };

    dataManagerRef.current = new HyperliquidDataManager(handleTickerUpdate, handleStatusUpdate);
    await dataManagerRef.current.start();

    // Fetch RSI for initial data after tickers are loaded
    const initialRsiTimeout = setTimeout(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForVisible(currentTickers);
      }
    }, TIMING.INITIAL_RSI_FETCH_DELAY);
    timeoutsRef.current.push(initialRsiTimeout);

    // Setup tiered RSI refresh intervals
    const rsiTop50Interval = setInterval(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForTier(currentTickers, 'top50');
      }
    }, TIMING.RSI_REFRESH_TOP50);
    intervalsRef.current.push(rsiTop50Interval);

    const rsiTier2Interval = setInterval(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForTier(currentTickers, 'tier2');
      }
    }, TIMING.RSI_REFRESH_TIER2);
    intervalsRef.current.push(rsiTier2Interval);

    const rsiTier3Interval = setInterval(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForTier(currentTickers, 'tier3');
      }
    }, TIMING.RSI_REFRESH_TIER3);
    intervalsRef.current.push(rsiTier3Interval);

    // Refresh market cap
    const marketCapInterval = setInterval(async () => {
      const newMarketCap = await fetchMarketCapData();
      setMarketCapData(newMarketCap);
      saveMarketCapCacheLocal(newMarketCap);
    }, TIMING.MARKET_CAP_REFRESH);
    intervalsRef.current.push(marketCapInterval);

  }, [fetchRsiForVisible, fetchRsiForTier, loadMarketCapCacheLocal, saveMarketCapCacheLocal, extractFundingRates]);

  // Cleanup - clear all intervals, timeouts, and stop data manager
  const cleanup = useCallback(() => {
    // Clear all intervals
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Clear all timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Clear RSI cache save timeout
    if (saveRsiCacheTimeoutRef.current) {
      clearTimeout(saveRsiCacheTimeoutRef.current);
      saveRsiCacheTimeoutRef.current = null;
    }

    // Stop data manager
    dataManagerRef.current?.stop();
    dataManagerRef.current = null;
  }, []);

  // Get filtered and sorted data
  const getFilteredData = useCallback((): ProcessedTicker[] => {
    let filtered = Array.from(tickers.values());

    // Search filter - supports pipe-separated terms (e.g., "ETH|SOL|BTC")
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split('|').map(t => t.trim()).filter(t => t);
      if (terms.length === 1) {
        filtered = filtered.filter(t => t.instId.toLowerCase().includes(terms[0]));
      } else {
        filtered = filtered.filter(t => terms.some(term => t.baseSymbol.toLowerCase() === term));
      }
    }

    // Favorites view
    if (view === 'favorites') {
      filtered = filtered.filter(t => favorites.includes(t.instId));
    }

    // Apply filters
    if (filters.rank) {
      const sortedByMarketCap = [...filtered].sort((a, b) => {
        const rankA = marketCapData.get(a.baseSymbol)?.rank ?? 9999;
        const rankB = marketCapData.get(b.baseSymbol)?.rank ?? 9999;
        return rankA - rankB;
      });

      const getTopN = (n: number) => new Set(sortedByMarketCap.slice(0, n).map(t => t.instId));
      const getRangeSet = (start: number, end: number) => new Set(sortedByMarketCap.slice(start - 1, end).map(t => t.instId));

      if (filters.rank === '1-25') {
        const top25Set = getTopN(25);
        filtered = filtered.filter(t => top25Set.has(t.instId));
      } else if (filters.rank === '1-20') {
        const top20Set = getTopN(20);
        filtered = filtered.filter(t => top20Set.has(t.instId));
      } else if (filters.rank === '21-50') {
        const rangeSet = getRangeSet(21, 50);
        filtered = filtered.filter(t => rangeSet.has(t.instId));
      } else if (filters.rank === '51-100') {
        const rangeSet = getRangeSet(51, 100);
        filtered = filtered.filter(t => rangeSet.has(t.instId));
      } else if (filters.rank === '101-500') {
        const rangeSet = getRangeSet(101, 500);
        filtered = filtered.filter(t => rangeSet.has(t.instId));
      } else if (filters.rank === '>500') {
        filtered = filtered.filter(t => !marketCapData.get(t.baseSymbol)?.rank);
      }
    }

    // RSI filter helper function
    const applyRsiFilter = (rsiValue: number | null | undefined, filterValue: string): boolean => {
      if (rsiValue === null || rsiValue === undefined) return false;
      if (filterValue.includes('~')) {
        const [minStr, maxStr] = filterValue.split('~');
        const min = minStr ? parseInt(minStr) : 0;
        const max = maxStr ? parseInt(maxStr) : 100;
        return rsiValue >= min && rsiValue <= max;
      } else if (filterValue.startsWith('<')) {
        const threshold = parseInt(filterValue.slice(1));
        return rsiValue < threshold;
      } else if (filterValue.startsWith('>')) {
        const threshold = parseInt(filterValue.slice(1));
        return rsiValue > threshold;
      }
      return true;
    };

    if (filters.rsi7) {
      const rsi7Filter = filters.rsi7;
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsi7, rsi7Filter));
    }
    if (filters.rsi14) {
      const rsi14Filter = filters.rsi14;
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsi14, rsi14Filter));
    }
    if (filters.rsiW7) {
      const rsiW7Filter = filters.rsiW7;
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsiW7, rsiW7Filter));
    }
    if (filters.rsiW14) {
      const rsiW14Filter = filters.rsiW14;
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsiW14, rsiW14Filter));
    }

    if (filters.hasSpot) {
      filtered = filtered.filter(t => {
        const hasSpot = spotSymbols.has(t.baseSymbol);
        return filters.hasSpot === 'yes' ? hasSpot : !hasSpot;
      });
    }

    if (filters.fundingRate) {
      if (filters.fundingRate === 'positive') {
        filtered = filtered.filter(t => {
          const fr = fundingRateData.get(t.instId)?.fundingRate;
          return fr !== undefined && fr > 0;
        });
      } else if (filters.fundingRate === 'negative') {
        filtered = filtered.filter(t => {
          const fr = fundingRateData.get(t.instId)?.fundingRate;
          return fr !== undefined && fr < 0;
        });
      }
    }

    if (filters.marketCapMin) {
      filtered = filtered.filter(t => {
        const cap = marketCapData.get(t.baseSymbol)?.marketCap;
        if (cap === undefined) return false;

        const capInMillions = cap / 1000000;

        switch (filters.marketCapMin) {
          case '0-20':
            return capInMillions <= 20;
          case '20-100':
            return capInMillions > 20 && capInMillions <= 100;
          case '100-1000':
            return capInMillions > 100 && capInMillions <= 1000;
          case '1000+':
            return capInMillions > 1000;
          default:
            return true;
        }
      });
    }

    if (filters.isMeme) {
      filtered = filtered.filter(t => {
        const isMeme = isMemeToken(t.baseSymbol);
        return filters.isMeme === 'yes' ? isMeme : !isMeme;
      });
    }

    // D-RSI Avg Signal filter
    if (filters.dRsiSignal && filters.dRsiSignal.length > 0) {
      const dRsiSignalFilter = filters.dRsiSignal;
      filtered = filtered.filter(t => {
        const rsi = rsiData.get(t.instId);
        if (!rsi) return false;
        const signalInfo = getRsiSignal(rsi.rsi7, rsi.rsi14);
        return dRsiSignalFilter.includes(signalInfo.signal);
      });
    }

    // W-RSI Avg Signal filter
    if (filters.wRsiSignal && filters.wRsiSignal.length > 0) {
      const wRsiSignalFilter = filters.wRsiSignal;
      filtered = filtered.filter(t => {
        const rsi = rsiData.get(t.instId);
        if (!rsi) return false;
        const signalInfo = getRsiSignal(rsi.rsiW7, rsi.rsiW14);
        return wRsiSignalFilter.includes(signalInfo.signal);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sort.column) {
        case 'symbol':
          aVal = a.instId;
          bVal = b.instId;
          break;
        case 'price':
          aVal = a.priceNum;
          bVal = b.priceNum;
          break;
        case 'change':
          aVal = a.changeNum;
          bVal = b.changeNum;
          break;
        case 'change4h':
          aVal = rsiData.get(a.instId)?.change4h ?? -9999;
          bVal = rsiData.get(b.instId)?.change4h ?? -9999;
          break;
        case 'change7d':
          aVal = rsiData.get(a.instId)?.change7d ?? -9999;
          bVal = rsiData.get(b.instId)?.change7d ?? -9999;
          break;
        case 'rank':
          aVal = marketCapData.get(a.baseSymbol)?.marketCap ?? 0;
          bVal = marketCapData.get(b.baseSymbol)?.marketCap ?? 0;
          if (sort.direction === 'asc') {
            return (bVal as number) - (aVal as number);
          } else {
            return (aVal as number) - (bVal as number);
          }
        case 'marketCap':
          aVal = marketCapData.get(a.baseSymbol)?.marketCap ?? 0;
          bVal = marketCapData.get(b.baseSymbol)?.marketCap ?? 0;
          break;
        case 'volume24h':
          aVal = (parseFloat(a.volCcy24h) || 0) * a.priceNum;
          bVal = (parseFloat(b.volCcy24h) || 0) * b.priceNum;
          break;
        case 'rsi7':
          aVal = rsiData.get(a.instId)?.rsi7 ?? 0;
          bVal = rsiData.get(b.instId)?.rsi7 ?? 0;
          break;
        case 'rsi14':
          aVal = rsiData.get(a.instId)?.rsi14 ?? 0;
          bVal = rsiData.get(b.instId)?.rsi14 ?? 0;
          break;
        case 'rsiW7':
          aVal = rsiData.get(a.instId)?.rsiW7 ?? 0;
          bVal = rsiData.get(b.instId)?.rsiW7 ?? 0;
          break;
        case 'rsiW14':
          aVal = rsiData.get(a.instId)?.rsiW14 ?? 0;
          bVal = rsiData.get(b.instId)?.rsiW14 ?? 0;
          break;
        case 'fundingRate':
          aVal = fundingRateData.get(a.instId)?.fundingRate ?? 0;
          bVal = fundingRateData.get(b.instId)?.fundingRate ?? 0;
          break;
        case 'fundingApr':
          const frA = fundingRateData.get(a.instId);
          const frB = fundingRateData.get(b.instId);
          const aprA = frA ? frA.fundingRate * ((365 * 24) / (frA.settlementInterval || 1)) : 0;
          const aprB = frB ? frB.fundingRate * ((365 * 24) / (frB.settlementInterval || 1)) : 0;
          aVal = aprA;
          bVal = aprB;
          break;
        case 'fundingInterval':
          aVal = fundingRateData.get(a.instId)?.settlementInterval ?? 1;
          bVal = fundingRateData.get(b.instId)?.settlementInterval ?? 1;
          break;
        case 'hasSpot':
          aVal = spotSymbols.has(a.baseSymbol) ? 1 : 0;
          bVal = spotSymbols.has(b.baseSymbol) ? 1 : 0;
          break;
        default:
          aVal = marketCapData.get(a.baseSymbol)?.rank ?? 9999;
          bVal = marketCapData.get(b.baseSymbol)?.rank ?? 9999;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sort.direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [tickers, searchTerm, view, favorites, filters, sort, marketCapData, rsiData, fundingRateData, spotSymbols]);

  // Calculate RSI averages for Hyperliquid Top 100 by market cap
  const getRsiAverages = useCallback(() => {
    let allTickers = Array.from(tickers.values());

    // Sort by market cap (descending) and take top 100
    const top100 = allTickers
      .filter(t => marketCapData.get(t.baseSymbol)?.marketCap)
      .sort((a, b) => {
        const mcA = marketCapData.get(a.baseSymbol)?.marketCap ?? 0;
        const mcB = marketCapData.get(b.baseSymbol)?.marketCap ?? 0;
        return mcB - mcA;
      })
      .slice(0, 100);

    let rsi7Sum = 0, rsi7Count = 0;
    let rsi14Sum = 0, rsi14Count = 0;
    let rsiW7Sum = 0, rsiW7Count = 0;
    let rsiW14Sum = 0, rsiW14Count = 0;

    top100.forEach(t => {
      const rsi = rsiData.get(t.instId);
      if (rsi?.rsi7 !== undefined && rsi.rsi7 !== null) {
        rsi7Sum += rsi.rsi7;
        rsi7Count++;
      }
      if (rsi?.rsi14 !== undefined && rsi.rsi14 !== null) {
        rsi14Sum += rsi.rsi14;
        rsi14Count++;
      }
      if (rsi?.rsiW7 !== undefined && rsi.rsiW7 !== null) {
        rsiW7Sum += rsi.rsiW7;
        rsiW7Count++;
      }
      if (rsi?.rsiW14 !== undefined && rsi.rsiW14 !== null) {
        rsiW14Sum += rsi.rsiW14;
        rsiW14Count++;
      }
    });

    return {
      avgRsi7: rsi7Count > 0 ? rsi7Sum / rsi7Count : null,
      avgRsi14: rsi14Count > 0 ? rsi14Sum / rsi14Count : null,
      avgRsiW7: rsiW7Count > 0 ? rsiW7Sum / rsiW7Count : null,
      avgRsiW14: rsiW14Count > 0 ? rsiW14Sum / rsiW14Count : null
    };
  }, [tickers, marketCapData, rsiData]);

  // Get top gainers/losers for leaderboard
  const getTopMovers = useCallback((timeframe: '4h' | '24h' | '7d', limit: number = 5) => {
    const allTickers = Array.from(tickers.values());

    const tickersWithChange = allTickers.map(t => {
      const rsi = rsiData.get(t.instId);
      let change: number | null = null;

      if (timeframe === '4h') {
        change = rsi?.change4h ?? null;
      } else if (timeframe === '24h') {
        change = t.changeNum;
      } else if (timeframe === '7d') {
        change = rsi?.change7d ?? null;
      }

      return { ...t, change };
    }).filter(t => t.change !== null);

    const sorted = [...tickersWithChange].sort((a, b) => (b.change ?? 0) - (a.change ?? 0));

    return {
      gainers: sorted.slice(0, limit),
      losers: sorted.slice(-limit).reverse()
    };
  }, [tickers, rsiData]);

  // Get paginated data
  const getPaginatedData = useCallback(() => {
    const filtered = getFilteredData();
    const { currentPage, pageSize } = paginationHook;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / pageSize),
      totalItems: filtered.length
    };
  }, [getFilteredData, paginationHook]);

  // Get quick filter counts
  const getQuickFilterCounts = useCallback(() => {
    const allTickers = Array.from(tickers.values());

    const overboughtCount = allTickers.filter(t => {
      const rsi = rsiData.get(t.instId);
      return rsi && rsi.rsi7 !== null && rsi.rsi14 !== null && rsi.rsi7 > 75 && rsi.rsi14 > 75;
    }).length;

    const oversoldCount = allTickers.filter(t => {
      const rsi = rsiData.get(t.instId);
      return rsi && rsi.rsi7 !== null && rsi.rsi14 !== null && rsi.rsi7 < 25 && rsi.rsi14 < 25;
    }).length;

    return {
      overbought: overboughtCount,
      oversold: oversoldCount
    };
  }, [tickers, rsiData]);

  // Column management
  const updateColumn = useCallback((col: keyof ColumnVisibility, visible: boolean) => {
    setColumns(prev => {
      const updated = { ...prev, [col]: visible };
      setHlColumnsCache(updated);
      return updated;
    });

    if (col === 'logo' && visible) {
      setColumnOrder(prev => {
        if (!prev.includes('logo')) {
          const rankIndex = prev.indexOf('rank');
          const newOrder = [...prev];
          newOrder.splice(rankIndex + 1, 0, 'logo');
          setHlColumnOrderCache(newOrder);
          return newOrder;
        }
        return prev;
      });
    }
  }, []);

  const updateColumnOrder = useCallback((newOrder: ColumnKey[]) => {
    const fixedCols = FIXED_COLUMNS as readonly ColumnKey[];
    const nonFixedOrder = newOrder.filter(col => !fixedCols.includes(col));
    const finalOrder: ColumnKey[] = [...fixedCols, ...nonFixedOrder];

    setColumnOrder(finalOrder);
    setHlColumnOrderCache(finalOrder);
  }, []);

  const moveColumn = useCallback((dragKey: ColumnKey, hoverKey: ColumnKey) => {
    const fixedCols = FIXED_COLUMNS as readonly ColumnKey[];
    if (fixedCols.includes(dragKey) || fixedCols.includes(hoverKey)) {
      return;
    }

    setColumnOrder(prev => {
      const dragIndex = prev.indexOf(dragKey);
      const hoverIndex = prev.indexOf(hoverKey);

      if (dragIndex === -1 || hoverIndex === -1) return prev;

      const newOrder = [...prev];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, dragKey);

      setHlColumnOrderCache(newOrder);
      return newOrder;
    });
  }, []);

  const setColumnsPreset = useCallback((preset: 'all' | 'none' | 'default') => {
    let newColumns: ColumnVisibility;

    if (preset === 'all') {
      newColumns = {
        favorite: true, rank: true, logo: true, symbol: true, price: true,
        fundingRate: true, fundingApr: true, fundingInterval: true,
        change4h: true, change: true, change7d: true,
        volume24h: true, marketCap: true,
        dRsiSignal: true, wRsiSignal: true,
        rsi7: true, rsi14: true, rsiW7: true, rsiW14: true,
        listDate: false, hasSpot: false
      };
    } else if (preset === 'none') {
      newColumns = {
        favorite: true, rank: true, logo: false, symbol: true, price: false,
        fundingRate: false, fundingApr: false, fundingInterval: false,
        change4h: false, change: false, change7d: false,
        volume24h: false, marketCap: false,
        dRsiSignal: false, wRsiSignal: false,
        rsi7: false, rsi14: false, rsiW7: false, rsiW14: false,
        listDate: false, hasSpot: false
      };
    } else {
      newColumns = getDefaultColumns(isMobile());
    }

    setColumns(newColumns);
    setHlColumnsCache(newColumns);
  }, []);

  const setColumnsDirectly = useCallback((newColumns: ColumnVisibility) => {
    setColumns(newColumns);
    setHlColumnsCache(newColumns);
  }, []);

  const setColumnOrderDirectly = useCallback((newOrder: ColumnKey[]) => {
    setColumnOrder(newOrder);
    setHlColumnOrderCache(newOrder);
  }, []);

  // Favorites management
  const toggleFavorite = useCallback((instId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(instId)
        ? prev.filter(f => f !== instId)
        : [...prev, instId];
      setHlFavoritesCache(newFavorites);
      return newFavorites;
    });
  }, []);

  const setFavoritesDirectly = useCallback((newFavorites: string[]) => {
    setFavorites(newFavorites);
    setHlFavoritesCache(newFavorites);
  }, []);

  // Filters management
  const setFilters = useCallback((newFilters: Filters | ((prev: Filters) => Filters)) => {
    setFiltersState(prev => {
      const resolved = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      return resolved;
    });
    paginationHook.resetPage();
  }, [paginationHook]);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    paginationHook.resetPage();
  }, [paginationHook]);

  const hasActiveFilters = useCallback(() => {
    return Object.values(filters).some(v => v !== undefined && v !== '');
  }, [filters]);

  // Sort management
  const updateSort = useCallback((column: string) => {
    setSort(prev => ({
      column,
      direction: prev.column === column
        ? (prev.direction === 'asc' ? 'desc' : 'asc')
        : (column === 'rank' ? 'asc' : 'desc')
    }));
  }, []);

  const setSortDirectly = useCallback((config: SortConfig) => {
    setSort(config);
  }, []);

  // View management
  const setView = useCallback((newView: 'market' | 'favorites') => {
    setViewState(newView);
  }, []);

  // Search management
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermInternal(term);
    paginationHook.resetPage();
  }, [paginationHook]);

  return {
    // Data
    tickers,
    rsiData,
    fundingRateData,
    marketCapData,
    spotSymbols,
    favorites,

    // UI state
    columns,
    columnOrder,
    filters,
    sort,
    view,
    searchTerm,
    status,
    lastUpdate,
    rsiProgress,
    currentPage: paginationHook.currentPage,
    pageSize: paginationHook.pageSize,
    urlInitialized,

    // Actions
    initialize,
    cleanup,
    toggleFavorite,
    updateColumn,
    setColumnsPreset,
    setFilters,
    clearFilters,
    hasActiveFilters,
    updateSort,
    setSortDirectly,
    setView,
    setSearchTerm,
    updateColumnOrder,
    moveColumn,
    setCurrentPage: paginationHook.setCurrentPage,
    setUrlInitialized,

    // Direct setters for URL state sync
    setFavoritesDirectly,
    setColumnsDirectly,
    setColumnOrderDirectly,

    // Derived data
    getFilteredData,
    getRsiAverages,
    getTopMovers,
    getPaginatedData,
    getQuickFilterCounts
  };
}
