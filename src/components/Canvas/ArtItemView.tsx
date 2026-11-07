import React, { useRef } from 'react';
import type { ArtItem, ToolMode } from '../../types';
import { BASE_PX_PER_MM, formatMeasure } from '../../utils/units';
import { samplePixelFromImage } from '../../utils/colorSampler';
import { Lock } from 'lucide-react';
import { BorderOverlay } from '../BorderOverlay';
import { getBorderGeometry } from '../../utils/borders';

interface ArtItemViewProps {
  item: ArtItem;
  isSelected: boolean;
  zoom: number;
  toolMode: ToolMode;
  previewOffset?: { deltaX: number; deltaY: number };
  onSelect: (e: React.MouseEvent, item: ArtItem) => void;
  onStartDrag: (e: React.MouseEvent, item: ArtItem) => void;
  onStartResize: (e: React.MouseEvent, item: ArtItem, handle: string) => void;
  onSampleColor?: (color: string) => void;
}

export const ArtItemView = React.memo<ArtItemViewProps>(({ 
  item,
  isSelected,
  zoom,
  toolMode,
  previewOffset,
  onSelect,
  onStartDrag,
  onStartResize,
  onSampleColor,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const scale = BASE_PX_PER_MM * zoom;
  const isRound = Boolean(item.isRound || item.shape === 'circle');
  const displayX = item.x + (previewOffset?.deltaX ?? 0);
  const displayY = item.y + (previewOffset?.deltaY ?? 0);
  const geometry = getBorderGeometry({ ...item, x: displayX, y: displayY });
  const hasBorder = geometry.borderWidth > 0;
  const bWidthMm = geometry.borderWidth;

  // Outer bounds in mm
  const outerXMm = geometry.outerX;
  const outerYMm = geometry.outerY;
  const outerWMm = geometry.outerWidth;
  const outerHMm = geometry.outerHeight;

  // Screen pixels
  const leftPx = outerXMm * scale;
  const topPx = outerYMm * scale;
  const widthPx = outerWMm * scale;
  const heightPx = outerHMm * scale;
  const borderPadPx = bWidthMm * scale;

  const handlePointerDown = (e: React.MouseEvent) => {
    // Crucial: Stop propagation so the canvas does NOT start marquee selection or deselect
    e.stopPropagation();

    if (e.button !== 0) return; // Only drag with left mouse button

    if (toolMode === 'eyedropper') {
      if (!imgRef.current || !onSampleColor) return;
      const rect = imgRef.current.getBoundingClientRect();
      const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      samplePixelFromImage(imgRef.current, relX, relY).then(onSampleColor);
      return;
    }

    if (item.locked) {
      onSelect(e, item);
      return;
    }

    onSelect(e, item);
    onStartDrag(e, item);
  };

  return (
    <div
      className={`absolute select-none group ${
        toolMode === 'eyedropper'
          ? 'cursor-crosshair'
          : item.locked
          ? 'cursor-not-allowed'
          : 'cursor-move'
      }`}
      style={{
        left: leftPx,
        top: topPx,
        width: widthPx,
        height: heightPx,
        transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        zIndex: item.zIndex,
      }}
      onMouseDown={handlePointerDown}
    >
      {/* Outer Border + Image Container */}
      <div
        className="w-full h-full relative"
        style={{
          backgroundColor: 'transparent',
        }}
      >
        <img
          ref={imgRef}
          src={item.src}
          alt={item.name}
          draggable={false}
          className="w-full h-full block pointer-events-none"
          style={{
            position: 'absolute',
            left: borderPadPx,
            top: borderPadPx,
            width: `calc(100% - ${borderPadPx * 2}px)`,
            height: `calc(100% - ${borderPadPx * 2}px)`,
            borderRadius: isRound ? '50%' : undefined,
            objectFit: 'fill', // Essential: stretches/squashes without clipping or cropping!
            imageRendering: 'auto',
          }}
        />
        {hasBorder && <BorderOverlay item={item} style={{ zIndex: 2 }} />}
      </div>

      {/* Lock Badge */}
      {item.locked && (
        <div className="absolute top-1 right-1 bg-zinc-900/80 text-amber-400 p-1 rounded shadow-md pointer-events-none">
          <Lock size={12} />
        </div>
      )}

      {/* Selection Box & Resize Handles */}
      {isSelected && (
        <div
          className={`absolute inset-0 pointer-events-none shadow-[0_0_0_1px_rgba(255,255,255,0.7)] ${
            isRound ? 'border-2 border-indigo-500 rounded-full' : 'border-2 border-indigo-500'
          }`}
        >
          {/* Dimension Tag */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none flex items-center gap-1">
            {item.groupId && (
              <span className="bg-amber-400 text-zinc-950 font-sans font-bold px-1 rounded-xs text-[8px] uppercase tracking-wider">
                Grupo
              </span>
            )}
            <span>
              {formatMeasure(item.width)} × {formatMeasure(item.height)} mm
              {hasBorder && ` (+${formatMeasure(bWidthMm * 2)}mm borda)`}
            </span>
          </div>

          {/* Resize handles (only if not locked) */}
          {!item.locked && toolMode !== 'eyedropper' && (
            <>
              {/* Corner Handles */}
              <div
                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-nwse-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 'nw');
                }}
              />
              <div
                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-nesw-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 'ne');
                }}
              />
              <div
                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-nesw-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 'sw');
                }}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-nwse-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 'se');
                }}
              />

              {/* Edge Handles */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-ns-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 'n');
                }}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-ns-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 's');
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-ew-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 'w');
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm pointer-events-auto cursor-ew-resize shadow"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartResize(e, item, 'e');
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
});
