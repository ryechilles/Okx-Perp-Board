'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/hooks/useMarketStore';
import { Header } from '@/components/Header';
import { Controls } from '@/components/Controls';
import { TableHeader } from '@/components/TableHeader';
import { TableRow } from '@/components/TableRow';

export default function PerpBoard() {
  const store = useMarketStore();
  
  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, []);
  
  const filteredData = store.getFilteredData();
  const { avgRsi7, avgRsi14 } = store.getRsiAverages();
  
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
      <div className="flex-1 overflow-hidden flex flex-col px-6">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col flex-1">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <span className="text-xs text-gray-500">
                {filteredData.length} Perp Contracts
              </span>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {store.rsiProgress && (
                  <span className="text-gray-400">{store.rsiProgress}</span>
                )}
                <div className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-500" />
                  <span>Live</span>
                </div>
                <span>
                  {store.lastUpdate ? store.lastUpdate.toLocaleTimeString() : '--'}
                </span>
              </div>
            </div>
            
            {/* Scrollable Table Container */}
            <div className="flex-1 overflow-hidden relative">
              {/* Fixed columns overlay */}
              <div className="absolute left-0 top-0 bottom-0 z-20 pointer-events-none" style={{ width: '194px' }}>
                <div className="h-full bg-gradient-to-r from-white via-white to-transparent" style={{ width: '100%' }} />
              </div>
              
              {/* Horizontal scroll container with bounce effect */}
              <div className="h-full overflow-x-auto overflow-y-auto scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Table Header */}
                <TableHeader
                  columns={store.columns}
                  columnOrder={store.columnOrder}
                  sort={store.sort}
                  onSort={store.updateSort}
                  onMoveColumn={store.moveColumn}
                />
                
                {/* Table Body */}
                <table className="w-full border-collapse" style={{ minWidth: '1200px' }}>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={13}>
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
                      filteredData.map(ticker => (
                        <TableRow
                          key={ticker.instId}
                          ticker={ticker}
                          rsi={store.rsiData.get(ticker.instId)}
                          fundingRate={store.fundingRateData.get(ticker.instId)}
                          listingData={store.listingData.get(ticker.instId)}
                          marketCap={store.marketCapData.get(ticker.baseSymbol)}
                          hasSpot={store.spotSymbols.has(`${ticker.baseSymbol}-USDT`)}
                          isFavorite={store.favorites.includes(ticker.instId)}
                          columns={store.columns}
                          columnOrder={store.columnOrder}
                          onToggleFavorite={store.toggleFavorite}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
