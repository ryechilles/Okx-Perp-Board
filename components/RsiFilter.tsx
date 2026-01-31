'use client';

import { debouncedSelect, debouncedRangeParse, handleNumberWheel } from '@/lib/inputUtils';

interface RsiFilterProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/**
 * Reusable RSI Filter component
 * Supports: preset buttons (<30, 30~70, >70), custom inputs (<, ~, >)
 */
export function RsiFilter({ label, value, onChange }: RsiFilterProps) {
  const isCustomLess = value?.startsWith('<') && value !== '<30';
  const isCustomRange = value?.includes('~') && value !== '30~70';
  const isCustomGreater = value?.startsWith('>') && value !== '>70';

  const rangeMin = isCustomRange && value ? value.split('~')[0] : '';
  const rangeMax = isCustomRange && value ? value.split('~')[1] : '';

  const inputClass = "bg-transparent text-[12px] font-medium text-center outline-none cursor-pointer";
  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => setTimeout(() => e.target.select(), 0);
  const clickHandler = (e: React.MouseEvent<HTMLInputElement>) => setTimeout(() => (e.target as HTMLInputElement).select(), 0);

  return (
    <div className="inline-flex items-center gap-2">
      {/* Label + Presets */}
      <div className="inline-flex bg-gray-200 rounded-lg p-0.5 gap-0.5 items-center">
        {/* Label */}
        <button
          onClick={() => onChange(undefined)}
          className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all w-[66px] text-center whitespace-nowrap ${
            !value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>

        {/* Presets */}
        {['<30', '30~70', '>70'].map(preset => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`px-2 py-1 rounded-md text-[12px] font-medium transition-all ${
              value === preset ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {preset.replace('<', '<').replace('>', '>')}
          </button>
        ))}
      </div>

      {/* Custom < */}
      <div className="inline-flex bg-gray-200 rounded-lg p-0.5 items-center">
        <div
          onClick={(e) => {
            if (!isCustomLess) onChange(undefined);
            e.currentTarget.querySelector('input')?.focus();
          }}
          className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
            isCustomLess ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
          }`}
        >
          <span>&lt;</span>
          <input
            type="number" min="1" max="100" step="1"
            value={isCustomLess && value ? value.slice(1) : ''}
            onChange={(e) => {
              let val = e.target.value;
              if (val === '') { onChange(undefined); }
              else {
                if (val === '30') val = '29';
                onChange(`<${val}`);
                debouncedSelect(e.target);
              }
            }}
            onWheel={(e) => handleNumberWheel(e, isCustomLess && value ? value.slice(1) : '', 1, 100, 1, (v) => onChange(`<${v}`), [30])}
            onFocus={focusHandler} onClick={clickHandler}
            className={`w-7 ${inputClass}`}
          />
        </div>
      </div>

      {/* Custom range ~ */}
      <div className="inline-flex bg-gray-200 rounded-lg p-0.5 items-center">
        <div
          onClick={(e) => {
            if (!isCustomRange) onChange(undefined);
            if (!(e.target instanceof HTMLInputElement)) e.currentTarget.querySelector('input')?.focus();
          }}
          className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
            isCustomRange ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
          }`}
        >
          <input
            type="number" min="1" max="100" step="1"
            value={rangeMin}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' && rangeMax === '') { onChange(undefined); }
              else {
                onChange(`${val}~${rangeMax}`);
                debouncedRangeParse(e.target, val, (min, max) => onChange(`${min}~${max}`));
              }
            }}
            onWheel={(e) => handleNumberWheel(e, rangeMin, 1, 100, 1, (v) => onChange(`${v}~${rangeMax}`), [30, 70])}
            onFocus={focusHandler} onClick={clickHandler}
            className={`w-6 ${inputClass}`}
          />
          <span>~</span>
          <input
            type="number" min="1" max="100" step="1"
            value={rangeMax}
            onChange={(e) => {
              const val = e.target.value;
              if (rangeMin === '' && val === '') { onChange(undefined); }
              else {
                onChange(`${rangeMin}~${val}`);
                debouncedRangeParse(e.target, val, (min, max) => onChange(`${min}~${max}`));
              }
            }}
            onWheel={(e) => handleNumberWheel(e, rangeMax, 1, 100, 1, (v) => onChange(`${rangeMin}~${v}`), [30, 70])}
            onFocus={focusHandler} onClick={clickHandler}
            className={`w-6 ${inputClass}`}
          />
        </div>
      </div>

      {/* Custom > */}
      <div className="inline-flex bg-gray-200 rounded-lg p-0.5 items-center">
        <div
          onClick={(e) => {
            if (!isCustomGreater) onChange(undefined);
            e.currentTarget.querySelector('input')?.focus();
          }}
          className={`flex items-center px-2 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
            isCustomGreater ? 'bg-white shadow-sm text-gray-700' : 'text-gray-500 hover:text-gray-700 focus-within:bg-white focus-within:shadow-sm focus-within:text-gray-700'
          }`}
        >
          <span>&gt;</span>
          <input
            type="number" min="1" max="100" step="1"
            value={isCustomGreater && value ? value.slice(1) : ''}
            onChange={(e) => {
              let val = e.target.value;
              if (val === '') { onChange(undefined); }
              else {
                if (val === '70') val = '71';
                onChange(`>${val}`);
                debouncedSelect(e.target);
              }
            }}
            onWheel={(e) => handleNumberWheel(e, isCustomGreater && value ? value.slice(1) : '', 1, 100, 1, (v) => onChange(`>${v}`), [70])}
            onFocus={focusHandler} onClick={clickHandler}
            className={`w-7 ${inputClass}`}
          />
        </div>
      </div>
    </div>
  );
}
