'use client';

import { useEffect, useState, useRef } from 'react';
import { useMarketStore } from '@/hooks/useMarketStore';
import { useUrlState } from '@/hooks/useUrlState';
import { Header } from '@/components/Header';
import { Controls } from '@/components/Controls';
import { Footer } from '@/components/Footer';
import { ColumnKey } from '@/lib/types';
import { COLUMN_DEFINITIONS, formatPrice, formatMarketCap, formatVolume, getRsiClass, getChangeClass, formatFundingRate, getFundingRateClass, formatFundingApr, getFundingAprClass, formatListDate, formatSettlementInterval, formatRsi } from '@/lib/utils';

export default function PerpBoard() {
  const store = useMarketStore();

  // URL state sync
  useUrlState(
    {
      favorites: store.favorites,
      filters: store.filters,
      columns: store.columns,
      columnOrder: store.columnOrder,
      view: store.view,
    },
    {
      setFavorites: store.setFavoritesDirectly,
      setFilters: store.setFilters,
      setColumns: store.setColumnsDirectly,
      setColumnOrder: store.setColumnOrderDirectly,
      setView: store.setView,
    }
  );

  // Drag state
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null);

  // Scroll state - only track horizontal scroll for sticky column shadow
  const [isScrolled, setIsScrolled] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Track which symbol is being hovered for z-index elevation
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, []);
  
  // Monitor horizontal scroll for sticky column shadow
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setIsScrolled(container.scrollLeft > 0);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const filteredData = store.getFilteredData();
  const { avgRsi7, avgRsi14, avgRsiW7, avgRsiW14 } = store.getRsiAverages();
  
  // Pagination
  const totalPages = Math.ceil(filteredData.length / store.pageSize);
  const paginatedData = filteredData.slice(
    (store.currentPage - 1) * store.pageSize,
    store.currentPage * store.pageSize
  );
  
  const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'logo', 'symbol'];
  
  // Get visible columns in order
  const visibleColumns = store.columnOrder.filter(key => store.columns[key]);
  
  // Fixed column widths - must match COLUMN_DEFINITIONS
  const FIXED_WIDTHS: Record<string, number> = {
    favorite: 40,
    rank: 48,
    logo: 32,
    symbol: 95,
  };
  
  // Calculate left position - add small buffer to ensure complete coverage
  const getStickyLeftOffset = (key: ColumnKey): number => {
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
  
  // Calculate column widths and sticky positions
  const getColStyle = (key: ColumnKey) => {
    // For fixed columns, use FIXED_WIDTHS
    if (FIXED_WIDTHS[key]) {
      return { width: FIXED_WIDTHS[key], minWidth: FIXED_WIDTHS[key], maxWidth: FIXED_WIDTHS[key] };
    }
    const def = COLUMN_DEFINITIONS[key];
    return { width: def.width, minWidth: def.width };
  };
  
  // Calculate left position for sticky columns
  const getStickyLeft = (key: ColumnKey): number => {
    return getStickyLeftOffset(key);
  };
  
  // Check if column is fixed
  const isFixedColumn = (key: ColumnKey) => fixedColumns.includes(key);
  
  // Check if this is the last fixed column (for shadow)
  const isLastFixedColumn = (key: ColumnKey) => {
    const visibleFixed = fixedColumns.filter(col => store.columns[col]);
    return visibleFixed[visibleFixed.length - 1] === key;
  };
  
  // Drag handlers
  const handleDragStart = (e: React.DragEvent, key: ColumnKey) => {
    if (isFixedColumn(key)) {
      e.preventDefault();
      return;
    }
    setDraggedColumn(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };
  
  const handleDragOver = (e: React.DragEvent, key: ColumnKey) => {
    e.preventDefault();
    if (isFixedColumn(key) || !draggedColumn || draggedColumn === key) return;
    setDragOverColumn(key);
  };
  
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };
  
  const handleDrop = (e: React.DragEvent, targetKey: ColumnKey) => {
    e.preventDefault();
    if (!draggedColumn || isFixedColumn(targetKey) || draggedColumn === targetKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    
    // Reorder columns
    const newOrder = [...store.columnOrder];
    const dragIndex = newOrder.indexOf(draggedColumn);
    const dropIndex = newOrder.indexOf(targetKey);
    
    if (dragIndex !== -1 && dropIndex !== -1) {
      newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggedColumn);
      store.updateColumnOrder(newOrder);
    }
    
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  
  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fafafa]">
      {/* Sticky Header */}
      <div className="bg-[#fafafa] z-50 px-6 pt-5 pb-0 flex-shrink-0">
        <div className="max-w-[1400px] mx-auto w-full">
          <Header />
          
          <Controls
            columns={store.columns}
            columnOrder={store.columnOrder}
            filters={store.filters}
            searchTerm={store.searchTerm}
            avgRsi7={avgRsi7}
            avgRsi14={avgRsi14}
            avgRsiW7={avgRsiW7}
            avgRsiW14={avgRsiW14}
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
            {/* Scrollable Table Container */}
            <div 
              ref={tableContainerRef}
              className="flex-1 overflow-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <table className="border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
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
                      const fixedWidth = FIXED_WIDTHS[key];
                      const isDragging = draggedColumn === key;
                      const isDragOver = dragOverColumn === key;
                      
                      let alignClass = 'text-left';
                      if (def.align === 'right') alignClass = 'text-right';
                      if (def.align === 'center') alignClass = 'text-center';
                      
                      const stickyStyle: React.CSSProperties | undefined = isFixed ? {
                        position: 'sticky',
                        left: stickyLeft,
                        zIndex: 30,
                        backgroundColor: '#fafafa',
                        width: fixedWidth,
                        minWidth: fixedWidth,
                        maxWidth: fixedWidth,
                        boxSizing: 'border-box',
                        boxShadow: isLastFixed && isScrolled ? '4px 0 6px -2px rgba(0,0,0,0.1)' : undefined,
                      } : undefined;
                      
                      return (
                        <th
                          key={key}
                          draggable={!isFixed}
                          onDragStart={(e) => handleDragStart(e, key)}
                          onDragOver={(e) => handleDragOver(e, key)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, key)}
                          onDragEnd={handleDragEnd}
                          className={`px-1 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wide bg-[#fafafa] border-b border-gray-200 whitespace-nowrap ${alignClass} ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''} ${!isFixed ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'bg-blue-50 border-l-2 border-l-blue-400' : ''} select-none`}
                          style={stickyStyle}
                          onClick={() => sortable && store.updateSort(key)}
                        >
                          <span className="inline-flex items-center gap-0.5">
                            {def.label}
                            {key === 'symbol' && (
                              <span className="text-[10px] text-gray-400 font-normal ml-0.5">({filteredData.length})</span>
                            )}
                            {sortable && (
                              <svg 
                                className={`w-3 h-3 ml-0.5 ${isActive ? 'text-gray-600' : 'text-gray-300'}`}
                                viewBox="0 0 12 12" 
                                fill="currentColor"
                              >
                                <path 
                                  d="M6 2L9 5H3L6 2Z" 
                                  className={isActive && store.sort.direction === 'asc' ? 'text-gray-700' : 'text-gray-300'}
                                  fill="currentColor"
                                />
                                <path 
                                  d="M6 10L3 7H9L6 10Z" 
                                  className={isActive && store.sort.direction === 'desc' ? 'text-gray-700' : 'text-gray-300'}
                                  fill="currentColor"
                                />
                              </svg>
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
                    paginatedData.map((ticker, index) => {
                      const rsi = store.rsiData.get(ticker.instId);
                      const fundingRate = store.fundingRateData.get(ticker.instId);
                      const listingData = store.listingData.get(ticker.instId);
                      const marketCap = store.marketCapData.get(ticker.baseSymbol);
                      const hasSpot = store.spotSymbols.has(`${ticker.baseSymbol}-USDT`);
                      const isFavorite = store.favorites.includes(ticker.instId);
                      
                      // Calculate actual rank in current list (considering pagination)
                      const displayRank = (store.currentPage - 1) * store.pageSize + index + 1;
                      
                      const parts = ticker.instId.split('-');
                      const base = parts[0];
                      const quote = parts[1];
                      
                      // Helper to get sticky style for cells
                      const getCellStyle = (key: ColumnKey, isHovered?: boolean): React.CSSProperties | undefined => {
                        if (!isFixedColumn(key)) return undefined;
                        const isLastFixed = isLastFixedColumn(key);
                        const fixedWidth = FIXED_WIDTHS[key];
                        return {
                          position: 'sticky',
                          left: getStickyLeft(key),
                          zIndex: isHovered ? 100 : 10,  // Elevate z-index when hovered
                          backgroundColor: '#ffffff',
                          width: fixedWidth,
                          minWidth: fixedWidth,
                          maxWidth: fixedWidth,
                          boxSizing: 'border-box',
                          boxShadow: isLastFixed && isScrolled ? '4px 0 6px -2px rgba(0,0,0,0.1)' : undefined,
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
                            
                            const baseClass = `px-1 py-3 text-[13px] whitespace-nowrap ${alignClass} ${isFixed ? 'bg-white group-hover:bg-gray-50' : ''}`;
                            
                            switch (key) {
                              case 'favorite':
                                return (
                                  <td key={key} className={baseClass} style={getCellStyle(key)}>
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
                                  <td key={key} className={`${baseClass} text-[12px] text-gray-500`} style={getCellStyle(key)}>
                                    {displayRank}
                                  </td>
                                );
                                
                              case 'symbol':
                                const isSymbolHovered = hoveredSymbol === ticker.instId;
                                return (
                                  <td
                                    key={key}
                                    className={`${baseClass} font-semibold relative`}
                                    style={getCellStyle(key, isSymbolHovered && !hasSpot)}
                                    onMouseEnter={() => !hasSpot && setHoveredSymbol(ticker.instId)}
                                    onMouseLeave={() => setHoveredSymbol(null)}
                                  >
                                    <div className="truncate">
                                      <span className="text-gray-900">{base}</span>
                                      <span className="text-gray-400 font-normal">/{quote}</span>
                                    </div>
                                    {!hasSpot && isSymbolHovered && (
                                      <div
                                        className="absolute left-full top-1/2 -translate-y-1/2 ml-2"
                                        style={{ zIndex: 9999 }}
                                      >
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
                                          <span className="text-[12px] text-gray-700 font-normal">This token spot not listed yet on OKX</span>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                );
                              
                              case 'logo':
                                const logoUrl = marketCap?.logo;
                                return (
                                  <td key={key} className={`${baseClass}`} style={getCellStyle(key)}>
                                    {logoUrl ? (
                                      <img 
                                        src={logoUrl}
                                        alt={base}
                                        className="w-5 h-5 rounded-full bg-gray-100"
                                        loading="lazy"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.onerror = null;
                                          target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect fill='%23e5e7eb' width='32' height='32' rx='16'/><text x='16' y='21' text-anchor='middle' fill='%236b7280' font-size='14' font-family='sans-serif'>${base.charAt(0)}</text></svg>`;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                                        {base.charAt(0)}
                                      </div>
                                    )}
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
                              
                              case 'fundingApr':
                                return (
                                  <td key={key} className={`${baseClass} font-medium tabular-nums ${getFundingAprClass(fundingRate?.fundingRate)}`}>
                                    {formatFundingApr(fundingRate?.fundingRate, fundingRate?.settlementInterval)}
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
                                    {formatRsi(rsi?.rsi7)}
                                  </td>
                                );

                              case 'rsi14':
                                return (
                                  <td key={key} className={`${baseClass} tabular-nums ${getRsiClass(rsi?.rsi14)}`}>
                                    {formatRsi(rsi?.rsi14)}
                                  </td>
                                );
                              
                              case 'rsiW7':
                                return (
                                  <td key={key} className={`${baseClass} tabular-nums ${getRsiClass(rsi?.rsiW7)}`}>
                                    {formatRsi(rsi?.rsiW7)}
                                  </td>
                                );

                              case 'rsiW14':
                                return (
                                  <td key={key} className={`${baseClass} tabular-nums ${getRsiClass(rsi?.rsiW14)}`}>
                                    {formatRsi(rsi?.rsiW14)}
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
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {(store.currentPage - 1) * store.pageSize + 1}-{Math.min(store.currentPage * store.pageSize, filteredData.length)} of {filteredData.length}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  store.status === 'live' ? 'bg-green-500' : 
                  store.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`} title={store.status === 'live' ? 'Live' : store.status === 'connecting' ? 'Connecting...' : 'Reconnecting...'} />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => store.setCurrentPage(1)}
                  disabled={store.currentPage === 1}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ««
                </button>
                <button
                  onClick={() => store.setCurrentPage(store.currentPage - 1)}
                  disabled={store.currentPage === 1}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  «
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (store.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (store.currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = store.currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => store.setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        store.currentPage === pageNum
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => store.setCurrentPage(store.currentPage + 1)}
                  disabled={store.currentPage === totalPages}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  »
                </button>
                <button
                  onClick={() => store.setCurrentPage(totalPages)}
                  disabled={store.currentPage === totalPages}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-6 flex-shrink-0">
        <div className="max-w-[1400px] mx-auto w-full">
          <Footer />
        </div>
      </div>
    </div>
  );
}
