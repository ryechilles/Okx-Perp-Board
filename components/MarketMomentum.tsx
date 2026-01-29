'use client';

import { useState } from 'react';

interface MarketMomentumProps {
  avgRsi7: number | null;
  avgRsi14: number | null;
  avgRsiW7: number | null;
  avgRsiW14: number | null;
}

type MomentumLevel = 'oversold' | 'weak' | 'neutral' | 'strong' | 'overbought';

interface MomentumInfo {
  level: MomentumLevel;
  label: string;
  color: string;
  bgColor: string;
}

// Get RSI color based on value (7-level color scale, same as table)
function getRsiColor(rsi: number | null): string {
  if (rsi === null) return 'text-gray-400';
  if (rsi <= 25) return 'text-green-600';      // Oversold Zone
  if (rsi <= 35) return 'text-green-500';      // Weak
  if (rsi <= 45) return 'text-emerald-500';    // Neutral → Weak
  if (rsi <= 55) return 'text-gray-600';       // Neutral
  if (rsi <= 65) return 'text-orange-500';     // Neutral → Strong
  if (rsi <= 75) return 'text-red-500';        // Strong
  return 'text-red-600';                       // Overbought Zone
}

// Format RSI value with emoji for extreme zones
function formatRsi(rsi: number | null): string {
  if (rsi === null) return '--';
  const value = rsi.toFixed(1);
  if (rsi <= 25) return `🔥${value}`;          // Oversold Zone
  if (rsi > 75) return `🧊${value}`;           // Overbought Zone
  return value;
}

function getMomentumInfo(rsi: number | null): MomentumInfo {
  if (rsi === null) {
    return { level: 'neutral', label: '--', color: 'text-gray-400', bgColor: 'bg-gray-50' };
  }

  if (rsi <= 25) {
    return { level: 'oversold', label: 'Oversold Zone', color: 'text-green-600', bgColor: 'bg-green-50' };
  }
  if (rsi <= 35) {
    return { level: 'weak', label: 'Weak', color: 'text-green-500', bgColor: 'bg-green-50' };
  }
  if (rsi <= 45) {
    return { level: 'neutral', label: 'Neutral → Weak', color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
  }
  if (rsi <= 55) {
    return { level: 'neutral', label: 'Neutral', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
  if (rsi <= 65) {
    return { level: 'neutral', label: 'Neutral → Strong', color: 'text-orange-500', bgColor: 'bg-orange-50' };
  }
  if (rsi <= 75) {
    return { level: 'strong', label: 'Strong', color: 'text-red-500', bgColor: 'bg-red-50' };
  }
  return { level: 'overbought', label: 'Overbought Zone', color: 'text-red-600', bgColor: 'bg-red-50' };
}

function getCombinedMomentum(rsi7: number | null, rsi14: number | null): MomentumInfo {
  if (rsi7 === null && rsi14 === null) {
    return { level: 'neutral', label: '--', color: 'text-gray-400', bgColor: 'bg-gray-50' };
  }

  // Use average of both, or whichever is available
  const avg = rsi7 !== null && rsi14 !== null
    ? (rsi7 + rsi14) / 2
    : rsi7 ?? rsi14;

  return getMomentumInfo(avg);
}

export function MarketMomentum({ avgRsi7, avgRsi14, avgRsiW7, avgRsiW14 }: MarketMomentumProps) {
  const [showDetails, setShowDetails] = useState(false);

  const dailyMomentum = getCombinedMomentum(avgRsi7, avgRsi14);
  const weeklyMomentum = getCombinedMomentum(avgRsiW7, avgRsiW14);

  return (
    <div
      className="relative flex items-center gap-3 px-3 h-9 bg-white border border-gray-200 rounded-lg cursor-default"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Icon */}
      <svg
        className="w-4 h-4 text-gray-400 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>

      {/* Main content */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-gray-500 leading-none">Market Momentum</span>
        <div className="flex items-center gap-2 text-[12px] leading-none">
          <span className="text-gray-400">Daily:</span>
          <span className={`font-medium ${dailyMomentum.color}`}>{dailyMomentum.label}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">Weekly:</span>
          <span className={`font-medium ${weeklyMomentum.color}`}>{weeklyMomentum.label}</span>
        </div>
      </div>

      {/* Hover tooltip with detailed RSI values */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
          <div className="text-[11px] font-medium text-gray-500 mb-2">RSI Details</div>
          <div className="flex items-center gap-3 text-[12px]">
            {/* Daily RSI - Left */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">D-RSI7:</span>
                <span className={`font-medium tabular-nums ${getRsiColor(avgRsi7)}`}>
                  {formatRsi(avgRsi7)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">D-RSI14:</span>
                <span className={`font-medium tabular-nums ${getRsiColor(avgRsi14)}`}>
                  {formatRsi(avgRsi14)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="text-gray-300">|</div>

            {/* Weekly RSI - Right */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">W-RSI7:</span>
                <span className={`font-medium tabular-nums ${getRsiColor(avgRsiW7)}`}>
                  {formatRsi(avgRsiW7)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">W-RSI14:</span>
                <span className={`font-medium tabular-nums ${getRsiColor(avgRsiW14)}`}>
                  {formatRsi(avgRsiW14)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
