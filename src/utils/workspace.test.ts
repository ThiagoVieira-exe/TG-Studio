import { describe, expect, it } from 'vitest';
import { addWorkspacePage, deleteWorkspacePage, switchWorkspacePage, rotateItemsAroundCenter } from './workspace';
import type { WorkspacePage, WorkspaceState } from '../types';

const page = (id: string): WorkspacePage => ({
  id,
  name: id,
  paperFormat: 'A4',
  paperOrientation: 'portrait',
  snapping: {
    enabled: true,
    spacing: 2,
    reference: 'outer',
    snapToSheet: true,
    snapToMargins: true,
    margin: 5,
  },
  items: [],
});

describe('workspace page management', () => {
  it('switches only to an existing page', () => {
    const state: WorkspaceState = { pages: [page('a'), page('b')], currentPageId: 'a' };
    expect(switchWorkspacePage(state, 'b').currentPageId).toBe('b');
    expect(switchWorkspacePage(state, 'missing')).toBe(state);
  });

  it('adds a page and activates it', () => {
    const state: WorkspaceState = { pages: [page('a')], currentPageId: 'a' };
    const next = addWorkspacePage(state, page('b'));
    expect(next.pages.map((item) => item.id)).toEqual(['a', 'b']);
    expect(next.currentPageId).toBe('b');
  });

  it('deletes the active page and selects the remaining page', () => {
    const state: WorkspaceState = { pages: [page('a'), page('b')], currentPageId: 'b' };
    const next = deleteWorkspacePage(state, 'b');
    expect(next.pages.map((item) => item.id)).toEqual(['a']);
    expect(next.currentPageId).toBe('a');
  });

  it('rotates multiple items around collective center while preserving relative positions', () => {
    const item1 = {
      id: '1',
      name: 'Item 1',
      src: '',
      naturalWidth: 100,
      naturalHeight: 100,
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      rotation: 0,
      aspectRatioLocked: true,
      locked: false,
      border: { enabled: false, width: 0, color: '#000' },
      zIndex: 1,
    };
    const item2 = {
      ...item1,
      id: '2',
      name: 'Item 2',
      x: 50,
      y: 10,
    };

    // Centers: item1=(20, 20), item2=(60, 20). Collective center: (40, 20)
    const rotated = rotateItemsAroundCenter([item1, item2], 90);
    expect(rotated).toHaveLength(2);
    // After 90 deg clockwise:
    // item1 center moves to (40, 0) -> x = 40 - 10 = 30, y = 0 - 10 = -10
    // item2 center moves to (40, 40) -> x = 40 - 10 = 30, y = 40 - 10 = 30
    expect(rotated[0].rotation).toBe(90);
    expect(rotated[1].rotation).toBe(90);
    expect(rotated[0].x).toBe(30);
    expect(rotated[0].y).toBe(-10);
    expect(rotated[1].x).toBe(30);
    expect(rotated[1].y).toBe(30);
  });
});
