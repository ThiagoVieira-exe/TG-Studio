import { describe, expect, it } from 'vitest';
import { POINT_IN_MM, formatMeasure, getItemBounds, mmToPx, pxToMm } from './units';
import type { ArtItem } from '../types';

const item: ArtItem = {
  id: 'test',
  name: 'Teste',
  src: 'data:image/png;base64,',
  naturalWidth: 100,
  naturalHeight: 100,
  x: 10,
  y: 20,
  width: 55.39,
  height: 90.12,
  rotation: 0,
  aspectRatioLocked: false,
  locked: false,
  border: { enabled: true, width: POINT_IN_MM, color: '#000000' },
  zIndex: 1,
};

describe('measurement utilities', () => {
  it('formats at most two decimal places without changing stored values', () => {
    expect(formatMeasure(55.399)).toBe('55.4');
    expect(formatMeasure(55.395)).toBe('55.4');
    expect(formatMeasure(55.39)).toBe('55.39');
    expect(formatMeasure(-0)).toBe('0');
  });

  it('converts millimeters to pixels and back', () => {
    const pixels = mmToPx(55.39, 1.25);
    expect(pxToMm(pixels, 1.25)).toBeCloseTo(55.39, 10);
  });

  it('keeps exact content measurements and adds the border only to outer bounds', () => {
    const bounds = getItemBounds(item, 'outer');
    expect(bounds.x).toBeCloseTo(10 - POINT_IN_MM, 10);
    expect(bounds.y).toBeCloseTo(20 - POINT_IN_MM, 10);
    expect(bounds.width).toBeCloseTo(55.39 + POINT_IN_MM * 2, 10);
    expect(bounds.height).toBeCloseTo(90.12 + POINT_IN_MM * 2, 10);
  });
});
