import type { ArtItem, SnapReference } from '../types';

export const CSS_DPI = 96;
export const MM_PER_INCH = 25.4;
export const POINT_IN_MM = MM_PER_INCH / 72;
export const BASE_PX_PER_MM = CSS_DPI / MM_PER_INCH; // ~3.779527559 pixels per mm at 100% zoom

export function mmToPx(mm: number, zoom: number = 1): number {
  return mm * BASE_PX_PER_MM * zoom;
}

export function pxToMm(px: number, zoom: number = 1): number {
  return px / (BASE_PX_PER_MM * zoom);
}

export function roundToPrecision(val: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/** Formats measurements for the interface without changing their stored precision. */
export function formatMeasure(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Number(value.toFixed(2));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

export interface ItemBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export function getItemBounds(item: ArtItem, reference: SnapReference = 'outer'): ItemBoundingBox {
  const hasBorder = reference === 'outer' && item.border.enabled && item.border.width > 0;
  const bWidth = hasBorder ? item.border.width : 0;

  const x = item.x - bWidth;
  const y = item.y - bWidth;
  const width = item.width + (bWidth * 2);
  const height = item.height + (bWidth * 2);
  const right = x + width;
  const bottom = y + height;
  const centerX = x + (width / 2);
  const centerY = y + (height / 2);

  return {
    x,
    y,
    width,
    height,
    right,
    bottom,
    centerX,
    centerY,
  };
}

export function getCombinedBounds(items: ArtItem[], reference: SnapReference = 'outer'): ItemBoundingBox | null {
  if (items.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of items) {
    const b = getItemBounds(item, reference);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.right > maxX) maxX = b.right;
    if (b.bottom > maxY) maxY = b.bottom;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    x: minX,
    y: minY,
    width,
    height,
    right: maxX,
    bottom: maxY,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}
