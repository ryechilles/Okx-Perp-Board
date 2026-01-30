'use client';

import { useState } from 'react';
import { ColumnVisibility, ColumnKey, Filters } from '@/lib/types';
import { MarketMomentum } from './MarketMomentum';
import { AHR999Indicator } from './AHR999Indicator';

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
  const hasFilters = Object.keys(filters).length > 0;
  
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
      {/* Indicators + Search Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MarketMomentum
            avgRsi7={avgRsi7}
            avgRsi14={avgRsi14}
            avgRsiW7={avgRsiW7}
            avgRsiW14={avgRsiW14}
          />
          <AHR999Indicator />
        </div>

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

        {/* Customize button */}
        <button
          className={`flex items-center gap-1.5 px-3 h-9 bg-white border rounded-lg text-sm cursor-pointer transition-all ${
            showCustomizePanel
              ? 'border-gray-900 text-gray-900'
              : hasFilters
              ? 'border-blue-500 text-blue-500 bg-blue-50'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
          }`}
          onClick={() => setShowCustomizePanel(!showCustomizePanel)}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Customize
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
        </button>
      </div>
      
      {/* Overlay to close panel when clicking outside */}
      {showCustomizePanel && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCustomizePanel(false)}
        />
      )}

      {showCustomizePanel && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm relative z-50">
          {/* Tab buttons */}
          <div className="flex gap-1 mb-4 border-b border-gray-200 pb-3">
            <button
              onClick={() => setCustomizeTab('columns')}
              className={`px-4 py-2 rounded-md text-[13px] font-medium transition-all ${
                customizeTab === 'columns'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Columns ({visibleCount}/{totalCount})
            </button>
            <button
              onClick={() => setCustomizeTab('filters')}
              className={`px-4 py-2 rounded-md text-[13px] font-medium transition-all ${
                customizeTab === 'filters'
                  ? 'bg-gray-900 text-white'
                  : hasFilters
                  ? 'text-blue-500 hover:bg-gray-100'
                  : 'text-gray-600 hover:bg-gray-100'
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
                  <div className="flex flex-wrap gap-2">
                    {group.columns.map(col => (
                      <label
                        key={col.key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-[13px] cursor-pointer transition-all ${
                          columns[col.key]
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={columns[col.key]}
                          onChange={(e) => onColumnChange(col.key, e.target.checked)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters tab content */}
          {customizeTab === 'filters' && (
            <>
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
            </>
          )}
        </div>
      )}

    </>
  );
}
