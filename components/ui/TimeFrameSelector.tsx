'use client';

import { TimeFrame } from '@/lib/widget-utils';

interface TimeFrameSelectorProps {
  value: TimeFrame;
  onChange: (tf: TimeFrame) => void;
}

/**
 * TimeFrameSelector
 * Shared component for selecting 1h/4h/24h time frames
 */
export function TimeFrameSelector({ value, onChange }: TimeFrameSelectorProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      {(['1h', '4h', '24h'] as TimeFrame[]).map((tf) => (
        <button
          key={tf}
          onClick={(e) => {
            e.stopPropagation();
            onChange(tf);
          }}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === tf
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
