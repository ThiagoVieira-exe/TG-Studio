import type { ArtItem } from '../types';

export interface BorderRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BorderGeometry {
  borderWidth: number;
  outerX: number;
  outerY: number;
  outerWidth: number;
  outerHeight: number;
  rectangles: BorderRect[];
}

/**
 * Calculates the physical border geometry once for every renderer.
 * Item x/y/width/height always describe the image content; the border is outside it.
 */
export function getBorderGeometry(item: ArtItem): BorderGeometry {
  const borderWidth = item.border.enabled && item.border.width > 0 ? item.border.width : 0;
  const outerX = item.x - borderWidth;
  const outerY = item.y - borderWidth;
  const outerWidth = item.width + borderWidth * 2;
  const outerHeight = item.height + borderWidth * 2;

  if (borderWidth === 0) {
    return {
      borderWidth,
      outerX,
      outerY,
      outerWidth,
      outerHeight,
      rectangles: [],
    };
  }

  const rectangles: BorderRect[] = [
    { x: 0, y: 0, width: outerWidth, height: borderWidth },
    { x: 0, y: outerHeight - borderWidth, width: outerWidth, height: borderWidth },
    { x: 0, y: borderWidth, width: borderWidth, height: item.height },
    { x: outerWidth - borderWidth, y: borderWidth, width: borderWidth, height: item.height },
  ];

  if (item.border.mode === 'outer-inner') {
    rectangles.push(
      { x: borderWidth, y: borderWidth, width: item.width, height: borderWidth },
      { x: borderWidth, y: borderWidth + item.height - borderWidth, width: item.width, height: borderWidth },
      { x: borderWidth, y: borderWidth * 2, width: borderWidth, height: Math.max(0, item.height - borderWidth * 2) },
      {
        x: borderWidth + item.width - borderWidth,
        y: borderWidth * 2,
        width: borderWidth,
        height: Math.max(0, item.height - borderWidth * 2),
      },
    );
  }

  return {
    borderWidth,
    outerX,
    outerY,
    outerWidth,
    outerHeight,
    rectangles,
  };
}

export function isOutsidePaper(
  geometry: Pick<BorderGeometry, 'outerX' | 'outerY' | 'outerWidth' | 'outerHeight'>,
  paperWidth: number,
  paperHeight: number,
): boolean {
  return (
    geometry.outerX + geometry.outerWidth < 0 ||
    geometry.outerY + geometry.outerHeight < 0 ||
    geometry.outerX > paperWidth ||
    geometry.outerY > paperHeight
  );
}
