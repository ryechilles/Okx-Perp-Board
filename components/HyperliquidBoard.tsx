'use client';

import { useEffect, useState, useRef } from 'react';
import { useHyperliquidStore } from '@/hooks/useHyperliquidStore';
import { Header } from '@/components/Header';
import { Controls } from '@/components/Controls';
import { Footer } from '@/components/Footer';
import { TableHeader, TableRow } from '@/components/table';
import { Spinner } from '@/components/ui';
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

export default function HyperliquidBoard() {
  const store = useHyperliquidStore();

  // Drag state
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null);

  // Scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    store.initialize().catch((err) => {
      if (!cancelled) console.error('Failed to initialize:', err);
    });
    return () => {
      cancelled = true;
      store.cleanup();
    };
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

  // Scroll table to top
  const handleScrollToTop = () => {
    tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted">
      {/* ===================================================================
          SECTION 1: Header (Logo + Title + Version + Exchange Buttons)
          =================================================================== */}
      <div className="bg-card shadow-sm">
        <Header />
      </div>

      {/* ===================================================================
          SECTION 2: Main Content
          =================================================================== */}
      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 pb-4 overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full flex flex-col flex-1 overflow-hidden">

          {/* -----------------------------------------------------------------
              ROW 1: Controls (full width since no tabs)
              ----------------------------------------------------------------- */}
          <div className="mb-4">
            <Controls
              exchange="hyperliquid"
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

          {/* -----------------------------------------------------------------
              ROW 2: Data Table (full width since no widget sidebar)
              ----------------------------------------------------------------- */}
          <div className="bg-card rounded-xl border flex flex-col flex-1 overflow-hidden">
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
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                          {store.tickers.size === 0 ? (
                            <>
                              <Spinner size="md" className="mr-3" />
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
                        listingData={undefined}
                        marketCap={store.marketCapData.get(ticker.baseSymbol)}
                        hasSpot={store.spotSymbols.has(ticker.baseSymbol)}
                        exchange="hyperliquid"
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
