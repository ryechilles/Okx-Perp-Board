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
 * Calculate average change for a list of tokens
 * Used in AltcoinVsBTC widget
 */
export function calculateAvgChanges(tokens: TokenWithChange[]): {
  avg1h: number | null;
  avg4h: number | null;
  avg24h: number | null;
} {
  const valid1h = tokens.filter(t => t.change1h !== null);
  const valid4h = tokens.filter(t => t.change4h !== null);

  return {
    avg1h: valid1h.length > 0
      ? valid1h.reduce((sum, t) => sum + (t.change1h ?? 0), 0) / valid1h.length
      : null,
    avg4h: valid4h.length > 0
      ? valid4h.reduce((sum, t) => sum + (t.change4h ?? 0), 0) / valid4h.length
      : null,
    avg24h: tokens.length > 0
      ? tokens.reduce((sum, t) => sum + t.change24h, 0) / tokens.length
      : null,
  };
}

/**
 * Calculate funding APR from rate and interval
 * Used in FundingKiller widget
 */
export function calculateFundingApr(rate: number, intervalHours: number = 8): number {
  const periodsPerYear = (365 * 24) / intervalHours;
  return rate * periodsPerYear * 100;
}
