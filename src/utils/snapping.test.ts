import { describe, expect, it } from 'vitest';
import { computeSnapping } from './snapping';
import type { ArtItem, SnappingSettings } from '../types';

const createItem = (id: string, x: number, y: number, width = 50, height = 50, borderWidth = 0): ArtItem => ({
  id,
  name: `Item ${id}`,
  src: 'test.png',
  naturalWidth: 100,
  naturalHeight: 100,
  x,
  y,
  width,
  height,
  rotation: 0,
  aspectRatioLocked: true,
  locked: false,
  border: { enabled: borderWidth > 0, width: borderWidth, color: '#000000' },
  zIndex: 1,
});

const defaultSettings: SnappingSettings = {
  enabled: true,
  spacing: 0,
  reference: 'outer',
  snapToSheet: false,
  snapToMargins: false,
  margin: 0,
};

describe('computeSnapping (art-to-art alignment)', () => {
  it('snaps left edge to other item left edge (column alignment)', () => {
    const fixed = createItem('fixed', 100, 100, 50, 50);
    const dragged = createItem('dragged', 100.5, 180, 50, 50); // within threshold of 100

    const result = computeSnapping(dragged, dragged.x, dragged.y, [fixed], undefined, defaultSettings);
    expect(result.x).toBe(100);
    expect(result.guides.some((g) => g.type === 'vertical' && g.position === 100)).toBe(true);
  });

  it('snaps top edge to other item top edge (row alignment)', () => {
    const fixed = createItem('fixed', 50, 80, 60, 60);
    const dragged = createItem('dragged', 150, 80.4, 60, 60);

    const result = computeSnapping(dragged, dragged.x, dragged.y, [fixed], undefined, defaultSettings);
    expect(result.y).toBe(80);
    expect(result.guides.some((g) => g.type === 'horizontal' && g.position === 80)).toBe(true);
  });

  it('snaps side-by-side taking border into account', () => {
    // Fixed item has 2mm border: outer bounds = x: 48, y: 48, right: 102, bottom: 102
    const fixed = createItem('fixed', 50, 50, 50, 50, 2);
    // Dragged item has 1mm border, candidate outer left near fixed outer right (102)
    // candidate x = 103 (with 1mm border, outerX = 102)
    const dragged = createItem('dragged', 103.2, 50, 40, 40, 1);

    const result = computeSnapping(dragged, dragged.x, dragged.y, [fixed], undefined, defaultSettings);
    // OuterX snaps to 102, so content x snaps to 102 + 1 = 103
    expect(result.x).toBe(103);
  });

  it('does not snap when settings.enabled is false', () => {
    const fixed = createItem('fixed', 100, 100, 50, 50);
    const dragged = createItem('dragged', 100.5, 180, 50, 50);

    const result = computeSnapping(dragged, dragged.x, dragged.y, [fixed], undefined, {
      ...defaultSettings,
      enabled: false,
    });
    expect(result.x).toBe(100.5);
    expect(result.guides).toHaveLength(0);
  });
});
