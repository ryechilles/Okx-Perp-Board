'use client';

import { useEffect, useState, useRef, useMemo, ReactNode } from 'react';
import { useMarketStore } from '@/hooks/useMarketStore';
import { useUrlState } from '@/hooks/useUrlState';
import { useWidgetOrder } from '@/hooks/useWidgetOrder';
import { Header } from '@/components/Header';
import { Controls } from '@/components/Controls';
import { Footer } from '@/components/Footer';
import { AltcoinTopGainers } from '@/components/AltcoinTopGainers';
import { AltcoinVsBTC } from '@/components/AltcoinVsBTC';
import { FundingKiller } from '@/components/FundingKiller';
import { FundingMarket } from '@/components/FundingMarket';
import { MarketMomentum } from '@/components/MarketMomentum';
import { RsiOversold } from '@/components/RsiOversold';
import { RsiOverbought } from '@/components/RsiOverbought';
import { AHR999Indicator } from '@/components/AHR999Indicator';
import { TableHeader, TableRow } from '@/components/table';
import { TabContainer, WidgetGrid } from '@/components/layout';
import { ColumnKey } from '@/lib/types';
import { COLUMN_DEFINITIONS } from '@/lib/utils';
// Fixed column configuration
const FIXED_COLUMNS: ColumnKey[] = ['favorite', 'rank', 'logo', 'symbol'];
const FIXED_WIDTHS: Record<string, number> = {
  favorite: 24,
  rank: 40,
  logo: 28,
  symbol: 95,
};

// Bitcoin logo for AHR999 tab
const BtcLogo = () => (
  <img
    src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
    alt="BTC"
    className="w-4 h-4 rounded-full"
  />
);

// Tab configuration
const TABS = [
  { id: 'rsi', label: 'RSI' },
  { id: 'funding', label: 'Funding' },
  { id: 'altcoin', label: 'Altcoin' },
  { id: 'ahr999', label: 'AHR999', icon: <BtcLogo /> },
];

// Default widget order per tab (for tabs with multiple widgets)
const DEFAULT_WIDGET_ORDER: Record<string, string[]> = {
  rsi: ['marketMomentum', 'rsiOversold', 'rsiOverbought'],
  funding: ['fundingMarket', 'fundingKiller'],
  altcoin: ['topGainers', 'vsBtc'],
};

export default function PerpBoard() {
  const store = useMarketStore();
  const [activeTab, setActiveTab] = useState('rsi');

  // Widget order for tabs with multiple widgets
  const [rsiWidgetOrder, setRsiWidgetOrder] = useWidgetOrder(
    'rsi',
    DEFAULT_WIDGET_ORDER.rsi
  );
  const [altcoinWidgetOrder, setAltcoinWidgetOrder] = useWidgetOrder(
    'altcoin',
    DEFAULT_WIDGET_ORDER.altcoin
  );
  const [fundingWidgetOrder, setFundingWidgetOrder] = useWidgetOrder(
    'funding',
    DEFAULT_WIDGET_ORDER.funding
  );

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

  // Show all data (no pagination)
  const displayData = filteredData;

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
    // Scroll table to top
    tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGroupClick = (symbols: string[]) => {
    store.setFilters({});
    store.setSearchTerm(symbols.join('|'));
    // Scroll table to top
    tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll table to top
  const handleScrollToTop = () => {
    tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Widget mapping for RSI tab
  const rsiWidgets: Record<string, ReactNode> = useMemo(() => ({
    marketMomentum: (
      <MarketMomentum
        avgRsi7={avgRsi7}
        avgRsi14={avgRsi14}
        avgRsiW7={avgRsiW7}
        avgRsiW14={avgRsiW14}
      />
    ),
    rsiOversold: (
      <RsiOversold
        tickers={store.tickers}
        rsiData={store.rsiData}
        marketCapData={store.marketCapData}
        onTokenClick={handleTokenClick}
      />
    ),
    rsiOverbought: (
      <RsiOverbought
        tickers={store.tickers}
        rsiData={store.rsiData}
        marketCapData={store.marketCapData}
        onTokenClick={handleTokenClick}
      />
    ),
  }), [avgRsi7, avgRsi14, avgRsiW7, avgRsiW14, store.tickers, store.rsiData, store.marketCapData]);

  // Widget mapping for altcoin tab
  const altcoinWidgets: Record<string, ReactNode> = useMemo(() => ({
    topGainers: (
      <AltcoinTopGainers
        tickers={store.tickers}
        rsiData={store.rsiData}
        marketCapData={store.marketCapData}
        onTokenClick={handleTokenClick}
      />
    ),
    vsBtc: (
      <AltcoinVsBTC
        tickers={store.tickers}
        rsiData={store.rsiData}
        marketCapData={store.marketCapData}
        onTokenClick={handleTokenClick}
        onTopNClick={handleGroupClick}
      />
    ),
  }), [store.tickers, store.rsiData, store.marketCapData]);

  // Widget mapping for funding tab
  const fundingWidgets: Record<string, ReactNode> = useMemo(() => ({
    fundingMarket: (
      <FundingMarket
        tickers={store.tickers}
        fundingRateData={store.fundingRateData}
        marketCapData={store.marketCapData}
        onGroupClick={handleGroupClick}
      />
    ),
    fundingKiller: (
      <FundingKiller
        tickers={store.tickers}
        fundingRateData={store.fundingRateData}
        marketCapData={store.marketCapData}
        onTokenClick={handleTokenClick}
        onGroupClick={handleGroupClick}
      />
    ),
  }), [store.tickers, store.fundingRateData, store.marketCapData]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* ===================================================================
          SECTION 1: Header (Logo + Title + Version + Exchange Buttons)
          =================================================================== */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="max-w-[1600px] mx-auto w-full bg-white rounded-xl shadow-sm">
          <Header />
        </div>
      </div>

      {/* ===================================================================
          SECTION 2: Main Content
          =================================================================== */}
      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 pb-4 overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full flex flex-col flex-1 overflow-hidden">

          {/* -----------------------------------------------------------------
              ROW 1: Tabs (left) + Controls (right) - Mobile stacked
              ----------------------------------------------------------------- */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-4">
            {/* Tabs - Desktop: fixed width, Mobile: full width */}
            <div className="lg:w-[320px] flex-shrink-0">
              <TabContainer
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="sidebar"
              />
            </div>

            {/* Controls - Desktop: flex-1, Mobile: full width */}
            <div className="flex-1">
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
                onScrollToTop={handleScrollToTop}
              />
            </div>
          </div>

          {/* -----------------------------------------------------------------
              ROW 2: Widgets (left) + Table (right) - TOP ALIGNED
              ----------------------------------------------------------------- */}
          <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden">
            {/* Widgets - Desktop: fixed width sidebar, Mobile: above table */}
            <div className="lg:w-[320px] flex-shrink-0 lg:overflow-y-auto lg:pr-2 space-y-4">
              {/* RSI Tab Widgets - Sortable */}
              {activeTab === 'rsi' && (
                <WidgetGrid
                  variant="vertical"
                  gap="md"
                  sortable
                  itemIds={rsiWidgetOrder}
                  onOrderChange={setRsiWidgetOrder}
                >
                  {rsiWidgetOrder.map((id) => rsiWidgets[id])}
                </WidgetGrid>
              )}

              {/* Funding Tab Widgets - Sortable */}
              {activeTab === 'funding' && (
                <WidgetGrid
                  variant="vertical"
                  gap="md"
                  sortable
                  itemIds={fundingWidgetOrder}
                  onOrderChange={setFundingWidgetOrder}
                >
                  {fundingWidgetOrder.map((id) => fundingWidgets[id])}
                </WidgetGrid>
              )}

              {/* Altcoin Tab Widgets - Sortable */}
              {activeTab === 'altcoin' && (
                <WidgetGrid
                  variant="vertical"
                  gap="md"
                  sortable
                  itemIds={altcoinWidgetOrder}
                  onOrderChange={setAltcoinWidgetOrder}
                >
                  {altcoinWidgetOrder.map((id) => altcoinWidgets[id])}
                </WidgetGrid>
              )}

              {/* AHR999 Tab Widget */}
              {activeTab === 'ahr999' && (
                <AHR999Indicator />
              )}
            </div>

            {/* Data Table - flex-1 to fill remaining space */}
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
                      displayData.map((ticker, index) => (
                        <TableRow
                          key={ticker.instId}
                          ticker={ticker}
                          index={index}
                          currentPage={1}
                          pageSize={displayData.length}
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
            </div>
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
