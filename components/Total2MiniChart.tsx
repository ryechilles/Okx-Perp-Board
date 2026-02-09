'use client';

import { useEffect } from 'react';
import { loadTradingViewMiniChart } from '@/lib/widget-utils';

export function Total2MiniChart() {
  useEffect(() => {
    loadTradingViewMiniChart();
  }, []);

  return (
    <div>
      {/* @ts-ignore - TradingView Web Component */}
      <tv-mini-chart symbol="CRYPTOCAP:TOTAL2"></tv-mini-chart>
    </div>
  );
}
