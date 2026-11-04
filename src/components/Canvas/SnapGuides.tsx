import React from 'react';
import type { SnapGuide } from '../../types';
import { BASE_PX_PER_MM, formatMeasure } from '../../utils/units';

interface SnapGuidesProps {
  guides: SnapGuide[];
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({
  guides,
  zoom,
}) => {
  if (guides.length === 0) return null;

  const scale = BASE_PX_PER_MM * zoom;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {guides.map((guide, idx) => {
        if (guide.type === 'vertical') {
          const xPx = guide.position * scale;
          const startYPx = Math.min(guide.start, guide.end) * scale - 20;
          const heightPx = Math.abs(guide.end - guide.start) * scale + 40;

          return (
            <React.Fragment key={`v-${idx}`}>
              <div
                className="absolute bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                style={{
                  left: xPx - 0.5,
                  top: startYPx,
                  width: 1.5,
                  height: Math.max(heightPx, 100),
                }}
              />
              {guide.label && (
                <div
                  className="absolute bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap transform -translate-x-1/2"
                  style={{
                    left: xPx,
                    top: startYPx - 16,
                  }}
                >
                  {guide.label} ({formatMeasure(guide.position)}mm)
                </div>
              )}
            </React.Fragment>
          );
        } else {
          const yPx = guide.position * scale;
          const startXPx = Math.min(guide.start, guide.end) * scale - 20;
          const widthPx = Math.abs(guide.end - guide.start) * scale + 40;

          return (
            <React.Fragment key={`h-${idx}`}>
              <div
                className="absolute bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                style={{
                  left: startXPx,
                  top: yPx - 0.5,
                  width: Math.max(widthPx, 100),
                  height: 1.5,
                }}
              />
              {guide.label && (
                <div
                  className="absolute bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap transform -translate-y-1/2"
                  style={{
                    left: startXPx - 10,
                    top: yPx,
                  }}
                >
                  {guide.label} ({formatMeasure(guide.position)}mm)
                </div>
              )}
            </React.Fragment>
          );
        }
      })}
    </div>
  );
};
