'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ProcessedTicker, 
  RSIData, 
  FundingRateData,
  ListingData,
  MarketCapData, 
  ColumnVisibility, 
  ColumnKey,
  Filters, 
  SortConfig 
} from '@/lib/types';
import {
  OKXHybridDataManager,
  fetchSpotSymbols,
  fetchRSIBatch,
  fetchMarketCapData,
  fetchTickersREST,
  fetchFundingRates,
  fetchListingDates
} from '@/lib/okx-api';
import { DEFAULT_COLUMN_ORDER, isMemeToken } from '@/lib/utils';

// Desktop default columns
const DEFAULT_COLUMNS_DESKTOP: ColumnVisibility = {
  favorite: true,
  rank: true,
  logo: true,
  symbol: true,
  price: true,
  fundingRate: false,
  fundingApr: true,
  fundingInterval: false,
  change4h: false,
  change: true,
  change7d: true,
  volume24h: false,
  marketCap: true,
  dRsiSignal: true,
  wRsiSignal: true,
  rsi7: false,
  rsi14: false,
  rsiW7: false,
  rsiW14: false,
  listDate: true,
  hasSpot: false
};

// Mobile default columns (minimal for small screens)
const DEFAULT_COLUMNS_MOBILE: ColumnVisibility = {
  favorite: true,
  rank: true,
  logo: true,
  symbol: true,
  price: true,
  fundingRate: false,
  fundingApr: false,
  fundingInterval: false,
  change4h: false,
  change: true,
  change7d: false,
  volume24h: false,
  marketCap: false,
  dRsiSignal: false,
  wRsiSignal: false,
  rsi7: false,
  rsi14: false,
  rsiW7: false,
  rsiW14: false,
  listDate: false,
  hasSpot: false
};

// Detect mobile device
const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

const DEFAULT_COLUMNS: ColumnVisibility = isMobile() ? DEFAULT_COLUMNS_MOBILE : DEFAULT_COLUMNS_DESKTOP;

export function useMarketStore() {
  // Core data
  const [tickers, setTickers] = useState<Map<string, ProcessedTicker>>(new Map());
  const [rsiData, setRsiData] = useState<Map<string, RSIData>>(new Map());
  const [fundingRateData, setFundingRateData] = useState<Map<string, FundingRateData>>(new Map());
  const [listingData, setListingData] = useState<Map<string, ListingData>>(new Map());
  const [marketCapData, setMarketCapData] = useState<Map<string, MarketCapData>>(new Map());
  const [spotSymbols, setSpotSymbols] = useState<Set<string>>(new Set());
  
  // UI state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnVisibility>(DEFAULT_COLUMNS);
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_COLUMN_ORDER);
  const [filters, setFiltersState] = useState<Filters>({});
  const [sort, setSort] = useState<SortConfig>({ column: 'rank', direction: 'asc' });
  const [view, setView] = useState<'market' | 'favorites'>('market');
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  // Status - Always show 'live' as requested
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('live');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rsiProgress, setRsiProgress] = useState('');
  
  // Refs for WebSocket and intervals
  const dataManagerRef = useRef<OKXHybridDataManager | null>(null);
  const isFetchingRsiRef = useRef(false);
  
  // Load favorites, column order, and filters from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('okx-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }

    const savedColumnOrder = localStorage.getItem('okx-column-order');
    if (savedColumnOrder) {
      try {
        const parsed = JSON.parse(savedColumnOrder);
        if (Array.isArray(parsed)) {
          // Merge saved order with default order to handle new columns
          const savedSet = new Set(parsed);
          const defaultSet = new Set(DEFAULT_COLUMN_ORDER);

          // Start with saved order, but only include columns that still exist
          const mergedOrder = parsed.filter((col: ColumnKey) => defaultSet.has(col));

          // Add any new columns that weren't in saved order (after the fixed columns)
          const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'logo', 'symbol'];
          const newColumns = DEFAULT_COLUMN_ORDER.filter(col =>
            !savedSet.has(col) && !fixedColumns.includes(col)
          );

          // Insert new columns after fixed columns
          const fixedPart = fixedColumns.filter(col => mergedOrder.includes(col) || DEFAULT_COLUMN_ORDER.includes(col));
          const nonFixedPart = mergedOrder.filter((col: ColumnKey) => !fixedColumns.includes(col));

          const finalOrder: ColumnKey[] = [...fixedColumns, ...nonFixedPart, ...newColumns];
          setColumnOrder(finalOrder);
          localStorage.setItem('okx-column-order', JSON.stringify(finalOrder));
        }
      } catch (e) {
        console.error('Failed to parse column order:', e);
      }
    }

    // Load saved filters
    const savedFilters = localStorage.getItem('okx-filters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (e) {
        console.error('Failed to parse filters:', e);
      }
    }

    // Load saved columns visibility
    const savedColumns = localStorage.getItem('okx-columns');
    if (savedColumns) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch (e) {
        console.error('Failed to parse columns:', e);
      }
    } else {
      // No saved columns - apply device-appropriate defaults
      const defaultCols = isMobile() ? DEFAULT_COLUMNS_MOBILE : DEFAULT_COLUMNS_DESKTOP;
      setColumns(defaultCols);
    }
  }, []);
  
  // Save favorites to localStorage
  const toggleFavorite = useCallback((instId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(instId)
        ? prev.filter(f => f !== instId)
        : [...prev, instId];
      localStorage.setItem('okx-favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // Save filters to localStorage
  const setFilters = useCallback((newFilters: Filters | ((prev: Filters) => Filters)) => {
    setFiltersState(prev => {
      const resolved = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      localStorage.setItem('okx-filters', JSON.stringify(resolved));
      return resolved;
    });
  }, []);
  
  // Update column order (for drag and drop)
  const updateColumnOrder = useCallback((newOrder: ColumnKey[]) => {
    // Ensure fixed columns stay in place
    const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'logo', 'symbol'];
    const nonFixedOrder = newOrder.filter(col => !fixedColumns.includes(col));
    const finalOrder: ColumnKey[] = [...fixedColumns, ...nonFixedOrder];
    
    setColumnOrder(finalOrder);
    localStorage.setItem('okx-column-order', JSON.stringify(finalOrder));
  }, []);
  
  // Move a column to a new position
  const moveColumn = useCallback((dragKey: ColumnKey, hoverKey: ColumnKey) => {
    // Fixed columns cannot be moved
    const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'logo', 'symbol'];
    if (fixedColumns.includes(dragKey) || fixedColumns.includes(hoverKey)) {
      return;
    }
    
    setColumnOrder(prev => {
      const dragIndex = prev.indexOf(dragKey);
      const hoverIndex = prev.indexOf(hoverKey);
      
      if (dragIndex === -1 || hoverIndex === -1) return prev;
      
      const newOrder = [...prev];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, dragKey);
      
      localStorage.setItem('okx-column-order', JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);
  
  // Save RSI data to localStorage (debounced)
  const saveRsiCacheTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveRsiCache = useCallback((rsiMap: Map<string, RSIData>) => {
    // Debounce: only save after 2 seconds of no updates
    if (saveRsiCacheTimeoutRef.current) {
      clearTimeout(saveRsiCacheTimeoutRef.current);
    }
    saveRsiCacheTimeoutRef.current = setTimeout(() => {
      try {
        const cacheData = {
          timestamp: Date.now(),
          data: Object.fromEntries(rsiMap)
        };
        localStorage.setItem('okx-rsi-cache', JSON.stringify(cacheData));
      } catch (e) {
        console.error('Failed to save RSI cache:', e);
      }
    }, 2000);
  }, []);

  // Load RSI cache from localStorage on mount
  useEffect(() => {
    const savedRsiCache = localStorage.getItem('okx-rsi-cache');
    if (savedRsiCache) {
      try {
        const { timestamp, data } = JSON.parse(savedRsiCache);
        const cacheAge = Date.now() - timestamp;
        // Use cache if less than 30 minutes old
        if (cacheAge < 30 * 60 * 1000 && data) {
          const rsiMap = new Map<string, RSIData>(Object.entries(data));
          setRsiData(rsiMap);
          console.log(`Loaded ${rsiMap.size} RSI entries from cache (${Math.round(cacheAge / 1000 / 60)}min old)`);
        }
      } catch (e) {
        console.error('Failed to load RSI cache:', e);
      }
    }
  }, []);

  // Update RSI data for single instrument
  const updateRsiData = useCallback((instId: string, data: RSIData) => {
    setRsiData(prev => {
      const newMap = new Map(prev);
      newMap.set(instId, data);
      saveRsiCache(newMap);
      return newMap;
    });
  }, []);
  
  // Get sorted instrument IDs by market cap rank
  const getSortedInstIds = useCallback((tickerMap: Map<string, ProcessedTicker>) => {
    return Array.from(tickerMap.values())
      .filter(t => t.instId.includes('-USDT-'))
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
      await fetchRSIBatch(
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
      await fetchRSIBatch(
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
  
  // Save market cap cache
  const saveMarketCapCache = useCallback((data: Map<string, MarketCapData>) => {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: Object.fromEntries(data)
      };
      localStorage.setItem('okx-marketcap-cache', JSON.stringify(cacheData));
    } catch (e) {
      console.error('Failed to save market cap cache:', e);
    }
  }, []);

  // Load market cap cache
  const loadMarketCapCache = useCallback((): Map<string, MarketCapData> | null => {
    try {
      const saved = localStorage.getItem('okx-marketcap-cache');
      if (saved) {
        const { timestamp, data } = JSON.parse(saved);
        const cacheAge = Date.now() - timestamp;
        // Use cache if less than 30 minutes old
        if (cacheAge < 30 * 60 * 1000 && data) {
          console.log(`Loaded market cap from cache (${Math.round(cacheAge / 1000 / 60)}min old)`);
          return new Map(Object.entries(data)) as Map<string, MarketCapData>;
        }
      }
    } catch (e) {
      console.error('Failed to load market cap cache:', e);
    }
    return null;
  }, []);

  // Initialize hybrid data manager (WebSocket for TOP 50 + REST for rest)
  const initialize = useCallback(async () => {
    // Try to load cached market cap first for instant display
    const cachedMarketCap = loadMarketCapCache();
    if (cachedMarketCap) {
      setMarketCapData(cachedMarketCap);
    }

    // Fetch OKX data first (fast, doesn't block)
    const [spotData, listings, fundingRates] = await Promise.all([
      fetchSpotSymbols(),
      fetchListingDates(),
      fetchFundingRates()
    ]);

    setSpotSymbols(spotData);
    setListingData(listings);
    setFundingRateData(fundingRates);

    // Fetch CoinGecko data separately (slower, shouldn't block OKX data)
    // This runs in background and updates UI as data arrives
    fetchMarketCapData().then((marketCap) => {
      console.log(`[MarketCap] Received ${marketCap.size} coins from CoinGecko`);
      setMarketCapData(marketCap);
      saveMarketCapCache(marketCap);
    }).catch((error) => {
      console.error('[MarketCap] Failed to fetch:', error);
    });
    
    // Initialize hybrid data manager
    const handleTickerUpdate = (newTickers: Map<string, ProcessedTicker>) => {
      setTickers(newTickers);
    };
    
    const handleStatusUpdate = (newStatus: 'connecting' | 'live' | 'error', time?: Date) => {
      setStatus(newStatus);
      if (time) setLastUpdate(time);
    };
    
    dataManagerRef.current = new OKXHybridDataManager(handleTickerUpdate, handleStatusUpdate);
    await dataManagerRef.current.start();
    
    // Fetch RSI for initial data after tickers are loaded
    setTimeout(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForVisible(currentTickers);
      }
    }, 2000);

    // Setup tiered RSI refresh intervals:
    // Top 50: every 2 minutes
    // 51-100: every 5 minutes
    // 101+: every 10 minutes

    // Top 50 RSI refresh (every 2 minutes)
    setInterval(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForTier(currentTickers, 'top50');
      }
    }, 2 * 60 * 1000);

    // Tier 2 (51-100) RSI refresh (every 5 minutes)
    setInterval(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForTier(currentTickers, 'tier2');
      }
    }, 5 * 60 * 1000);

    // Tier 3 (101+) RSI refresh (every 10 minutes)
    setInterval(() => {
      const currentTickers = dataManagerRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForTier(currentTickers, 'tier3');
      }
    }, 10 * 60 * 1000);

    // Refresh market cap every 5 minutes
    setInterval(async () => {
      const newMarketCap = await fetchMarketCapData();
      setMarketCapData(newMarketCap);
      saveMarketCapCache(newMarketCap);
    }, 5 * 60 * 1000);
    
    // Refresh funding rates every 5 minutes
    setInterval(async () => {
      const newFundingRates = await fetchFundingRates();
      setFundingRateData(newFundingRates);
    }, 5 * 60 * 1000);
    
  }, [fetchRsiForVisible, fetchRsiForTier]);
  
  // Cleanup
  const cleanup = useCallback(() => {
    dataManagerRef.current?.stop();
  }, []);
  
  // Column management
  const updateColumn = useCallback((col: keyof ColumnVisibility, visible: boolean) => {
    setColumns(prev => ({ ...prev, [col]: visible }));
    
    // If enabling logo and it's not in columnOrder, add it in the correct position
    if (col === 'logo' && visible) {
      setColumnOrder(prev => {
        if (!prev.includes('logo')) {
          // Insert logo between rank and symbol
          const rankIndex = prev.indexOf('rank');
          const newOrder = [...prev];
          newOrder.splice(rankIndex + 1, 0, 'logo');
          localStorage.setItem('okx-column-order', JSON.stringify(newOrder));
          return newOrder;
        }
        return prev;
      });
    }
  }, []);
  
  const setColumnsPreset = useCallback((preset: 'all' | 'none' | 'default') => {
    if (preset === 'all') {
      setColumns({
        favorite: true,
        rank: true,
        logo: true,
        symbol: true,
        price: true,
        fundingRate: true,
        fundingApr: true,
        fundingInterval: true,
        change4h: true,
        change: true,
        change7d: true,
        volume24h: true,
        marketCap: true,
        dRsiSignal: true,
        wRsiSignal: true,
        rsi7: true,
        rsi14: true,
        rsiW7: true,
        rsiW14: true,
        listDate: true,
        hasSpot: false  // Keep hidden - use No Spot quick filter instead
      });
    } else if (preset === 'none') {
      setColumns({
        favorite: true,
        rank: true,
        logo: false,
        symbol: true,
        price: false,
        fundingRate: false,
        fundingApr: false,
        fundingInterval: false,
        change4h: false,
        change: false,
        change7d: false,
        volume24h: false,
        marketCap: false,
        dRsiSignal: false,
        wRsiSignal: false,
        rsi7: false,
        rsi14: false,
        rsiW7: false,
        rsiW14: false,
        listDate: false,
        hasSpot: false
      });
    } else {
      setColumns(DEFAULT_COLUMNS);
    }
  }, []);
  
  // Sorting
  const updateSort = useCallback((column: string) => {
    setSort(prev => ({
      column,
      direction: prev.column === column 
        ? (prev.direction === 'asc' ? 'desc' : 'asc')
        : (column === 'rank' ? 'asc' : 'desc')
    }));
  }, []);
  
  // Get filtered and sorted data
  const getFilteredData = useCallback((): ProcessedTicker[] => {
    let filtered = Array.from(tickers.values());
    
    // Filter by USDT swap
    filtered = filtered.filter(t => t.instId.includes('-USDT-'));
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => t.instId.toLowerCase().includes(term));
    }
    
    // Favorites view
    if (view === 'favorites') {
      filtered = filtered.filter(t => favorites.includes(t.instId));
    }
    
    // Apply filters
    if (filters.rank) {
      // For Top N filters, we need to get the top N by market cap among OKX perps
      // First sort all filtered tokens by market cap rank
      const sortedByMarketCap = [...filtered].sort((a, b) => {
        const rankA = marketCapData.get(a.baseSymbol)?.rank ?? 9999;
        const rankB = marketCapData.get(b.baseSymbol)?.rank ?? 9999;
        return rankA - rankB;
      });

      // Create a set of top N instIds
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
    
    // RSI filter helper function - supports <N, >N, and N~M (range)
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
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsi7, filters.rsi7!));
    }

    if (filters.rsi14) {
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsi14, filters.rsi14!));
    }

    // Weekly RSI7 filter
    if (filters.rsiW7) {
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsiW7, filters.rsiW7!));
    }

    // Weekly RSI14 filter
    if (filters.rsiW14) {
      filtered = filtered.filter(t => applyRsiFilter(rsiData.get(t.instId)?.rsiW14, filters.rsiW14!));
    }
    
    if (filters.hasSpot) {
      filtered = filtered.filter(t => {
        const baseQuote = `${t.baseSymbol}-USDT`;
        const hasSpot = spotSymbols.has(baseQuote);
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
    
    // Market cap filter (range-based)
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
    
    // Listing age filter
    if (filters.listAge) {
      const now = Date.now();
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const twoYears = 2 * oneYear;

      filtered = filtered.filter(t => {
        const listTime = listingData.get(t.instId)?.listTime;
        if (!listTime) return false;

        const age = now - listTime;

        switch (filters.listAge) {
          case '<1y':
            return age <= oneYear;
          case '1-2y':
            return age > oneYear && age <= twoYears;
          case '>2y':
            return age > twoYears;
          default:
            return true;
        }
      });
    }

    // Meme token filter
    if (filters.isMeme) {
      filtered = filtered.filter(t => {
        const isMeme = isMemeToken(t.baseSymbol);
        return filters.isMeme === 'yes' ? isMeme : !isMeme;
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
          // Sort by market cap value (larger = better rank)
          aVal = marketCapData.get(a.baseSymbol)?.marketCap ?? 0;
          bVal = marketCapData.get(b.baseSymbol)?.marketCap ?? 0;
          // Reverse for rank: higher market cap = lower rank number
          if (sort.direction === 'asc') {
            return (bVal as number) - (aVal as number); // desc by marketCap = asc by rank
          } else {
            return (aVal as number) - (bVal as number); // asc by marketCap = desc by rank
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
        case 'hasSpot':
          const aBase = `${a.baseSymbol}-USDT`;
          const bBase = `${b.baseSymbol}-USDT`;
          aVal = spotSymbols.has(aBase) ? 1 : 0;
          bVal = spotSymbols.has(bBase) ? 1 : 0;
          break;
        case 'fundingRate':
          aVal = fundingRateData.get(a.instId)?.fundingRate ?? 0;
          bVal = fundingRateData.get(b.instId)?.fundingRate ?? 0;
          break;
        case 'fundingApr':
          const frA = fundingRateData.get(a.instId);
          const frB = fundingRateData.get(b.instId);
          const aprA = frA ? frA.fundingRate * ((365 * 24) / (frA.settlementInterval || 8)) : 0;
          const aprB = frB ? frB.fundingRate * ((365 * 24) / (frB.settlementInterval || 8)) : 0;
          aVal = aprA;
          bVal = aprB;
          break;
        case 'fundingInterval':
          aVal = fundingRateData.get(a.instId)?.settlementInterval ?? 8;
          bVal = fundingRateData.get(b.instId)?.settlementInterval ?? 8;
          break;
        case 'listDate':
          aVal = listingData.get(a.instId)?.listTime ?? 0;
          bVal = listingData.get(b.instId)?.listTime ?? 0;
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
  }, [tickers, searchTerm, view, favorites, filters, sort, marketCapData, rsiData, spotSymbols, fundingRateData, listingData]);
  
  // Calculate RSI averages for Top 100 market cap tokens (fixed, not affected by filters)
  const getRsiAverages = useCallback(() => {
    // Get all USDT swap tickers
    let allTickers = Array.from(tickers.values()).filter(t => t.instId.includes('-USDT-'));

    // Sort by market cap and take top 100
    const top100 = allTickers
      .filter(t => marketCapData.get(t.baseSymbol)?.rank)
      .sort((a, b) => {
        const rankA = marketCapData.get(a.baseSymbol)?.rank ?? 9999;
        const rankB = marketCapData.get(b.baseSymbol)?.rank ?? 9999;
        return rankA - rankB;
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
    const allTickers = Array.from(tickers.values()).filter(t => t.instId.includes('-USDT-'));
    
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
    
    // Sort by change
    const sorted = [...tickersWithChange].sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
    
    return {
      gainers: sorted.slice(0, limit),
      losers: sorted.slice(-limit).reverse()
    };
  }, [tickers, rsiData]);
  
  // Get paginated data
  const getPaginatedData = useCallback(() => {
    const filtered = getFilteredData();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / pageSize),
      totalItems: filtered.length
    };
  }, [getFilteredData, currentPage, pageSize]);

  // Get quick filter counts (for displaying on buttons)
  const getQuickFilterCounts = useCallback(() => {
    // Get all tickers
    const allTickers = Array.from(tickers.values()).filter(t => t.instId.includes('-USDT-'));

    // Count overbought: RSI7 > 70 AND RSI14 > 70
    const overboughtCount = allTickers.filter(t => {
      const rsi = rsiData.get(t.instId);
      return rsi && rsi.rsi7 !== null && rsi.rsi14 !== null && rsi.rsi7 > 70 && rsi.rsi14 > 70;
    }).length;

    // Count oversold: RSI7 < 30 AND RSI14 < 30
    const oversoldCount = allTickers.filter(t => {
      const rsi = rsiData.get(t.instId);
      return rsi && rsi.rsi7 !== null && rsi.rsi14 !== null && rsi.rsi7 < 30 && rsi.rsi14 < 30;
    }).length;

    return {
      overbought: overboughtCount,
      oversold: oversoldCount
    };
  }, [tickers, rsiData]);
  
  // Direct setters for URL state sync
  const setFavoritesDirectly = useCallback((newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('okx-favorites', JSON.stringify(newFavorites));
  }, []);

  const setColumnsDirectly = useCallback((newColumns: ColumnVisibility) => {
    setColumns(newColumns);
  }, []);

  const setColumnOrderDirectly = useCallback((newOrder: ColumnKey[]) => {
    setColumnOrder(newOrder);
    localStorage.setItem('okx-column-order', JSON.stringify(newOrder));
  }, []);

  return {
    // Data
    tickers,
    rsiData,
    fundingRateData,
    listingData,
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
    currentPage,
    pageSize,
    urlInitialized,

    // Actions
    initialize,
    cleanup,
    toggleFavorite,
    updateColumn,
    setColumnsPreset,
    setFilters,
    updateSort,
    setView,
    setSearchTerm,
    updateColumnOrder,
    moveColumn,
    setCurrentPage,
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
