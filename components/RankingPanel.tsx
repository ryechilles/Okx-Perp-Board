'use client';

import { useState } from 'react';
import { ProcessedTicker, RSIData } from '@/lib/types';

interface RankingPanelProps {
  tickers: ProcessedTicker[];
  rsiData: Map<string, RSIData>;
  onTokenClick: (instId: string) => void;
}

type TimeFrame = '4h' | '24h' | '7d';

export function RankingPanel({ tickers, rsiData, onTokenClick }: RankingPanelProps) {
  const [gainersTimeframe, setGainersTimeframe] = useState<TimeFrame>('24h');
  const [losersTimeframe, setLosersTimeframe] = useState<TimeFrame>('24h');

  // Get change value based on timeframe
  const getChange = (ticker: ProcessedTicker, timeframe: TimeFrame): number | null => {
    if (timeframe === '24h') {
      return ticker.changeNum;
    }
    const rsi = rsiData.get(ticker.instId);
    if (!rsi) return null;
    if (timeframe === '4h') return rsi.change4h;
    if (timeframe === '7d') return rsi.change7d;
    return null;
  };

  // Sort tickers by change
  const getSortedTickers = (timeframe: TimeFrame, ascending: boolean) => {
    return [...tickers]
      .map(t => ({ ticker: t, change: getChange(t, timeframe) }))
      .filter(item => item.change !== null && item.change !== undefined)
      .sort((a, b) => ascending ? (a.change! - b.change!) : (b.change! - a.change!))
      .slice(0, 5);
  };

  const topGainers = getSortedTickers(gainersTimeframe, false);
  const topLosers = getSortedTickers(losersTimeframe, true);

  const TimeframeSelector = ({ 
    value, 
    onChange 
  }: { 
    value: TimeFrame; 
    onChange: (tf: TimeFrame) => void;
  }) => (
    <div className="flex gap-1 text-[11px]">
      {(['4h', '24h', '7d'] as TimeFrame[]).map(tf => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-2 py-0.5 rounded ${
            value === tf 
              ? 'bg-gray-200 text-gray-800 font-medium' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );

  const RankingList = ({ 
    items, 
    isGainers 
  }: { 
    items: { ticker: ProcessedTicker; change: number | null }[];
    isGainers: boolean;
  }) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div 
          key={item.ticker.instId}
          onClick={() => onTokenClick(item.ticker.instId)}
          className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[12px] w-4">{index + 1}</span>
            <span className="font-medium text-[13px]">{item.ticker.baseSymbol}</span>
          </div>
          <span className={`text-[13px] font-medium ${
            isGainers ? 'text-green-500' : 'text-red-500'
          }`}>
            {item.change !== null ? `${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}%` : '--'}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center text-gray-400 text-[12px] py-4">Loading...</div>
      )}
    </div>
  );

  return (
    <div className="flex gap-4">
      {/* Top Gainers */}
      <div className="flex-1 bg-white rounded-lg border border-gray-100 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-medium text-green-600">涨幅榜 ▲</span>
          <TimeframeSelector value={gainersTimeframe} onChange={setGainersTimeframe} />
        </div>
        <RankingList items={topGainers} isGainers={true} />
      </div>

      {/* Top Losers */}
      <div className="flex-1 bg-white rounded-lg border border-gray-100 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-medium text-red-600">跌幅榜 ▼</span>
          <TimeframeSelector value={losersTimeframe} onChange={setLosersTimeframe} />
        </div>
        <RankingList items={topLosers} isGainers={false} />
      </div>
    </div>
  );
}
