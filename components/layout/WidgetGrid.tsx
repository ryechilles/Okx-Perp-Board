'use client';

import { ReactNode, Children, cloneElement, isValidElement, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

export interface WidgetGridProps {
  /** Grid children (widgets) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Grid layout variant */
  variant?: 'auto' | 'fixed' | 'masonry' | 'vertical';
  /** Gap between widgets */
  gap?: 'sm' | 'md' | 'lg';
  /** Enable sortable drag-and-drop */
  sortable?: boolean;
  /** Unique IDs for sortable items (required when sortable=true) */
  itemIds?: string[];
  /** Callback when order changes */
  onOrderChange?: (newOrder: string[]) => void;
}

interface SortableItemProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * SortableItem - Wrapper for draggable widgets
 */
function SortableItem({ id, children, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      {/* Drag Handle - appears on hover */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full',
            'p-1 rounded-md cursor-grab active:cursor-grabbing',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'z-20'
          )}
          title="拖动排序"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * WidgetGrid - Responsive grid layout for widgets with optional drag-and-drop sorting
 *
 * Variants:
 * - auto: Auto-fit columns based on content (default)
 * - fixed: Fixed column layout (2 on md, 3 on lg, 4 on xl)
 * - masonry: CSS columns for masonry-like layout
 * - vertical: Vertical stack layout (best for sortable)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <WidgetGrid variant="auto" gap="md">
 *   <SmallWidget title="Widget 1">...</SmallWidget>
 *   <SmallWidget title="Widget 2">...</SmallWidget>
 * </WidgetGrid>
 *
 * // With drag-and-drop sorting
 * <WidgetGrid
 *   variant="vertical"
 *   sortable
 *   itemIds={['widget1', 'widget2']}
 *   onOrderChange={(newOrder) => saveOrder(newOrder)}
 * >
 *   <SmallWidget title="Widget 1">...</SmallWidget>
 *   <SmallWidget title="Widget 2">...</SmallWidget>
 * </WidgetGrid>
 * ```
 */
export function WidgetGrid({
  children,
  className,
  variant = 'auto',
  gap = 'md',
  sortable = false,
  itemIds = [],
  onOrderChange,
}: WidgetGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const variantClasses = {
    auto: 'flex flex-wrap items-start',
    fixed: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    masonry: 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 space-y-4',
    vertical: 'flex flex-col',
  };

  // Non-sortable mode - render children directly
  if (!sortable || itemIds.length === 0) {
    return (
      <div className={cn(variantClasses[variant], gapClasses[gap], className)}>
        {children}
      </div>
    );
  }

  // Convert children to array for sortable rendering
  const childrenArray = Children.toArray(children);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string);
      const newIndex = itemIds.indexOf(over.id as string);
      const newOrder = arrayMove(itemIds, oldIndex, newIndex);
      onOrderChange?.(newOrder);
    }
  };

  // Find the active child for drag overlay
  const activeIndex = activeId ? itemIds.indexOf(activeId) : -1;
  const activeChild = activeIndex >= 0 ? childrenArray[activeIndex] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={cn(variantClasses[variant], gapClasses[gap], 'pl-6', className)}>
          {itemIds.map((id, index) => (
            <SortableItem key={id} id={id}>
              {childrenArray[index]}
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - shows dragged item */}
      <DragOverlay>
        {activeChild && isValidElement(activeChild) ? (
          <div className="opacity-90 shadow-2xl rounded-2xl">
            {cloneElement(activeChild)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default WidgetGrid;
