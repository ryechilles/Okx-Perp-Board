'use client';

import { useState, useEffect, useRef } from 'react';
import { ColumnVisibility, ColumnKey, Filters } from '@/lib/types';
import { MarketMomentum } from './MarketMomentum';
import { AHR999Indicator } from './AHR999Indicator';
import { RsiFilter } from './RsiFilter';

// Quick filter types
type QuickFilter = 'all' | 'top25' | 'meme' | 'noSpot' | 'overbought' | 'oversold';

// Check if mobile
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

// Default columns for comparison - must match useMarketStore.ts
const DEFAULT_COLUMNS_DESKTOP: ColumnVisibility = {
  favorite: true, rank: true, logo: true, symbol: true, price: true,
  fundingRate: false, fundingApr: true, fundingInterval: false,
  change4h: false, change: true, change7d: true,
  volume24h: false, marketCap: true,
  dRsiSignal: true, wRsiSignal: true,
  rsi7: false, rsi14: false, rsiW7: false, rsiW14: false,
  listDate: true, hasSpot: false,
};

const DEFAULT_COLUMNS_MOBILE: ColumnVisibility = {
  favorite: true, rank: true, logo: true, symbol: true, price: true,
  fundingRate: false, fundingApr: false, fundingInterval: false,
  change4h: false, change: true, change7d: false,
  volume24h: false, marketCap: false,
  dRsiSignal: false, wRsiSignal: false,
  rsi7: false, rsi14: false, rsiW7: false, rsiW14: false,
  listDate: false, hasSpot: false,
};

interface ControlsProps {
  columns: ColumnVisibility;
  columnOrder: ColumnKey[];
  filters: Filters;
  searchTerm: string;
  avgRsi7: number | null;
  avgRsi14: number | null;
  avgRsiW7: number | null;
  avgRsiW14: number | null;
  overboughtCount: number;
  oversoldCount: number;
  onColumnChange: (col: keyof ColumnVisibility, visible: boolean) => void;
  onColumnsPreset: (preset: 'all' | 'none' | 'default') => void;
  onFiltersChange: (filters: Filters) => void;
  onSearchChange: (term: string) => void;
  onColumnOrderChange: (order: ColumnKey[]) => void;
}

export function Controls({
  columns,
  columnOrder,
  filters,
  searchTerm,
  avgRsi7,
  avgRsi14,
  avgRsiW7,
  avgRsiW14,
  overboughtCount,
  oversoldCount,
  onColumnChange,
  onColumnsPreset,
  onFiltersChange,
  onSearchChange,
  onColumnOrderChange,
}: ControlsProps) {
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [hoveredFilter, setHoveredFilter] = useState<QuickFilter | null>(null);
  const [customizeTab, setCustomizeTab] = useState<'columns' | 'filters'>('columns');
  const customizePanelRef = useRef<HTMLDivElement>(null);
  const customizeButtonRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!showCustomizePanel) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        customizePanelRef.current &&
        !customizePanelRef.current.contains(target) &&
        customizeButtonRef.current &&
        !customizeButtonRef.current.contains(target)
      ) {
        setShowCustomizePanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustomizePanel]);

  // Determine active quick filter based on current filters
  const getActiveQuickFilter = (): QuickFilter => {
    if (filters.rank === '1-25' && !filters.rsi7 && !filters.rsi14 && !filters.isMeme && !filters.hasSpot) return 'top25';
    if (filters.isMeme === 'yes' && !filters.rsi7 && !filters.rsi14) return 'meme';
    if (filters.hasSpot === 'no' && !filters.rsi7 && !filters.rsi14) return 'noSpot';
    if (filters.rsi7 === '>70' && filters.rsi14 === '>70') return 'overbought';
    if (filters.rsi7 === '<30' && filters.rsi14 === '<30') return 'oversold';
    if (Object.keys(filters).length === 0) return 'all';
    return 'all';
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    setQuickFilter(filter);
    // Clear search term when using quick filters
    onSearchChange('');
    switch (filter) {
      case 'all':
        onFiltersChange({});
        setTempFilters({});
        break;
      case 'top25':
        onFiltersChange({ rank: '1-25' });
        setTempFilters({ rank: '1-25' });
        break;
      case 'meme':
        onFiltersChange({ isMeme: 'yes' });
        setTempFilters({ isMeme: 'yes' });
        break;
      case 'noSpot':
        onFiltersChange({ hasSpot: 'no' });
        setTempFilters({ hasSpot: 'no' });
        break;
      case 'overbought':
        onFiltersChange({ rsi7: '>70', rsi14: '>70' });
        setTempFilters({ rsi7: '>70', rsi14: '>70' });
        break;
      case 'oversold':
        onFiltersChange({ rsi7: '<30', rsi14: '<30' });
        setTempFilters({ rsi7: '<30', rsi14: '<30' });
        break;
    }
  };

  const activeQuickFilter = getActiveQuickFilter();
  
  // Fixed columns that are always shown and not counted
  const excludedColumns = ['favorite', 'rank', 'logo', 'symbol', 'hasSpot'];
  const visibleCount = Object.entries(columns)
    .filter(([key]) => !excludedColumns.includes(key))
    .filter(([, v]) => v).length;
  const totalCount = Object.keys(columns).length - excludedColumns.length;
  // Only count filters that have actual values (not undefined or empty string)
  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  // Check if columns differ from default
  const defaultColumns = isMobile() ? DEFAULT_COLUMNS_MOBILE : DEFAULT_COLUMNS_DESKTOP;
  const hasNonDefaultColumns = Object.keys(columns).some(
    key => columns[key as keyof ColumnVisibility] !== defaultColumns[key as keyof ColumnVisibility]
  );

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
  };
  
  const handleClearFilters = () => {
    setTempFilters({});
    onFiltersChange({});
  };

  // Column options grouped by category
  const columnGroups: { label: string; columns: { key: ColumnKey; label: string }[] }[] = [
    {
      label: 'Price & Funding',
      columns: [
        { key: 'price', label: 'Price' },
        { key: 'fundingRate', label: 'Funding Rate' },
        { key: 'fundingApr', label: 'Funding APR' },
        { key: 'fundingInterval', label: 'Funding Interval' },
        { key: 'volume24h', label: '24H Volume' },
        { key: 'marketCap', label: 'Market Cap' },
      ]
    },
    {
      label: 'Price Change',
      columns: [
        { key: 'change4h', label: '4H Change' },
        { key: 'change', label: '24H Change' },
        { key: 'change7d', label: '7D Change' },
      ]
    },
    {
      label: 'RSI Indicators',
      columns: [
        { key: 'dRsiSignal', label: 'Daily RSI Signal' },
        { key: 'wRsiSignal', label: 'Weekly RSI Signal' },
        { key: 'rsi7', label: 'Daily RSI7' },
        { key: 'rsi14', label: 'Daily RSI14' },
        { key: 'rsiW7', label: 'Weekly RSI7' },
        { key: 'rsiW14', label: 'Weekly RSI14' },
      ]
    },
    {
      label: 'Other',
      columns: [
        { key: 'listDate', label: 'List Date' },
      ]
    }
  ];
  
  return (
    <>
      {/* Indicators Row */}
      <div className="flex items-center mb-4 relative z-[70]">
        <div className="flex items-center gap-3 flex-wrap">
          <MarketMomentum
            avgRsi7={avgRsi7}
            avgRsi14={avgRsi14}
            avgRsiW7={avgRsiW7}
            avgRsiW14={avgRsiW14}
          />
          <AHR999Indicator />
        </div>
      </div>

      {/* Quick Filters + Controls Row */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap relative z-[60]">
        <div className="flex items-center gap-4 flex-wrap">
        {/* Quick Filter Buttons - Part 1: All & Top 25 */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-0.5">
          <button
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              activeQuickFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleQuickFilter('all')}
          >
            All
          </button>

          {/* Top 25 with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredFilter('top25')}
            onMouseLeave={() => setHoveredFilter(null)}
          >
            <button
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeQuickFilter === 'top25'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleQuickFilter('top25')}
            >
              Top 25
            </button>
            {hoveredFilter === 'top25' && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                <div className="text-[12px]">
                  <span className="text-gray-900">OKX Perp Market Cap Rank 1-25</span>
                </div>
              </div>
            )}
          </div>

          {/* Meme with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredFilter('meme')}
            onMouseLeave={() => setHoveredFilter(null)}
          >
            <button
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeQuickFilter === 'meme'
                  ? 'bg-white text-orange-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleQuickFilter('meme')}
            >
              🐸 Meme
            </button>
            {hoveredFilter === 'meme' && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                <div className="text-[12px]">
                  <span className="text-gray-900">Meme Tokens Only</span>
                </div>
              </div>
            )}
          </div>

          {/* No Spot with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredFilter('noSpot')}
            onMouseLeave={() => setHoveredFilter(null)}
          >
            <button
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeQuickFilter === 'noSpot'
                  ? 'bg-white text-purple-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleQuickFilter('noSpot')}
            >
              No Spot
            </button>
            {hoveredFilter === 'noSpot' && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                <div className="text-[12px]">
                  <span className="text-gray-900">Tokens without Spot listing on OKX</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Filter Buttons - Part 2: RSI Filters */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-0.5">
          {/* Overbought with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredFilter('overbought')}
            onMouseLeave={() => setHoveredFilter(null)}
          >
            <button
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeQuickFilter === 'overbought'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleQuickFilter('overbought')}
            >
              🔥 Overbought {overboughtCount > 0 && <span className="text-gray-500 font-normal">{overboughtCount}</span>}
            </button>
            {hoveredFilter === 'overbought' && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Daily Overbought</div>
                <div className="text-[12px] flex flex-col gap-0.5">
                  <span className="text-gray-900">D-RSI7 &gt; 70</span>
                  <span className="text-gray-900">D-RSI14 &gt; 70</span>
                </div>
              </div>
            )}
          </div>

          {/* Oversold with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredFilter('oversold')}
            onMouseLeave={() => setHoveredFilter(null)}
          >
            <button
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeQuickFilter === 'oversold'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleQuickFilter('oversold')}
            >
              🧊 Oversold {oversoldCount > 0 && <span className="text-gray-500 font-normal">{oversoldCount}</span>}
            </button>
            {hoveredFilter === 'oversold' && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Daily Oversold</div>
                <div className="text-[12px] flex flex-col gap-0.5">
                  <span className="text-gray-900">D-RSI7 &lt; 30</span>
                  <span className="text-gray-900">D-RSI14 &lt; 30</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customize button - icon only */}
        <div ref={customizeButtonRef} className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex items-center justify-center p-1.5 rounded-md transition-all ${
              showCustomizePanel || hasFilters
                ? 'bg-white shadow-sm'
                : 'hover:bg-gray-200'
            }`}
            onClick={() => setShowCustomizePanel(!showCustomizePanel)}
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        </div>

        {/* Search box - right side */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <svg
            className="w-4 h-4 text-gray-500 ml-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search token..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-[13px] text-gray-700 placeholder-gray-500 w-[120px] px-1 py-1"
          />
        </div>
      </div>
      
      {showCustomizePanel && (
        <div ref={customizePanelRef} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm relative z-50">
          {/* Tab buttons */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-0.5 mb-4">
            <button
              onClick={() => setCustomizeTab('columns')}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                customizeTab === 'columns'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Columns ({visibleCount}/{totalCount})
            </button>
            <button
              onClick={() => setCustomizeTab('filters')}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                customizeTab === 'filters'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : hasFilters
                  ? 'text-blue-500 hover:text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Filters {hasFilters && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 ml-1" />}
            </button>
          </div>

          {/* Columns tab content */}
          {customizeTab === 'columns' && (
            <div className="space-y-4">
              {columnGroups.map(group => (
                <div key={group.label}>
                  <div className="text-[11px] text-gray-500 font-medium mb-2">{group.label}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5 flex-wrap">
                      {group.columns.map(col => (
                        <button
                          key={col.key}
                          onClick={() => onColumnChange(col.key, !columns[col.key])}
                          className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                            columns[col.key]
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                    {group.label === 'Other' && hasNonDefaultColumns && (
                      <button
                        onClick={() => onColumnsPreset('default')}
                        className="p-1.5 rounded-md cursor-pointer transition-all text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                        title="Reset columns"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters tab content */}
          {customizeTab === 'filters' && (
            <div className="space-y-4">
              {/* Market & Funding */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">Market & Funding</div>
                <div className="flex flex-wrap gap-x-4 gap-y-3">
                  {/* Market Cap Rank */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {[
                      { value: '', label: 'MC Rank' },
                      { value: '1-20', label: 'Top 20' },
                      { value: '21-50', label: '21-50' },
                      { value: '51-100', label: '51-100' },
                      { value: '>500', label: '>500' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFiltersChange({ ...filters, rank: opt.value || undefined })}
                        className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                          (filters.rank || '') === opt.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Market Cap */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {[
                      { value: '', label: 'Market Cap' },
                      { value: '0-20', label: '≤$20M' },
                      { value: '20-100', label: '$20M-$100M' },
                      { value: '100-1000', label: '$100M-$1B' },
                      { value: '1000+', label: '≥$1B' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFiltersChange({ ...filters, marketCapMin: opt.value || undefined })}
                        className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                          (filters.marketCapMin || '') === opt.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Funding Rate */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {[
                      { value: '', label: 'Funding' },
                      { value: 'positive', label: 'Positive' },
                      { value: 'negative', label: 'Negative' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFiltersChange({ ...filters, fundingRate: opt.value || undefined })}
                        className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                          (filters.fundingRate || '') === opt.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RSI */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">RSI Indicators</div>
                <div className="flex flex-col gap-3">
                  {/* Daily RSI Row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-3">
                    <RsiFilter label="D-RSI7" value={filters.rsi7} onChange={(v) => onFiltersChange({ ...filters, rsi7: v })} />
                    <RsiFilter label="D-RSI14" value={filters.rsi14} onChange={(v) => onFiltersChange({ ...filters, rsi14: v })} />
                  </div>
                  {/* Weekly RSI Row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-3">
                    <RsiFilter label="W-RSI7" value={filters.rsiW7} onChange={(v) => onFiltersChange({ ...filters, rsiW7: v })} />
                    <RsiFilter label="W-RSI14" value={filters.rsiW14} onChange={(v) => onFiltersChange({ ...filters, rsiW14: v })} />
                  </div>
                </div>
              </div>

              {/* Other */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">Other</div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  {/* Has Spot */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {[
                      { value: '', label: 'Spot' },
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFiltersChange({ ...filters, hasSpot: opt.value || undefined })}
                        className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                          (filters.hasSpot || '') === opt.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Listing Age */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {[
                      { value: '', label: 'List Age' },
                      { value: '<30d', label: '<30d' },
                      { value: '<60d', label: '<60d' },
                      { value: '<90d', label: '<90d' },
                      { value: '<180d', label: '<180d' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFiltersChange({ ...filters, listAge: opt.value || undefined })}
                        className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                          (filters.listAge || '') === opt.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {hasFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="p-1.5 rounded-md cursor-pointer transition-all text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                      title="Reset filters"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </>
  );
}
