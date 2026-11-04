import { describe, expect, it } from 'vitest';
import { addWorkspacePage, deleteWorkspacePage, switchWorkspacePage } from './workspace';
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
});
