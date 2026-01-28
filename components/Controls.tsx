'use client';

import { useState } from 'react';
import { ColumnVisibility, ColumnKey, Filters } from '@/lib/types';

interface ControlsProps {
  view: 'market' | 'favorites';
  columns: ColumnVisibility;
  columnOrder: ColumnKey[];
  filters: Filters;
  searchTerm: string;
  avgRsi7: number | null;
  avgRsi14: number | null;
  onViewChange: (view: 'market' | 'favorites') => void;
  onColumnChange: (col: keyof ColumnVisibility, visible: boolean) => void;
  onColumnsPreset: (preset: 'all' | 'none' | 'default') => void;
  onFiltersChange: (filters: Filters) => void;
  onSearchChange: (term: string) => void;
  onColumnOrderChange: (order: ColumnKey[]) => void;
}

export function Controls({
  view,
  columns,
  columnOrder,
  filters,
  searchTerm,
  avgRsi7,
  avgRsi14,
  onViewChange,
  onColumnChange,
  onColumnsPreset,
  onFiltersChange,
  onSearchChange,
  onColumnOrderChange,
}: ControlsProps) {
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  
  const visibleCount = Object.entries(columns)
    .filter(([key]) => !['favorite', 'rank', 'symbol'].includes(key))
    .filter(([, v]) => v).length;
  const totalCount = Object.keys(columns).length - 3;
  const hasFilters = Object.keys(filters).length > 0;
  
  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
  };
  
  const handleClearFilters = () => {
    setTempFilters({});
    onFiltersChange({});
  };
  
  const getRsiAvgClass = (rsi: number | null) => {
    if (rsi === null) return '';
    if (rsi <= 30) return 'text-green-500';
    if (rsi >= 70) return 'text-red-500';
    return 'text-gray-900';
  };
  
  const columnOptions: { key: ColumnKey; label: string; disabled?: boolean }[] = [
    { key: 'favorite', label: '★ Favorite', disabled: true },
    { key: 'rank', label: '#Rank', disabled: true },
    { key: 'symbol', label: 'Token', disabled: true },
    { key: 'price', label: 'Price' },
    { key: 'fundingRate', label: 'Funding Rate' },
    { key: 'fundingInterval', label: 'Funding Interval' },
    { key: 'change4h', label: '4H Change' },
    { key: 'change', label: '24H Change' },
    { key: 'change7d', label: '7D Change' },
    { key: 'marketCap', label: 'Market Cap' },
    { key: 'rsi7', label: 'RSI7' },
    { key: 'rsi14', label: 'RSI14' },
    { key: 'listDate', label: 'List Date' },
    { key: 'hasSpot', label: 'Has Spot' }
  ];
  
  return (
    <>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-0.5">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'market' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => onViewChange('market')}
          >
            Market
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'favorites' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => onViewChange('favorites')}
          >
            Favorites
          </button>
        </div>
        
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
              <div className="flex justify-between px-3 pb-2 mb-1 border-b border-gray-100">
                <span 
                  className="text-xs text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => onColumnsPreset('all')}
                >
                  All
                </span>
                <span 
                  className="text-xs text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => onColumnsPreset('default')}
                >
                  Default
                </span>
                <span 
                  className="text-xs text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => onColumnsPreset('none')}
                >
                  None
                </span>
              </div>
              
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
              
              <div className="px-3 pt-2 mt-1 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  Drag column headers to reorder
                </p>
              </div>
            </div>
          )}
        </div>
        
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
        
        <div className="flex items-center gap-4 ml-auto px-3.5 h-9 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Avg RSI7</span>
            <span className={`text-sm font-semibold tabular-nums ${getRsiAvgClass(avgRsi7)}`}>
              {avgRsi7 !== null ? avgRsi7.toFixed(1) : '--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Avg RSI14</span>
            <span className={`text-sm font-semibold tabular-nums ${getRsiAvgClass(avgRsi14)}`}>
              {avgRsi14 !== null ? avgRsi14.toFixed(1) : '--'}
            </span>
          </div>
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
            className="border-none outline-none text-sm w-[150px]"
          />
        </div>
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
              <label className="text-xs text-gray-600 font-medium">RSI7</label>
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
              <label className="text-xs text-gray-600 font-medium">RSI14</label>
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
              <label className="text-xs text-gray-600 font-medium">Min Market Cap ($M)</label>
              <select
                value={tempFilters.marketCapMin || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, marketCapMin: e.target.value || undefined }))}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-[13px] outline-none bg-white cursor-pointer focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="20">≥ $20M</option>
                <option value="50">≥ $50M</option>
                <option value="100">≥ $100M</option>
                <option value="500">≥ $500M</option>
                <option value="1000">≥ $1B</option>
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
                <option value=">1y">Listed &gt; 1 year</option>
                <option value=">6m">Listed &gt; 6 months</option>
                <option value="<30d">New (&lt; 30 days)</option>
                <option value="<7d">Very New (&lt; 7 days)</option>
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
