'use client';

import { useEffect, useRef } from 'react';

export function BTCDominance() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create TradingView Mini Symbol Overview widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: "CRYPTOCAP:BTC.D",
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "1D",
      colorTheme: "light",
      isTransparent: true,
      autosize: true,
      largeChartUrl: ""
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
    />
  );
}
