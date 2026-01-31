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

// Base props shared by single and multi-select
interface PillButtonGroupBaseProps<T extends string = string> {
  /** Available options */
  options: PillButtonOption<T>[];
  /** Additional CSS classes for container */
  className?: string;
  /** Size variant: 'sm' for compact, 'md' for default */
  size?: 'sm' | 'md';
}

// Single-select props (default)
interface PillButtonGroupSingleProps<T extends string = string> extends PillButtonGroupBaseProps<T> {
  /** Multi-select mode disabled (default) */
  multiSelect?: false;
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Allow deselecting (clicking active item clears selection) */
  allowDeselect?: boolean;
}

// Multi-select props
interface PillButtonGroupMultiProps<T extends string = string> extends PillButtonGroupBaseProps<T> {
  /** Enable multi-select mode */
  multiSelect: true;
  /** Currently selected values */
  value: T[];
  /** Callback when selection changes */
  onChange: (value: T[]) => void;
  /** Not applicable in multi-select */
  allowDeselect?: never;
}

// Union type for props
export type PillButtonGroupProps<T extends string = string> =
  | PillButtonGroupSingleProps<T>
  | PillButtonGroupMultiProps<T>;

/**
 * PillButtonGroup - Segmented control / pill button group template
 *
 * A group of toggle buttons with pill/rounded style.
 * Supports both single-select and multi-select modes.
 *
 * Features:
 * - Single-select (default): mutually exclusive selection
 * - Multi-select: toggle multiple options on/off
 * - Size variants: 'sm' (compact) or 'md' (default)
 * - Support for icons, badges, custom active colors
 * - Optional tooltips on hover
 * - Responsive (hiddenOnMobile option)
 *
 * @example Single-select (default)
 * ```tsx
 * <PillButtonGroup
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'active', label: 'Active' },
 *   ]}
 *   value={filter}
 *   onChange={setFilter}
 * />
 * ```
 *
 * @example Single-select with deselect
 * ```tsx
 * <PillButtonGroup
 *   options={rankOptions}
 *   value={filters.rank}
 *   onChange={(v) => setFilters({ ...filters, rank: v })}
 *   allowDeselect
 * />
 * ```
 *
 * @example Multi-select (for column toggles)
 * ```tsx
 * <PillButtonGroup
 *   options={columnOptions}
 *   value={activeColumns}
 *   onChange={setActiveColumns}
 *   multiSelect
 *   size="sm"
 * />
 * ```
 */
export function PillButtonGroup<T extends string = string>(props: PillButtonGroupProps<T>) {
  const {
    options,
    value,
    onChange,
    className,
    size = 'md',
    multiSelect = false,
  } = props;

  const allowDeselect = !multiSelect && (props as PillButtonGroupSingleProps<T>).allowDeselect;

  const [hoveredValue, setHoveredValue] = useState<T | null>(null);

  // Size-based styles
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[12px]',
    md: 'px-3 py-1.5 text-[13px]',
  };

  // Check if a value is active
  const isActive = (optionValue: T): boolean => {
    if (multiSelect) {
      return (value as T[]).includes(optionValue);
    }
    return value === optionValue;
  };

  // Handle click
  const handleClick = (optionValue: T) => {
    if (multiSelect) {
      const currentValues = value as T[];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      (onChange as (value: T[]) => void)(newValues);
    } else {
      if (allowDeselect && value === optionValue) {
        // Deselect - pass undefined cast as T (caller should handle)
        (onChange as (value: T) => void)(undefined as unknown as T);
      } else {
        (onChange as (value: T) => void)(optionValue);
      }
    }
  };

  return (
    <div className={cn('inline-flex bg-gray-200 rounded-lg p-1 gap-0.5 flex-wrap', className)}>
      {options.map((option) => {
        const active = isActive(option.value);
        const isHovered = hoveredValue === option.value;

        return (
          <div
            key={option.value}
            className={cn('relative', option.hiddenOnMobile && 'hidden md:block')}
            onMouseEnter={() => setHoveredValue(option.value)}
            onMouseLeave={() => setHoveredValue(null)}
          >
            <button
              onClick={() => !option.disabled && handleClick(option.value)}
              disabled={option.disabled}
              className={cn(
                // Base styles
                'rounded-md font-medium transition-all',
                sizeStyles[size],
                // Flex for icon + label + badge
                option.icon || option.badge !== undefined ? 'flex items-center gap-1' : '',
                // Active state
                active
                  ? cn('bg-white shadow-sm', option.activeColor || 'text-gray-900')
                  : 'text-gray-500 hover:text-gray-700',
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
