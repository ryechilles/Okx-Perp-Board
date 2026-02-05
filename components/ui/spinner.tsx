'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  /** Size: 'sm' (16px), 'md' (20px), 'lg' (24px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * Spinner - Unified loading indicator using Lucide Loader2 icon
 * Matches shadcn/ui design system
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        sizeMap[size],
        'animate-spin text-muted-foreground',
        className
      )}
    />
  );
}

export default Spinner;
