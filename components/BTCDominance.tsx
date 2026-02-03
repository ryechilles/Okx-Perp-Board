'use client';

import { useEffect, useRef } from 'react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent } from '@/components/ui';

export function BTCDominance() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create TradingView widget
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
      largeChartUrl: "",
      noTimeScale: false,
      chartOnly: false
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // BTC icon
  const btcIcon = (
    <img
      src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
      alt="BTC"
      className="w-5 h-5 rounded-full"
    />
  );

  return (
    <SmallWidget
      title="BTC Dominance"
      icon={btcIcon}
      subtitle="TradingView BTC.D"
      className="w-full"
      padded={false}
      tooltip={
        <TooltipContent items={[
          "BTC market cap / Total market cap",
          "Data from TradingView",
        ]} />
      }
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: '180px' }}
      />
    </SmallWidget>
  );
}
