'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SmallWidgetProps {
  /** Widget title displayed in header */
  title: string;
  /** Optional icon displayed before title */
  icon?: ReactNode;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Widget content */
  children: ReactNode;
  /** Optional header actions (buttons, etc.) */
  headerActions?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Content area padding - default: true */
  padded?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * SmallWidget - Base template for small dashboard widgets with floating card effect
 *
 * Standard dimensions: 280px - 360px width
 * Use for: Quick stats, mini charts, indicators
 *
 * Features:
 * - Floating card effect (always elevated with soft shadow)
 * - Smooth transitions on hover
 * - Consistent styling across all widgets
 *
 * @example
 * ```tsx
 * <SmallWidget
 *   title="RSI Overview"
 *   icon={<Activity className="w-4 h-4" />}
 *   subtitle="Daily RSI distribution"
 * >
 *   <div>Your content here</div>
 * </SmallWidget>
 * ```
 */
export function SmallWidget({
  title,
  icon,
  subtitle,
  children,
  headerActions,
  className,
  padded = true,
  loading = false,
}: SmallWidgetProps) {
  return (
    <div
      className={cn(
        // Base styles - floating card effect (always visible)
        'bg-white rounded-2xl',
        // Soft shadow for floating effect - always visible, no hover
        'shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
        // Size constraints
        'min-w-[280px] w-full',
        // Flex behavior in grid
        'flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="text-gray-500 flex-shrink-0">{icon}</span>
          )}
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 text-sm truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {headerActions && (
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1', padded && 'p-4')}>
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[80px]">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default SmallWidget;
