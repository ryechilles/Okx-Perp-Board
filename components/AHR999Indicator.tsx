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

  // Format price with commas
  const formatPrice = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '--';
    return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
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
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-11.5h-2v1h2v-1zm0 2h-2v4h-1v1h1v1h2v-1h1v-1h-1v-4zm-1-4h2c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-1c0-.55.45-1 1-1z"/>
      </svg>

      {/* Main content */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium text-gray-700 leading-none">AHR999</span>
        <div className="flex items-center gap-2 text-[13px] leading-none">
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
      </div>

      {/* Hover tooltip with details */}
      {showDetails && !loading && data && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
          <div className="text-[11px] font-medium text-gray-500 mb-2">BTC AHR999 Indicator</div>

          {/* Zone bar visualization */}
          <div className="mb-3">
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
              <div className="w-[15%] bg-green-500" title="< 0.45 Bottom" />
              <div className="w-[25%] bg-emerald-400" title="0.45-1.2 DCA" />
              <div className="w-[27%] bg-orange-400" title="1.2-2.0 Wait" />
              <div className="w-[20%] bg-red-400" title="2.0-4.0 Take Profit" />
              <div className="w-[13%] bg-red-600" title="> 4.0 Top" />
            </div>
            {/* Position indicator */}
            <div className="relative h-2 mt-0.5">
              <div
                className="absolute w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-700"
                style={{
                  left: `${Math.min(Math.max((data.value / 5) * 100, 2), 98)}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between">
              <span className="text-gray-500">BTC Price:</span>
              <span className="text-gray-900 font-medium tabular-nums">{formatPrice(data.btcPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">200D DCA Cost:</span>
              <span className="text-gray-900 font-medium tabular-nums">{formatPrice(data.dca200Cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Growth Value:</span>
              <span className="text-gray-900 font-medium tabular-nums">{formatPrice(data.growthValuation)}</span>
            </div>
          </div>

          {/* Zone legend */}
          <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span><span className="text-green-600">●</span> &lt;0.45 Bottom</span>
              <span><span className="text-emerald-500">●</span> 0.45-1.2 DCA</span>
              <span><span className="text-orange-500">●</span> 1.2-2.0 Wait</span>
              <span><span className="text-red-500">●</span> 2.0-4.0 Profit</span>
              <span><span className="text-red-600">●</span> &gt;4 Top</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
