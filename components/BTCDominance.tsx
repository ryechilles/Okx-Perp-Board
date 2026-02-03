'use client';

import { useState, useEffect, useMemo } from 'react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent, TimeFrameSelector } from '@/components/ui';
import { Sparkline } from '@/components/Sparkline';
import { TimeFrame } from '@/lib/widget-utils';

interface HistoricalPoint {
  timestamp: number;
  dominance: number;
}

interface BTCDominanceData {
  current: {
    data: {
      market_cap_percentage: {
        btc: number;
        eth: number;
      };
      total_market_cap: {
        usd: number;
      };
      market_cap_change_percentage_24h_usd: number;
    };
  };
  history: HistoricalPoint[];
}

export function BTCDominance() {
  const [data, setData] = useState<BTCDominanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/btc-dominance');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('[BTCDominance] Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Refresh every minute
    const interval = setInterval(loadData, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate change based on timeframe
  const { change, sparklineData } = useMemo(() => {
    if (!data || data.history.length < 2) {
      return { change: null, sparklineData: [] };
    }

    const now = Date.now();
    const currentDominance = data.current.data.market_cap_percentage.btc;

    // Get time threshold based on timeframe
    const thresholds: Record<TimeFrame, number> = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    const threshold = thresholds[timeFrame];

    // Filter history for the timeframe
    const relevantHistory = data.history.filter(
      point => now - point.timestamp <= threshold
    );

    if (relevantHistory.length === 0) {
      return { change: null, sparklineData: [currentDominance] };
    }

    // Calculate change from oldest point in timeframe
    const oldestPoint = relevantHistory[0];
    const changeValue = currentDominance - oldestPoint.dominance;

    // Prepare sparkline data
    const sparkline = [...relevantHistory.map(p => p.dominance), currentDominance];

    return { change: changeValue, sparklineData: sparkline };
  }, [data, timeFrame]);

  const btcDominance = data?.current.data.market_cap_percentage.btc;
  const ethDominance = data?.current.data.market_cap_percentage.eth;

  // BTC icon
  const btcIcon = (
    <img
      src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
      alt="BTC"
      className="w-5 h-5 rounded-full"
    />
  );

  return (
    <SmallWidget
      title="BTC Dominance"
      icon={btcIcon}
      subtitle="Market Cap Share"
      loading={loading}
      className="w-full"
      headerActions={
        <TimeFrameSelector value={timeFrame} onChange={setTimeFrame} />
      }
      tooltip={
        <TooltipContent items={[
          "BTC market cap / Total market cap",
          "Higher = BTC outperforming altcoins",
          "Lower = Altcoin season potential",
        ]} />
      }
    >
      <div className="space-y-3">
        {/* Main Dominance Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900 tabular-nums">
              {btcDominance != null ? `${btcDominance.toFixed(2)}%` : '--'}
            </div>
            {change !== null && (
              <div className={`text-sm font-medium tabular-nums ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% ({timeFrame})
              </div>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData.length >= 2 && (
            <Sparkline
              data={sparklineData}
              change={change ?? 0}
              width={80}
              height={40}
            />
          )}
        </div>

        {/* ETH Dominance (secondary info) */}
        <div className="flex items-center justify-between text-[12px] text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1.5">
            <img
              src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
              alt="ETH"
              className="w-4 h-4 rounded-full"
            />
            ETH Dominance
          </span>
          <span className="font-medium text-gray-700 tabular-nums">
            {ethDominance != null ? `${ethDominance.toFixed(2)}%` : '--'}
          </span>
        </div>
      </div>
    </SmallWidget>
  );
}
