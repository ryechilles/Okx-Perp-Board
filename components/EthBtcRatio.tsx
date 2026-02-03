'use client';

import { useEffect, useRef } from 'react';

export function EthBtcRatio() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load TradingView script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://widgets.tradingview-widget.com/w/en/tv-mini-chart.js';
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      script.remove();
    };
  }, []);

  return (
    <div ref={containerRef}>
      {/* @ts-ignore - TradingView Web Component */}
      <tv-mini-chart symbol="OKX:ETHBTC"></tv-mini-chart>
    </div>
  );
}
