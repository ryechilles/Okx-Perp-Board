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
  OKXWebSocket,
  fetchSpotSymbols,
  fetchRSIBatch,
  fetchMarketCapData,
  fetchTickersREST,
  fetchFundingRates,
  fetchListingDates
} from '@/lib/okx-api';
import { DEFAULT_COLUMN_ORDER } from '@/lib/utils';

const DEFAULT_COLUMNS: ColumnVisibility = {
  favorite: true,
  rank: true,
  symbol: true,
  price: true,
  fundingRate: true,
  change4h: true,
  change: true,
  change7d: true,
  marketCap: true,
  rsi7: true,
  rsi14: true,
  listDate: true,
  hasSpot: true
};

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
  const [filters, setFilters] = useState<Filters>({});
  const [sort, setSort] = useState<SortConfig>({ column: 'rank', direction: 'asc' });
  const [view, setView] = useState<'market' | 'favorites'>('market');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Status - Always show 'live' as requested
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('live');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rsiProgress, setRsiProgress] = useState('');
  
  // Refs for WebSocket and intervals
  const wsRef = useRef<OKXWebSocket | null>(null);
  const rsiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRsiRef = useRef(false);
  
  // Load favorites and column order from localStorage
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
        // Validate that all required columns are present
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COLUMN_ORDER.length) {
          setColumnOrder(parsed);
        }
      } catch (e) {
        console.error('Failed to parse column order:', e);
      }
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
  
  // Update column order (for drag and drop)
  const updateColumnOrder = useCallback((newOrder: ColumnKey[]) => {
    // Ensure fixed columns stay in place
    const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'symbol'];
    const nonFixedOrder = newOrder.filter(col => !fixedColumns.includes(col));
    const finalOrder: ColumnKey[] = [...fixedColumns, ...nonFixedOrder];
    
    setColumnOrder(finalOrder);
    localStorage.setItem('okx-column-order', JSON.stringify(finalOrder));
  }, []);
  
  // Move a column to a new position
  const moveColumn = useCallback((dragKey: ColumnKey, hoverKey: ColumnKey) => {
    // Fixed columns cannot be moved
    const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'symbol'];
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
  
  // Update RSI data for single instrument
  const updateRsiData = useCallback((instId: string, data: RSIData) => {
    setRsiData(prev => {
      const newMap = new Map(prev);
      newMap.set(instId, data);
      return newMap;
    });
  }, []);
  
  // Fetch RSI for visible/filtered items
  const fetchRsiForVisible = useCallback(async (tickerMap: Map<string, ProcessedTicker>) => {
    if (isFetchingRsiRef.current) return;
    isFetchingRsiRef.current = true;
    
    try {
      // Get filtered instrument IDs sorted by rank
      const instIds = Array.from(tickerMap.values())
        .filter(t => t.instId.includes('-USDT-'))
        .sort((a, b) => {
          const rankA = marketCapData.get(a.baseSymbol)?.rank ?? 9999;
          const rankB = marketCapData.get(b.baseSymbol)?.rank ?? 9999;
          return rankA - rankB;
        })
        .map(t => t.instId);
      
      await fetchRSIBatch(
        instIds,
        rsiData,
        setRsiProgress,
        updateRsiData,
        50 // Priority first 50
      );
    } finally {
      isFetchingRsiRef.current = false;
    }
  }, [marketCapData, rsiData, updateRsiData]);
  
  // Initialize WebSocket and data fetching
  const initialize = useCallback(async () => {
    // Always show live status
    setStatus('live');
    
    // Fetch initial data
    const [spotData, marketCap, listings, fundingRates] = await Promise.all([
      fetchSpotSymbols(),
      fetchMarketCapData(),
      fetchListingDates(),
      fetchFundingRates()
    ]);
    
    setSpotSymbols(spotData);
    setMarketCapData(marketCap);
    setListingData(listings);
    setFundingRateData(fundingRates);
    
    // Initialize WebSocket
    const handleTickerUpdate = (newTickers: Map<string, ProcessedTicker>) => {
      setTickers(newTickers);
    };
    
    const handleStatusUpdate = (_newStatus: 'connecting' | 'live' | 'error', time?: Date) => {
      // Always show live status regardless of actual status
      setStatus('live');
      if (time) setLastUpdate(time);
    };
    
    wsRef.current = new OKXWebSocket(handleTickerUpdate, handleStatusUpdate);
    wsRef.current.connect();
    
    // Fallback: fetch initial tickers via REST
    const initialTickers = await fetchTickersREST();
    if (initialTickers.length > 0) {
      const tickerMap = new Map<string, ProcessedTicker>();
      initialTickers.forEach(t => tickerMap.set(t.instId, t));
      setTickers(tickerMap);
      setLastUpdate(new Date());
      
      // Fetch RSI for initial data
      setTimeout(() => fetchRsiForVisible(tickerMap), 1000);
    }
    
    // Setup RSI refresh interval (every 5 minutes)
    rsiIntervalRef.current = setInterval(() => {
      const currentTickers = wsRef.current?.getTickers();
      if (currentTickers && currentTickers.size > 0) {
        fetchRsiForVisible(currentTickers);
      }
    }, 5 * 60 * 1000);
    
    // Refresh market cap every 5 minutes
    setInterval(async () => {
      const newMarketCap = await fetchMarketCapData();
      setMarketCapData(newMarketCap);
    }, 5 * 60 * 1000);
    
    // Refresh funding rates every 5 minutes
    setInterval(async () => {
      const newFundingRates = await fetchFundingRates();
      setFundingRateData(newFundingRates);
    }, 5 * 60 * 1000);
    
  }, [fetchRsiForVisible]);
  
  // Cleanup
  const cleanup = useCallback(() => {
    wsRef.current?.disconnect();
    if (rsiIntervalRef.current) {
      clearInterval(rsiIntervalRef.current);
    }
  }, []);
  
  // Column management
  const updateColumn = useCallback((col: keyof ColumnVisibility, visible: boolean) => {
    setColumns(prev => ({ ...prev, [col]: visible }));
  }, []);
  
  const setColumnsPreset = useCallback((preset: 'all' | 'none' | 'default') => {
    if (preset === 'all') {
      setColumns({
        favorite: true,
        rank: true,
        symbol: true,
        price: true,
        fundingRate: true,
        change4h: true,
        change: true,
        change7d: true,
        marketCap: true,
        rsi7: true,
        rsi14: true,
        listDate: true,
        hasSpot: true
      });
    } else if (preset === 'none') {
      setColumns({
        favorite: true,
        rank: true,
        symbol: true,
        price: false,
        fundingRate: false,
        change4h: false,
        change: false,
        change7d: false,
        marketCap: false,
        rsi7: false,
        rsi14: false,
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
      if (filters.rank === '1-20') {
        filtered = filtered.filter(t => {
          const rank = marketCapData.get(t.baseSymbol)?.rank;
          return rank && rank <= 20;
        });
      } else if (filters.rank === '21-50') {
        filtered = filtered.filter(t => {
          const rank = marketCapData.get(t.baseSymbol)?.rank;
          return rank && rank >= 21 && rank <= 50;
        });
      } else if (filters.rank === '51-100') {
        filtered = filtered.filter(t => {
          const rank = marketCapData.get(t.baseSymbol)?.rank;
          return rank && rank >= 51 && rank <= 100;
        });
      } else if (filters.rank === '101-500') {
        filtered = filtered.filter(t => {
          const rank = marketCapData.get(t.baseSymbol)?.rank;
          return rank && rank >= 101 && rank <= 500;
        });
      } else if (filters.rank === '>500') {
        filtered = filtered.filter(t => !marketCapData.get(t.baseSymbol)?.rank);
      }
    }
    
    if (filters.rsi7) {
      if (filters.rsi7 === '<30') {
        filtered = filtered.filter(t => (rsiData.get(t.instId)?.rsi7 ?? 50) < 30);
      } else if (filters.rsi7 === '30-70') {
        filtered = filtered.filter(t => {
          const rsi = rsiData.get(t.instId)?.rsi7;
          return rsi !== undefined && rsi !== null && rsi >= 30 && rsi <= 70;
        });
      } else if (filters.rsi7 === '>70') {
        filtered = filtered.filter(t => (rsiData.get(t.instId)?.rsi7 ?? 50) > 70);
      }
    }
    
    if (filters.rsi14) {
      if (filters.rsi14 === '<30') {
        filtered = filtered.filter(t => (rsiData.get(t.instId)?.rsi14 ?? 50) < 30);
      } else if (filters.rsi14 === '30-70') {
        filtered = filtered.filter(t => {
          const rsi = rsiData.get(t.instId)?.rsi14;
          return rsi !== undefined && rsi !== null && rsi >= 30 && rsi <= 70;
        });
      } else if (filters.rsi14 === '>70') {
        filtered = filtered.filter(t => (rsiData.get(t.instId)?.rsi14 ?? 50) > 70);
      }
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
          aVal = marketCapData.get(a.baseSymbol)?.rank ?? 9999;
          bVal = marketCapData.get(b.baseSymbol)?.rank ?? 9999;
          break;
        case 'marketCap':
          aVal = marketCapData.get(a.baseSymbol)?.marketCap ?? 0;
          bVal = marketCapData.get(b.baseSymbol)?.marketCap ?? 0;
          break;
        case 'rsi7':
          aVal = rsiData.get(a.instId)?.rsi7 ?? 0;
          bVal = rsiData.get(b.instId)?.rsi7 ?? 0;
          break;
        case 'rsi14':
          aVal = rsiData.get(a.instId)?.rsi14 ?? 0;
          bVal = rsiData.get(b.instId)?.rsi14 ?? 0;
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
  
  // Calculate RSI averages
  const getRsiAverages = useCallback(() => {
    const filtered = getFilteredData();
    let rsi7Sum = 0, rsi7Count = 0;
    let rsi14Sum = 0, rsi14Count = 0;
    
    filtered.forEach(t => {
      const rsi = rsiData.get(t.instId);
      if (rsi?.rsi7 !== undefined && rsi.rsi7 !== null) {
        rsi7Sum += rsi.rsi7;
        rsi7Count++;
      }
      if (rsi?.rsi14 !== undefined && rsi.rsi14 !== null) {
        rsi14Sum += rsi.rsi14;
        rsi14Count++;
      }
    });
    
    return {
      avgRsi7: rsi7Count > 0 ? rsi7Sum / rsi7Count : null,
      avgRsi14: rsi14Count > 0 ? rsi14Sum / rsi14Count : null
    };
  }, [getFilteredData, rsiData]);
  
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
    
    // Derived data
    getFilteredData,
    getRsiAverages
  };
}
