'use client';

import { useEffect, useRef } from 'react';
import { loadTradingViewMiniChart } from '@/lib/widget-utils';

export function Total2MiniChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    loadTradingViewMiniChart();
  }, []);

  return (
    <div ref={containerRef}>
      {/* @ts-ignore - TradingView Web Component */}
      <tv-mini-chart symbol="CRYPTOCAP:TOTAL2"></tv-mini-chart>
    </div>
  );
}
