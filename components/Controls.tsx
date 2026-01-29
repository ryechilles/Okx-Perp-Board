'use client';

import { useState } from 'react';
import { ColumnVisibility, ColumnKey, Filters } from '@/lib/types';
import { MarketMomentum } from './MarketMomentum';

// Quick filter types
type QuickFilter = 'all' | 'top25' | 'overbought' | 'oversold';

interface ControlsProps {
  columns: ColumnVisibility;
  columnOrder: ColumnKey[];
  filters: Filters;
  searchTerm: string;
  avgRsi7: number | null;
  avgRsi14: number | null;
  avgRsiW7: number | null;
  avgRsiW14: number | null;
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
  onColumnChange,
  onColumnsPreset,
  onFiltersChange,
  onSearchChange,
  onColumnOrderChange,
}: ControlsProps) {
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [hoveredFilter, setHoveredFilter] = useState<QuickFilter | null>(null);

  // Determine active quick filter based on current filters
  const getActiveQuickFilter = (): QuickFilter => {
    if (filters.rank === '1-20' && !filters.rsi7 && !filters.rsi14) return 'top25';
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
        onFiltersChange({ rank: '1-20' });
        setTempFilters({ rank: '1-20' });
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
  const alwaysFixedColumns = ['favorite', 'rank', 'logo', 'symbol'];
  const visibleCount = Object.entries(columns)
    .filter(([key]) => !alwaysFixedColumns.includes(key))
    .filter(([, v]) => v).length;
  const totalCount = Object.keys(columns).length - alwaysFixedColumns.length;
  const hasFilters = Object.keys(filters).length > 0;
  
  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
  };
  
  const handleClearFilters = () => {
    setTempFilters({});
    onFiltersChange({});
  };

  const columnOptions: { key: ColumnKey; label: string; disabled?: boolean }[] = [
    { key: 'favorite', label: '★ Favorite', disabled: true },
    { key: 'rank', label: '#Rank', disabled: true },
    { key: 'logo', label: 'Logo', disabled: true },
    { key: 'symbol', label: 'Token', disabled: true },
    { key: 'price', label: 'Price' },
    { key: 'fundingRate', label: 'Funding Rate' },
    { key: 'fundingApr', label: 'Funding APR' },
    { key: 'fundingInterval', label: 'Funding Interval' },
    { key: 'change4h', label: '4H Change' },
    { key: 'change', label: '24H Change' },
    { key: 'change7d', label: '7D Change' },
    { key: 'volume24h', label: '24H Volume' },
    { key: 'marketCap', label: 'Market Cap' },
    { key: 'rsi7', label: 'Daily RSI7' },
    { key: 'rsi14', label: 'Daily RSI14' },
    { key: 'rsiW7', label: 'Weekly RSI7' },
    { key: 'rsiW14', label: 'Weekly RSI14' },
    { key: 'listDate', label: 'List Date' },
    { key: 'hasSpot', label: 'Has Spot' }
  ];
  
  return (
    <>
      {/* Market Momentum + Search Row */}
      <div className="flex items-center justify-between mb-4">
        <MarketMomentum
          avgRsi7={avgRsi7}
          avgRsi14={avgRsi14}
          avgRsiW7={avgRsiW7}
          avgRsiW14={avgRsiW14}
        />

        <div className="flex items-center gap-2 px-3 h-9 bg-white border border-gray-200 rounded-lg">
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
            placeholder="Search token..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-none outline-none text-sm w-[120px]"
          />
        </div>
      </div>

      {/* Quick Filters + Controls Row */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* Quick Filter Buttons */}
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
                  <span className="text-gray-700">OKX Perp Market Cap Rank 1-25</span>
                </div>
              </div>
            )}
          </div>

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
              🔥 Overbought
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
              🧊 Oversold
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

        {/* Columns dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 h-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer transition-all hover:border-gray-300"
            onClick={() => setShowColumnsMenu(!showColumnsMenu)}
          >
            <span className="text-gray-600">Columns:</span>
            <span>{visibleCount}/{totalCount}</span>
            <span className="text-[10px] text-gray-400">▼</span>
          </button>

          {showColumnsMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] z-50 py-2">
              {columnOptions.map(col => (
                <label
                  key={col.key}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 text-[13px]"
                >
                  <span className={col.disabled ? 'text-gray-400' : ''}>{col.label}</span>
                  <input
                    type="checkbox"
                    checked={columns[col.key]}
                    disabled={col.disabled}
                    onChange={(e) => onColumnChange(col.key, e.target.checked)}
                    className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Filters button */}
        <button
          className={`flex items-center gap-1.5 px-3 h-9 bg-white border rounded-lg text-sm cursor-pointer transition-all ${
            hasFilters
              ? 'border-blue-500 text-blue-500 bg-blue-50'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
          }`}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
        >
          <span>⚙</span> Filters
        </button>
      </div>
      
      {showFilterPanel && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Market Cap Rank</label>
              <select
                value={tempFilters.rank || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, rank: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="1-20">Top 20</option>
                <option value="21-50">21 - 50</option>
                <option value="51-100">51 - 100</option>
                <option value="101-500">101 - 500</option>
                <option value=">500">&gt; 500 / N/A</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Funding Rate</label>
              <select
                value={tempFilters.fundingRate || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, fundingRate: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="positive">Positive (Longs Pay)</option>
                <option value="negative">Negative (Shorts Pay)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Daily RSI7</label>
              <select
                value={tempFilters.rsi7 || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, rsi7: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="<30">&lt; 30 (Oversold)</option>
                <option value="30-70">30 - 70</option>
                <option value=">70">&gt; 70 (Overbought)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Daily RSI14</label>
              <select
                value={tempFilters.rsi14 || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, rsi14: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="<30">&lt; 30 (Oversold)</option>
                <option value="30-70">30 - 70</option>
                <option value=">70">&gt; 70 (Overbought)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Weekly RSI7</label>
              <select
                value={tempFilters.rsiW7 || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, rsiW7: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="<30">&lt; 30 (Oversold)</option>
                <option value="30-70">30 - 70</option>
                <option value=">70">&gt; 70 (Overbought)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Weekly RSI14</label>
              <select
                value={tempFilters.rsiW14 || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, rsiW14: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="<30">&lt; 30 (Oversold)</option>
                <option value="30-70">30 - 70</option>
                <option value=">70">&gt; 70 (Overbought)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Has Spot</label>
              <select
                value={tempFilters.hasSpot || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, hasSpot: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Market Cap</label>
              <select
                value={tempFilters.marketCapMin || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, marketCapMin: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="0-20">≤ $20M</option>
                <option value="20-100">$20M - $100M</option>
                <option value="100-1000">$100M - $1B</option>
                <option value="1000+">≥ $1B</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Listing Age</label>
              <select
                value={tempFilters.listAge || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, listAge: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="<1y">≤ 1 year</option>
                <option value="1-2y">1 - 2 years</option>
                <option value=">2y">&gt; 2 years</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 rounded-md text-[13px] cursor-pointer transition-all bg-gray-900 text-white border-none hover:bg-gray-700"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-md text-[13px] cursor-pointer transition-all bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
      
      {showColumnsMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowColumnsMenu(false)}
        />
      )}
    </>
  );
}
