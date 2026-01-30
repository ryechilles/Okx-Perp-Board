'use client';

interface SparklineProps {
  change: number;        // Percentage change (e.g., -5.5)
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Mini sparkline chart showing price trend
 * Generates a simple visual based on the change percentage
 */
export function Sparkline({ change, width = 50, height = 20, className = '' }: SparklineProps) {
  const isPositive = change >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444'; // green-500 / red-500

  // Generate jagged trend points based on change
  // This creates a volatile price-like pattern similar to CoinMarketCap
  const generatePoints = (): string => {
    const points: [number, number][] = [];
    const numPoints = 20; // More points for more detail

    // Use change value as seed for deterministic randomness
    const seed = Math.abs(change * 1000) % 1000;

    // Simple seeded random function
    const seededRandom = (i: number): number => {
      const x = Math.sin(seed + i * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    // Start from middle, end based on change direction
    const startY = height / 2;
    const endY = isPositive
      ? height * 0.15 // End near top for positive
      : height * 0.85; // End near bottom for negative

    // Generate volatile price-like movements
    let prevY = startY;

    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const progress = i / (numPoints - 1);

      // Linear trend from start to end
      const trendY = startY + (endY - startY) * progress;

      // Add significant random variation (jagged effect)
      const randomJump = (seededRandom(i) - 0.5) * height * 0.5;

      // Secondary smaller variation
      const microNoise = (seededRandom(i + 100) - 0.5) * height * 0.15;

      // Combine trend with random movements
      let y = trendY + randomJump + microNoise;

      // Slight momentum (influenced by previous point)
      y = y * 0.7 + prevY * 0.3;

      // Clamp y to bounds with padding
      y = Math.max(2, Math.min(height - 2, y));

      points.push([x, y]);
      prevY = y;
    }

    return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  };

  const points = generatePoints();

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ChangeWithSparklineProps {
  change: number | null | undefined;
  showSparkline?: boolean;
}

/**
 * Change percentage display with optional sparkline
 */
export function ChangeWithSparkline({ change, showSparkline = true }: ChangeWithSparklineProps) {
  if (change === null || change === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  const isPositive = change >= 0;
  const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <div className="flex flex-col items-center gap-0.5">
      {showSparkline && (
        <Sparkline change={change} width={45} height={16} />
      )}
      <span className={`${colorClass} font-medium tabular-nums text-[12px]`}>
        {arrow} {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
}
