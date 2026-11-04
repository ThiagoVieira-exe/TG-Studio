import React, { useEffect, useRef } from 'react';
import { BASE_PX_PER_MM } from '../../utils/units';

interface RulersProps {
  zoom: number;
  panX: number;
  panY: number;
  cursorMm: { x: number; y: number } | null;
  width: number;
  height: number;
  rulerThickness?: number;
}

export const Rulers = React.memo<RulersProps>(({ 
  zoom,
  panX,
  panY,
  cursorMm,
  width,
  height,
  rulerThickness = 24,
}) => {
  const topCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const scale = BASE_PX_PER_MM * zoom; // pixels per mm

  // Render Horizontal Ruler
  useEffect(() => {
    const canvas = topCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = (width - rulerThickness) * dpr;
    canvas.height = rulerThickness * dpr;
    ctx.scale(dpr, dpr);

    const w = width - rulerThickness;
    const h = rulerThickness;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#18181b'; // zinc-900 background
    ctx.fillRect(0, 0, w, h);

    // Bottom border
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(w, h - 0.5);
    ctx.stroke();

    // Determine interval step in mm based on zoom
    let stepMm = 10;
    if (scale < 1.5) stepMm = 50;
    else if (scale < 3) stepMm = 20;
    else if (scale > 8) stepMm = 5;

    // Start mm visible on screen
    const startMm = Math.floor((-panX) / stepMm) * stepMm - stepMm * 2;
    const endMm = Math.ceil((w - panX) / stepMm) * stepMm + stepMm * 2;

    ctx.fillStyle = '#a1a1aa'; // zinc-400
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let mm = startMm; mm <= endMm; mm += stepMm) {
      const screenX = panX + mm * scale;
      if (screenX < -20 || screenX > w + 20) continue;

      // Major tick
      ctx.strokeStyle = '#52525b';
      ctx.beginPath();
      ctx.moveTo(screenX, h - 10);
      ctx.lineTo(screenX, h);
      ctx.stroke();

      // Label (only if spaced enough)
      ctx.fillText(mm.toString(), screenX, 3);

      // Sub-ticks (5mm, 1mm)
      if (stepMm >= 10 && scale > 1.8) {
        // Half tick (5mm)
        const halfX = panX + (mm + stepMm / 2) * scale;
        if (halfX >= 0 && halfX <= w) {
          ctx.strokeStyle = '#3f3f46';
          ctx.beginPath();
          ctx.moveTo(halfX, h - 6);
          ctx.lineTo(halfX, h);
          ctx.stroke();
        }

        // Minor ticks (1mm) if zoomed in
        if (scale >= 3.5) {
          ctx.strokeStyle = '#27272a';
          for (let sub = 1; sub < stepMm; sub++) {
            if (sub === stepMm / 2) continue;
            const subX = panX + (mm + sub) * scale;
            if (subX >= 0 && subX <= w) {
              ctx.beginPath();
              ctx.moveTo(subX, h - 3);
              ctx.lineTo(subX, h);
              ctx.stroke();
            }
          }
        }
      }
    }

    // Cursor indicator
    if (cursorMm !== null) {
      const cursorX = panX + cursorMm.x * scale;
      if (cursorX >= 0 && cursorX <= w) {
        ctx.strokeStyle = '#f43f5e'; // rose-500
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cursorX, 0);
        ctx.lineTo(cursorX, h);
        ctx.stroke();
      }
    }
  }, [zoom, panX, cursorMm, width, rulerThickness, scale]);

  // Render Vertical Ruler
  useEffect(() => {
    const canvas = leftCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rulerThickness * dpr;
    canvas.height = (height - rulerThickness) * dpr;
    ctx.scale(dpr, dpr);

    const w = rulerThickness;
    const h = height - rulerThickness;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, w, h);

    // Right border
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - 0.5, 0);
    ctx.lineTo(w - 0.5, h);
    ctx.stroke();

    let stepMm = 10;
    if (scale < 1.5) stepMm = 50;
    else if (scale < 3) stepMm = 20;
    else if (scale > 8) stepMm = 5;

    const startMm = Math.floor((-panY) / stepMm) * stepMm - stepMm * 2;
    const endMm = Math.ceil((h - panY) / stepMm) * stepMm + stepMm * 2;

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let mm = startMm; mm <= endMm; mm += stepMm) {
      const screenY = panY + mm * scale;
      if (screenY < -20 || screenY > h + 20) continue;

      // Major tick
      ctx.strokeStyle = '#52525b';
      ctx.beginPath();
      ctx.moveTo(w - 10, screenY);
      ctx.lineTo(w, screenY);
      ctx.stroke();

      // Label (rotated or vertical)
      ctx.save();
      ctx.translate(w - 12, screenY);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(mm.toString(), 0, 0);
      ctx.restore();

      // Sub-ticks
      if (stepMm >= 10 && scale > 1.8) {
        const halfY = panY + (mm + stepMm / 2) * scale;
        if (halfY >= 0 && halfY <= h) {
          ctx.strokeStyle = '#3f3f46';
          ctx.beginPath();
          ctx.moveTo(w - 6, halfY);
          ctx.lineTo(w, halfY);
          ctx.stroke();
        }

        if (scale >= 3.5) {
          ctx.strokeStyle = '#27272a';
          for (let sub = 1; sub < stepMm; sub++) {
            if (sub === stepMm / 2) continue;
            const subY = panY + (mm + sub) * scale;
            if (subY >= 0 && subY <= h) {
              ctx.beginPath();
              ctx.moveTo(w - 3, subY);
              ctx.lineTo(w, subY);
              ctx.stroke();
            }
          }
        }
      }
    }

    // Cursor indicator
    if (cursorMm !== null) {
      const cursorY = panY + cursorMm.y * scale;
      if (cursorY >= 0 && cursorY <= h) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, cursorY);
        ctx.lineTo(w, cursorY);
        ctx.stroke();
      }
    }
  }, [zoom, panY, cursorMm, height, rulerThickness, scale]);

  return (
    <>
      {/* Top-left corner box */}
      <div
        className="absolute top-0 left-0 z-30 bg-zinc-950 border-r border-b border-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-400 select-none"
        style={{ width: rulerThickness, height: rulerThickness }}
        title="Unidade: Milímetros (mm)"
      >
        mm
      </div>

      {/* Top Horizontal Ruler */}
      <canvas
        ref={topCanvasRef}
        className="absolute top-0 z-20 pointer-events-none"
        style={{
          left: rulerThickness,
          width: width - rulerThickness,
          height: rulerThickness,
        }}
      />

      {/* Left Vertical Ruler */}
      <canvas
        ref={leftCanvasRef}
        className="absolute left-0 z-20 pointer-events-none"
        style={{
          top: rulerThickness,
          width: rulerThickness,
          height: height - rulerThickness,
        }}
      />
    </>
  );
});
