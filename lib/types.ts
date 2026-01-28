// OKX Ticker data from REST API
export interface OKXTicker {
  instId: string;
  last: string;
  sodUtc8: string;
  open24h?: string;
  high24h?: string;
  low24h?: string;
  vol24h?: string;
  volCcy24h?: string;
  ts: string;
}

// Processed ticker data
export interface ProcessedTicker {
  instId: string;
  baseSymbol: string;
  priceNum: number;
  changeNum: number; // 24h change %
  rawData: OKXTicker;
}

// RSI data for a single instrument
export interface RSIData {
  rsi7: number | null;
  rsi14: number | null;
  change7d: number | null;
  change4h: number | null;
  lastUpdated: number;
}

// Market cap data from CoinGecko
export interface MarketCapData {
  marketCap: number;
  rank: number;
}

// Column visibility settings
export interface ColumnVisibility {
  symbol: boolean;
  price: boolean;
  change4h: boolean;
  change: boolean;
  change7d: boolean;
  rank: boolean;
  marketCap: boolean;
  rsi7: boolean;
  rsi14: boolean;
  hasSpot: boolean;
}

// Filter settings
export interface Filters {
  rank?: string;
  rsi7?: string;
  rsi14?: string;
  hasSpot?: string;
}

// Sort configuration
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// WebSocket message types
export interface WSTickerUpdate {
  instId: string;
  last: string;
  sodUtc8: string;
  ts: string;
}

// Store state
export interface AppState {
  tickers: Map<string, ProcessedTicker>;
  rsiData: Map<string, RSIData>;
  marketCapData: Map<string, MarketCapData>;
  spotSymbols: Set<string>;
  favorites: string[];
  columns: ColumnVisibility;
  filters: Filters;
  sort: SortConfig;
  view: 'market' | 'favorites';
  status: 'connecting' | 'live' | 'error';
  lastUpdate: Date | null;
  rsiProgress: string;
}
