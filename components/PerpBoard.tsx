'use client';

import { useEffect, useState, useRef } from 'react';
import { useMarketStore } from '@/hooks/useMarketStore';
import { useUrlState } from '@/hooks/useUrlState';
import { Controls } from '@/components/Controls';
import { Footer } from '@/components/Footer';
import { AltcoinTopGainers } from '@/components/AltcoinTopGainers';
import { AltcoinVsBTC } from '@/components/AltcoinVsBTC';
import { FundingKiller } from '@/components/FundingKiller';
import { MarketMomentum } from '@/components/MarketMomentum';
import { AHR999Indicator } from '@/components/AHR999Indicator';
import { TableHeader, TableRow, TablePagination } from '@/components/table';
import { TabContainer, TabPanel, WidgetGrid } from '@/components/layout';
import { ColumnKey } from '@/lib/types';
import { COLUMN_DEFINITIONS } from '@/lib/utils';
import { Activity, DollarSign, BarChart2, Bitcoin } from 'lucide-react';

// Fixed column configuration
const FIXED_COLUMNS: ColumnKey[] = ['favorite', 'rank', 'logo', 'symbol'];
const FIXED_WIDTHS: Record<string, number> = {
  favorite: 24,
  rank: 40,
  logo: 28,
  symbol: 95,
};

// Tab configuration
const TABS = [
  { id: 'rsi', label: 'RSI', icon: <Activity className="w-4 h-4" /> },
  { id: 'funding', label: 'Funding', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'altcoin', label: 'Altcoin vs BTC', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'ahr999', label: 'AHR999', icon: <Bitcoin className="w-4 h-4" /> },
];

export default function PerpBoard() {
  const store = useMarketStore();
  const [activeTab, setActiveTab] = useState('rsi');

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

  // Scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredData = store.getFilteredData();
  const { avgRsi7, avgRsi14, avgRsiW7, avgRsiW14 } = store.getRsiAverages();
  const quickFilterCounts = store.getQuickFilterCounts();

  // Pagination
  const totalPages = Math.ceil(filteredData.length / store.pageSize);
  const paginatedData = filteredData.slice(
    (store.currentPage - 1) * store.pageSize,
    store.currentPage * store.pageSize
  );

  // Get visible columns in order
  const visibleColumns = store.columnOrder.filter((key) => store.columns[key]);

  // Get column style for colgroup
  const getColStyle = (key: ColumnKey) => {
    if (FIXED_WIDTHS[key]) {
      return {
        width: FIXED_WIDTHS[key],
        minWidth: FIXED_WIDTHS[key],
        maxWidth: FIXED_WIDTHS[key],
      };
    }
    const def = COLUMN_DEFINITIONS[key];
    return { width: def.width, minWidth: def.width };
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, key: ColumnKey) => {
    if (FIXED_COLUMNS.includes(key)) {
      e.preventDefault();
      return;
    }
    setDraggedColumn(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleDragOver = (e: React.DragEvent, key: ColumnKey) => {
    e.preventDefault();
    if (FIXED_COLUMNS.includes(key) || !draggedColumn || draggedColumn === key) return;
    setDragOverColumn(key);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetKey: ColumnKey) => {
    e.preventDefault();
    if (!draggedColumn || FIXED_COLUMNS.includes(targetKey) || draggedColumn === targetKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

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

  // Token click handler
  const handleTokenClick = (symbol: string) => {
    store.setFilters({});
    store.setSearchTerm(symbol);
  };

  const handleGroupClick = (symbols: string[]) => {
    store.setFilters({});
    store.setSearchTerm(symbols.join('|'));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fafafa]">
      {/* ===================================================================
          SECTION 1: Tab Navigation (Top Bar)
          =================================================================== */}
      <div className="bg-[#fafafa] z-50 px-2 sm:px-6 pt-5 pb-2 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto w-full">
          <TabContainer
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* ===================================================================
          SECTION 2: Main Content (Desktop: Left Widgets + Right Table)
          =================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row px-2 sm:px-6 pb-4 overflow-hidden relative gap-4">
        <div className="max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row flex-1 overflow-hidden gap-4">

          {/* -----------------------------------------------------------------
              LEFT COLUMN: Widgets (Desktop only, stacked vertically)
              ----------------------------------------------------------------- */}
          <div className="hidden lg:flex flex-col gap-4 w-[320px] flex-shrink-0 overflow-y-auto">
            {/* RSI Tab Widgets */}
            {activeTab === 'rsi' && (
              <>
                <MarketMomentum
                  avgRsi7={avgRsi7}
                  avgRsi14={avgRsi14}
                  avgRsiW7={avgRsiW7}
                  avgRsiW14={avgRsiW14}
                />
                <AltcoinTopGainers
                  tickers={store.tickers}
                  rsiData={store.rsiData}
                  marketCapData={store.marketCapData}
                  onTokenClick={handleTokenClick}
                />
              </>
            )}

            {/* Funding Tab Widget */}
            {activeTab === 'funding' && (
              <FundingKiller
                tickers={store.tickers}
                fundingRateData={store.fundingRateData}
                marketCapData={store.marketCapData}
                onTokenClick={handleTokenClick}
                onGroupClick={handleGroupClick}
              />
            )}

            {/* Altcoin vs BTC Tab Widget */}
            {activeTab === 'altcoin' && (
              <AltcoinVsBTC
                tickers={store.tickers}
                rsiData={store.rsiData}
                marketCapData={store.marketCapData}
                onTokenClick={handleTokenClick}
                onTopNClick={handleGroupClick}
              />
            )}

            {/* AHR999 Tab Widget */}
            {activeTab === 'ahr999' && (
              <AHR999Indicator />
            )}
          </div>

          {/* -----------------------------------------------------------------
              RIGHT COLUMN: Controls + Table
              ----------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile: Show widgets above controls */}
            <div className="lg:hidden mb-4">
              {activeTab === 'rsi' && (
                <WidgetGrid variant="auto" gap="md">
                  <MarketMomentum
                    avgRsi7={avgRsi7}
                    avgRsi14={avgRsi14}
                    avgRsiW7={avgRsiW7}
                    avgRsiW14={avgRsiW14}
                  />
                  <AltcoinTopGainers
                    tickers={store.tickers}
                    rsiData={store.rsiData}
                    marketCapData={store.marketCapData}
                    onTokenClick={handleTokenClick}
                  />
                </WidgetGrid>
              )}
              {activeTab === 'funding' && (
                <FundingKiller
                  tickers={store.tickers}
                  fundingRateData={store.fundingRateData}
                  marketCapData={store.marketCapData}
                  onTokenClick={handleTokenClick}
                  onGroupClick={handleGroupClick}
                />
              )}
              {activeTab === 'altcoin' && (
                <AltcoinVsBTC
                  tickers={store.tickers}
                  rsiData={store.rsiData}
                  marketCapData={store.marketCapData}
                  onTokenClick={handleTokenClick}
                  onTopNClick={handleGroupClick}
                />
              )}
              {activeTab === 'ahr999' && (
                <AHR999Indicator />
              )}
            </div>

            {/* Controls: Quick Filters, Settings, Search */}
            <div className="mb-4">
              <Controls
              columns={store.columns}
              columnOrder={store.columnOrder}
              filters={store.filters}
              searchTerm={store.searchTerm}
              overboughtCount={quickFilterCounts.overbought}
              oversoldCount={quickFilterCounts.oversold}
              onColumnChange={store.updateColumn}
              onColumnsPreset={store.setColumnsPreset}
              onFiltersChange={store.setFilters}
              onSearchChange={store.setSearchTerm}
              onColumnOrderChange={store.updateColumnOrder}
            />
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Table Container */}
            <div
              ref={tableContainerRef}
              className="flex-1 overflow-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <table
                className="border-collapse"
                style={{ width: 'max-content', minWidth: '100%' }}
              >
                <colgroup>
                  {visibleColumns.map((key) => (
                    <col key={key} style={getColStyle(key)} />
                  ))}
                </colgroup>

                <TableHeader
                  visibleColumns={visibleColumns}
                  sort={store.sort}
                  isScrolled={isScrolled}
                  totalCount={filteredData.length}
                  draggedColumn={draggedColumn}
                  dragOverColumn={dragOverColumn}
                  fixedColumns={FIXED_COLUMNS}
                  fixedWidths={FIXED_WIDTHS}
                  columns={store.columns}
                  onSort={store.updateSort}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />

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
                    paginatedData.map((ticker, index) => (
                      <TableRow
                        key={ticker.instId}
                        ticker={ticker}
                        index={index}
                        currentPage={store.currentPage}
                        pageSize={store.pageSize}
                        visibleColumns={visibleColumns}
                        rsi={store.rsiData.get(ticker.instId)}
                        fundingRate={store.fundingRateData.get(ticker.instId)}
                        listingData={store.listingData.get(ticker.instId)}
                        marketCap={store.marketCapData.get(ticker.baseSymbol)}
                        hasSpot={store.spotSymbols.has(`${ticker.baseSymbol}-USDT`)}
                        isFavorite={store.favorites.includes(ticker.instId)}
                        isScrolled={isScrolled}
                        fixedColumns={FIXED_COLUMNS}
                        fixedWidths={FIXED_WIDTHS}
                        columns={store.columns}
                        onToggleFavorite={store.toggleFavorite}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={store.currentPage}
              totalPages={totalPages}
              pageSize={store.pageSize}
              totalItems={filteredData.length}
              status={store.status}
              onPageChange={store.setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* ===================================================================
          SECTION 3: Footer
          =================================================================== */}
      <div className="px-6 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto w-full">
          <Footer />
        </div>
      </div>
    </div>
  );
}
