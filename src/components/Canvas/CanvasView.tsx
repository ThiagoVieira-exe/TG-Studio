import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type {
  ArtItem,
  PaperDimensions,
  PaperFormat,
  PaperOrientation,
  SnapGuide,
  SnappingSettings,
  ToolMode,
  ViewportTransform,
} from '../../types';
import { BASE_PX_PER_MM, getItemBounds, POINT_IN_MM } from '../../utils/units';
import { computeSnapping } from '../../utils/snapping';
import { loadFile } from '../../utils/fileLoader';
import { Sheet } from './Sheet';
import { Rulers } from './Rulers';
import { ArtItemView } from './ArtItemView';
import { SnapGuides } from './SnapGuides';
import { SelectionOverlay } from './SelectionOverlay';

interface CanvasViewProps {
  paper: PaperDimensions;
  paperFormat: PaperFormat;
  paperOrientation: PaperOrientation;
  items: ArtItem[];
  selectedIds: string[];
  toolMode: ToolMode;
  snapping: SnappingSettings;
  transform: ViewportTransform;
  onUpdateTransform: (t: Partial<ViewportTransform> | ((prev: ViewportTransform) => ViewportTransform)) => void;
  onSelectItems: (ids: string[]) => void;
  onUpdateItem: (id: string, updates: Partial<ArtItem>, recordHistory?: boolean) => void;
  onUpdateItems: (updates: { id: string; changes: Partial<ArtItem> }[], recordHistory?: boolean) => void;
  onAddItems: (newItems: ArtItem[]) => void;
  onApplyBorderColor: (color: string) => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  paper,
  paperFormat,
  paperOrientation,
  items,
  selectedIds,
  toolMode,
  snapping,
  transform,
  onUpdateTransform,
  onSelectItems,
  onUpdateItem,
  onUpdateItems,
  onAddItems,
  onApplyBorderColor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [cursorMm, setCursorMm] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
  });

  // Dragging state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startClientX: number;
    startClientY: number;
    startItemPositions: Map<string, { x: number; y: number }>;
    primaryItemId: string;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    deltaX: number;
    deltaY: number;
    itemIds: string[];
  } | null>(null);
  const dragPreviewRef = useRef<typeof dragPreview>(null);
  const pendingSnapGuidesRef = useRef<SnapGuide[]>([]);
  const dragAnimationFrameRef = useRef<number | null>(null);

  // Resize state
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    item: ArtItem;
    handle: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    aspectRatio: number;
  } | null>(null);

  // Selection Marquee
  const [marqueeBox, setMarqueeBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const isMarqueeActiveRef = useRef(false);

  // Active snap guides
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

  // Space key tracker for pan
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const rulerThickness = 24;
  const scale = BASE_PX_PER_MM * transform.zoom;

  // Publish drag previews at most once per animation frame. The project state
  // is committed only when the pointer is released.
  const publishDragPreview = useCallback(
    (preview: NonNullable<typeof dragPreview>, guides: SnapGuide[]) => {
      dragPreviewRef.current = preview;
      pendingSnapGuidesRef.current = guides;

      if (dragAnimationFrameRef.current !== null) return;
      dragAnimationFrameRef.current = requestAnimationFrame(() => {
        dragAnimationFrameRef.current = null;
        setDragPreview(dragPreviewRef.current);
        setSnapGuides(pendingSnapGuidesRef.current);
      });
    },
    []
  );

  const clearDragPreview = useCallback(() => {
    if (dragAnimationFrameRef.current !== null) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
      dragAnimationFrameRef.current = null;
    }
    dragPreviewRef.current = null;
    pendingSnapGuidesRef.current = [];
    setDragPreview(null);
    setSnapGuides([]);
  }, []);

  useEffect(() => () => {
    if (dragAnimationFrameRef.current !== null) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
    }
  }, []);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Listen to space bar for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert screen coordinates to canvas mm
  const screenToMm = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const canvasScreenX = clientX - rect.left - rulerThickness;
      const canvasScreenY = clientY - rect.top - rulerThickness;

      const mmX = (canvasScreenX - transform.panX) / scale;
      const mmY = (canvasScreenY - transform.panY) / scale;
      return { x: mmX, y: mmY };
    },
    [transform.panX, transform.panY, scale, rulerThickness]
  );

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rulerThickness;
    const mouseY = e.clientY - rect.top - rulerThickness;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(6.0, Math.max(0.15, transform.zoom * zoomFactor));

    const newScale = BASE_PX_PER_MM * newZoom;
    const oldScale = scale;

    // Zoom centered on mouse
    const newPanX = mouseX - (mouseX - transform.panX) * (newScale / oldScale);
    const newPanY = mouseY - (mouseY - transform.panY) * (newScale / oldScale);

    onUpdateTransform({
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY,
    });
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const mm = screenToMm(e.clientX, e.clientY);
    if (!dragState?.isDragging) setCursorMm(mm);

    // 1. Panning
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      onUpdateTransform({
        panX: panStartRef.current.panX + dx,
        panY: panStartRef.current.panY + dy,
      });
      return;
    }

    // 2. Dragging items
    if (dragState && dragState.isDragging) {
      const deltaScreenX = e.clientX - dragState.startClientX;
      const deltaScreenY = e.clientY - dragState.startClientY;
      const deltaMmX = deltaScreenX / scale;
      const deltaMmY = deltaScreenY / scale;

      const primaryInitial = dragState.startItemPositions.get(dragState.primaryItemId);
      const primaryItem = items.find((i) => i.id === dragState.primaryItemId);

      if (primaryInitial && primaryItem) {
        const rawTargetX = primaryInitial.x + deltaMmX;
        const rawTargetY = primaryInitial.y + deltaMmY;

        // Snapping calculation on primary dragged item (ignoring any dragged items)
        const draggedIds = new Set(dragState.startItemPositions.keys());
        const otherItems = items.filter((i) => !draggedIds.has(i.id));
        const snapRes = computeSnapping(
          primaryItem,
          rawTargetX,
          rawTargetY,
          otherItems,
          paper,
          snapping,
          transform.zoom
        );

        // Effective delta after snapping
        const effectiveDeltaX = snapRes.x - primaryInitial.x;
        const effectiveDeltaY = snapRes.y - primaryInitial.y;

        publishDragPreview(
          {
            deltaX: effectiveDeltaX,
            deltaY: effectiveDeltaY,
            itemIds: Array.from(dragState.startItemPositions.keys()),
          },
          snapRes.guides
        );
      }
      return;
    }

    // 3. Resizing item
    if (resizeState && resizeState.isResizing) {
      const deltaX = (e.clientX - resizeState.startClientX) / scale;
      const deltaY = (e.clientY - resizeState.startClientY) / scale;
      const { item, handle, startX, startY, startW, startH, aspectRatio } = resizeState;

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      if (handle.includes('e')) {
        newW = Math.max(2, startW + deltaX);
      }
      if (handle.includes('s')) {
        newH = Math.max(2, startH + deltaY);
      }
      if (handle.includes('w')) {
        const proposedW = startW - deltaX;
        if (proposedW >= 2) {
          newW = proposedW;
          newX = startX + deltaX;
        }
      }
      if (handle.includes('n')) {
        const proposedH = startH - deltaY;
        if (proposedH >= 2) {
          newH = proposedH;
          newY = startY + deltaY;
        }
      }

      // If aspect ratio locked, maintain ratio
      if (item.aspectRatioLocked && (handle.length === 2)) {
        if (handle === 'se' || handle === 'nw') {
          // Adjust based on largest change
          newH = newW / aspectRatio;
          if (handle === 'nw') {
            newY = startY + (startH - newH);
          }
        } else if (handle === 'ne' || handle === 'sw') {
          newH = newW / aspectRatio;
          if (handle === 'ne') {
            newY = startY + (startH - newH);
          }
        }
      }

      onUpdateItem(
        item.id,
        {
              x: newX,
              y: newY,
              width: Math.max(1, newW),
              height: Math.max(1, newH),
        },
        false
      );
      return;
    }

    // 4. Marquee Selection
    if (isMarqueeActiveRef.current && marqueeBox) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const curScreenX = e.clientX - rect.left - rulerThickness;
      const curScreenY = e.clientY - rect.top - rulerThickness;

      setMarqueeBox((prev) => (prev ? { ...prev, x2: curScreenX, y2: curScreenY } : null));

      // Calculate intersection with items
      const boxLeft = Math.min(marqueeBox.x1, curScreenX);
      const boxTop = Math.min(marqueeBox.y1, curScreenY);
      const boxRight = Math.max(marqueeBox.x1, curScreenX);
      const boxBottom = Math.max(marqueeBox.y1, curScreenY);

      const boxMmX1 = (boxLeft - transform.panX) / scale;
      const boxMmY1 = (boxTop - transform.panY) / scale;
      const boxMmX2 = (boxRight - transform.panX) / scale;
      const boxMmY2 = (boxBottom - transform.panY) / scale;

      const intersected = items.filter((item) => {
        const b = getItemBounds(item, 'outer');
        return !(
          b.right < boxMmX1 ||
          b.x > boxMmX2 ||
          b.bottom < boxMmY1 ||
          b.y > boxMmY2
        );
      });

      onSelectItems(intersected.map((i) => i.id));
    }
  };

  // Mouse Down handler on background workspace
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if middle click or space bar or pan tool
    if (e.button === 1 || isSpacePressed || toolMode === 'pan') {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: transform.panX,
        panY: transform.panY,
      };
      return;
    }

    // Left click on empty workspace
    if (e.button === 0) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const startScreenX = e.clientX - rect.left - rulerThickness;
      const startScreenY = e.clientY - rect.top - rulerThickness;

      isMarqueeActiveRef.current = true;
      setMarqueeBox({
        x1: startScreenX,
        y1: startScreenY,
        x2: startScreenX,
        y2: startScreenY,
      });

      if (!e.shiftKey) {
        onSelectItems([]);
      }
    }
  };

  // Global mouse up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (dragState) {
      const preview = dragPreviewRef.current;
      if (preview && (preview.deltaX !== 0 || preview.deltaY !== 0)) {
        const updates = preview.itemIds.map((id) => {
          const initial = dragState.startItemPositions.get(id);
          return {
            id,
            changes: {
              x: (initial ? initial.x : 0) + preview.deltaX,
              y: (initial ? initial.y : 0) + preview.deltaY,
            },
          };
        });
        onUpdateItems(updates, true);
      }

      setDragState(null);
      clearDragPreview();
    }

    if (resizeState) {
      setResizeState(null);
      // Trigger a history push
      onUpdateItems([], true);
    }

    if (isMarqueeActiveRef.current) {
      isMarqueeActiveRef.current = false;
      setMarqueeBox(null);
    }
  };

  // Item select & drag
  const handleItemSelect = useCallback((e: React.MouseEvent, item: ArtItem) => {
    let targetIds: string[];

    if (item.groupId) {
      const groupMemberIds = items.filter((i) => i.groupId === item.groupId).map((i) => i.id);
      if (e.shiftKey) {
        const isAnySelected = groupMemberIds.some((id) => selectedIds.includes(id));
        targetIds = isAnySelected
          ? selectedIds.filter((id) => !groupMemberIds.includes(id))
          : [...selectedIds, ...groupMemberIds];
      } else {
        targetIds = groupMemberIds;
      }
    } else {
      if (e.shiftKey) {
        targetIds = selectedIds.includes(item.id)
          ? selectedIds.filter((id) => id !== item.id)
          : [...selectedIds, item.id];
      } else {
        // If clicking an item already part of a multi-selection, preserve the selection so they drag together
        targetIds = selectedIds.includes(item.id) ? selectedIds : [item.id];
      }
    }

    onSelectItems(targetIds);
  }, [items, onSelectItems, selectedIds]);

  const handleStartDrag = useCallback((e: React.MouseEvent, item: ArtItem) => {
    if (e.button !== 0 || isSpacePressed || toolMode === 'pan') return;

    let dragIds: string[];
    if (item.groupId) {
      const groupMemberIds = items.filter((i) => i.groupId === item.groupId).map((i) => i.id);
      dragIds = selectedIds.includes(item.id)
        ? Array.from(new Set([...selectedIds, ...groupMemberIds]))
        : groupMemberIds;
    } else {
      dragIds = selectedIds.includes(item.id) ? selectedIds : [item.id];
    }

    const initialPositions = new Map<string, { x: number; y: number }>();
    dragIds.forEach((id) => {
      const it = items.find((i) => i.id === id);
      if (it && !it.locked) {
        initialPositions.set(id, { x: it.x, y: it.y });
      }
    });

    setDragState({
      isDragging: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startItemPositions: initialPositions,
      primaryItemId: item.id,
    });
  }, [isSpacePressed, items, selectedIds, toolMode]);

  const handleStartResize = useCallback((e: React.MouseEvent, item: ArtItem, handle: string) => {
    if (e.button !== 0 || item.locked) return;
    setResizeState({
      isResizing: true,
      item,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
      aspectRatio: item.width / item.height,
    });
  }, []);

  // Drag and drop external files from operating system
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Drop position in mm
    const dropMm = screenToMm(e.clientX, e.clientY);

    const newArtItems: ArtItem[] = [];
    let offsetX = dropMm.x;
    let offsetY = dropMm.y;

    for (const file of files) {
      try {
        const loadedResults = await loadFile(file);
        for (const res of loadedResults) {
          newArtItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: res.name,
            src: res.src,
            naturalWidth: res.naturalWidth,
            naturalHeight: res.naturalHeight,
            x: offsetX,
            y: offsetY,
            width: res.widthMm,
            height: res.heightMm,
            rotation: 0,
            aspectRatioLocked: true,
            locked: false,
            border: {
              enabled: false,
              width: POINT_IN_MM,
              color: '#000000',
            },
            zIndex: items.length + newArtItems.length + 1,
          });

          // Offset subsequent items slightly so they cascade
          offsetX += 10;
          offsetY += 10;
        }
      } catch (err) {
        console.error('Erro ao importar arquivo:', file.name, err);
      }
    }

    if (newArtItems.length > 0) {
      onAddItems(newArtItems);
      onSelectItems(newArtItems.map((i) => i.id));
    }
  };

  const selectedItemsForOverlay = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-[#18181b] ${
        isPanning || toolMode === 'pan' || isSpacePressed
          ? 'cursor-grab active:cursor-grabbing'
          : toolMode === 'eyedropper'
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setCursorMm(null);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Rulers (Top and Left) */}
      <Rulers
        zoom={transform.zoom}
        panX={transform.panX}
        panY={transform.panY}
        cursorMm={cursorMm}
        width={containerSize.width}
        height={containerSize.height}
        rulerThickness={rulerThickness}
      />

      {/* Main Workspace (Pasteboard + Sheet) */}
      <div
        className="absolute inset-0"
        style={{
          left: rulerThickness,
          top: rulerThickness,
          width: containerSize.width - rulerThickness,
          height: containerSize.height - rulerThickness,
          backgroundImage:
            'radial-gradient(circle, #2d2d35 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Infinite Pan & Zoom Transformation Wrapper */}
        <div
          className="absolute origin-top-left pointer-events-auto"
          style={{
            transform: `translate(${transform.panX}px, ${transform.panY}px)`,
          }}
        >
          {/* Printable Sheet (A4 or A3) */}
          <Sheet
            paper={paper}
            format={paperFormat}
            orientation={paperOrientation}
            zoom={transform.zoom}
            margin={snapping.margin}
            showMargins={snapping.snapToMargins}
          />

          {/* Art Items */}
          {items.map((item) => {
            const isPreviewing = Boolean(dragPreview?.itemIds.includes(item.id));
            return (
              <ArtItemView
                key={item.id}
                item={item}
                isSelected={selectedIds.includes(item.id)}
                zoom={transform.zoom}
                toolMode={toolMode}
                previewOffset={isPreviewing ? dragPreview ?? undefined : undefined}
                onSelect={handleItemSelect}
                onStartDrag={handleStartDrag}
                onStartResize={handleStartResize}
                onSampleColor={onApplyBorderColor}
              />
            );
          })}

          {/* Visual Snap Alignment Guides */}
          <SnapGuides
            guides={snapGuides}
            zoom={transform.zoom}
            viewportWidth={containerSize.width}
            viewportHeight={containerSize.height}
          />

          {/* Selection Box & Collective Bounding Box */}
          <SelectionOverlay
            selectedItems={selectedItemsForOverlay}
            marqueeBox={marqueeBox}
            zoom={transform.zoom}
            dragOffset={dragPreview ?? undefined}
            dragItemIds={dragPreview?.itemIds}
          />
        </div>
      </div>

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-600/30 border-4 border-dashed border-indigo-400 z-50 flex items-center justify-center pointer-events-none backdrop-blur-xs">
          <div className="bg-zinc-900/90 text-white px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 border border-zinc-700">
            <svg
              className="w-10 h-10 text-indigo-400 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <p className="text-lg font-semibold">Solte as imagens aqui</p>
            <p className="text-xs text-zinc-400">PNG, JPG, SVG ou páginas de PDF</p>
          </div>
        </div>
      )}
    </div>
  );
};
