'use client';

import { ProcessedTicker, RSIData, FundingRateData, ListingData, MarketCapData, ColumnVisibility, ColumnKey } from '@/lib/types';
import { formatPrice, formatMarketCap, getRsiClass, getChangeClass, formatFundingRate, getFundingRateClass, formatListDate, COLUMN_DEFINITIONS } from '@/lib/utils';

interface TableRowProps {
  ticker: ProcessedTicker;
  rsi: RSIData | undefined;
  fundingRate: FundingRateData | undefined;
  listingData: ListingData | undefined;
  marketCap: MarketCapData | undefined;
  hasSpot: boolean;
  isFavorite: boolean;
  columns: ColumnVisibility;
  columnOrder: ColumnKey[];
  onToggleFavorite: (instId: string) => void;
}

export function TableRow({ 
  ticker, 
  rsi, 
  fundingRate,
  listingData,
  marketCap, 
  hasSpot, 
  isFavorite, 
  columns,
  columnOrder,
  onToggleFavorite 
}: TableRowProps) {
  const parts = ticker.instId.split('-');
  const base = parts[0];
  const quote = parts[1];
  
  const change4h = rsi?.change4h;
  const change7d = rsi?.change7d;
  
  const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'symbol'];
  
  const getCellStyle = (key: ColumnKey) => {
    const def = COLUMN_DEFINITIONS[key];
    const isFixed = fixedColumns.includes(key);
    
    return {
      width: def.width,
      minWidth: def.width,
      position: isFixed ? 'sticky' as const : 'relative' as const,
      left: isFixed ? (key === 'favorite' ? '0' : key === 'rank' ? '44px' : '94px') : undefined,
      zIndex: isFixed ? 10 : 1,
      backgroundColor: isFixed ? 'inherit' : undefined,
    };
  };
  
  const renderCell = (key: ColumnKey) => {
    const def = COLUMN_DEFINITIONS[key];
    let alignClass = 'text-left';
    if (def.align === 'right') alignClass = 'text-right';
    if (def.align === 'center') alignClass = 'text-center';
    
    const baseClass = `px-3 py-3 text-[13px] whitespace-nowrap ${alignClass}`;
    
    switch (key) {
      case 'favorite':
        return (
          <td key={key} className={`${baseClass} bg-white`} style={getCellStyle(key)}>
            <button
              className={`bg-transparent border-none cursor-pointer text-base transition-colors flex items-center justify-center w-full ${
                isFavorite ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-400'
              }`}
              onClick={() => onToggleFavorite(ticker.instId)}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          </td>
        );
        
      case 'rank':
        return (
          <td key={key} className={`${baseClass} text-[12px] text-gray-500 bg-white`} style={getCellStyle(key)}>
            {marketCap?.rank ? `#${marketCap.rank}` : <span className="text-gray-300">--</span>}
          </td>
        );
        
      case 'symbol':
        return (
          <td key={key} className={`${baseClass} font-semibold overflow-hidden text-ellipsis bg-white`} style={getCellStyle(key)}>
            <span className="text-gray-900">{base}</span>
            <span className="text-gray-400 font-normal">/{quote}</span>
          </td>
        );
        
      case 'price':
        return (
          <td key={key} className={`${baseClass} font-medium tabular-nums`} style={getCellStyle(key)}>
            {formatPrice(ticker.priceNum)}
          </td>
        );
        
      case 'fundingRate':
        return (
          <td key={key} className={`${baseClass} font-medium tabular-nums ${getFundingRateClass(fundingRate?.fundingRate)}`} style={getCellStyle(key)}>
            {formatFundingRate(fundingRate?.fundingRate)}
          </td>
        );
        
      case 'change4h':
        return (
          <td key={key} className={`${baseClass} font-medium tabular-nums ${getChangeClass(change4h)}`} style={getCellStyle(key)}>
            {change4h !== undefined && change4h !== null 
              ? `${change4h >= 0 ? '+' : ''}${change4h.toFixed(2)}%`
              : <span className="text-gray-300">--</span>
            }
          </td>
        );
        
      case 'change':
        return (
          <td key={key} className={`${baseClass} font-medium tabular-nums ${getChangeClass(ticker.changeNum)}`} style={getCellStyle(key)}>
            {ticker.changeNum >= 0 ? '+' : ''}{ticker.changeNum.toFixed(2)}%
          </td>
        );
        
      case 'change7d':
        return (
          <td key={key} className={`${baseClass} font-medium tabular-nums ${getChangeClass(change7d)}`} style={getCellStyle(key)}>
            {change7d !== undefined && change7d !== null 
              ? `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`
              : <span className="text-gray-300">--</span>
            }
          </td>
        );
        
      case 'marketCap':
        return (
          <td key={key} className={`${baseClass} text-gray-600 tabular-nums`} style={getCellStyle(key)}>
            {marketCap?.marketCap ? formatMarketCap(marketCap.marketCap) : <span className="text-gray-300">--</span>}
          </td>
        );
        
      case 'rsi7':
        return (
          <td key={key} className={`${baseClass} tabular-nums ${getRsiClass(rsi?.rsi7)}`} style={getCellStyle(key)}>
            {rsi?.rsi7 !== undefined && rsi.rsi7 !== null ? rsi.rsi7.toFixed(1) : '--'}
          </td>
        );
        
      case 'rsi14':
        return (
          <td key={key} className={`${baseClass} tabular-nums ${getRsiClass(rsi?.rsi14)}`} style={getCellStyle(key)}>
            {rsi?.rsi14 !== undefined && rsi.rsi14 !== null ? rsi.rsi14.toFixed(1) : '--'}
          </td>
        );
        
      case 'listDate':
        return (
          <td key={key} className={`${baseClass} text-[12px] text-gray-500`} style={getCellStyle(key)}>
            {formatListDate(listingData?.listTime)}
          </td>
        );
        
      case 'hasSpot':
        return (
          <td key={key} className={baseClass} style={getCellStyle(key)}>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
              hasSpot 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {hasSpot ? 'Yes' : 'No'}
            </span>
          </td>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <tr className="hover:bg-[#fafafa] border-b border-gray-50">
      {columnOrder.map(key => columns[key] && renderCell(key))}
    </tr>
  );
}
