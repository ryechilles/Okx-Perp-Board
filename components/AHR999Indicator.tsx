'use client';

import { useState, useEffect } from 'react';
import { fetchAHR999Data, getAHR999ZoneInfo, AHR999Data } from '@/lib/ahr999';

export function AHR999Indicator() {
  const [data, setData] = useState<AHR999Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchAHR999Data();
      setData(result);
      setLoading(false);
    };

    loadData();

    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const zoneInfo = getAHR999ZoneInfo(data?.value ?? null);

  // Format number with fixed decimals
  const formatValue = (val: number | null | undefined, decimals: number = 2) => {
    if (val === null || val === undefined) return '--';
    return val.toFixed(decimals);
  };

  // Calculate position percentage for the indicator (0-5 range mapped to 0-100%)
  const getPositionPercent = (value: number) => {
    return Math.min(Math.max((value / 5) * 100, 2), 98);
  };

  return (
    <div
      className="relative flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-default"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Bitcoin Logo from CoinGecko */}
      <img
        src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
        alt="BTC"
        className="w-4 h-4 rounded-full flex-shrink-0"
      />

      {/* Main content */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[13px] leading-none">
          <span className="font-medium text-gray-700">Ahr999</span>
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : (
            <>
              <span className={`font-medium tabular-nums ${zoneInfo.color}`}>
                {formatValue(data?.value)}
              </span>
              <span className={`font-medium ${zoneInfo.color}`}>
                {zoneInfo.label}
              </span>
            </>
          )}
        </div>

        {/* Zone bar in component */}
        {!loading && data && (
          <div className="w-[180px]">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div className="w-[9%] bg-green-500" />
              <div className="w-[15%] bg-emerald-400" />
              <div className="w-[16%] bg-orange-400" />
              <div className="w-[40%] bg-red-400" />
              <div className="w-[20%] bg-red-600" />
            </div>
            {/* Position indicator */}
            <div className="relative h-1.5 -mt-0.5">
              <div
                className="absolute w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-gray-700"
                style={{
                  left: `${getPositionPercent(data.value)}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hover tooltip with zone legend */}
      {showDetails && !loading && data && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
          <div className="text-[11px] font-medium text-gray-500 mb-2">Ahr999 Zone</div>
          <div className="flex items-start gap-3 text-[11px] text-gray-900">
            {/* Current zone - left side */}
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Current</div>
              <div className={`font-medium ${zoneInfo.color}`}>
                <span>{zoneInfo.dot}</span> {zoneInfo.range} {zoneInfo.label}
              </div>
            </div>
            {/* Divider */}
            <div className="text-gray-500 self-center">|</div>
            {/* Other zones - right side */}
            <div className="space-y-1">
              <div className="text-[10px] text-gray-500 mb-1">All Zones</div>
              {zoneInfo.label !== 'Bottom' && <div><span className="text-green-600">●</span> &lt;0.45 Bottom</div>}
              {zoneInfo.label !== 'DCA' && <div><span className="text-emerald-500">●</span> 0.45-1.2 DCA</div>}
              {zoneInfo.label !== 'Wait' && <div><span className="text-orange-500">●</span> 1.2-2.0 Wait</div>}
              {zoneInfo.label !== 'Take Profit' && <div><span className="text-red-500">●</span> 2.0-4.0 Take Profit</div>}
              {zoneInfo.label !== 'Top' && <div><span className="text-red-600">●</span> &gt;4 Top</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
