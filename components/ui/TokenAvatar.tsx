'use client';

import { cn } from '@/lib/utils';

interface TokenAvatarProps {
  /** Token symbol (used for alt text and fallback) */
  symbol: string;
  /** Logo URL (optional) */
  logo?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 text-[8px]',
  md: 'w-5 h-5 text-[9px]',
  lg: 'w-6 h-6 text-[10px]',
};

/**
 * TokenAvatar - Displays a token's logo or fallback initial
 *
 * Used in widget token lists to show token identity consistently.
 * Falls back to first letter of symbol if no logo is available.
 *
 * @example
 * ```tsx
 * <TokenAvatar symbol="BTC" logo={btcLogo} size="md" />
 * <TokenAvatar symbol="ETH" />  // Shows "E" fallback
 * ```
 */
export function TokenAvatar({ symbol, logo, size = 'md', className }: TokenAvatarProps) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={symbol}
        className={cn('rounded-full', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium',
        sizeClasses[size],
        className
      )}
    >
      {symbol.charAt(0)}
    </div>
  );
}

export default TokenAvatar;
