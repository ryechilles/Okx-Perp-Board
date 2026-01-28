import { RSIData, MarketCapData, ProcessedTicker, OKXTicker } from './types';

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
