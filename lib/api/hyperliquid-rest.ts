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
  HyperliquidSpotMeta,
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

// ===== Fetch spot symbols (which perp tokens have spot trading on Hyperliquid) =====
// Hyperliquid spot tokens use wrapped names (UBTC for BTC, UETH for ETH)
// and universe entries use "@index" format instead of "BTC/USDC".
// We need to map wrapped spot names back to perp asset names.
export async function fetchHyperliquidSpotSymbols(): Promise<Set<string>> {
  const symbols = new Set<string>();

  try {
    const rawResult = await hlPost<unknown>({ type: 'spotMetaAndAssetCtxs' });

    if (!rawResult) {
      console.error('[Hyperliquid] spotMetaAndAssetCtxs returned null');
      return symbols;
    }

    // Response is [SpotMeta, SpotAssetCtx[]]
    let meta: HyperliquidSpotMeta | null = null;

    if (Array.isArray(rawResult) && rawResult.length >= 1) {
      meta = rawResult[0] as HyperliquidSpotMeta;
    } else if (rawResult && typeof rawResult === 'object' && 'universe' in (rawResult as Record<string, unknown>)) {
      meta = rawResult as HyperliquidSpotMeta;
    }

    if (!meta?.universe || !Array.isArray(meta.universe)) {
      console.error('[Hyperliquid] spotMeta: no universe array found');
      return symbols;
    }

    // Build token index → name lookup
    const tokenNames = new Map<number, string>();
    if (meta.tokens && Array.isArray(meta.tokens)) {
      meta.tokens.forEach(token => {
        tokenNames.set(token.index, token.name);
      });
    }

    // Also fetch perp meta to get the canonical perp asset names for matching
    const perpResult = await hlPost<[HyperliquidMeta, unknown[]]>({ type: 'metaAndAssetCtxs' });
    const perpNames = new Set<string>();
    if (perpResult && Array.isArray(perpResult) && perpResult.length >= 1) {
      const perpMeta = perpResult[0];
      perpMeta.universe?.forEach((asset: HyperliquidAsset) => {
        perpNames.add(asset.name);
      });
    }

    // Helper: map a spot token name to its perp equivalent
    // Hyperliquid wraps bridged tokens: UBTC→BTC, UETH→ETH, etc.
    // Native tokens keep their name: HYPE→HYPE, PURR→PURR
    const toPerpName = (spotName: string): string | null => {
      // Direct match (native tokens: HYPE, PURR, PUMP, etc.)
      if (perpNames.has(spotName)) return spotName;
      // Wrapped token: strip "U" prefix (UBTC→BTC, UETH→ETH, USOL→SOL, etc.)
      if (spotName.length > 1 && spotName.startsWith('U')) {
        const stripped = spotName.slice(1);
        if (perpNames.has(stripped)) return stripped;
      }
      // Wrapped token: strip "W" prefix (WETH→ETH, WBTC→BTC, etc.)
      if (spotName.length > 1 && spotName.startsWith('W')) {
        const stripped = spotName.slice(1);
        if (perpNames.has(stripped)) return stripped;
      }
      return null;
    };

    // Extract base symbols from universe pairs
    meta.universe.forEach(pair => {
      let baseName: string | null = null;

      if (pair.name && pair.name.includes('/')) {
        // Human-readable format: "PURR/USDC" → "PURR"
        baseName = pair.name.split('/')[0] || null;
      } else if (pair.tokens && pair.tokens.length >= 2) {
        // "@index" format: resolve via token lookup
        baseName = tokenNames.get(pair.tokens[0]) || null;
      }

      if (!baseName) return;

      // Map spot token name to perp name and add
      const perpName = toPerpName(baseName);
      if (perpName) {
        symbols.add(perpName);
      } else {
        // No perp match — still add the raw name (might match in the future)
        symbols.add(baseName);
      }
    });

    console.log(`[Hyperliquid] Found ${symbols.size} spot symbols from ${meta.universe.length} pairs`);
  } catch (error) {
    console.error('[Hyperliquid] Failed to fetch spot symbols:', error);
  }

  return symbols;
}

// ===== Fetch all mid-prices (lightweight) =====
export async function fetchHyperliquidAllMids(): Promise<Record<string, string> | null> {
  return hlPost<Record<string, string>>({ type: 'allMids' });
}

// ===== HLP (Hyperliquidity Provider) Vault Data =====
export interface HLPVaultDetails {
  name: string;
  vaultAddress: string;
  leader: string;
  tvl: number;
  apr: number;
  apy: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  pnlAllTime: number;
  accountValue: number;
}

interface VaultSummary {
  name: string;
  vaultAddress: string;
  leader: string;
  tvl: string;
  isClosed: boolean;
  relationship: { type: string } | null;
  allowDeposits: boolean;
  apr: number;
  lockupPeriod: number;
}

interface VaultFollower {
  user: string;
  vaultEquity: string;
  pnl: string;
  allTimePnl: string;
  daysFollowing: number;
  vaultEntryTime: number;
  lockupUntil: number;
}

interface VaultDetailsRaw {
  name: string;
  vaultAddress: string;
  leader: string;
  description: string;
  portfolio: unknown[];
  apr: number;
  followerState: VaultFollower[] | null;
  isClosed: boolean;
  maxDistributable: string;
  maxWithdrawable: string;
  relationship: { type: string } | null;
  allowDeposits: boolean;
  lockupPeriod: number;
  pnlHistory: [number, string][];  // [timestamp_ms, cumulative_pnl]
}

// HLP vault address (well-known)
const HLP_VAULT_ADDRESS = '0xdfc24b077bc1425ad1dea75bcb6f8158e10df303';

export async function fetchHLPVaultData(): Promise<HLPVaultDetails | null> {
  try {
    // Fetch vault details and summaries in parallel
    const [details, summaries] = await Promise.all([
      hlPost<VaultDetailsRaw>({
        type: 'vaultDetails',
        vaultAddress: HLP_VAULT_ADDRESS,
      }),
      hlPost<VaultSummary[]>({ type: 'vaultSummaries' }),
    ]);

    if (!details) {
      console.error('[HLP] Failed to fetch vault details');
      return null;
    }

    // Get TVL from summaries (more reliable)
    let tvl = 0;
    if (summaries) {
      const hlpSummary = summaries.find(
        (v) => v.vaultAddress.toLowerCase() === HLP_VAULT_ADDRESS.toLowerCase()
      );
      if (hlpSummary) {
        tvl = parseFloat(hlpSummary.tvl) || 0;
      }
    }

    // Calculate PnL from pnlHistory
    const history = details.pnlHistory || [];
    const now = Date.now();
    const latestPnl = history.length > 0 ? parseFloat(history[history.length - 1][1]) : 0;

    // Find PnL at different time intervals
    const findPnlAt = (msAgo: number): number => {
      const targetTime = now - msAgo;
      let closest: [number, string] | null = null;
      for (const entry of history) {
        if (entry[0] <= targetTime) {
          closest = entry;
        } else {
          break;
        }
      }
      return closest ? parseFloat(closest[1]) : 0;
    };

    const pnl24hAgo = findPnlAt(24 * 60 * 60 * 1000);
    const pnl7dAgo = findPnlAt(7 * 24 * 60 * 60 * 1000);
    const pnl30dAgo = findPnlAt(30 * 24 * 60 * 60 * 1000);

    // APR from details, compute APY
    const apr = details.apr || 0;
    const apy = (Math.pow(1 + apr / 365, 365) - 1) * 100;

    return {
      name: details.name || 'HLP',
      vaultAddress: HLP_VAULT_ADDRESS,
      leader: details.leader,
      tvl,
      apr: apr * 100,  // Convert decimal to percentage
      apy,
      pnl24h: latestPnl - pnl24hAgo,
      pnl7d: latestPnl - pnl7dAgo,
      pnl30d: latestPnl - pnl30dAgo,
      pnlAllTime: latestPnl,
      accountValue: tvl,
    };
  } catch (error) {
    console.error('[HLP] Failed to fetch vault data:', error);
    return null;
  }
}
