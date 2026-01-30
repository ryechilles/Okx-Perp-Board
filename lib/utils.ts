import { RSIData, MarketCapData, ProcessedTicker, OKXTicker, ColumnKey } from './types';

// Known Meme tokens list
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

// Check if a token is a meme token
export function isMemeToken(symbol: string): boolean {
  // Handle symbols like "1000PEPE" or just "PEPE"
  const upperSymbol = symbol.toUpperCase();
  if (MEME_TOKENS.has(upperSymbol)) return true;
  // Check if it starts with a number multiplier
  const match = upperSymbol.match(/^(\d+)(.+)$/);
  if (match) {
    return MEME_TOKENS.has(match[2]) || MEME_TOKENS.has(upperSymbol);
  }
  return false;
}

// Default column order (hasSpot removed - use No Spot quick filter instead)
export const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  'favorite',
  'rank',
  'logo',
  'symbol',
  'price',
  'fundingRate',
  'fundingApr',
  'fundingInterval',
  'change4h',
  'change',
  'change7d',
  'volume24h',
  'marketCap',
  'dRsiSignal',
  'wRsiSignal',
  'rsi7',
  'rsi14',
  'rsiW7',
  'rsiW14',
  'listDate'
];

// Column definitions - all columns centered except symbol (left-aligned)
export const COLUMN_DEFINITIONS: Record<ColumnKey, { label: string; width: number; align: 'left' | 'right' | 'center'; fixed?: boolean; sortable?: boolean }> = {
  favorite: { label: '', width: 40, align: 'center', fixed: true, sortable: false },
  rank: { label: '#', width: 48, align: 'center', fixed: true, sortable: true },
  logo: { label: '', width: 32, align: 'center', fixed: true, sortable: false },
  symbol: { label: 'Token', width: 95, align: 'left', fixed: true, sortable: true },
  price: { label: 'Price', width: 90, align: 'center', sortable: true },
  fundingRate: { label: 'Funding Rate', width: 95, align: 'center', sortable: true },
  fundingApr: { label: 'Funding APR', width: 95, align: 'center', sortable: true },
  fundingInterval: { label: 'Funding Interval', width: 110, align: 'center', sortable: true },
  change4h: { label: '4h', width: 68, align: 'center', sortable: true },
  change: { label: '24h', width: 68, align: 'center', sortable: true },
  change7d: { label: '7d', width: 68, align: 'center', sortable: true },
  volume24h: { label: 'Vol 24h', width: 85, align: 'center', sortable: true },
  marketCap: { label: 'Market Cap', width: 90, align: 'center', sortable: true },
  dRsiSignal: { label: 'D-RSI Signal', width: 95, align: 'center', sortable: true },
  wRsiSignal: { label: 'W-RSI Signal', width: 95, align: 'center', sortable: true },
  rsi7: { label: 'D-RSI7', width: 58, align: 'center', sortable: true },
  rsi14: { label: 'D-RSI14', width: 62, align: 'center', sortable: true },
  rsiW7: { label: 'W-RSI7', width: 58, align: 'center', sortable: true },
  rsiW14: { label: 'W-RSI14', width: 62, align: 'center', sortable: true },
  listDate: { label: 'Listed', width: 75, align: 'center', sortable: true },
  hasSpot: { label: 'Spot', width: 48, align: 'center', sortable: true }
};

// Format funding APR (annualized)
export function formatFundingApr(rate: number | undefined | null, intervalHours: number | undefined | null): string {
  if (rate === undefined || rate === null) return '--';
  const interval = intervalHours || 8; // default 8 hours
  const periodsPerYear = (365 * 24) / interval;
  const apr = rate * periodsPerYear * 100;
  const sign = apr >= 0 ? '+' : '';
  return `${sign}${apr.toFixed(1)}%`;
}

// Get funding APR color class
export function getFundingAprClass(rate: number | undefined | null): string {
  if (rate === undefined || rate === null) return 'text-gray-300';
  if (rate > 0) return 'text-green-500';
  if (rate < 0) return 'text-red-500';
  return 'text-gray-500';
}

// Format funding rate as percentage
export function formatFundingRate(rate: number | undefined | null): string {
  if (rate === undefined || rate === null) return '--';
  const percentage = rate * 100;
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(4)}%`;
}

// Format settlement interval
export function formatSettlementInterval(hours: number | undefined | null): string {
  if (hours === undefined || hours === null || hours === 0) return '--';
  return `${hours}h`;
}

// Get funding rate color class
export function getFundingRateClass(rate: number | undefined | null): string {
  if (rate === undefined || rate === null) return 'text-gray-300';
  if (rate > 0.0001) return 'text-green-500'; // Positive = longs pay shorts
  if (rate < -0.0001) return 'text-red-500';  // Negative = shorts pay longs
  return 'text-gray-500';
}

// Format listing date
export function formatListDate(timestamp: number | undefined | null): string {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  
  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// Calculate RSI using Wilder's smoothing method (RMA)
// This matches TradingView's default RSI calculation
export function calculateRSI(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null;

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  if (changes.length < period) return null;

  // Separate gains and losses
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

  // First average (SMA for initial value)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // Apply Wilder's smoothing (RMA) for remaining values
  // RMA formula: newAvg = (prevAvg * (period - 1) + currentValue) / period
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) {
    return avgGain === 0 ? 50 : 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

// RSI Signal types and helper functions
export type RsiSignal = 'overbought' | 'strong' | 'neutral-strong' | 'neutral' | 'neutral-weak' | 'weak' | 'oversold';

export interface RsiSignalInfo {
  signal: RsiSignal;
  label: string;
  color: string;
}

// Get RSI signal based on combined RSI7 and RSI14 values
export function getRsiSignal(rsi7: number | null, rsi14: number | null): RsiSignalInfo {
  if (rsi7 === null && rsi14 === null) {
    return { signal: 'neutral', label: '--', color: 'text-gray-400' };
  }

  // Use average of both, or whichever is available
  const avg = rsi7 !== null && rsi14 !== null
    ? (rsi7 + rsi14) / 2
    : rsi7 ?? rsi14 ?? 50;

  if (avg <= 25) {
    return { signal: 'oversold', label: '🧊 Oversold', color: 'text-green-600' };
  }
  if (avg <= 35) {
    return { signal: 'weak', label: 'Weak', color: 'text-green-500' };
  }
  if (avg <= 45) {
    return { signal: 'neutral-weak', label: 'Neutral→Weak', color: 'text-emerald-500' };
  }
  if (avg <= 55) {
    return { signal: 'neutral', label: 'Neutral', color: 'text-gray-600' };
  }
  if (avg <= 65) {
    return { signal: 'neutral-strong', label: 'Neutral→Strong', color: 'text-orange-500' };
  }
  if (avg <= 75) {
    return { signal: 'strong', label: 'Strong', color: 'text-red-500' };
  }
  return { signal: 'overbought', label: '🔥 Overbought', color: 'text-red-600' };
}

// Calculate 7D change from candles
export function calculate7DChange(candles: number[][]): number | null {
  if (candles.length < 7) return null;
  const currentClose = candles[candles.length - 1][4];
  const close7dAgo = candles[candles.length - 7][4];
  if (close7dAgo === 0) return null;
  return ((currentClose - close7dAgo) / close7dAgo) * 100;
}

// Format price with appropriate decimals, removing trailing zeros
export function formatPrice(price: number): string {
  let formatted: string;
  if (price >= 1000) {
    formatted = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 100) {
    formatted = parseFloat(price.toFixed(2)).toString();
  } else if (price >= 1) {
    formatted = parseFloat(price.toFixed(4)).toString();
  } else if (price >= 0.0001) {
    formatted = parseFloat(price.toFixed(6)).toString();
  } else {
    formatted = parseFloat(price.toFixed(8)).toString();
  }
  return formatted;
}

// Format market cap
export function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return '$' + (cap / 1e12).toFixed(2) + 'T';
  if (cap >= 1e9) return '$' + (cap / 1e9).toFixed(2) + 'B';
  if (cap >= 1e6) return '$' + (cap / 1e6).toFixed(2) + 'M';
  if (cap >= 1e3) return '$' + (cap / 1e3).toFixed(2) + 'K';
  return '$' + cap.toFixed(2);
}

// Format 24h volume (input is volume in base currency, needs to multiply by price)
export function formatVolume(volCcy: string | number, price: number): string {
  const vol = typeof volCcy === 'string' ? parseFloat(volCcy) : volCcy;
  if (isNaN(vol) || vol === 0 || isNaN(price) || price === 0) return '--';
  
  const volumeUsd = vol * price;
  
  if (volumeUsd >= 1e9) return '$' + (volumeUsd / 1e9).toFixed(2) + 'B';
  if (volumeUsd >= 1e6) return '$' + (volumeUsd / 1e6).toFixed(1) + 'M';
  if (volumeUsd >= 1e3) return '$' + (volumeUsd / 1e3).toFixed(0) + 'K';
  return '$' + volumeUsd.toFixed(0);
}

// Get RSI class for styling (7-level color scale)
export function getRsiClass(rsi: number | null | undefined): string {
  if (rsi === null || rsi === undefined) return 'text-gray-300';
  if (rsi <= 25) return 'text-green-600';      // Oversold Zone
  if (rsi <= 35) return 'text-green-500';      // Weak
  if (rsi <= 45) return 'text-emerald-500';    // Neutral → Weak
  if (rsi <= 55) return 'text-gray-600';       // Neutral
  if (rsi <= 65) return 'text-orange-500';     // Neutral → Strong
  if (rsi <= 75) return 'text-red-500';        // Strong
  return 'text-red-600';                       // Overbought Zone
}

// Format RSI value with emoji for extreme zones
export function formatRsi(rsi: number | null | undefined): string {
  if (rsi === null || rsi === undefined) return '--';
  const value = rsi.toFixed(1);
  if (rsi <= 25) return `🧊${value}`;          // Oversold Zone (cold)
  if (rsi > 75) return `🔥${value}`;           // Overbought Zone (hot)
  return value;
}

// Get change class for styling
export function getChangeClass(change: number | null | undefined): string {
  if (change === null || change === undefined) return '';
  return change >= 0 ? 'text-green-500' : 'text-red-500';
}

// Process OKX ticker data
export function processTicker(t: OKXTicker): ProcessedTicker {
  const parts = t.instId.split('-');
  const baseSymbol = parts[0];
  const priceNum = parseFloat(t.last) || 0;
  const sodUtc8 = parseFloat(t.sodUtc8) || 0;
  const changeNum = sodUtc8 > 0 ? ((priceNum - sodUtc8) / sodUtc8 * 100) : 0;
  
  return {
    instId: t.instId,
    baseSymbol,
    priceNum,
    changeNum,
    volCcy24h: t.volCcy24h || '0',
    rawData: t
  };
}

// Mutex class for preventing concurrent API calls
export class Mutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

// API rate limiter
export class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    
    if (this.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp) + 50;
      await new Promise(r => setTimeout(r, waitTime));
      return this.waitForSlot();
    }
    
    this.timestamps.push(now);
  }
}
