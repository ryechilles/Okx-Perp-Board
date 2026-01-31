/**
 * Default configurations for the application
 * Shared across components to avoid duplication
 */

import { ColumnVisibility, ColumnKey } from './types';

// Desktop default columns
export const DEFAULT_COLUMNS_DESKTOP: ColumnVisibility = {
  favorite: true,
  rank: true,
  logo: true,
  symbol: true,
  price: true,
  fundingRate: false,
  fundingApr: true,
  fundingInterval: false,
  change4h: false,
  change: true,
  change7d: true,
  volume24h: false,
  marketCap: true,
  dRsiSignal: true,
  wRsiSignal: true,
  rsi7: false,
  rsi14: false,
  rsiW7: false,
  rsiW14: false,
  listDate: true,
  hasSpot: false
};

// Mobile default columns (minimal for small screens)
export const DEFAULT_COLUMNS_MOBILE: ColumnVisibility = {
  favorite: true,
  rank: true,
  logo: true,
  symbol: true,
  price: true,
  fundingRate: false,
  fundingApr: false,
  fundingInterval: false,
  change4h: false,
  change: true,
  change7d: false,
  volume24h: false,
  marketCap: false,
  dRsiSignal: false,
  wRsiSignal: false,
  rsi7: false,
  rsi14: false,
  rsiW7: false,
  rsiW14: false,
  listDate: false,
  hasSpot: false
};

// Get default columns based on device
export function getDefaultColumns(isMobile: boolean): ColumnVisibility {
  return isMobile ? DEFAULT_COLUMNS_MOBILE : DEFAULT_COLUMNS_DESKTOP;
}

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
  'dRsiSignal',
  'wRsiSignal',
  'rsi7',
  'rsi14',
  'rsiW7',
  'rsiW14',
  'listDate'
];
