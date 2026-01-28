'use client';

import { ColumnVisibility, SortConfig } from '@/lib/types';

interface TableHeaderProps {
  columns: ColumnVisibility;
  sort: SortConfig;
  onSort: (column: string) => void;
}

const SortIcon = ({ column, sort }: { column: string; sort: SortConfig }) => {
  const isActive = sort.column === column;
  return (
    <span className={`ml-1 inline-flex flex-col text-[9px] leading-[0.6] align-middle ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
      <span className={isActive && sort.direction === 'asc' ? 'text-gray-600' : 'text-gray-300'}>▲</span>
      <span className={isActive && sort.direction === 'desc' ? 'text-gray-600' : 'text-gray-300'}>▼</span>
    </span>
  );
};

export function TableHeader({ columns, sort, onSort }: TableHeaderProps) {
  const thClass = "text-left px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wide bg-[#fafafa] cursor-pointer select-none whitespace-nowrap transition-colors hover:bg-gray-100 group";
  const thRightClass = thClass + " text-right";
  
  return (
    <div className="flex-shrink-0 bg-[#fafafa] border-b border-gray-100">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <th className="w-9 px-2 py-3 bg-[#fafafa]"></th>
            
            <th 
              className={`${thClass} w-[120px]`}
              style={{ display: columns.symbol ? '' : 'none' }}
              onClick={() => onSort('symbol')}
            >
              Token <SortIcon column="symbol" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[100px]`}
              style={{ display: columns.price ? '' : 'none' }}
              onClick={() => onSort('price')}
            >
              Price <SortIcon column="price" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[95px]`}
              style={{ display: columns.change4h ? '' : 'none' }}
              onClick={() => onSort('change4h')}
            >
              4H <SortIcon column="change4h" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[95px]`}
              style={{ display: columns.change ? '' : 'none' }}
              onClick={() => onSort('change')}
            >
              24H <SortIcon column="change" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[95px]`}
              style={{ display: columns.change7d ? '' : 'none' }}
              onClick={() => onSort('change7d')}
            >
              7D <SortIcon column="change7d" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[70px]`}
              style={{ display: columns.rank ? '' : 'none' }}
              onClick={() => onSort('rank')}
            >
              #Rank <SortIcon column="rank" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[100px]`}
              style={{ display: columns.marketCap ? '' : 'none' }}
              onClick={() => onSort('marketCap')}
            >
              Mkt Cap <SortIcon column="marketCap" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[65px]`}
              style={{ display: columns.rsi7 ? '' : 'none' }}
              onClick={() => onSort('rsi7')}
            >
              RSI7 <SortIcon column="rsi7" sort={sort} />
            </th>
            
            <th 
              className={`${thRightClass} w-[65px]`}
              style={{ display: columns.rsi14 ? '' : 'none' }}
              onClick={() => onSort('rsi14')}
            >
              RSI14 <SortIcon column="rsi14" sort={sort} />
            </th>
            
            <th 
              className={`${thClass} w-[65px]`}
              style={{ display: columns.hasSpot ? '' : 'none' }}
              onClick={() => onSort('hasSpot')}
            >
              Spot <SortIcon column="hasSpot" sort={sort} />
            </th>
          </tr>
        </thead>
      </table>
    </div>
  );
}
