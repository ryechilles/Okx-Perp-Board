'use client';

import { useEffect, useRef } from 'react';

// Track whether the TradingView mini-chart script has been loaded globally
let tvMiniChartScriptLoaded = false;

export function EthBtcRatio() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (tvMiniChartScriptLoaded) return;

    // Load TradingView script once globally (web component script, no need to remove)
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://widgets.tradingview-widget.com/w/en/tv-mini-chart.js';
    document.head.appendChild(script);
    tvMiniChartScriptLoaded = true;
  }, []);

  return (
    <div ref={containerRef}>
      {/* @ts-ignore - TradingView Web Component */}
      <tv-mini-chart symbol="OKX:ETHBTC"></tv-mini-chart>
    </div>
  );
}
