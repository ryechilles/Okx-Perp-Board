/**
 * Hyperliquid REST API functions
 * Handles all REST API calls to Hyperliquid
 *
 * Hyperliquid API is simpler than OKX:
 * - All info queries go to POST https://api.hyperliquid.xyz/info
 * - No authentication needed for read-only data
 * - metaAndAssetCtxs returns everything in one call (meta + prices + funding + volume)
 */

import {
  HyperliquidMeta,
  HyperliquidAsset,
  HyperliquidAssetCtx,
  HyperliquidRawTicker,
  ProcessedTicker,
  FundingRateData,
  ListingData,
} from '../types';
import { API } from '../constants';

const HL_REST = API.HYPERLIQUID_REST;

// ===== Helper: POST to Hyperliquid info endpoint =====
async function hlPost<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const response = await fetch(HL_REST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[Hyperliquid] HTTP ${response.status} for type=${body.type}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Hyperliquid] Request failed for type=${body.type}:`, error);
    return null;
  }
}

// ===== Process Hyperliquid asset data into ProcessedTicker =====
export function processHyperliquidTicker(
  asset: HyperliquidAsset,
  ctx: HyperliquidAssetCtx
): ProcessedTicker {
  const coin = asset.name;
  const markPx = parseFloat(ctx.markPx) || 0;
  const prevDayPx = parseFloat(ctx.prevDayPx) || 0;
  const changeNum = prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0;

  // dayNtlVlm is already in USD (notional volume)
  // Store as volume / price so formatVolume(volCcy24h, price) yields correct USD value
  const dayNtlVlm = parseFloat(ctx.dayNtlVlm) || 0;
  const volInBase = markPx > 0 ? dayNtlVlm / markPx : 0;

  const rawData: HyperliquidRawTicker = {
    coin,
    markPx: ctx.markPx,
    oraclePx: ctx.oraclePx,
    prevDayPx: ctx.prevDayPx,
    dayNtlVlm: ctx.dayNtlVlm,
    funding: ctx.funding,
    openInterest: ctx.openInterest,
    maxLeverage: asset.maxLeverage,
  };

  return {
    instId: coin, // Hyperliquid uses simple coin names (e.g., "BTC", "ETH")
    baseSymbol: coin,
    priceNum: markPx,
    changeNum,
    volCcy24h: volInBase.toString(),
    rawData,
  };
}

// ===== Fetch all tickers via metaAndAssetCtxs =====
export async function fetchHyperliquidTickers(): Promise<ProcessedTicker[]> {
  const result = await hlPost<[HyperliquidMeta, HyperliquidAssetCtx[]]>({
    type: 'metaAndAssetCtxs',
  });

  if (!result || !Array.isArray(result) || result.length < 2) {
    console.error('[Hyperliquid] Invalid metaAndAssetCtxs response');
    return [];
  }

  const [meta, contexts] = result;
  const universe = meta.universe;

  if (!universe || !contexts || universe.length !== contexts.length) {
    console.error('[Hyperliquid] Universe/context length mismatch');
    return [];
  }

  const tickers: ProcessedTicker[] = [];

  for (let i = 0; i < universe.length; i++) {
    const asset = universe[i];
    const ctx = contexts[i];

    // Skip assets with zero or invalid price
    const markPx = parseFloat(ctx.markPx);
    if (!markPx || markPx <= 0) continue;

    tickers.push(processHyperliquidTicker(asset, ctx));
  }

  return tickers;
}

// ===== Fetch meta (instrument info) =====
export async function fetchHyperliquidMeta(): Promise<HyperliquidMeta | null> {
  return hlPost<HyperliquidMeta>({ type: 'meta' });
}

// ===== Extract funding rates from metaAndAssetCtxs response =====
export async function fetchHyperliquidFundingRates(): Promise<Map<string, FundingRateData>> {
  const result = await hlPost<[HyperliquidMeta, HyperliquidAssetCtx[]]>({
    type: 'metaAndAssetCtxs',
  });

  const fundingMap = new Map<string, FundingRateData>();

  if (!result || !Array.isArray(result) || result.length < 2) {
    return fundingMap;
  }

  const [meta, contexts] = result;
  const universe = meta.universe;

  for (let i = 0; i < universe.length; i++) {
    const coin = universe[i].name;
    const ctx = contexts[i];
    const fundingRate = parseFloat(ctx.funding) || 0;

    fundingMap.set(coin, {
      fundingRate,
      nextFundingRate: fundingRate, // Hyperliquid doesn't provide predicted next rate separately
      fundingTime: Date.now(),
      nextFundingTime: Date.now() + 3600 * 1000, // Funding settles every hour
      settlementInterval: 1, // Hyperliquid funding is applied hourly
      lastUpdated: Date.now(),
    });
  }

  return fundingMap;
}

// ===== Fetch listing dates =====
// Hyperliquid meta doesn't provide listing timestamps directly
// We return an empty map for now; could be populated from chain history later
export async function fetchHyperliquidListingDates(): Promise<Map<string, ListingData>> {
  return new Map<string, ListingData>();
}

// ===== Fetch all mid-prices (lightweight) =====
export async function fetchHyperliquidAllMids(): Promise<Record<string, string> | null> {
  return hlPost<Record<string, string>>({ type: 'allMids' });
}
