'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface WidgetGridProps {
  /** Grid children (widgets) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Grid layout variant */
  variant?: 'auto' | 'fixed' | 'masonry';
  /** Gap between widgets */
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * WidgetGrid - Responsive grid layout for widgets
 *
 * Variants:
 * - auto: Auto-fit columns based on content (default)
 * - fixed: Fixed column layout (2 on md, 3 on lg, 4 on xl)
 * - masonry: CSS columns for masonry-like layout
 *
 * @example
 * ```tsx
 * <WidgetGrid variant="auto" gap="md">
 *   <SmallWidget title="Widget 1">...</SmallWidget>
 *   <SmallWidget title="Widget 2">...</SmallWidget>
 *   <LargeWidget title="Widget 3">...</LargeWidget>
 * </WidgetGrid>
 * ```
 */
export function WidgetGrid({
  children,
  className,
  variant = 'auto',
  gap = 'md',
}: WidgetGridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const variantClasses = {
    auto: 'flex flex-wrap items-start',
    fixed: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    masonry: 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 space-y-4',
  };

  return (
    <div className={cn(variantClasses[variant], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

export default WidgetGrid;
