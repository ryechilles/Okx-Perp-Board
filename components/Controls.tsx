'use client';

import { useState, useEffect, useRef, WheelEvent } from 'react';
import { ColumnVisibility, ColumnKey, Filters } from '@/lib/types';
import { MarketMomentum } from './MarketMomentum';
import { AHR999Indicator } from './AHR999Indicator';

// Debounce timer for auto-select after keyboard input
let selectDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced select - selects input content after user stops typing
const debouncedSelect = (input: HTMLInputElement, delay: number = 400) => {
  if (selectDebounceTimer) clearTimeout(selectDebounceTimer);
  selectDebounceTimer = setTimeout(() => {
    if (document.activeElement === input) {
      input.select();
    }
  }, delay);
};

// Helper for scroll wheel number input
const handleNumberWheel = (
  e: WheelEvent<HTMLInputElement>,
  currentValue: string,
  min: number,
  max: number,
  step: number,
  onChange: (newValue: string) => void,
  skipValues?: number[] // Skip these values (preset values like 30, 70)
) => {
  e.preventDefault();
  const input = e.currentTarget; // Save reference before async
  const current = currentValue === '' ? (e.deltaY > 0 ? max + step : min - step) : parseFloat(currentValue);
  const delta = e.deltaY > 0 ? -step : step;
  let newValue = Math.min(max, Math.max(min, current + delta));
  // Skip preset values to avoid jumping to preset buttons
  if (skipValues && skipValues.includes(newValue)) {
    newValue = Math.min(max, Math.max(min, newValue + delta));
  }
  onChange(newValue.toString());
  // Auto-select after wheel so keyboard input replaces the value
  setTimeout(() => input.select(), 10);
};

// Quick filter types
type QuickFilter = 'all' | 'top25' | 'meme' | 'noSpot' | 'overbought' | 'oversold';

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
        <div className="flex items-center gap-3">
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
              🔥 Overbought {overboughtCount > 0 && <span className="text-gray-400 font-normal">{overboughtCount}</span>}
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
              🧊 Oversold {oversoldCount > 0 && <span className="text-gray-400 font-normal">{oversoldCount}</span>}
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
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        </div>

        {/* Search box - right side */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <svg
            className="w-4 h-4 text-gray-400 ml-2"
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
                  <div className="text-[11px] text-gray-400 font-medium mb-2">{group.label}</div>
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
                </div>
              ))}
            </div>
          )}

          {/* Filters tab content */}
          {customizeTab === 'filters' && (
            <div className="space-y-4">
              {/* Market & Funding */}
              <div>
                <div className="text-[11px] text-gray-400 font-medium mb-2">Market & Funding</div>
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
                <div className="text-[11px] text-gray-400 font-medium mb-2">RSI Indicators</div>
                <div className="flex flex-wrap gap-x-4 gap-y-3">
                  {/* Daily RSI7 */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5 items-center">
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi7: undefined })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        !filters.rsi7 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      D-RSI7
                    </button>
                    {/* Preset buttons */}
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi7: '<30' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsi7 === '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &lt;30
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi7: '30~70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsi7 === '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      30~70
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi7: '>70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsi7 === '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &gt;70
                    </button>
                    {/* Custom < input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsi7?.startsWith('<') && filters.rsi7 !== '<30')) {
                          onFiltersChange({ ...filters, rsi7: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsi7?.startsWith('<') && filters.rsi7 !== '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&lt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi7?.startsWith('<') && filters.rsi7 !== '<30' ? filters.rsi7.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsi7: undefined });
                          } else {
                            if (val === '30') val = '29'; // Skip preset
                            onFiltersChange({ ...filters, rsi7: `<${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsi7?.startsWith('<') && filters.rsi7 !== '<30' ? filters.rsi7.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsi7: `<${val}` }),
                          [30]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom range input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsi7?.includes('~') && filters.rsi7 !== '30~70')) {
                          onFiltersChange({ ...filters, rsi7: undefined });
                        }
                        if (!(e.target instanceof HTMLInputElement)) {
                          e.currentTarget.querySelector('input')?.focus();
                        }
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[0] : ''}
                        onChange={(e) => {
                          let min = e.target.value;
                          const max = filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[1] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsi7: undefined });
                          } else {
                            if (min === '30' || min === '70') min = min === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsi7: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const max = filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[1] : '';
                          handleNumberWheel(
                            e,
                            filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[0] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsi7: `${val}~${max}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                      <span>~</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[1] : ''}
                        onChange={(e) => {
                          let max = e.target.value;
                          const min = filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[0] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsi7: undefined });
                          } else {
                            if (max === '30' || max === '70') max = max === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsi7: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const min = filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[0] : '';
                          handleNumberWheel(
                            e,
                            filters.rsi7?.includes('~') && filters.rsi7 !== '30~70' ? filters.rsi7.split('~')[1] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsi7: `${min}~${val}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom > input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsi7?.startsWith('>') && filters.rsi7 !== '>70')) {
                          onFiltersChange({ ...filters, rsi7: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsi7?.startsWith('>') && filters.rsi7 !== '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&gt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi7?.startsWith('>') && filters.rsi7 !== '>70' ? filters.rsi7.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsi7: undefined });
                          } else {
                            if (val === '70') val = '71'; // Skip preset
                            onFiltersChange({ ...filters, rsi7: `>${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsi7?.startsWith('>') && filters.rsi7 !== '>70' ? filters.rsi7.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsi7: `>${val}` }),
                          [70]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Daily RSI14 */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5 items-center">
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi14: undefined })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        !filters.rsi14 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      D-RSI14
                    </button>
                    {/* Preset buttons */}
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi14: '<30' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsi14 === '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &lt;30
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi14: '30~70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsi14 === '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      30~70
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsi14: '>70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsi14 === '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &gt;70
                    </button>
                    {/* Custom < input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsi14?.startsWith('<') && filters.rsi14 !== '<30')) {
                          onFiltersChange({ ...filters, rsi14: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsi14?.startsWith('<') && filters.rsi14 !== '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&lt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi14?.startsWith('<') && filters.rsi14 !== '<30' ? filters.rsi14.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsi14: undefined });
                          } else {
                            if (val === '30') val = '29'; // Skip preset
                            onFiltersChange({ ...filters, rsi14: `<${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsi14?.startsWith('<') && filters.rsi14 !== '<30' ? filters.rsi14.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsi14: `<${val}` }),
                          [30]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom range input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsi14?.includes('~') && filters.rsi14 !== '30~70')) {
                          onFiltersChange({ ...filters, rsi14: undefined });
                        }
                        if (!(e.target instanceof HTMLInputElement)) {
                          e.currentTarget.querySelector('input')?.focus();
                        }
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[0] : ''}
                        onChange={(e) => {
                          let min = e.target.value;
                          const max = filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[1] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsi14: undefined });
                          } else {
                            if (min === '30' || min === '70') min = min === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsi14: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const max = filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[1] : '';
                          handleNumberWheel(
                            e,
                            filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[0] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsi14: `${val}~${max}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                      <span>~</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[1] : ''}
                        onChange={(e) => {
                          let max = e.target.value;
                          const min = filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[0] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsi14: undefined });
                          } else {
                            if (max === '30' || max === '70') max = max === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsi14: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const min = filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[0] : '';
                          handleNumberWheel(
                            e,
                            filters.rsi14?.includes('~') && filters.rsi14 !== '30~70' ? filters.rsi14.split('~')[1] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsi14: `${min}~${val}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom > input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsi14?.startsWith('>') && filters.rsi14 !== '>70')) {
                          onFiltersChange({ ...filters, rsi14: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsi14?.startsWith('>') && filters.rsi14 !== '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&gt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsi14?.startsWith('>') && filters.rsi14 !== '>70' ? filters.rsi14.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsi14: undefined });
                          } else {
                            if (val === '70') val = '71'; // Skip preset
                            onFiltersChange({ ...filters, rsi14: `>${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsi14?.startsWith('>') && filters.rsi14 !== '>70' ? filters.rsi14.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsi14: `>${val}` }),
                          [70]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Weekly RSI7 */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5 items-center">
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW7: undefined })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        !filters.rsiW7 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      W-RSI7
                    </button>
                    {/* Preset buttons */}
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW7: '<30' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsiW7 === '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &lt;30
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW7: '30~70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsiW7 === '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      30~70
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW7: '>70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsiW7 === '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &gt;70
                    </button>
                    {/* Custom < input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsiW7?.startsWith('<') && filters.rsiW7 !== '<30')) {
                          onFiltersChange({ ...filters, rsiW7: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsiW7?.startsWith('<') && filters.rsiW7 !== '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&lt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW7?.startsWith('<') && filters.rsiW7 !== '<30' ? filters.rsiW7.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsiW7: undefined });
                          } else {
                            if (val === '30') val = '29'; // Skip preset
                            onFiltersChange({ ...filters, rsiW7: `<${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsiW7?.startsWith('<') && filters.rsiW7 !== '<30' ? filters.rsiW7.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsiW7: `<${val}` }),
                          [30]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom range input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70')) {
                          onFiltersChange({ ...filters, rsiW7: undefined });
                        }
                        if (!(e.target instanceof HTMLInputElement)) {
                          e.currentTarget.querySelector('input')?.focus();
                        }
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[0] : ''}
                        onChange={(e) => {
                          let min = e.target.value;
                          const max = filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[1] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsiW7: undefined });
                          } else {
                            if (min === '30' || min === '70') min = min === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsiW7: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const max = filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[1] : '';
                          handleNumberWheel(
                            e,
                            filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[0] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsiW7: `${val}~${max}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                      <span>~</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[1] : ''}
                        onChange={(e) => {
                          let max = e.target.value;
                          const min = filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[0] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsiW7: undefined });
                          } else {
                            if (max === '30' || max === '70') max = max === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsiW7: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const min = filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[0] : '';
                          handleNumberWheel(
                            e,
                            filters.rsiW7?.includes('~') && filters.rsiW7 !== '30~70' ? filters.rsiW7.split('~')[1] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsiW7: `${min}~${val}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom > input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsiW7?.startsWith('>') && filters.rsiW7 !== '>70')) {
                          onFiltersChange({ ...filters, rsiW7: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsiW7?.startsWith('>') && filters.rsiW7 !== '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&gt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW7?.startsWith('>') && filters.rsiW7 !== '>70' ? filters.rsiW7.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsiW7: undefined });
                          } else {
                            if (val === '70') val = '71'; // Skip preset
                            onFiltersChange({ ...filters, rsiW7: `>${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsiW7?.startsWith('>') && filters.rsiW7 !== '>70' ? filters.rsiW7.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsiW7: `>${val}` }),
                          [70]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Weekly RSI14 */}
                  <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5 items-center">
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW14: undefined })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        !filters.rsiW14 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      W-RSI14
                    </button>
                    {/* Preset buttons */}
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW14: '<30' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsiW14 === '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &lt;30
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW14: '30~70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsiW14 === '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      30~70
                    </button>
                    <button
                      onClick={() => onFiltersChange({ ...filters, rsiW14: '>70' })}
                      className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rsiW14 === '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      &gt;70
                    </button>
                    {/* Custom < input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsiW14?.startsWith('<') && filters.rsiW14 !== '<30')) {
                          onFiltersChange({ ...filters, rsiW14: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsiW14?.startsWith('<') && filters.rsiW14 !== '<30' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&lt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW14?.startsWith('<') && filters.rsiW14 !== '<30' ? filters.rsiW14.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsiW14: undefined });
                          } else {
                            if (val === '30') val = '29'; // Skip preset
                            onFiltersChange({ ...filters, rsiW14: `<${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsiW14?.startsWith('<') && filters.rsiW14 !== '<30' ? filters.rsiW14.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsiW14: `<${val}` }),
                          [30]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom range input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70')) {
                          onFiltersChange({ ...filters, rsiW14: undefined });
                        }
                        if (!(e.target instanceof HTMLInputElement)) {
                          e.currentTarget.querySelector('input')?.focus();
                        }
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[0] : ''}
                        onChange={(e) => {
                          let min = e.target.value;
                          const max = filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[1] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsiW14: undefined });
                          } else {
                            if (min === '30' || min === '70') min = min === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsiW14: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const max = filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[1] : '';
                          handleNumberWheel(
                            e,
                            filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[0] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsiW14: `${val}~${max}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                      <span>~</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[1] : ''}
                        onChange={(e) => {
                          let max = e.target.value;
                          const min = filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[0] : '';
                          if (min === '' && max === '') {
                            onFiltersChange({ ...filters, rsiW14: undefined });
                          } else {
                            if (max === '30' || max === '70') max = max === '30' ? '31' : '69'; // Skip preset
                            onFiltersChange({ ...filters, rsiW14: `${min}~${max}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => {
                          const min = filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[0] : '';
                          handleNumberWheel(
                            e,
                            filters.rsiW14?.includes('~') && filters.rsiW14 !== '30~70' ? filters.rsiW14.split('~')[1] : '',
                            1, 100, 1,
                            (val) => onFiltersChange({ ...filters, rsiW14: `${min}~${val}` }),
                            [30, 70]
                          );
                        }}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-6 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                    {/* Custom > input */}
                    <div
                      onClick={(e) => {
                        if (!(filters.rsiW14?.startsWith('>') && filters.rsiW14 !== '>70')) {
                          onFiltersChange({ ...filters, rsiW14: undefined });
                        }
                        e.currentTarget.querySelector('input')?.focus();
                      }}
                      className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        filters.rsiW14?.startsWith('>') && filters.rsiW14 !== '>70' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
                      }`}>
                      <span>&gt;</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder=""
                        value={filters.rsiW14?.startsWith('>') && filters.rsiW14 !== '>70' ? filters.rsiW14.slice(1) : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '') {
                            onFiltersChange({ ...filters, rsiW14: undefined });
                          } else {
                            if (val === '70') val = '71'; // Skip preset
                            onFiltersChange({ ...filters, rsiW14: `>${val}` });
                            debouncedSelect(e.target);
                          }
                        }}
                        onWheel={(e) => handleNumberWheel(
                          e,
                          filters.rsiW14?.startsWith('>') && filters.rsiW14 !== '>70' ? filters.rsiW14.slice(1) : '',
                          1, 100, 1,
                          (val) => onFiltersChange({ ...filters, rsiW14: `>${val}` }),
                          [70]
                        )}
                                                onFocus={(e) => { const input = e.target; setTimeout(() => input.select(), 0); }}
                        className="w-7 bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Other */}
              <div>
                <div className="text-[11px] text-gray-400 font-medium mb-2">Other</div>
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
                      { value: '<1y', label: '≤1y' },
                      { value: '1-2y', label: '1-2y' },
                      { value: '>2y', label: '>2y' },
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
                      className="p-1.5 rounded-md cursor-pointer transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
