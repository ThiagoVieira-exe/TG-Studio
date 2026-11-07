import type { ArtItem, WorkspacePage, WorkspaceState } from '../types';
import { roundToPrecision } from './units';

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

/**
 * Rotates a selection/group of items around their collective center,
 * preserving their relative distances, formations, and orientations.
 */
export function rotateItemsAroundCenter(
  items: ArtItem[],
  deltaDegrees: number
): ArtItem[] {
  if (items.length === 0) return items;
  if (items.length === 1) {
    const item = items[0];
    const newRot = Math.round(((item.rotation || 0) + deltaDegrees) % 360 + 360) % 360;
    return [{ ...item, rotation: newRot }];
  }

  // Calculate collective bounding box center
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of items) {
    const bWidth = item.border.enabled && item.border.width > 0 ? item.border.width : 0;
    const left = item.x - bWidth;
    const top = item.y - bWidth;
    const right = item.x + item.width + bWidth;
    const bottom = item.y + item.height + bWidth;

    if (left < minX) minX = left;
    if (top < minY) minY = top;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const rad = (deltaDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return items.map((item) => {
    // Current item content center
    const itemCenterX = item.x + item.width / 2;
    const itemCenterY = item.y + item.height / 2;

    // Vector from collective center to item center
    const dx = itemCenterX - cx;
    const dy = itemCenterY - cy;

    // Rotated vector
    const newDx = dx * cos - dy * sin;
    const newDy = dx * sin + dy * cos;

    // New item center
    const newItemCenterX = cx + newDx;
    const newItemCenterY = cy + newDy;

    // New item top-left content coordinate
    const newX = roundToPrecision(newItemCenterX - item.width / 2, 2);
    const newY = roundToPrecision(newItemCenterY - item.height / 2, 2);
    const newRotation = Math.round(((item.rotation || 0) + deltaDegrees) % 360 + 360) % 360;

    return {
      ...item,
      x: newX,
      y: newY,
      rotation: newRotation,
    };
  });
}
