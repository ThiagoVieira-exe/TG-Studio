import React from 'react';
import type { PaperDimensions, PaperFormat, PaperOrientation } from '../../types';
import { BASE_PX_PER_MM } from '../../utils/units';

interface SheetProps {
  paper: PaperDimensions;
  format: PaperFormat;
  orientation: PaperOrientation;
  zoom: number;
  margin?: number;
  showMargins?: boolean;
}

export const Sheet = React.memo<SheetProps>(({ 
  paper,
  format,
  orientation,
  zoom,
  margin = 5,
  showMargins = true,
}) => {
  const scale = BASE_PX_PER_MM * zoom;
  const sheetWidthPx = paper.width * scale;
  const sheetHeightPx = paper.height * scale;
  const marginPx = margin * scale;

  return (
    <div
      className="absolute bg-white shadow-2xl transition-shadow select-none pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: sheetWidthPx,
        height: sheetHeightPx,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Paper Information Header Badge */}
      <div
        className="absolute -top-7 left-0 flex items-center gap-2 px-2.5 py-0.5 rounded-t bg-zinc-800 text-zinc-300 font-mono text-[11px] font-semibold border-t border-x border-zinc-700 pointer-events-none shadow"
        style={{ transformOrigin: 'bottom left' }}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>{format} ({paper.width} × {paper.height} mm)</span>
        <span className="text-zinc-500 text-[10px] uppercase">[{orientation === 'portrait' ? 'Retrato' : 'Paisagem'}]</span>
      </div>

      {/* Printable Margins Guide (Safety zone) */}
      {showMargins && margin > 0 && (
        <div
          className="absolute border border-dashed border-sky-400/40 pointer-events-none"
          style={{
            left: marginPx,
            top: marginPx,
            width: sheetWidthPx - marginPx * 2,
            height: sheetHeightPx - marginPx * 2,
          }}
        >
          <span className="absolute top-1 left-1.5 text-[9px] font-mono text-sky-400/60 select-none">
            Margem {margin}mm
          </span>
        </div>
      )}
    </div>
  );
});
