'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/hooks/useMarketStore';
import { Header } from '@/components/Header';
import { Controls } from '@/components/Controls';
import { ColumnKey } from '@/lib/types';
import { COLUMN_DEFINITIONS, formatPrice, formatMarketCap, formatVolume, getRsiClass, getChangeClass, formatFundingRate, getFundingRateClass, formatListDate, formatSettlementInterval } from '@/lib/utils';

export default function PerpBoard() {
  const store = useMarketStore();
  
  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, []);
  
  const filteredData = store.getFilteredData();
  const { avgRsi7, avgRsi14 } = store.getRsiAverages();
  
  const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'symbol'];
  
  // Get visible columns in order
  const visibleColumns = store.columnOrder.filter(key => store.columns[key]);
  
  // Fixed column widths (must match COLUMN_DEFINITIONS exactly)
  const FIXED_WIDTHS: Record<string, number> = {
    favorite: 36,
    rank: 40,
    symbol: 85,
  };
  
  // Calculate column widths and sticky positions
  const getColStyle = (key: ColumnKey) => {
    const def = COLUMN_DEFINITIONS[key];
    return { width: def.width, minWidth: def.width };
  };
  
  // Calculate left position for sticky columns
  const getStickyLeft = (key: ColumnKey): number => {
    if (!fixedColumns.includes(key)) return 0;
    let left = 0;
    for (const col of fixedColumns) {
      if (col === key) break;
      if (store.columns[col]) {
        left += FIXED_WIDTHS[col] || 0;
      }
    }
    return left;
  };
  
  // Check if column is fixed
  const isFixedColumn = (key: ColumnKey) => fixedColumns.includes(key);
  
  // Check if this is the last fixed column (for shadow)
  const isLastFixedColumn = (key: ColumnKey) => {
    const visibleFixed = fixedColumns.filter(col => store.columns[col]);
    return visibleFixed[visibleFixed.length - 1] === key;
  };
  
  // Check if it's the last fixed column (for border)
  const isLastFixedColumn = (key: ColumnKey) => {
    const visibleFixed = fixedColumns.filter(col => store.columns[col]);
    return visibleFixed[visibleFixed.length - 1] === key;
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Sticky Header */}
      <div className="bg-[#fafafa] z-50 px-6 pt-5 pb-0 flex-shrink-0">
        <div className="max-w-[1400px] mx-auto w-full">
          <Header />
          
          <Controls
            view={store.view}
            columns={store.columns}
            columnOrder={store.columnOrder}
            filters={store.filters}
            searchTerm={store.searchTerm}
            avgRsi7={avgRsi7}
            avgRsi14={avgRsi14}
            onViewChange={store.setView}
            onColumnChange={store.updateColumn}
            onColumnsPreset={store.setColumnsPreset}
            onFiltersChange={store.setFilters}
            onSearchChange={store.setSearchTerm}
            onColumnOrderChange={store.updateColumnOrder}
          />
        </div>
      </div>
      
      {/* Table Area */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 pb-4">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col flex-1">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <span className="text-xs text-gray-500">
                {filteredData.length} Perp Contracts
              </span>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {store.rsiProgress && (
                  <span className="text-gray-400">{store.rsiProgress}</span>
                )}
                <div className="flex items-center">
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    store.status === 'live' ? 'bg-green-500' : 
                    store.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <span>
                    {store.status === 'live' ? 'Live' : 
                     store.status === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
                  </span>
                </div>
                <span>
                  {store.lastUpdate ? store.lastUpdate.toLocaleTimeString() : '--'}
                </span>
              </div>
            </div>
            
            {/* Scrollable Table Container */}
            <div className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full border-collapse" style={{ minWidth: '1100px' }}>
                <colgroup>
                  {visibleColumns.map(key => (
                    <col key={key} style={getColStyle(key)} />
                  ))}
                </colgroup>
                
                {/* Table Header */}
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#fafafa]">
                    {visibleColumns.map(key => {
                      const def = COLUMN_DEFINITIONS[key];
                      const sortable = def.sortable !== false;
                      const isActive = store.sort.column === key;
                      const isFixed = isFixedColumn(key);
                      const isLastFixed = isLastFixedColumn(key);
                      const stickyLeft = getStickyLeft(key);
                      
                      let alignClass = 'text-left';
                      if (def.align === 'right') alignClass = 'text-right';
                      if (def.align === 'center') alignClass = 'text-center';
                      
                      const stickyStyle = isFixed ? {
                        position: 'sticky' as const,
                        left: stickyLeft,
                        zIndex: 30,
                        backgroundColor: '#fafafa',
                        boxShadow: isLastFixed ? '4px 0 6px -2px rgba(0,0,0,0.1)' : undefined,
                      } : undefined;
                      
                      return (
                        <th
                          key={key}
                          className={`px-2 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wide bg-[#fafafa] border-b border-gray-200 whitespace-nowrap ${alignClass} ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          style={stickyStyle}
                          onClick={() => sortable && store.updateSort(key)}
                        >
                          <span className="inline-flex items-center gap-0.5">
                            {def.label}
                            {sortable && (
                              <span className={`ml-0.5 inline-flex flex-col text-[8px] leading-[0.6] ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                                <span className={isActive && store.sort.direction === 'asc' ? 'text-gray-700' : 'text-gray-300'}>▲</span>
                                <span className={isActive && store.sort.direction === 'desc' ? 'text-gray-700' : 'text-gray-300'}>▼</span>
                              </span>
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length}>
                        <div className="flex items-center justify-center py-16 text-gray-500">
                          {store.tickers.size === 0 ? (
                            <>
                              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mr-3" />
                              Loading market data...
                            </>
                          ) : (
                            'No data found'
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(ticker => {
                      const rsi = store.rsiData.get(ticker.instId);
                      const fundingRate = store.fundingRateData.get(ticker.instId);
                      const listingData = store.listingData.get(ticker.instId);
                      const marketCap = store.marketCapData.get(ticker.baseSymbol);
                      const hasSpot = store.spotSymbols.has(`${ticker.baseSymbol}-USDT`);
                      const isFavorite = store.favorites.includes(ticker.instId);
                      
                      const parts = ticker.instId.split('-');
                      const base = parts[0];
                      const quote = parts[1];
                      
                      // Helper to get sticky style for cells
                      const getCellStyle = (key: ColumnKey) => {
                        if (!isFixedColumn(key)) return undefined;
                        const isLastFixed = isLastFixedColumn(key);
                        return {
                          position: 'sticky' as const,
                          left: getStickyLeft(key),
                          zIndex: 10,
                          backgroundColor: 'white',
                          boxShadow: isLastFixed ? '4px 0 6px -2px rgba(0,0,0,0.1)' : undefined,
                        };
                      };
                      
                      return (
                        <tr key={ticker.instId} className="hover:bg-gray-50 border-b border-gray-50 group">
                          {visibleColumns.map(key => {
                            const def = COLUMN_DEFINITIONS[key];
                            const isFixed = isFixedColumn(key);
                            let alignClass = 'text-left';
                            if (def.align === 'right') alignClass = 'text-right';
                            if (def.align === 'center') alignClass = 'text-center';
                            
                            const baseClass = `px-2 py-3 text-[13px] whitespace-nowrap ${alignClass} ${isFixed ? 'group-hover:bg-gray-50' : ''}`;
                            const cellStyle = getCellStyle(key);
                            
                            switch (key) {
                              case 'favorite':
                                return (
                                  <td key={key} className={baseClass} style={cellStyle}>
                                    <button
                                      className={`bg-transparent border-none cursor-pointer text-base transition-colors ${
                                        isFavorite ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-400'
                                      }`}
                                      onClick={() => store.toggleFavorite(ticker.instId)}
                                    >
                                      {isFavorite ? '★' : '☆'}
                                    </button>
                                  </td>
                                );
                                
                              case 'rank':
                                return (
                                  <td key={key} className={`${baseClass} text-[12px] text-gray-500`} style={cellStyle}>
                                    {marketCap?.rank ? marketCap.rank : <span className="text-gray-300">--</span>}
                                  </td>
                                );
                                
                              case 'symbol':
                                return (
                                  <td key={key} className={`${baseClass} font-semibold`} style={cellStyle}>
                                    <span className="text-gray-900">{base}</span>
                                    <span className="text-gray-400 font-normal">/{quote}</span>
                                  </td>
                                );
                                
                              case 'price':
                                return (
                                  <td key={key} className={`${baseClass} font-medium tabular-nums`}>
                                    {formatPrice(ticker.priceNum)}
                                  </td>
                                );
                                
                              case 'fundingRate':
                                return (
                                  <td key={key} className={`${baseClass} font-medium tabular-nums ${getFundingRateClass(fundingRate?.fundingRate)}`}>
                                    {formatFundingRate(fundingRate?.fundingRate)}
                                  </td>
                                );
                              
                              case 'fundingInterval':
                                return (
                                  <td key={key} className={`${baseClass} text-[12px] text-gray-500`}>
                                    {formatSettlementInterval(fundingRate?.settlementInterval)}
                                  </td>
                                );
                                
                              case 'change4h':
                                const change4h = rsi?.change4h;
                                return (
                                  <td key={key} className={`${baseClass} font-medium tabular-nums ${getChangeClass(change4h)}`}>
                                    {change4h !== undefined && change4h !== null 
                                      ? `${change4h >= 0 ? '+' : ''}${change4h.toFixed(2)}%`
                                      : <span className="text-gray-300">--</span>
                                    }
                                  </td>
                                );
                                
                              case 'change':
                                return (
                                  <td key={key} className={`${baseClass} font-medium tabular-nums ${getChangeClass(ticker.changeNum)}`}>
                                    {ticker.changeNum >= 0 ? '+' : ''}{ticker.changeNum.toFixed(2)}%
                                  </td>
                                );
                                
                              case 'change7d':
                                const change7d = rsi?.change7d;
                                return (
                                  <td key={key} className={`${baseClass} font-medium tabular-nums ${getChangeClass(change7d)}`}>
                                    {change7d !== undefined && change7d !== null 
                                      ? `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`
                                      : <span className="text-gray-300">--</span>
                                    }
                                  </td>
                                );
                                
                              case 'marketCap':
                                return (
                                  <td key={key} className={`${baseClass} text-gray-600 tabular-nums`}>
                                    {marketCap?.marketCap ? formatMarketCap(marketCap.marketCap) : <span className="text-gray-300">--</span>}
                                  </td>
                                );
                              
                              case 'volume24h':
                                return (
                                  <td key={key} className={`${baseClass} text-gray-600 tabular-nums`}>
                                    {formatVolume(ticker.volCcy24h, ticker.priceNum)}
                                  </td>
                                );
                                
                              case 'rsi7':
                                return (
                                  <td key={key} className={`${baseClass} tabular-nums ${getRsiClass(rsi?.rsi7)}`}>
                                    {rsi?.rsi7 !== undefined && rsi.rsi7 !== null ? rsi.rsi7.toFixed(1) : '--'}
                                  </td>
                                );
                                
                              case 'rsi14':
                                return (
                                  <td key={key} className={`${baseClass} tabular-nums ${getRsiClass(rsi?.rsi14)}`}>
                                    {rsi?.rsi14 !== undefined && rsi.rsi14 !== null ? rsi.rsi14.toFixed(1) : '--'}
                                  </td>
                                );
                                
                              case 'listDate':
                                return (
                                  <td key={key} className={`${baseClass} text-[12px] text-gray-500`}>
                                    {formatListDate(listingData?.listTime)}
                                  </td>
                                );
                                
                              case 'hasSpot':
                                return (
                                  <td key={key} className={baseClass}>
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
                                return <td key={key} className={baseClass}>--</td>;
                            }
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
