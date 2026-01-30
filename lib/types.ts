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

// OKX Instrument data
export interface OKXInstrument {
  instId: string;
  instType: string;
  uly?: string;
  instFamily?: string;
  baseCcy?: string;
  quoteCcy?: string;
  settleCcy?: string;
  ctVal?: string;
  ctMult?: string;
  ctValCcy?: string;
  optType?: string;
  stk?: string;
  listTime: string; // Listing timestamp in milliseconds
  expTime?: string;
  lever?: string;
  tickSz?: string;
  lotSz?: string;
  minSz?: string;
  ctType?: string;
  state: string;
}

// OKX Funding Rate data
export interface OKXFundingRate {
  instId: string;
  instType: string;
  fundingRate: string;
  nextFundingRate: string;
  fundingTime: string;
  nextFundingTime: string;
}

// Processed ticker data
export interface ProcessedTicker {
  instId: string;
  baseSymbol: string;
  priceNum: number;
  changeNum: number; // 24h change %
  volCcy24h: string; // 24h volume in currency
  rawData: OKXTicker;
}

// RSI data for a single instrument
export interface RSIData {
  rsi7: number | null;      // Daily RSI7
  rsi14: number | null;     // Daily RSI14
  rsiW7: number | null;     // Weekly RSI7
  rsiW14: number | null;    // Weekly RSI14
  change7d: number | null;
  change4h: number | null;
  lastUpdated: number;
}

// Funding rate data
export interface FundingRateData {
  fundingRate: number;
  nextFundingRate: number;
  fundingTime: number;
  nextFundingTime: number;
  settlementInterval: number; // in hours (1, 2, 4, 8)
  lastUpdated: number;
}

// Listing date data
export interface ListingData {
  listTime: number; // Unix timestamp in milliseconds
}

// Market cap data from CoinGecko
export interface MarketCapData {
  marketCap: number;
  rank: number;
  logo?: string;
}

// Column key type
export type ColumnKey = 
  | 'favorite'
  | 'rank'
  | 'logo'
  | 'symbol'
  | 'price'
  | 'fundingRate'
  | 'fundingApr'
  | 'fundingInterval'
  | 'change4h'
  | 'change'
  | 'change7d'
  | 'volume24h'
  | 'marketCap'
  | 'rsi7'
  | 'rsi14'
  | 'rsiW7'
  | 'rsiW14'
  | 'listDate'
  | 'hasSpot';

// Column visibility settings
export interface ColumnVisibility {
  favorite: boolean;
  rank: boolean;
  logo: boolean;
  symbol: boolean;
  price: boolean;
  fundingRate: boolean;
  fundingApr: boolean;
  fundingInterval: boolean;
  change4h: boolean;
  change: boolean;
  change7d: boolean;
  volume24h: boolean;
  marketCap: boolean;
  rsi7: boolean;
  rsi14: boolean;
  rsiW7: boolean;
  rsiW14: boolean;
  listDate: boolean;
  hasSpot: boolean;
}

// Column order configuration
export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  width: string;
  align: 'left' | 'right' | 'center';
  fixed?: boolean; // Fixed columns cannot be reordered
  sortable?: boolean;
}

// Filter settings
export interface Filters {
  rank?: string;
  marketCapMin?: string;  // Minimum market cap filter
  rsi7?: string;
  rsi14?: string;
  rsiW7?: string;   // Weekly RSI7 filter
  rsiW14?: string;  // Weekly RSI14 filter
  hasSpot?: string;
  fundingRate?: string;
  listAge?: string;  // Listing age filter (e.g., '>1y', '<30d')
  isMeme?: string;   // Meme token filter
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
  fundingRateData: Map<string, FundingRateData>;
  listingData: Map<string, ListingData>;
  marketCapData: Map<string, MarketCapData>;
  spotSymbols: Set<string>;
  favorites: string[];
  columns: ColumnVisibility;
  columnOrder: ColumnKey[];
  filters: Filters;
  sort: SortConfig;
  view: 'market' | 'favorites';
  status: 'connecting' | 'live' | 'error';
  lastUpdate: Date | null;
  rsiProgress: string;
}
