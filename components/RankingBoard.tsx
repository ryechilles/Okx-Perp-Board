'use client';

import { useState } from 'react';
import { ProcessedTicker, RSIData } from '@/lib/types';

interface RankingBoardProps {
  tickers: Map<string, ProcessedTicker>;
  rsiData: Map<string, RSIData>;
  onTokenClick?: (instId: string) => void;
}

type TimeFrame = '4h' | '24h' | '7d';

export default function RankingBoard({ tickers, rsiData, onTokenClick }: RankingBoardProps) {
  const [gainersTimeFrame, setGainersTimeFrame] = useState<TimeFrame>('24h');
  const [losersTimeFrame, setLosersTimeFrame] = useState<TimeFrame>('24h');

  // Get change value based on timeframe
  const getChange = (ticker: ProcessedTicker, timeFrame: TimeFrame): number | null => {
    if (timeFrame === '24h') {
      return ticker.changeNum;
    }
    const rsi = rsiData.get(ticker.instId);
    if (timeFrame === '4h') {
      return rsi?.change4h ?? null;
    }
    if (timeFrame === '7d') {
      return rsi?.change7d ?? null;
    }
    return null;
  };

  // Get top gainers
  const getGainers = (timeFrame: TimeFrame) => {
    const tickerArray = Array.from(tickers.values());
    return tickerArray
      .map(t => ({ ticker: t, change: getChange(t, timeFrame) }))
      .filter(item => item.change !== null && item.change > 0)
      .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
      .slice(0, 5);
  };

  // Get top losers
  const getLosers = (timeFrame: TimeFrame) => {
    const tickerArray = Array.from(tickers.values());
    return tickerArray
      .map(t => ({ ticker: t, change: getChange(t, timeFrame) }))
      .filter(item => item.change !== null && item.change < 0)
      .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
      .slice(0, 5);
  };

  const TimeFrameSelector = ({ 
    selected, 
    onChange 
  }: { 
    selected: TimeFrame; 
    onChange: (tf: TimeFrame) => void;
  }) => (
    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
      {(['4h', '24h', '7d'] as TimeFrame[]).map(tf => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-3 py-1 rounded-md transition-colors ${
            selected === tf 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );

  const RankingList = ({ 
    items, 
    type 
  }: { 
    items: { ticker: ProcessedTicker; change: number | null }[];
    type: 'gainers' | 'losers';
  }) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div 
          key={item.ticker.instId}
          onClick={() => onTokenClick?.(item.ticker.instId)}
          className="flex items-center gap-3 py-2 px-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        >
          <span className="text-gray-400 text-sm w-4">{index + 1}</span>
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-600">
            {item.ticker.baseSymbol.slice(0, 2)}
          </div>
          <span className="font-medium text-gray-900 flex-1">{item.ticker.baseSymbol}</span>
          <span className="text-gray-500 text-sm tabular-nums">
            ${item.ticker.priceNum < 0.01 
              ? item.ticker.priceNum.toPrecision(4) 
              : item.ticker.priceNum.toFixed(2)}
          </span>
          <span className={`font-medium tabular-nums min-w-[70px] text-right ${
            type === 'gainers' ? 'text-green-500' : 'text-red-500'
          }`}>
            {item.change !== null 
              ? `${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}%`
              : '--'}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center text-gray-400 py-4 text-sm">No data</div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gainers */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-1">
            涨幅榜 <span className="text-green-500">▲</span>
          </h3>
          <TimeFrameSelector selected={gainersTimeFrame} onChange={setGainersTimeFrame} />
        </div>
        <RankingList items={getGainers(gainersTimeFrame)} type="gainers" />
      </div>

      {/* Losers */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-1">
            跌幅榜 <span className="text-red-500">▼</span>
          </h3>
          <TimeFrameSelector selected={losersTimeFrame} onChange={setLosersTimeFrame} />
        </div>
        <RankingList items={getLosers(losersTimeFrame)} type="losers" />
      </div>
    </div>
  );
}
