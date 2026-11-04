import { useCallback } from 'react';
import type {
  ArtItem,
  PaperFormat,
  PaperOrientation,
  ProjectData,
  SnappingSettings,
  WorkspacePage,
  WorkspaceState,
} from '../types';
import { useHistory } from './useHistory';

const DEFAULT_SNAPPING: SnappingSettings = {
  enabled: true,
  spacing: 2,
  reference: 'outer',
  snapToSheet: true,
  snapToMargins: true,
  margin: 5,
};

export function useWorkspaceState(initialProject: ProjectData) {
  const defaultPage: WorkspacePage = {
    id: 'page-1',
    name: 'Página 1',
    paperFormat: initialProject.paperFormat || 'A4',
    paperOrientation: initialProject.paperOrientation || 'portrait',
    snapping: initialProject.snapping || DEFAULT_SNAPPING,
    items: initialProject.items || [],
  };

  const initialPages = initialProject.pages?.length ? initialProject.pages : [defaultPage];
  const initialWorkspace: WorkspaceState = {
    pages: initialPages,
    currentPageId: initialPages[0].id,
  };

  const {
    state: workspace,
    set: setWorkspace,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<WorkspaceState>(initialWorkspace);

  const pages = workspace.pages;
  const currentPageId = workspace.currentPageId;
  const currentPage = pages.find((page) => page.id === currentPageId) || pages[0];
  const items = currentPage.items;
  const paperFormat = currentPage.paperFormat;
  const paperOrientation = currentPage.paperOrientation;
  const snapping = currentPage.snapping;

  const updateCurrentPage = useCallback(
    (updater: (page: WorkspacePage) => WorkspacePage, recordHistory = true) => {
      setWorkspace(
        (previous) => ({
          ...previous,
          pages: previous.pages.map((page) =>
            page.id === previous.currentPageId ? updater(page) : page
          ),
        }),
        recordHistory
      );
    },
    [setWorkspace]
  );

  const setItems = useCallback(
    (action: ArtItem[] | ((previous: ArtItem[]) => ArtItem[]), recordHistory = true) => {
      updateCurrentPage(
        (page) => ({
          ...page,
          items: typeof action === 'function' ? action(page.items) : action,
        }),
        recordHistory
      );
    },
    [updateCurrentPage]
  );

  const setPaperFormat = useCallback(
    (value: PaperFormat | ((previous: PaperFormat) => PaperFormat), recordHistory = true) => {
      updateCurrentPage(
        (page) => ({
          ...page,
          paperFormat: typeof value === 'function' ? value(page.paperFormat) : value,
        }),
        recordHistory
      );
    },
    [updateCurrentPage]
  );

  const setPaperOrientation = useCallback(
    (
      value: PaperOrientation | ((previous: PaperOrientation) => PaperOrientation),
      recordHistory = true,
    ) => {
      updateCurrentPage(
        (page) => ({
          ...page,
          paperOrientation: typeof value === 'function' ? value(page.paperOrientation) : value,
        }),
        recordHistory
      );
    },
    [updateCurrentPage]
  );

  const setSnapping = useCallback(
    (
      value: SnappingSettings | ((previous: SnappingSettings) => SnappingSettings),
      recordHistory = true,
    ) => {
      updateCurrentPage(
        (page) => ({
          ...page,
          snapping: typeof value === 'function' ? value(page.snapping) : value,
        }),
        recordHistory
      );
    },
    [updateCurrentPage]
  );

  const setCurrentPageId = useCallback(
    (pageId: string, recordHistory = false) => {
      setWorkspace((previous) => ({ ...previous, currentPageId: pageId }), recordHistory);
    },
    [setWorkspace]
  );

  return {
    pages,
    currentPageId,
    currentPage,
    items,
    paperFormat,
    paperOrientation,
    snapping,
    setWorkspace,
    setCurrentPageId,
    setItems,
    setPaperFormat,
    setPaperOrientation,
    setSnapping,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
