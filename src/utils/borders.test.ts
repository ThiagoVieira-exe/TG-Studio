import { describe, expect, it } from 'vitest';
import { getBorderGeometry, isOutsidePaper } from './borders';
import type { ArtItem } from '../types';

function makeItem(mode: 'outer' | 'outer-inner' = 'outer'): ArtItem {
  return {
    id: 'border-test',
    name: 'Borda',
    src: 'data:image/png;base64,',
    naturalWidth: 100,
    naturalHeight: 100,
    x: 10,
    y: 20,
    width: 50,
    height: 30,
    rotation: 0,
    aspectRatioLocked: false,
    locked: false,
    border: { enabled: true, width: 2.95, color: '#ff0000', mode },
    zIndex: 1,
  };
}

describe('border geometry', () => {
  it('preserves a decimal border exactly', () => {
    const geometry = getBorderGeometry(makeItem());
    expect(geometry.borderWidth).toBe(2.95);
    expect(geometry.outerX).toBe(7.05);
    expect(geometry.outerY).toBe(17.05);
    expect(geometry.outerWidth).toBe(55.9);
    expect(geometry.outerHeight).toBe(35.9);
    expect(geometry.rectangles).toHaveLength(4);
  });

  it('adds the four inner rectangles in external-and-internal mode', () => {
    const geometry = getBorderGeometry(makeItem('outer-inner'));
    expect(geometry.rectangles).toHaveLength(8);
    expect(geometry.rectangles[4]).toMatchObject({ x: 2.95, y: 2.95, width: 50, height: 2.95 });
  });

  it('detects items outside the physical paper', () => {
    const geometry = getBorderGeometry({ ...makeItem(), x: -100 });
    expect(isOutsidePaper(geometry, 210, 297)).toBe(true);
    expect(isOutsidePaper(getBorderGeometry(makeItem()), 210, 297)).toBe(false);
  });

  it('calculates outer bounds accurately for round/circular items', () => {
    const roundItem: ArtItem = {
      ...makeItem(),
      isRound: true,
      shape: 'circle',
      width: 40,
      height: 40,
      border: { enabled: true, width: 2, color: '#0000ff', mode: 'outer' },
    };
    const geometry = getBorderGeometry(roundItem);
    expect(geometry.borderWidth).toBe(2);
    expect(geometry.outerWidth).toBe(44);
    expect(geometry.outerHeight).toBe(44);
  });
});
