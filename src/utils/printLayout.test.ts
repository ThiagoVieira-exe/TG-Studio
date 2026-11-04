import { describe, expect, it } from 'vitest';
import { getPrintableItemLayouts } from './printLayout';
import type { ArtItem } from '../types';

function makeItem(id: string, zIndex: number, x: number): ArtItem {
  return {
    id,
    name: id,
    src: 'data:image/png;base64,',
    naturalWidth: 100,
    naturalHeight: 100,
    x,
    y: 10,
    width: 40,
    height: 40,
    rotation: 0,
    aspectRatioLocked: false,
    locked: false,
    border: { enabled: true, width: 1.5, color: '#000000' },
    zIndex,
  };
}

describe('print layout', () => {
  it('sorts items by z-index and keeps physical millimeter coordinates', () => {
    const layouts = getPrintableItemLayouts(
      [makeItem('back', 2, 50), makeItem('front', 1, 10)],
      { width: 210, height: 297 },
    );

    expect(layouts.map((layout) => layout.item.id)).toEqual(['front', 'back']);
    expect(layouts[0]).toMatchObject({
      borderWidth: 1.5,
      outerX: 8.5,
      outerY: 8.5,
      outerWidth: 43,
      outerHeight: 43,
    });
  });

  it('omits objects that do not touch the paper', () => {
    expect(getPrintableItemLayouts([makeItem('outside', 1, -100)], { width: 210, height: 297 })).toEqual([]);
  });
});
