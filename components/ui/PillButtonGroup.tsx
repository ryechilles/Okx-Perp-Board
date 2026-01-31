'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Single button option
export interface PillButtonOption<T extends string = string> {
  /** Unique value for this option */
  value: T;
  /** Display label */
  label: string;
  /** Optional icon before label */
  icon?: ReactNode;
  /** Optional badge/count after label */
  badge?: string | number;
  /** Disabled state */
  disabled?: boolean;
  /** Custom active color class (e.g., 'text-red-500', 'text-green-500') */
  activeColor?: string;
}

// Props for single-select mode
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
 * PillButtonGroup - Segmented control / pill button group
 *
 * A group of mutually exclusive toggle buttons with pill/rounded style.
 * Commonly used for: quick filters, view toggles, tab-like navigation.
 *
 * Features:
 * - Consistent styling across the app
 * - Support for icons, badges, and custom active colors
 * - Accessible and keyboard navigable
 *
 * @example
 * ```tsx
 * // Simple usage
 * <PillButtonGroup
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'active', label: 'Active' },
 *     { value: 'archived', label: 'Archived' },
 *   ]}
 *   value={filter}
 *   onChange={setFilter}
 * />
 *
 * // With icons and badges
 * <PillButtonGroup
 *   options={[
 *     { value: 'overbought', label: 'Overbought', icon: <Flame />, badge: 5, activeColor: 'text-red-600' },
 *     { value: 'oversold', label: 'Oversold', icon: <Snowflake />, badge: 3, activeColor: 'text-green-600' },
 *   ]}
 *   value={rsiFilter}
 *   onChange={setRsiFilter}
 * />
 * ```
 */
export function PillButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: PillButtonGroupProps<T>) {
  return (
    <div className={cn('inline-flex bg-gray-200 rounded-lg p-1 gap-0.5', className)}>
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => !option.disabled && onChange(option.value)}
            disabled={option.disabled}
            className={cn(
              // Base styles
              'flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all',
              // Active state
              isActive
                ? cn('bg-white shadow-sm', option.activeColor || 'text-gray-900')
                : 'text-gray-600 hover:text-gray-900',
              // Disabled state
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className="text-gray-500 font-normal">{option.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PillButtonGroup;
