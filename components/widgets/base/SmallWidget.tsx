'use client';

import { ReactNode, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SmallWidgetProps {
  /** Widget title displayed in header */
  title: string;
  /** Optional icon displayed before title */
  icon?: ReactNode;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Tooltip content - shows info icon, click to expand inline */
  tooltip?: ReactNode;
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
 * SmallWidget - Base template for small dashboard widgets
 *
 * Standard dimensions: 280px - 360px width
 * Use for: Quick stats, mini charts, indicators
 *
 * Features:
 * - Flat card style matching PillButton aesthetic
 * - Subtle border and shadow for definition
 * - Consistent styling across all widgets
 * - Click info icon to show/hide explanation inline (smooth expand)
 *
 * Tooltip Guidelines:
 * - Use <TooltipContent> component from @/components/ui
 * - Pass array of strings or JSX elements
 * - Bullet points are added automatically
 * - Use colored spans for keywords
 *
 * @example
 * ```tsx
 * import { TooltipContent } from '@/components/ui';
 *
 * <SmallWidget
 *   title="RSI Overview"
 *   icon={<Activity className="w-4 h-4" />}
 *   subtitle="Daily RSI distribution"
 *   tooltip={
 *     <TooltipContent items={[
 *       "Simple text explanation",
 *       "Another point here",
 *       <><span className="text-red-500">Keyword</span>: with explanation</>,
 *     ]} />
 *   }
 * >
 *   <div>Your content here</div>
 * </SmallWidget>
 * ```
 */
export function SmallWidget({
  title,
  icon,
  subtitle,
  tooltip,
  children,
  headerActions,
  className,
  padded = true,
  loading = false,
}: SmallWidgetProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={cn(
        // Base styles - flat card matching PillButton style
        'bg-white rounded-xl',
        // Subtle border and shadow for definition
        'border border-gray-200 shadow-sm',
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
            <div className="flex items-center gap-1.5">
              <h3 className="font-medium text-gray-900 text-sm truncate">
                {title}
              </h3>
              {tooltip && (
                <button
                  type="button"
                  onClick={() => setShowTooltip(!showTooltip)}
                  className={cn(
                    'text-gray-400 hover:text-gray-600 transition-colors',
                    'focus:outline-none rounded-full',
                    showTooltip && 'text-blue-500 hover:text-blue-600'
                  )}
                  aria-label="Toggle information"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
          <>
            {children}

            {/* Inline Tooltip - auto height */}
            {tooltip && showTooltip && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="text-[11px] text-gray-500 space-y-1">
                  {tooltip}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SmallWidget;
