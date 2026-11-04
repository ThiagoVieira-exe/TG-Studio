import React from 'react';
import type { ArtItem } from '../types';
import { getBorderGeometry } from '../utils/borders';

interface BorderOverlayProps {
  item: ArtItem;
  className?: string;
  style?: React.CSSProperties;
}

/** Shared vector border renderer used by the canvas and print preview. */
export const BorderOverlay: React.FC<BorderOverlayProps> = ({ item, className, style }) => {
  const geometry = getBorderGeometry(item);
  if (geometry.borderWidth <= 0 || geometry.rectangles.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${geometry.outerWidth} ${geometry.outerHeight}`}
      preserveAspectRatio="none"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {geometry.rectangles.map((rect, index) => (
        <rect
          key={`${rect.x}-${rect.y}-${rect.width}-${rect.height}-${index}`}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={item.border.color}
        />
      ))}
    </svg>
  );
};
