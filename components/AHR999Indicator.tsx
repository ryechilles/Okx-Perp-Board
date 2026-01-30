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
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm1.922 24.15v2.4h-2.4v-2.35c-1.65-.05-3.3-.5-4.35-1.1l.75-2.85c1.15.55 2.75 1.1 4.45 1.1 1.5 0 2.55-.55 2.55-1.55 0-.95-.85-1.55-2.8-2.2-2.85-1-4.7-2.3-4.7-4.9 0-2.35 1.7-4.2 4.65-4.75V5.45h2.4v2.3c1.65.05 2.75.4 3.6.8l-.7 2.75c-.65-.3-1.8-.8-3.55-.8-1.75 0-2.3.7-2.3 1.4 0 .85.95 1.4 3.2 2.2 3.15 1.1 4.35 2.55 4.35 5 0 2.4-1.75 4.35-4.85 4.9v2.15h-.3z"/>
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
          <div className="text-[11px] font-medium text-gray-500 mb-2">AHR999 Zone Legend</div>
          <div className="text-[11px] text-gray-600 space-y-1">
            <div><span className="text-green-600">●</span> &lt;0.45 Bottom (抄底)</div>
            <div><span className="text-emerald-500">●</span> 0.45-1.2 DCA (定投)</div>
            <div><span className="text-orange-500">●</span> 1.2-2.0 Wait (观望)</div>
            <div><span className="text-red-500">●</span> 2.0-4.0 Take Profit (止盈)</div>
            <div><span className="text-red-600">●</span> &gt;4 Top (逃顶)</div>
          </div>
        </div>
      )}
    </div>
  );
}
