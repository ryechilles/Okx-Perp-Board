'use client';

import { useRef, useState } from 'react';
import { ColumnVisibility, ColumnKey, SortConfig } from '@/lib/types';
import { COLUMN_DEFINITIONS } from '@/lib/utils';

interface TableHeaderProps {
  columns: ColumnVisibility;
  columnOrder: ColumnKey[];
  sort: SortConfig;
  onSort: (column: string) => void;
  onMoveColumn: (dragKey: ColumnKey, hoverKey: ColumnKey) => void;
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

export function TableHeader({ columns, columnOrder, sort, onSort, onMoveColumn }: TableHeaderProps) {
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null);
  const dragRef = useRef<ColumnKey | null>(null);
  
  const fixedColumns: ColumnKey[] = ['favorite', 'rank', 'symbol'];
  
  const handleDragStart = (e: React.DragEvent, key: ColumnKey) => {
    if (fixedColumns.includes(key)) {
      e.preventDefault();
      return;
    }
    setDraggedColumn(key);
    dragRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };
  
  const handleDragOver = (e: React.DragEvent, key: ColumnKey) => {
    e.preventDefault();
    if (fixedColumns.includes(key) || !dragRef.current) return;
    setDragOverColumn(key);
  };
  
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };
  
  const handleDrop = (e: React.DragEvent, key: ColumnKey) => {
    e.preventDefault();
    if (fixedColumns.includes(key) || !dragRef.current) return;
    
    onMoveColumn(dragRef.current, key);
    setDraggedColumn(null);
    setDragOverColumn(null);
    dragRef.current = null;
  };
  
  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
    dragRef.current = null;
  };
  
  const getHeaderStyle = (key: ColumnKey) => {
    const def = COLUMN_DEFINITIONS[key];
    const isFixed = fixedColumns.includes(key);
    const isDragging = draggedColumn === key;
    const isDragOver = dragOverColumn === key;
    
    return {
      width: def.width,
      minWidth: def.width,
      opacity: isDragging ? 0.5 : 1,
      backgroundColor: isDragOver ? '#f0f9ff' : '#fafafa',
      cursor: isFixed ? 'default' : 'grab',
      position: isFixed ? 'sticky' as const : 'relative' as const,
      left: isFixed ? (key === 'favorite' ? '0' : key === 'rank' ? '44px' : '94px') : undefined,
      zIndex: isFixed ? 30 : 1,
    };
  };
  
  const thBaseClass = "px-3 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wide bg-[#fafafa] select-none whitespace-nowrap transition-colors hover:bg-gray-100 group border-b border-gray-100";
  
  return (
    <div className="flex-shrink-0 sticky top-0 z-20 bg-[#fafafa]">
      <table className="w-full border-collapse" style={{ minWidth: '1200px' }}>
        <thead>
          <tr>
            {columnOrder.map(key => {
              if (!columns[key]) return null;
              
              const def = COLUMN_DEFINITIONS[key];
              const isFixed = fixedColumns.includes(key);
              const sortable = def.sortable !== false;
              
              // Determine text alignment class
              let alignClass = 'text-left';
              if (def.align === 'right') alignClass = 'text-right';
              if (def.align === 'center') alignClass = 'text-center';
              
              return (
                <th
                  key={key}
                  className={`${thBaseClass} ${alignClass}`}
                  style={getHeaderStyle(key)}
                  draggable={!isFixed}
                  onDragStart={(e) => handleDragStart(e, key)}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, key)}
                  onDragEnd={handleDragEnd}
                  onClick={() => sortable && onSort(key)}
                >
                  <span className="flex items-center justify-center gap-0.5" style={{ justifyContent: def.align === 'left' ? 'flex-start' : def.align === 'right' ? 'flex-end' : 'center' }}>
                    {def.label}
                    {sortable && <SortIcon column={key} sort={sort} />}
                    {!isFixed && (
                      <span className="ml-1 opacity-0 group-hover:opacity-30 text-[10px] cursor-grab">⋮⋮</span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
      </table>
    </div>
  );
}
