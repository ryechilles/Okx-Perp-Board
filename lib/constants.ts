/**
 * Application-wide constants
 * Centralized configuration for all magic numbers and settings
 */

// ===========================================
// App Version (increment this when deploying updates that require cache refresh)
// ===========================================
export const APP_VERSION = '2.6.2';

// ===========================================
// API Endpoints
// ===========================================
export const API = {
  OKX_WS_PUBLIC: 'wss://ws.okx.com:8443/ws/v5/public',
  OKX_REST_BASE: 'https://www.okx.com/api/v5',
  COINGECKO_BASE: 'https://api.coingecko.com/api/v3',
} as const;

// ===========================================
// Timing Configuration (in milliseconds)
// ===========================================
export const TIMING = {
  // RSI refresh intervals (tiered by market cap rank)
  RSI_REFRESH_TOP50: 2 * 60 * 1000,      // 2 minutes
  RSI_REFRESH_TIER2: 5 * 60 * 1000,      // 5 minutes
  RSI_REFRESH_TIER3: 10 * 60 * 1000,     // 10 minutes

  // RSI stale thresholds
  RSI_STALE_TOP50: 2 * 60 * 1000,        // 2 minutes
  RSI_STALE_TIER2: 5 * 60 * 1000,        // 5 minutes
  RSI_STALE_TIER3: 10 * 60 * 1000,       // 10 minutes

  // Data refresh intervals
  MARKET_CAP_REFRESH: 5 * 60 * 1000,     // 5 minutes
  FUNDING_RATES_REFRESH: 5 * 60 * 1000,  // 5 minutes
  REST_POLLING_INTERVAL: 5 * 1000,       // 5 seconds

  // Initial delays
  INITIAL_RSI_FETCH_DELAY: 2000,         // 2 seconds
  API_BATCH_DELAY: 100,                  // 100ms between API batches

  // RSI fetch delays per tier
  RSI_DELAY_TOP50: 150,                  // 150ms
  RSI_DELAY_TIER2: 300,                  // 300ms
  RSI_DELAY_TIER3: 500,                  // 500ms

  // WebSocket
  WS_RECONNECT_DELAY: 3000,              // 3 seconds
  WS_RECONNECT_FALLBACK: 5000,           // 5 seconds
  WS_PING_INTERVAL: 25000,               // 25 seconds

  // Cache durations
  CACHE_RSI: 30 * 60 * 1000,             // 30 minutes
  CACHE_MARKET_CAP: 30 * 60 * 1000,      // 30 minutes
  CACHE_LOGO: 7 * 24 * 60 * 60 * 1000,   // 7 days
  CACHE_COINGECKO_PROXY: 5 * 60 * 1000,  // 5 minutes

  // Debounce
  RSI_CACHE_SAVE_DEBOUNCE: 2000,         // 2 seconds
  URL_UPDATE_DEBOUNCE: 300,              // 300ms
} as const;

// ===========================================
// Rate Limiting
// ===========================================
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_SECOND: 8,
  WINDOW_MS: 1000,
  API_BATCH_SIZE: 20,
} as const;

// ===========================================
// RSI Configuration
// ===========================================
export const RSI = {
  // Zone thresholds
  OVERSOLD_THRESHOLD: 25,
  WEAK_THRESHOLD: 35,
  NEUTRAL_WEAK_THRESHOLD: 45,
  NEUTRAL_THRESHOLD: 55,
  NEUTRAL_STRONG_THRESHOLD: 65,
  STRONG_THRESHOLD: 75,
  OVERBOUGHT_THRESHOLD: 75,

  // Candle limits for calculation
  DAILY_CANDLE_LIMIT: 100,
  WEEKLY_CANDLE_LIMIT: 100,
  HOURLY_CANDLE_LIMIT: 24,

  // Minimum candles for valid RSI
  MIN_CANDLES_REQUIRED: 15,
} as const;

// ===========================================
// Funding Rate Configuration
// ===========================================
export const FUNDING = {
  // APR threshold for "killer" alerts
  KILLER_APR_THRESHOLD: 20,               // 20% APR

  // Funding rate thresholds (as decimal)
  POSITIVE_THRESHOLD: 0.0001,
  NEGATIVE_THRESHOLD: -0.0001,

  // Default settlement interval
  DEFAULT_INTERVAL_HOURS: 8,
} as const;

// ===========================================
// AHR999 Indicator Zones
// ===========================================
export const AHR999 = {
  BOTTOM_THRESHOLD: 0.45,
  DCA_THRESHOLD: 1.2,
  WAIT_THRESHOLD: 2.0,
  TAKE_PROFIT_THRESHOLD: 4.0,

  // Bitcoin genesis date for calculation
  GENESIS_DATE: '2009-01-03',

  // Power law model coefficients
  COEFFICIENT_A: 5.84,
  COEFFICIENT_B: 17.01,
} as const;

// Zone colors for the bar visualization
export const AHR999_ZONE_COLORS = [
  { width: '9%', color: 'bg-green-500' },   // Bottom
  { width: '15%', color: 'bg-emerald-400' }, // DCA
  { width: '16%', color: 'bg-orange-400' },  // Wait
  { width: '40%', color: 'bg-red-400' },     // Take Profit
  { width: '20%', color: 'bg-red-600' },     // Top
] as const;

// Zone legend data
export const AHR999_ZONE_LEGEND = [
  { range: '<0.45', label: 'Bottom', color: 'text-green-600', dot: '●' },
  { range: '0.45-1.2', label: 'DCA', color: 'text-emerald-500', dot: '●' },
  { range: '1.2-2.0', label: 'Wait', color: 'text-orange-500', dot: '●' },
  { range: '2.0-4.0', label: 'Take Profit', color: 'text-red-500', dot: '●' },
  { range: '>4', label: 'Top', color: 'text-red-600', dot: '●' },
] as const;

// ===========================================
// UI Configuration
// ===========================================
export const UI = {
  // Pagination
  PAGE_SIZE: 25,

  // Table tiers
  TOP50_COUNT: 50,
  TIER2_END: 100,

  // Sparkline dimensions
  SPARKLINE_WIDTH: 50,
  SPARKLINE_HEIGHT: 20,
  SPARKLINE_POINTS: 24,

  // Mobile breakpoint
  MOBILE_BREAKPOINT: 768,

  // WebSocket subscription batch size
  WS_SUBSCRIBE_BATCH_SIZE: 20,

  // CoinGecko fetch pages
  COINGECKO_PAGES: 2,
  COINGECKO_PER_PAGE: 250,
} as const;

// ===========================================
// Fixed Columns (cannot be reordered)
// ===========================================
export const FIXED_COLUMNS = ['favorite', 'rank', 'logo', 'symbol'] as const;

// ===========================================
// Cache Keys
// ===========================================
export const CACHE_KEYS = {
  APP_VERSION: 'okx-app-version',
  FAVORITES: 'okx-favorites',
  COLUMN_ORDER: 'okx-column-order',
  FILTERS: 'okx-filters',
  COLUMNS: 'okx-columns',
  RSI_CACHE: 'okx-rsi-cache',
  MARKET_CAP_CACHE: 'okx-marketcap-cache',
  LOGO_CACHE: 'perp_board_logo_cache',
} as const;

// ===========================================
// Meme Tokens List
// ===========================================
export const MEME_TOKENS = new Set([
  'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'MEME', 'ELON',
  'BABYDOGE', 'SAITAMA', 'AKITA', 'KISHU', 'HOGE', 'SAMO', 'CHEEMS',
  'TURBO', 'LADYS', 'AIDOGE', 'BOB', 'WOJAK', 'CHAD', 'MUMU', 'BOME',
  'SLERF', 'MEW', 'POPCAT', 'GOAT', 'PNUT', 'ACT', 'NEIRO', 'HIPPO',
  'CHILLGUY', 'BAN', 'LUCE', 'MOODENG', 'SUNDOG', 'MYRO', 'WEN',
  'PONKE', 'BODEN', 'TREMP', 'MOTHER', 'GIGA', 'SPX', 'MOG', 'BRETT',
  'TOSHI', 'MANEKI', 'KEYCAT', 'DOG', 'PIZZA', 'PEOPLE', 'COW',
  'SATS', 'RATS', 'ORDI', 'TRUMP', 'MELANIA', 'VINE', 'ANIME', 'PENGU',
  '1000PEPE', '1000SHIB', '1000BONK', '1000FLOKI', '1000SATS', '1000RATS',
]);
