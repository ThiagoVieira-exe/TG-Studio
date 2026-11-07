import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  ArtItem,
  PaperDimensions,
  PaperFormat,
  PaperOrientation,
  ProjectData,
  ToolMode,
  ViewportTransform,
  WorkspacePage,
} from './types';
import { PAPER_SIZES } from './types';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import {
  saveProjectToFile,
  loadProjectFromFile,
  saveToLocalStorage,
  loadFromLocalStorage,
  createSampleProject,
} from './utils/storage';
import { loadFile } from './utils/fileLoader';
import { getItemBounds, getCombinedBounds, POINT_IN_MM } from './utils/units';
import { addWorkspacePage, deleteWorkspacePage, switchWorkspacePage, rotateItemsAroundCenter } from './utils/workspace';

// Components
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { CanvasView } from './components/Canvas/CanvasView';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ExportModal } from './components/Modals/ExportModal';
import { GridModal } from './components/Modals/GridModal';
import { HelpModal } from './components/Modals/HelpModal';
import { PrintView } from './components/PrintView';

export function App() {
  // Load initial project from localStorage or create sample
  const [initialProject] = useState<ProjectData>(() => loadFromLocalStorage() || createSampleProject());

  const [projectName, setProjectName] = useState(initialProject.name || 'Projeto Gráfico');
  const {
    pages,
    currentPageId,
    items,
    paperFormat,
    paperOrientation,
    snapping,
    setWorkspace,
    setItems,
    setPaperFormat,
    setPaperOrientation,
    setSnapping,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWorkspaceState(initialProject);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  // Canvas viewport transform
  const [transform, setTransform] = useState<ViewportTransform>({
    zoom: 0.85,
    panX: 180,
    panY: 80,
  });

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Hidden File Inputs
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const clipboardItemsRef = useRef<ArtItem[]>([]);

  // Compute paper physical dimensions taking orientation into account
  const baseDims = PAPER_SIZES[paperFormat];
  const paperDimensions: PaperDimensions = useMemo(
    () => paperOrientation === 'portrait'
      ? { width: baseDims.width, height: baseDims.height }
      : { width: baseDims.height, height: baseDims.width },
    [paperOrientation, baseDims.height, baseDims.width]
  );

  // Auto-save the complete project, including every page.
  useEffect(() => {
    const projectToSave: ProjectData = {
      version: '1.0.0',
      name: projectName,
      paperFormat,
      paperOrientation,
      snapping,
      items,
      pages,
    };
    saveToLocalStorage(projectToSave);
  }, [projectName, paperFormat, paperOrientation, snapping, items, pages, currentPageId]);

  const handleSwitchPage = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page || page.id === currentPageId) return;
    setWorkspace((previous) => switchWorkspacePage(previous, page.id), false);
    setSelectedIds([]);
  };

  const handleAddPage = () => {
    const page: WorkspacePage = {
      id: `page-${Date.now()}`,
      name: `Página ${pages.length + 1}`,
      paperFormat,
      paperOrientation,
      snapping: { ...snapping },
      items: [],
    };
    setWorkspace((previous) => addWorkspacePage(previous, page), true);
    setSelectedIds([]);
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) return;
    const pageToDelete = pages.find((page) => page.id === pageId);
    if (!pageToDelete) return;
    const confirmed = window.confirm(`Deseja excluir a página "${pageToDelete.name}"?`);
    if (!confirmed) return;
    setWorkspace((previous) => deleteWorkspacePage(previous, pageId), true);
    if (pageId === currentPageId) setSelectedIds([]);
  };

  // Handle Paper Format toggle
  const handleUpdateFormat = (format: PaperFormat) => {
    setPaperFormat(format, true);
  };

  const handleUpdateOrientation = (orientation: PaperOrientation) => {
    setPaperOrientation(orientation, true);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.min(6.0, prev.zoom * 1.2),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.max(0.15, prev.zoom / 1.2),
    }));
  };

  const handleZoom100 = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: 1.0,
    }));
  };

  const handleZoomFit = useCallback(() => {
    // Center paper on screen
    const availableW = window.innerWidth - 320 - 48; // minus sidebar and padding
    const availableH = window.innerHeight - 56 - 48 - 48; // minus header, toolbar, padding

    const scaleW = availableW / (paperDimensions.width * 3.78);
    const scaleH = availableH / (paperDimensions.height * 3.78);
    const fitZoom = Math.min(1.5, Math.max(0.2, Math.min(scaleW, scaleH) * 0.9));

    const sheetPxW = paperDimensions.width * 3.78 * fitZoom;
    const sheetPxH = paperDimensions.height * 3.78 * fitZoom;

    const panX = Math.max(40, (availableW - sheetPxW) / 2);
    const panY = Math.max(30, (availableH - sheetPxH) / 2);

    setTransform({
      zoom: fitZoom,
      panX,
      panY,
    });
  }, [paperDimensions.width, paperDimensions.height]);

  // Center fit on first render
  const initialFitDoneRef = useRef(false);
  useEffect(() => {
    if (!initialFitDoneRef.current) {
      initialFitDoneRef.current = true;
      const frameId = requestAnimationFrame(() => {
        handleZoomFit();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [handleZoomFit]);

  // Update item(s)
  const handleUpdateItem = useCallback(
    (id: string, updates: Partial<ArtItem>, recordHistory: boolean = true) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        recordHistory
      );
    },
    [setItems]
  );

  const handleUpdateItems = useCallback(
    (updatesList: { id: string; changes: Partial<ArtItem> }[], recordHistory: boolean = true) => {
      if (updatesList.length === 0 && recordHistory) {
        // Trigger history snapshot without changes
        setItems((prev) => [...prev], true);
        return;
      }

      const updatesMap = new Map<string, Partial<ArtItem>>();
      updatesList.forEach((u) => updatesMap.set(u.id, u.changes));

      setItems(
        (prev) =>
          prev.map((item) => {
            const ch = updatesMap.get(item.id);
            return ch ? { ...item, ...ch } : item;
          }),
        recordHistory
      );
    },
    [setItems]
  );

  // Add items
  const handleAddItems = useCallback(
    (newItems: ArtItem[]) => {
      setItems((prev) => [...prev, ...newItems], true);
      setSelectedIds(newItems.map((i) => i.id));
    },
    [setItems]
  );

  // Duplicate single item
  const handleDuplicateItem = useCallback(
    (item: ArtItem) => {
      const clone: ArtItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${item.name} (cópia)`,
        x: item.x + 5,
        y: item.y + 5,
        zIndex: items.length + 1,
      };
      setItems((prev) => [...prev, clone], true);
      setSelectedIds([clone.id]);
    },
    [items.length, setItems]
  );

  // Duplicate selected items
  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const clones: ArtItem[] = [];

    items.forEach((item) => {
      if (selectedIds.includes(item.id)) {
        clones.push({
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${item.name} (cópia)`,
          x: item.x + 6,
          y: item.y + 6,
          zIndex: items.length + clones.length + 1,
        });
      }
    });

    setItems((prev) => [...prev, ...clones], true);
    setSelectedIds(clones.map((c) => c.id));
  }, [items, selectedIds, setItems]);

  const handleCopySelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    clipboardItemsRef.current = items.filter((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const handlePasteItems = useCallback(() => {
    if (clipboardItemsRef.current.length === 0) return;

    const groupMap = new Map<string, string>();
    const pastedItems = clipboardItemsRef.current.map((item, index) => {
      let groupId = item.groupId;
      if (groupId) {
        if (!groupMap.has(groupId)) groupMap.set(groupId, `group-${Date.now()}-${groupMap.size}`);
        groupId = groupMap.get(groupId);
      }

      return {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: `${item.name} (cópia)`,
        x: item.x + 6,
        y: item.y + 6,
        zIndex: items.length + index + 1,
        groupId,
      };
    });

    setItems((prev) => [...prev, ...pastedItems], true);
    setSelectedIds(pastedItems.map((item) => item.id));
  }, [items.length, setItems]);

  // Delete item
  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id), true);
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    },
    [setItems]
  );

  // Delete all selected items
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)), true);
    setSelectedIds([]);
  }, [selectedIds, setItems]);

  // Toggle lock on selected
  const handleToggleLockSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const shouldLock = items.some((i) => selectedIds.includes(i.id) && !i.locked);
    setItems(
      (prev) =>
        prev.map((i) => (selectedIds.includes(i.id) ? { ...i, locked: shouldLock } : i)),
      true
    );
  }, [items, selectedIds, setItems]);

  // Clear sheet
  const handleClearSheet = useCallback(() => {
    setItems([], true);
    setSelectedIds([]);
  }, [setItems]);

  // Eyedropper sample color application
  const handleApplyBorderColor = useCallback(
    (color: string) => {
      if (selectedIds.length === 0) return;
      setItems(
        (prev) =>
          prev.map((item) =>
            selectedIds.includes(item.id)
              ? {
                  ...item,
                  border: {
                    ...item.border,
                    enabled: true,
                    color,
                    width: item.border.width === 0 ? POINT_IN_MM : item.border.width,
                  },
                }
              : item
          ),
        true
      );
      setToolMode('select');
    },
    [selectedIds, setItems]
  );

  // Z-Order manipulations
  const handleBringForward = (id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy.map((it, i) => ({ ...it, zIndex: i + 1 }));
    }, true);
  };

  const handleSendBackward = (id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy.map((it, i) => ({ ...it, zIndex: i + 1 }));
    }, true);
  };

  const handleBringToFront = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      const others = prev.filter((i) => i.id !== id);
      return [...others, item].map((it, i) => ({ ...it, zIndex: i + 1 }));
    }, true);
  };

  const handleSendToBack = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      const others = prev.filter((i) => i.id !== id);
      return [item, ...others].map((it, i) => ({ ...it, zIndex: i + 1 }));
    }, true);
  };

  // Alignment Tools for multiple selection
  const handleAlign = useCallback(
    (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
      if (selectedIds.length < 2) return;
      const selected = items.filter((i) => selectedIds.includes(i.id));

      let minLeft = Infinity;
      let maxRight = -Infinity;
      let minTop = Infinity;
      let maxBottom = -Infinity;

      selected.forEach((i) => {
        const b = getItemBounds(i, snapping.reference);
        if (b.x < minLeft) minLeft = b.x;
        if (b.right > maxRight) maxRight = b.right;
        if (b.y < minTop) minTop = b.y;
        if (b.bottom > maxBottom) maxBottom = b.bottom;
      });

      const centerX = (minLeft + maxRight) / 2;
      const centerY = (minTop + maxBottom) / 2;

      setItems(
        (prev) =>
          prev.map((item) => {
            if (!selectedIds.includes(item.id) || item.locked) return item;
            const b = getItemBounds(item, snapping.reference);
            const bWidth = snapping.reference === 'outer' && item.border.enabled ? item.border.width : 0;

            let targetX = item.x;
            let targetY = item.y;

            if (alignment === 'left') targetX = minLeft + bWidth;
            if (alignment === 'right') targetX = maxRight - b.width + bWidth;
            if (alignment === 'center-h') targetX = centerX - b.width / 2 + bWidth;

            if (alignment === 'top') targetY = minTop + bWidth;
            if (alignment === 'bottom') targetY = maxBottom - b.height + bWidth;
            if (alignment === 'center-v') targetY = centerY - b.height / 2 + bWidth;

            return {
              ...item,
              x: targetX,
              y: targetY,
            };
          }),
        true
      );
    },
    [items, selectedIds, snapping.reference, setItems]
  );

  // Distribute items with equal gap
  const handleDistribute = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      if (selectedIds.length < 3) return;
      const selected = items.filter((i) => selectedIds.includes(i.id));

      if (axis === 'horizontal') {
        // Sort items left to right
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const first = getItemBounds(sorted[0], snapping.reference);
        const last = getItemBounds(sorted[sorted.length - 1], snapping.reference);

        const totalWidthItems = sorted.reduce((sum, item) => {
          return sum + getItemBounds(item, snapping.reference).width;
        }, 0);

        const availableSpan = last.right - first.x;
        const totalGap = availableSpan - totalWidthItems;
        const gap = totalGap / (sorted.length - 1);

        let curX = first.x;
        const newPositions = new Map<string, number>();

        sorted.forEach((item) => {
          const b = getItemBounds(item, snapping.reference);
          const bWidth = snapping.reference === 'outer' && item.border.enabled ? item.border.width : 0;
          newPositions.set(item.id, curX + bWidth);
          curX += b.width + gap;
        });

        setItems(
          (prev) =>
            prev.map((i) => {
              const nx = newPositions.get(i.id);
              return nx !== undefined ? { ...i, x: nx } : i;
            }),
          true
        );
      } else {
        // Sort items top to bottom
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const first = getItemBounds(sorted[0], snapping.reference);
        const last = getItemBounds(sorted[sorted.length - 1], snapping.reference);

        const totalHeightItems = sorted.reduce((sum, item) => {
          return sum + getItemBounds(item, snapping.reference).height;
        }, 0);

        const availableSpan = last.bottom - first.y;
        const totalGap = availableSpan - totalHeightItems;
        const gap = totalGap / (sorted.length - 1);

        let curY = first.y;
        const newPositions = new Map<string, number>();

        sorted.forEach((item) => {
          const b = getItemBounds(item, snapping.reference);
          const bWidth = snapping.reference === 'outer' && item.border.enabled ? item.border.width : 0;
          newPositions.set(item.id, curY + bWidth);
          curY += b.height + gap;
        });

        setItems(
          (prev) =>
            prev.map((i) => {
              const ny = newPositions.get(i.id);
              return ny !== undefined ? { ...i, y: ny } : i;
            }),
          true
        );
      }
    },
    [items, selectedIds, snapping.reference, setItems]
  );

  // Batch update
  const handleBatchUpdate = useCallback(
    (updates: Partial<ArtItem>) => {
      setItems(
        (prev) =>
          prev.map((i) => (selectedIds.includes(i.id) ? { ...i, ...updates } : i)),
        true
      );
    },
    [selectedIds, setItems]
  );

  // Group selected items
  const handleGroupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const newGroupId = `group-${Date.now()}`;
    setItems(
      (prev) =>
        prev.map((i) => (selectedIds.includes(i.id) ? { ...i, groupId: newGroupId } : i)),
      true
    );
  }, [selectedIds, setItems]);

  // Ungroup selected items
  const handleUngroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const groupIdsToDissolve = new Set(
      items.filter((i) => selectedIds.includes(i.id) && i.groupId).map((i) => i.groupId)
    );
    if (groupIdsToDissolve.size === 0) return;

    setItems(
      (prev) =>
        prev.map((i) =>
          i.groupId && groupIdsToDissolve.has(i.groupId)
            ? { ...i, groupId: undefined }
            : i
        ),
      true
    );
  }, [items, selectedIds, setItems]);

  // Center selected items (or all items) on the sheet
  const handleCenterSelectedOnSheet = useCallback(
    (axis: 'both' | 'horizontal' | 'vertical' = 'both') => {
      const targetItems =
        selectedIds.length > 0 ? items.filter((i) => selectedIds.includes(i.id)) : items;

      if (targetItems.length === 0) return;

      const bounds = getCombinedBounds(targetItems, snapping.reference);
      if (!bounds) return;

      const sheetCenterX = paperDimensions.width / 2;
      const sheetCenterY = paperDimensions.height / 2;

      const deltaX = axis === 'vertical' ? 0 : sheetCenterX - bounds.centerX;
      const deltaY = axis === 'horizontal' ? 0 : sheetCenterY - bounds.centerY;

      // Shift ALL target items by the exact same delta to preserve the formation
      const updates = targetItems.map((item) => ({
        id: item.id,
        changes: {
          x: item.x + deltaX,
          y: item.y + deltaY,
        },
      }));

      handleUpdateItems(updates, true);
    },
    [items, selectedIds, paperDimensions, snapping.reference, handleUpdateItems]
  );

  // Rotate selected items around their collective center, preserving relative positions
  const handleRotateSelection = useCallback(
    (deltaDegrees: number) => {
      if (selectedIds.length === 0) return;

      const selectedSet = new Set(selectedIds);
      const groupIds = new Set<string>();

      items.forEach((item) => {
        if (selectedSet.has(item.id) && item.groupId) {
          groupIds.add(item.groupId);
        }
      });

      const itemsToRotate = items.filter(
        (item) => selectedSet.has(item.id) || (item.groupId && groupIds.has(item.groupId))
      );

      const rotatedItems = rotateItemsAroundCenter(itemsToRotate, deltaDegrees);
      const rotatedMap = new Map(rotatedItems.map((item) => [item.id, item]));

      setItems(
        (prev) => prev.map((item) => rotatedMap.get(item.id) || item),
        true
      );
    },
    [items, selectedIds, setItems]
  );

  // Apply Grid duplication (repositions original item in cell 0,0 and adds clones)
  const handleApplyGrid = useCallback(
    (
      updatedTarget: { id: string; x: number; y: number; rotation?: number; groupId?: string },
      newClones: ArtItem[]
    ) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === updatedTarget.id
            ? {
                ...item,
                x: updatedTarget.x,
                y: updatedTarget.y,
                rotation: updatedTarget.rotation !== undefined ? updatedTarget.rotation : item.rotation,
                groupId: updatedTarget.groupId ?? item.groupId,
              }
            : item
        );
        return [...updated, ...newClones];
      }, true);

      // Select all grid items so user can immediately move or center the whole matrix
      const allGridIds = [updatedTarget.id, ...newClones.map((c) => c.id)];
      setSelectedIds(allGridIds);
    },
    [setItems]
  );

  // File Upload Handlers
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPages: WorkspacePage[] = [];

    for (const file of files) {
      try {
        const loadedResults = await loadFile(file);
        for (const res of loadedResults) {
          const newItem: ArtItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: res.name,
            src: res.src,
            naturalWidth: res.naturalWidth,
            naturalHeight: res.naturalHeight,
            x: 15,
            y: 15,
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
            zIndex: 1,
          };

          newPages.push({
            id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: res.name || `Página ${pages.length + newPages.length + 1}`,
            paperFormat,
            paperOrientation,
            snapping: { ...snapping },
            items: [newItem],
          });
        }
      } catch (err) {
        console.error('Falha ao carregar arquivo:', err);
      }
    }

    if (newPages.length > 0) {
      const lastPage = newPages[newPages.length - 1];
      setWorkspace(
        (previous) => ({
          pages: [...previous.pages, ...newPages],
          currentPageId: lastPage.id,
        }),
        true
      );
      setSelectedIds(lastPage.items.map((item) => item.id));
    }

    e.target.value = '';
  };

  // Save / Load Project
  const handleSaveProject = () => {
    const project: ProjectData = {
      version: '1.0.0',
      name: projectName,
      paperFormat,
      paperOrientation,
      snapping,
      items,
      pages,
    };
    saveProjectToFile(project, `${projectName}.tgstudio`);
  };

  const handleOpenProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await loadProjectFromFile(file);
      setProjectName(data.name || 'Projeto Carregado');
      const loadedPages: WorkspacePage[] = data.pages?.length
        ? data.pages
        : [{
            id: 'page-1',
            name: 'Página 1',
            paperFormat: data.paperFormat || 'A4',
            paperOrientation: data.paperOrientation || 'portrait',
            snapping: data.snapping || snapping,
            items: data.items || [],
          }];
      setWorkspace(
        {
          pages: loadedPages,
          currentPageId: loadedPages[0].id,
        },
        true
      );
      setSelectedIds([]);
    } catch {
      alert('Erro ao carregar projeto TG Studio. Arquivo inválido ou corrompido.');
    }

    e.target.value = '';
  };

  // Print Direct: native system dialog in Electron, browser dialog on the web.
  const handlePrintDirect = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.print(paperDimensions);
      if (!result.success && result.failureReason !== 'Print job canceled') {
        console.error('Falha na impressão:', result.failureReason);
      }
      return;
    }

    window.print();
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Select all: Ctrl+A
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        setSelectedIds(items.map((item) => item.id));
        return;
      }

      // Copy / paste: Ctrl+C / Ctrl+V
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyC') {
        e.preventDefault();
        handleCopySelected();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyV') {
        e.preventDefault();
        handlePasteItems();
        return;
      }

      // Duplicate: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Delete: Delete or Backspace
      if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Smart Snapping toggle: Key S
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSnapping((prev) => ({ ...prev, enabled: !prev.enabled }));
        return;
      }

      // Group: Ctrl+G
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyG') {
        e.preventDefault();
        handleGroupSelected();
        return;
      }

      // Ungroup: Ctrl+Shift+G
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyG') {
        e.preventDefault();
        handleUngroupSelected();
        return;
      }

      // Rotate Selection / Group: Alt+R or Ctrl+Shift+R
      if ((e.altKey && e.code === 'KeyR') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyR')) {
        e.preventDefault();
        handleRotateSelection(90);
        return;
      }

      // Tools: Key V (Select), Key H (Pan)
      if (e.code === 'KeyV') {
        setToolMode('select');
      } else if (e.code === 'KeyH') {
        setToolMode('pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    handleDuplicateSelected,
    handleCopySelected,
    handlePasteItems,
    handleDeleteSelected,
    handleGroupSelected,
    handleUngroupSelected,
    handleRotateSelection,
    setSnapping,
    items,
  ]);

  const targetItemForGrid =
    selectedIds.length >= 1 ? items.find((i) => i.id === selectedIds[0]) || null : null;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 select-none">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.svg,.pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".tgstudio,.json"
        className="hidden"
        onChange={handleOpenProjectFile}
      />

      {/* Top Header */}
      <Header
        pages={pages}
        currentPageId={currentPageId}
        onSwitchPage={handleSwitchPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onSaveProject={handleSaveProject}
        onOpenProjectClick={() => projectInputRef.current?.click()}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onPrintDirect={handlePrintDirect}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
      />

      {/* Main Tool Bar */}
      <Toolbar
        toolMode={toolMode}
        onSetToolMode={setToolMode}
        onImportClick={() => imageInputRef.current?.click()}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={transform.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onZoom100={handleZoom100}
        snappingEnabled={snapping.enabled}
        onToggleSnapping={() => setSnapping((p) => ({ ...p, enabled: !p.enabled }))}
        selectedCount={selectedIds.length}
        hasSelectedLocked={items.some((i) => selectedIds.includes(i.id) && i.locked)}
        canGroup={selectedIds.length >= 2}
        canUngroup={items.some((i) => selectedIds.includes(i.id) && i.groupId)}
        onGroup={handleGroupSelected}
        onUngroup={handleUngroupSelected}
        onCenterOnSheet={handleCenterSelectedOnSheet}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={handleDeleteSelected}
        onToggleLockSelected={handleToggleLockSelected}
        onAlignSelected={handleAlign}
        onOpenGridModal={() => setIsGridModalOpen(true)}
        onRotateSelection={handleRotateSelection}
      />

      {/* Workspace Area: Canvas + Sidebar */}
      <div className="flex flex-1 w-full h-[calc(100vh-104px)] overflow-hidden">
        {/* Main Interactive Canvas */}
        <div className="flex-1 h-full relative">
          <CanvasView
            paper={paperDimensions}
            paperFormat={paperFormat}
            paperOrientation={paperOrientation}
            items={items}
            selectedIds={selectedIds}
            toolMode={toolMode}
            snapping={snapping}
            transform={transform}
            onUpdateTransform={(t) =>
              setTransform((prev) => (typeof t === 'function' ? t(prev) : { ...prev, ...t }))
            }
            onSelectItems={setSelectedIds}
            onUpdateItem={handleUpdateItem}
            onUpdateItems={handleUpdateItems}
            onAddItems={handleAddItems}
            onApplyBorderColor={handleApplyBorderColor}
          />
        </div>

        {/* Right Properties & Settings Sidebar */}
        <Sidebar
          paper={paperDimensions}
          paperFormat={paperFormat}
          paperOrientation={paperOrientation}
          snapping={snapping}
          items={items}
          selectedIds={selectedIds}
          toolMode={toolMode}
          canGroup={selectedIds.length >= 2}
          canUngroup={items.some((i) => selectedIds.includes(i.id) && i.groupId)}
          onGroup={handleGroupSelected}
          onUngroup={handleUngroupSelected}
          onCenterOnSheet={handleCenterSelectedOnSheet}
          onRotateSelection={handleRotateSelection}
          onUpdateFormat={handleUpdateFormat}
          onUpdateOrientation={handleUpdateOrientation}
          onUpdateSnapping={(s) => setSnapping((prev) => ({ ...prev, ...s }))}
          onClearSheet={handleClearSheet}
          onUpdateItem={handleUpdateItem}
          onDuplicateItem={handleDuplicateItem}
          onDeleteItem={handleDeleteItem}
          onDeleteSelected={handleDeleteSelected}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onSetToolMode={setToolMode}
          onOpenGridModal={() => setIsGridModalOpen(true)}
          onSelectLayersItem={(id, multi) => {
            if (multi) {
              setSelectedIds((prev) =>
                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
              );
            } else {
              setSelectedIds([id]);
            }
          }}
          onToggleLock={(id) => {
            const it = items.find((i) => i.id === id);
            if (it) handleUpdateItem(id, { locked: !it.locked });
          }}
          onAlign={handleAlign}
          onDistribute={handleDistribute}
          onBatchUpdate={handleBatchUpdate}
        />
      </div>

      {/* Hidden Physical 1:1 Print Container for window.print() */}
      <PrintView
        paper={paperDimensions}
        items={items}
      />

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projectName={projectName}
        paperFormat={paperFormat}
        paperOrientation={paperOrientation}
        dimensions={paperDimensions}
        items={items}
      />

      <GridModal
        isOpen={isGridModalOpen}
        onClose={() => setIsGridModalOpen(false)}
        targetItem={targetItemForGrid}
        paper={paperDimensions}
        margin={snapping.margin}
        onApplyGrid={handleApplyGrid}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}

export default App;
