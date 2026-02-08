'use client';

import { useState, useEffect, useCallback } from 'react';
import { Vault } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipList } from '@/components/ui';
import { fetchHLPVaultData, HLPVaultDetails } from '@/lib/api/hyperliquid-rest';

function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${formatUsd(value)}`;
}

export function HLPVault() {
  const [data, setData] = useState<HLPVaultDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchHLPVaultData();
      if (result) setData(result);
    } catch (err) {
      console.error('[HLP Widget] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <SmallWidget
      title="HLP Vault"
      icon={<Vault className="w-4 h-4" />}
      subtitle="Hyperliquidity Provider"
      loading={loading}
      tooltip={
        <TooltipList items={[
          "HLP is Hyperliquid's flagship market-making vault",
          "Provides liquidity across all perp markets",
          "Handles liquidations, funding, and spreads",
          "APR based on vault performance over time",
          "PnL data from on-chain vault history",
        ]} />
      }
    >
      {data ? (
        <div className="space-y-3">
          {/* TVL & APR Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground">TVL</div>
              <div className="text-lg font-semibold tabular-nums">{formatUsd(data.tvl)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground">APR</div>
              <div className={`text-lg font-semibold tabular-nums ${data.apr >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.apr.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* PnL Grid */}
          <div className="border-t pt-3">
            <div className="text-[11px] text-muted-foreground mb-2">PnL</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-[10px] text-muted-foreground">24h</div>
                <div className={`text-[12px] font-medium tabular-nums ${data.pnl24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPnl(data.pnl24h)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">7d</div>
                <div className={`text-[12px] font-medium tabular-nums ${data.pnl7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPnl(data.pnl7d)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">30d</div>
                <div className={`text-[12px] font-medium tabular-nums ${data.pnl30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPnl(data.pnl30d)}
                </div>
              </div>
            </div>
          </div>

          {/* All-time PnL */}
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">All-time PnL</span>
            <span className={`text-[13px] font-semibold tabular-nums ${data.pnlAllTime >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPnl(data.pnlAllTime)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-[11px] text-muted-foreground">
          Failed to load HLP data
        </div>
      )}
    </SmallWidget>
  );
}
