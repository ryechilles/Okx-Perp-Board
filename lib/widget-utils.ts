/**
 * Widget Utilities
 * Shared utilities for widget components
 */

// Time frame type for 1h/4h/24h selectors
export type TimeFrame = '1h' | '4h' | '24h';

// Format percentage with color class
export function formatChange(value: number | null | undefined): { text: string; color: string } {
  if (value === null || value === undefined) {
    return { text: '--', color: 'text-gray-400' };
  }
  const sign = value > 0 ? '+' : '';
  const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-400';
  return { text: `${sign}${value.toFixed(2)}%`, color };
}

// Token with change data for altcoin widgets
export interface TokenWithChange {
  symbol: string;
  instId: string;
  rank: number;
  price?: number;
  change1h: number | null;
  change4h: number | null;
  change24h: number;
  logo?: string;
}

// Get change value based on timeframe
export function getChangeByTimeFrame(token: TokenWithChange, tf: TimeFrame): number | null {
  switch (tf) {
    case '1h': return token.change1h;
    case '4h': return token.change4h;
    case '24h': return token.change24h;
  }
}

// RSI data structure (minimal for calculation)
export interface RSIValues {
  rsi7: number | null;
  rsi14: number | null;
  rsiW7: number | null;
  rsiW14: number | null;
}

/**
 * Calculate average RSI from all 4 RSI values
 * Used in RsiOversold and RsiOverbought widgets
 */
export function calculateAvgRsi(rsi: RSIValues): number | null {
  const values = [rsi.rsi7, rsi.rsi14, rsi.rsiW7, rsi.rsiW14].filter(
    (v): v is number => v !== null && v !== undefined
  );
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate funding APR from rate and interval
 * Used in FundingKiller widget
 */
export function calculateFundingApr(rate: number, intervalHours: number = 8): number {
  const periodsPerYear = (365 * 24) / intervalHours;
  return rate * periodsPerYear * 100;
}
