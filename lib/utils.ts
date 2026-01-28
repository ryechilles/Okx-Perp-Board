import { RSIData, MarketCapData, ProcessedTicker, OKXTicker, ColumnKey } from './types';

// Default column order
export const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  'favorite',
  'rank', 
  'symbol',
  'price',
  'fundingRate',
  'fundingInterval',
  'change4h',
  'change',
  'change7d',
  'volume24h',
  'marketCap',
  'rsi7',
  'rsi14',
  'listDate',
  'hasSpot'
];

// Column definitions - all columns centered except symbol (left-aligned)
export const COLUMN_DEFINITIONS: Record<ColumnKey, { label: string; width: string; align: 'left' | 'right' | 'center'; fixed?: boolean; sortable?: boolean }> = {
  favorite: { label: '', width: '44px', align: 'center', fixed: true, sortable: false },
  rank: { label: '#', width: '50px', align: 'center', fixed: true, sortable: true },
  symbol: { label: 'Token', width: '100px', align: 'left', fixed: true, sortable: true },
  price: { label: 'Price', width: '95px', align: 'center', sortable: true },
  fundingRate: { label: 'Funding', width: '85px', align: 'center', sortable: true },
  fundingInterval: { label: 'Interval', width: '65px', align: 'center', sortable: true },
  change4h: { label: '4H', width: '70px', align: 'center', sortable: true },
  change: { label: '24H', width: '70px', align: 'center', sortable: true },
  change7d: { label: '7D', width: '70px', align: 'center', sortable: true },
  volume24h: { label: 'Vol 24H', width: '90px', align: 'center', sortable: true },
  marketCap: { label: 'Mkt Cap', width: '85px', align: 'center', sortable: true },
  rsi7: { label: 'RSI7', width: '55px', align: 'center', sortable: true },
  rsi14: { label: 'RSI14', width: '55px', align: 'center', sortable: true },
  listDate: { label: 'Listed', width: '80px', align: 'center', sortable: true },
  hasSpot: { label: 'Spot', width: '50px', align: 'center', sortable: true }
};

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

// Format price with appropriate decimals
export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toFixed(8);
}

// Format market cap
export function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return '$' + (cap / 1e12).toFixed(2) + 'T';
  if (cap >= 1e9) return '$' + (cap / 1e9).toFixed(2) + 'B';
  if (cap >= 1e6) return '$' + (cap / 1e6).toFixed(2) + 'M';
  if (cap >= 1e3) return '$' + (cap / 1e3).toFixed(2) + 'K';
  return '$' + cap.toFixed(2);
}

// Format 24h volume
export function formatVolume(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '--';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(0) + 'K';
  return '$' + num.toFixed(0);
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
