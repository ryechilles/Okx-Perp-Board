'use client';

import { ProcessedTicker, RSIData, MarketCapData, ColumnVisibility } from '@/lib/types';
import { formatPrice, formatMarketCap, getRsiClass, getChangeClass } from '@/lib/utils';

interface TableRowProps {
  ticker: ProcessedTicker;
  rsi: RSIData | undefined;
  marketCap: MarketCapData | undefined;
  hasSpot: boolean;
  isFavorite: boolean;
  columns: ColumnVisibility;
  onToggleFavorite: (instId: string) => void;
}

export function TableRow({ 
  ticker, 
  rsi, 
  marketCap, 
  hasSpot, 
  isFavorite, 
  columns,
  onToggleFavorite 
}: TableRowProps) {
  const parts = ticker.instId.split('-');
  const base = parts[0];
  const quote = parts[1];
  
  const change4h = rsi?.change4h;
  const change7d = rsi?.change7d;
  
  return (
    <tr className="hover:bg-[#fafafa]">
      <td className="w-9 px-2 py-3">
        <button
          className={`bg-transparent border-none cursor-pointer text-sm transition-colors ${
            isFavorite ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-400'
          }`}
          onClick={() => onToggleFavorite(ticker.instId)}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </td>
      
      <td 
        className="w-[120px] px-4 py-3 text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ display: columns.symbol ? '' : 'none' }}
      >
        <span className="text-gray-900">{base}</span>
        <span className="text-gray-400 font-normal">/{quote}</span>
      </td>
      
      <td 
        className="w-[100px] px-4 py-3 text-[13px] text-right font-medium tabular-nums whitespace-nowrap"
        style={{ display: columns.price ? '' : 'none' }}
      >
        {formatPrice(ticker.priceNum)}
      </td>
      
      <td 
        className={`w-[95px] px-4 py-3 text-[13px] text-right font-medium tabular-nums whitespace-nowrap ${getChangeClass(change4h)}`}
        style={{ display: columns.change4h ? '' : 'none' }}
      >
        {change4h !== undefined && change4h !== null 
          ? `${change4h >= 0 ? '+' : ''}${change4h.toFixed(2)}%`
          : <span className="text-gray-300">--</span>
        }
      </td>
      
      <td 
        className={`w-[95px] px-4 py-3 text-[13px] text-right font-medium tabular-nums whitespace-nowrap ${getChangeClass(ticker.changeNum)}`}
        style={{ display: columns.change ? '' : 'none' }}
      >
        {ticker.changeNum >= 0 ? '+' : ''}{ticker.changeNum.toFixed(2)}%
      </td>
      
      <td 
        className={`w-[95px] px-4 py-3 text-[13px] text-right font-medium tabular-nums whitespace-nowrap ${getChangeClass(change7d)}`}
        style={{ display: columns.change7d ? '' : 'none' }}
      >
        {change7d !== undefined && change7d !== null 
          ? `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`
          : <span className="text-gray-300">N/A</span>
        }
      </td>
      
      <td 
        className="w-[70px] px-4 py-3 text-[12px] text-right text-gray-500 whitespace-nowrap"
        style={{ display: columns.rank ? '' : 'none' }}
      >
        {marketCap?.rank ? `#${marketCap.rank}` : <span className="text-gray-300">N/A</span>}
      </td>
      
      <td 
        className="w-[100px] px-4 py-3 text-[13px] text-right text-gray-600 tabular-nums whitespace-nowrap"
        style={{ display: columns.marketCap ? '' : 'none' }}
      >
        {marketCap?.marketCap ? formatMarketCap(marketCap.marketCap) : <span className="text-gray-300">N/A</span>}
      </td>
      
      <td 
        className={`w-[65px] px-4 py-3 text-[13px] text-right tabular-nums whitespace-nowrap ${getRsiClass(rsi?.rsi7)}`}
        style={{ display: columns.rsi7 ? '' : 'none' }}
      >
        {rsi?.rsi7 !== undefined && rsi.rsi7 !== null ? rsi.rsi7.toFixed(1) : '--'}
      </td>
      
      <td 
        className={`w-[65px] px-4 py-3 text-[13px] text-right tabular-nums whitespace-nowrap ${getRsiClass(rsi?.rsi14)}`}
        style={{ display: columns.rsi14 ? '' : 'none' }}
      >
        {rsi?.rsi14 !== undefined && rsi.rsi14 !== null ? rsi.rsi14.toFixed(1) : '--'}
      </td>
      
      <td 
        className="w-[65px] px-4 py-3"
        style={{ display: columns.hasSpot ? '' : 'none' }}
      >
        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
          hasSpot 
            ? 'bg-green-100 text-green-600' 
            : 'bg-gray-100 text-gray-400'
        }`}>
          {hasSpot ? 'Yes' : 'No'}
        </span>
      </td>
    </tr>
  );
}
