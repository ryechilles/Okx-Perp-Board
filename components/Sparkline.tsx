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

  // Generate simple trend points based on change
  // This creates a believable visual pattern
  const generatePoints = (): string => {
    const points: [number, number][] = [];
    const numPoints = 12;
    const absChange = Math.min(Math.abs(change), 20); // Cap at 20% for visual

    // Start from middle, end based on change direction
    const startY = height / 2;
    const endY = isPositive
      ? height * 0.2 // End near top for positive
      : height * 0.8; // End near bottom for negative

    // Generate a natural looking curve with some randomness
    const seed = Math.abs(change * 1000) % 100; // Deterministic "randomness" based on change

    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const progress = i / (numPoints - 1);

      // Ease function for smooth curve
      const easeProgress = progress * progress * (3 - 2 * progress);

      // Base y position interpolated from start to end
      let y = startY + (endY - startY) * easeProgress;

      // Add some variation (but keep it deterministic)
      const variation = Math.sin((seed + i * 37) * 0.1) * (height * 0.15);
      y += variation * (1 - Math.abs(progress - 0.5) * 2); // Less variation at ends

      // Clamp y to bounds
      y = Math.max(2, Math.min(height - 2, y));

      points.push([x, y]);
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
    <div className="flex flex-col items-end gap-0.5">
      {showSparkline && (
        <Sparkline change={change} width={45} height={16} />
      )}
      <span className={`${colorClass} font-medium tabular-nums text-[12px]`}>
        {arrow} {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
}
