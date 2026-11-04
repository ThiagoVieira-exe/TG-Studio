import React from 'react';
import type { ArtItem } from '../../types';
import { BASE_PX_PER_MM, formatMeasure, getCombinedBounds } from '../../utils/units';

interface SelectionOverlayProps {
  selectedItems: ArtItem[];
  marqueeBox: { x1: number; y1: number; x2: number; y2: number } | null;
  zoom: number;
  dragOffset?: { deltaX: number; deltaY: number };
  dragItemIds?: string[];
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selectedItems,
  marqueeBox,
  zoom,
  dragOffset,
  dragItemIds,
}) => {
  const scale = BASE_PX_PER_MM * zoom;

  // Render Drag Marquee Box
  if (marqueeBox) {
    const left = Math.min(marqueeBox.x1, marqueeBox.x2);
    const top = Math.min(marqueeBox.y1, marqueeBox.y2);
    const width = Math.abs(marqueeBox.x2 - marqueeBox.x1);
    const height = Math.abs(marqueeBox.y2 - marqueeBox.y1);

    return (
      <div
        className="absolute border border-indigo-500 bg-indigo-500/15 pointer-events-none z-50"
        style={{
          left,
          top,
          width,
          height,
        }}
      />
    );
  }

  // If multiple items are selected, render combined boundary
  if (selectedItems.length > 1) {
    const displayedItems = dragOffset
      ? selectedItems.map((item) => ({
          ...item,
          x: dragItemIds?.includes(item.id) ? item.x + dragOffset.deltaX : item.x,
          y: dragItemIds?.includes(item.id) ? item.y + dragOffset.deltaY : item.y,
        }))
      : selectedItems;
    const bounds = getCombinedBounds(displayedItems, 'outer');
    if (!bounds) return null;

    const leftPx = bounds.x * scale;
    const topPx = bounds.y * scale;
    const widthPx = bounds.width * scale;
    const heightPx = bounds.height * scale;

    const isUnifiedGroup =
      selectedItems.length > 1 &&
      Boolean(selectedItems[0].groupId) &&
      selectedItems.every((i) => i.groupId === selectedItems[0].groupId);

    return (
      <div
        className={`absolute border pointer-events-none z-45 ${
          isUnifiedGroup ? 'border-amber-400 border-2' : 'border-dashed border-indigo-400'
        }`}
        style={{
          left: leftPx,
          top: topPx,
          width: widthPx,
          height: heightPx,
        }}
      >
        <div
          className={`absolute -top-6 left-0 font-mono text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1.5 ${
            isUnifiedGroup ? 'bg-amber-500 text-zinc-950 font-semibold' : 'bg-indigo-700 text-white'
          }`}
        >
          {isUnifiedGroup ? (
            <span>★ Grupo ({selectedItems.length} objetos)</span>
          ) : (
            <span>{selectedItems.length} objetos selecionados</span>
          )}
          <span>({formatMeasure(bounds.width)} × {formatMeasure(bounds.height)} mm)</span>
        </div>
      </div>
    );
  }

  return null;
};
