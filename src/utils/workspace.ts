import type { WorkspacePage, WorkspaceState } from '../types';

export function switchWorkspacePage(state: WorkspaceState, pageId: string): WorkspaceState {
  return state.pages.some((page) => page.id === pageId)
    ? { ...state, currentPageId: pageId }
    : state;
}

export function addWorkspacePage(state: WorkspaceState, page: WorkspacePage): WorkspaceState {
  return {
    pages: [...state.pages, page],
    currentPageId: page.id,
  };
}

export function deleteWorkspacePage(state: WorkspaceState, pageId: string): WorkspaceState {
  if (state.pages.length <= 1 || !state.pages.some((page) => page.id === pageId)) return state;

  const pages = state.pages.filter((page) => page.id !== pageId);
  const currentPageId = state.currentPageId === pageId
    ? pages[0].id
    : state.currentPageId;

  return { pages, currentPageId };
}
