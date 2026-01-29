import { RSIData, MarketCapData, ProcessedTicker, OKXTicker, ColumnKey } from './types';

// Default column order
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
  'rsi7',
  'rsi14',
  'rsiW7',
  'rsiW14',
  'listDate',
  'hasSpot'
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
  change4h: { label: '4H', width: 68, align: 'center', sortable: true },
  change: { label: '24H', width: 68, align: 'center', sortable: true },
  change7d: { label: '7D', width: 68, align: 'center', sortable: true },
  volume24h: { label: 'Vol 24H', width: 85, align: 'center', sortable: true },
  marketCap: { label: 'Mkt Cap', width: 80, align: 'center', sortable: true },
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

// Calculate RSI using Wilder's smoothing method
export function calculateRSI(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  // Initial average
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Wilder's smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
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

// Get RSI class for styling
export function getRsiClass(rsi: number | null | undefined): string {
  if (rsi === null || rsi === undefined) return 'text-gray-300';
  if (rsi <= 30) return 'text-green-500';
  if (rsi >= 70) return 'text-red-500';
  return 'text-gray-600';
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
