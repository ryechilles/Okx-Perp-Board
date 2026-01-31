'use client';

import { useState, useEffect, useRef } from 'react';
import { ColumnVisibility, ColumnKey, Filters } from '@/lib/types';
import { isMobile } from '@/lib/utils';
import { getDefaultColumns } from '@/lib/defaults';
import { RsiFilter } from './RsiFilter';

// Quick filter types
type QuickFilter = 'all' | 'top25' | 'meme' | 'noSpot' | 'newListed' | 'overbought' | 'oversold';

interface ControlsProps {
  columns: ColumnVisibility;
  columnOrder: ColumnKey[];
  filters: Filters;
  searchTerm: string;
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
    if (filters.listAge === '<180d' && !filters.rsi7 && !filters.rsi14) return 'newListed';
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
      case 'newListed':
        onFiltersChange({ listAge: '<180d' });
        setTempFilters({ listAge: '<180d' });
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
  const defaultColumns = getDefaultColumns(isMobile());
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
      {/* Mobile Search Row - minimal style */}
      <div className="md:hidden mb-3 w-full">
        <div className="flex items-center gap-2 w-full border-b border-gray-300 pb-2">
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
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
            placeholder=""
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-[14px] text-gray-700 placeholder-gray-400 flex-1"
          />
        </div>
      </div>

      {/* Quick Filters + Controls Row */}
      <div className="flex items-center gap-4 mb-4 relative z-[60]">
        <div className="flex items-center gap-2 md:gap-4 overflow-visible pb-1 md:pb-0 md:flex-wrap">
        {/* Quick Filter Buttons - Part 1: All & Top 25 */}
        <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
          {/* All with tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredFilter('all')}
            onMouseLeave={() => setHoveredFilter(null)}
          >
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
            {hoveredFilter === 'all' && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                <div className="text-[12px]">
                  <span className="text-gray-900">Show all tokens</span>
                </div>
              </div>
            )}
          </div>

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
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
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
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                <div className="text-[12px]">
                  <span className="text-gray-900">Meme Tokens Only</span>
                </div>
              </div>
            )}
          </div>

          {/* No Spot with tooltip - Hidden on mobile */}
          <div
            className="relative hidden md:block"
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
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                <div className="text-[12px]">
                  <span className="text-gray-900">Tokens without Spot listing on OKX</span>
                </div>
              </div>
            )}
          </div>

          {/* New Listed with tooltip - Hidden on mobile */}
          <div
            className="relative hidden md:block"
            onMouseEnter={() => setHoveredFilter('newListed')}
            onMouseLeave={() => setHoveredFilter(null)}
          >
            <button
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                activeQuickFilter === 'newListed'
                  ? 'bg-white text-blue-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleQuickFilter('newListed')}
            >
              New Listed
            </button>
            {hoveredFilter === 'newListed' && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Filter Criteria</div>
                <div className="text-[12px]">
                  <span className="text-gray-900">Listed &lt;180d</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Filter Buttons - Part 2: RSI Filters - Hidden on mobile */}
        <div className="hidden md:inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
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
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
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
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-[70] whitespace-nowrap">
                <div className="text-[11px] font-medium text-gray-500 mb-1">Daily Oversold</div>
                <div className="text-[12px] flex flex-col gap-0.5">
                  <span className="text-gray-900">D-RSI7 &lt; 30</span>
                  <span className="text-gray-900">D-RSI14 &lt; 30</span>
                </div>
              </div>
            )}
          </div>
        </div>

        </div>

        {/* Settings icon */}
        <div
          ref={customizeButtonRef}
          className="cursor-pointer p-1"
          onClick={() => setShowCustomizePanel(!showCustomizePanel)}
        >
          <svg
            className={`w-4 h-4 transition-colors ${hasFilters || hasNonDefaultColumns ? 'text-gray-900' : 'text-gray-400'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>

        {/* Search */}
        <div className="hidden md:inline-flex items-center gap-1">
          <svg
            className="w-4 h-4 text-gray-400"
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
            placeholder=""
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-[13px] text-gray-700 w-[60px]"
          />
        </div>
      </div>
      
      {/* Sidebar Overlay */}
      {showCustomizePanel && (
        <div
          className="fixed inset-0 bg-black/20 z-[100]"
          onClick={() => setShowCustomizePanel(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        ref={customizePanelRef}
        className={`fixed top-0 right-0 h-full w-[500px] bg-white shadow-xl z-[101] transform transition-transform duration-300 ease-in-out ${
          showCustomizePanel ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
              <button
                onClick={() => setCustomizeTab('columns')}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                  customizeTab === 'columns'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : hasNonDefaultColumns
                    ? 'text-blue-500 hover:text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Columns {hasNonDefaultColumns && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 ml-1" />}
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
{(hasFilters || hasNonDefaultColumns) && (
              <button
                onClick={() => {
                  if (customizeTab === 'columns') {
                    onColumnsPreset('default');
                  } else {
                    handleClearFilters();
                  }
                }}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                title={customizeTab === 'columns' ? 'Reset columns' : 'Reset filters'}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">

          {/* Columns tab content */}
          {customizeTab === 'columns' && (
            <div className="space-y-4">
              {columnGroups.map(group => (
                <div key={group.label}>
                  <div className="text-[11px] text-gray-500 font-medium mb-2">{group.label}</div>
                  <div className="inline-flex flex-wrap bg-gray-200 rounded-lg p-1 gap-0.5">
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
              {/* Market Cap Rank */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">Market Cap Rank</div>
                <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
                  {[
                    { value: '1-20', label: 'Top 20' },
                    { value: '21-50', label: '21-50' },
                    { value: '51-100', label: '51-100' },
                    { value: '>500', label: '>500' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onFiltersChange({ ...filters, rank: filters.rank === opt.value ? undefined : opt.value })}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.rank === opt.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Cap */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">Market Cap</div>
                <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
                  {[
                    { value: '20-100', label: '$20M-$100M' },
                    { value: '100-1000', label: '$100M-$1B' },
                    { value: '1000+', label: '≥$1B' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onFiltersChange({ ...filters, marketCapMin: filters.marketCapMin === opt.value ? undefined : opt.value })}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.marketCapMin === opt.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Funding Rate */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">Funding Rate</div>
                <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
                  {[
                    { value: 'positive', label: 'Positive' },
                    { value: 'negative', label: 'Negative' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onFiltersChange({ ...filters, fundingRate: filters.fundingRate === opt.value ? undefined : opt.value })}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.fundingRate === opt.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
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

              {/* Has Spot */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">Has Spot on OKX</div>
                <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onFiltersChange({ ...filters, hasSpot: filters.hasSpot === opt.value ? undefined : opt.value })}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.hasSpot === opt.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listing Age */}
              <div>
                <div className="text-[11px] text-gray-500 font-medium mb-2">Listing Age</div>
                <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-0.5">
                  {[
                    { value: '<30d', label: '<30d' },
                    { value: '<60d', label: '<60d' },
                    { value: '<90d', label: '<90d' },
                    { value: '<180d', label: '<180d' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onFiltersChange({ ...filters, listAge: filters.listAge === opt.value ? undefined : opt.value })}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                        filters.listAge === opt.value
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
          )}
          </div>
        </div>
      </div>

    </>
  );
}
