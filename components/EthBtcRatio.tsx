'use client';

import { useEffect, useRef } from 'react';
import { loadTradingViewMiniChart } from '@/lib/widget-utils';

export function EthBtcRatio() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    loadTradingViewMiniChart();
  }, []);

  return (
    <div ref={containerRef}>
      {/* @ts-ignore - TradingView Web Component */}
      <tv-mini-chart symbol="OKX:ETHBTC"></tv-mini-chart>
    </div>
  );
}
