import React from 'react';
import type { ArtItem } from '../types';
import { getBorderGeometry } from '../utils/borders';

interface BorderOverlayProps {
  item: ArtItem;
  className?: string;
  style?: React.CSSProperties;
}

/** Shared vector border renderer used by the canvas and print preview. Supports rectangular and circular borders. */
export const BorderOverlay: React.FC<BorderOverlayProps> = ({ item, className, style }) => {
  const geometry = getBorderGeometry(item);
  if (geometry.borderWidth <= 0 || geometry.rectangles.length === 0) return null;

  const isRound = Boolean(item.isRound || item.shape === 'circle');
  const maskId = `border-round-mask-${item.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const cx = geometry.outerWidth / 2;
  const cy = geometry.outerHeight / 2;
  const outerRx = geometry.outerWidth / 2;
  const outerRy = geometry.outerHeight / 2;
  const innerRx = item.width / 2;
  const innerRy = item.height / 2;

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
      {isRound ? (
        <>
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              <ellipse cx={cx} cy={cy} rx={innerRx} ry={innerRy} fill="black" />
            </mask>
          </defs>
          {/* Round outer border ring */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={outerRx}
            ry={outerRy}
            fill={item.border.color}
            mask={`url(#${maskId})`}
          />
          {/* Inner ring if outer-inner mode is active */}
          {item.border.mode === 'outer-inner' && (
            <ellipse
              cx={cx}
              cy={cy}
              rx={innerRx}
              ry={innerRy}
              stroke={item.border.color}
              strokeWidth={geometry.borderWidth}
              fill="none"
            />
          )}
        </>
      ) : (
        geometry.rectangles.map((rect, index) => (
          <rect
            key={`${rect.x}-${rect.y}-${rect.width}-${rect.height}-${index}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill={item.border.color}
          />
        ))
      )}
    </svg>
  );
};
