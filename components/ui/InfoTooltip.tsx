'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InfoTooltipProps {
  /** Tooltip content - can be string or JSX */
  content: ReactNode;
  /** Icon size */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * InfoTooltip - Hover/click to show information tooltip
 *
 * @example
 * ```tsx
 * <InfoTooltip content="This is a helpful explanation" />
 *
 * <InfoTooltip
 *   content={
 *     <ul>
 *       <li>Point 1</li>
 *       <li>Point 2</li>
 *     </ul>
 *   }
 * />
 * ```
 */
export function InfoTooltip({ content, size = 'sm', className }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  // Calculate position to avoid overflow
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 200 ? 'top' : 'bottom');
    }
  }, [isVisible]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'text-gray-400 hover:text-gray-600 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full'
        )}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="More information"
      >
        <Info className={sizeClasses[size]} />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 w-64 p-3',
            'bg-gray-900 text-white text-xs rounded-lg shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
          )}
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45',
              position === 'bottom' ? '-top-1' : '-bottom-1'
            )}
          />
          <div className="relative">{content}</div>
        </div>
      )}
    </div>
  );
}

export default InfoTooltip;
