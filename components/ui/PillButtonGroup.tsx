'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

// Single button option
export interface PillButtonOption<T extends string = string> {
  /** Unique value for this option */
  value: T;
  /** Display label */
  label: string;
  /** Optional icon/emoji before label */
  icon?: ReactNode;
  /** Optional badge/count after label */
  badge?: string | number;
  /** Disabled state */
  disabled?: boolean;
  /** Hidden on mobile (show only on md+) */
  hiddenOnMobile?: boolean;
  /** Custom active color class (e.g., 'text-red-500', 'text-green-500') */
  activeColor?: string;
  /** Tooltip content (string or ReactNode) */
  tooltip?: ReactNode;
}

// Props for PillButtonGroup
export interface PillButtonGroupProps<T extends string = string> {
  /** Available options */
  options: PillButtonOption<T>[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Additional CSS classes for container */
  className?: string;
}

/**
 * PillButtonGroup - Segmented control / pill button group template
 *
 * A group of mutually exclusive toggle buttons with pill/rounded style.
 * Commonly used for: quick filters, view toggles, tab-like navigation.
 *
 * Features:
 * - Consistent styling across the app (text-[13px], px-3 py-1.5)
 * - Support for icons, badges, custom active colors
 * - Optional tooltips on hover
 * - Responsive (hiddenOnMobile option)
 *
 * @example
 * ```tsx
 * <PillButtonGroup
 *   options={[
 *     { value: 'all', label: 'All', tooltip: 'Show all tokens' },
 *     { value: 'top25', label: 'Top 25' },
 *     { value: 'meme', label: '🐸 Meme', activeColor: 'text-orange-500' },
 *     { value: 'overbought', label: '🔥 Overbought', badge: 5, activeColor: 'text-red-600' },
 *   ]}
 *   value={filter}
 *   onChange={setFilter}
 * />
 * ```
 */
export function PillButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: PillButtonGroupProps<T>) {
  const [hoveredValue, setHoveredValue] = useState<T | null>(null);

  return (
    <div className={cn('inline-flex bg-gray-200 rounded-lg p-1 gap-0.5', className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        const isHovered = hoveredValue === option.value;

        return (
          <div
            key={option.value}
            className={cn('relative', option.hiddenOnMobile && 'hidden md:block')}
            onMouseEnter={() => setHoveredValue(option.value)}
            onMouseLeave={() => setHoveredValue(null)}
          >
            <button
              onClick={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              className={cn(
                // Base styles - the core template style
                'px-3 py-1.5 rounded-md text-[13px] font-medium transition-all',
                // Flex for icon + label + badge
                option.icon || option.badge !== undefined ? 'flex items-center gap-1' : '',
                // Active state
                isActive
                  ? cn('bg-white shadow-sm', option.activeColor || 'text-gray-900')
                  : 'text-gray-600 hover:text-gray-900',
                // Disabled state
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.icon}
              {option.label}
              {option.badge !== undefined && (
                <span className="text-gray-500 font-normal">{option.badge}</span>
              )}
            </button>

            {/* Tooltip */}
            {option.tooltip && isHovered && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
                {typeof option.tooltip === 'string' ? (
                  <>
                    <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                    <div className="text-[12px] text-gray-900">{option.tooltip}</div>
                  </>
                ) : (
                  option.tooltip
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PillButtonGroup;
