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
      {/* Bitcoin Icon */}
      <svg
        className="w-4 h-4 text-orange-500 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 4v1H9v2h2v6H9v2h2v1h2v-1h.5c1.93 0 3.5-1.57 3.5-3.5 0-1.16-.57-2.19-1.44-2.83.27-.47.44-1.01.44-1.67 0-1.65-1.35-3-3-3h-.5V6h-2zm2 3h.5c.55 0 1 .45 1 1s-.45 1-1 1H13V9zm0 4h.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H13v-3z"/>
      </svg>

      {/* Main content */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[13px] leading-none">
          <span className="font-medium text-gray-700">AHR999</span>
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
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
          <div className="text-[11px] font-medium text-gray-500 mb-2">AHR999 Zone</div>
          <div className="text-[11px] text-gray-600 space-y-1">
            <div><span className="text-green-600">●</span> &lt;0.45 Bottom</div>
            <div><span className="text-emerald-500">●</span> 0.45-1.2 DCA</div>
            <div><span className="text-orange-500">●</span> 1.2-2.0 Wait</div>
            <div><span className="text-red-500">●</span> 2.0-4.0 Take Profit</div>
            <div><span className="text-red-600">●</span> &gt;4 Top</div>
          </div>
        </div>
      )}
    </div>
  );
}
