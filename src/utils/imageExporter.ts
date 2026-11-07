import type { ArtItem, PaperDimensions } from '../types';
import { getBorderGeometry, isOutsidePaper } from './borders';

export interface ImageExportOptions {
  format: 'png' | 'jpeg';
  dpi: number; // 72, 150, 300
  dimensions: PaperDimensions;
  items: ArtItem[];
  fileName?: string;
  backgroundColor?: string;
}

export async function exportToImage(options: ImageExportOptions): Promise<void> {
  const {
    format,
    dpi = 300,
    dimensions,
    items,
    fileName = `tg-studio-projeto-${dpi}dpi.${format === 'jpeg' ? 'jpg' : 'png'}`,
    backgroundColor = '#ffffff',
  } = options;

  // Pixels per mm at specified DPI
  const scale = dpi / 25.4;
  const canvasWidth = Math.round(dimensions.width * scale);
  const canvasHeight = Math.round(dimensions.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível obter contexto 2D');

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Sort items by zIndex
  const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

  for (const item of sortedItems) {
    const geometry = getBorderGeometry(item);
    const { outerX, outerY } = geometry;

    // Check if on canvas
    if (isOutsidePaper(geometry, dimensions.width, dimensions.height)) {
      continue;
    }

    const isRound = Boolean(item.isRound || item.shape === 'circle');

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();

        const centerX = (item.x + item.width / 2) * scale;
        const centerY = (item.y + item.height / 2) * scale;

        if (item.rotation && item.rotation !== 0) {
          ctx.translate(centerX, centerY);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        const drawBorderRects = (rectangles: typeof geometry.rectangles) => {
          ctx.fillStyle = item.border.color;
          rectangles.forEach((rect) => {
            ctx.fillRect(
              (outerX + rect.x) * scale,
              (outerY + rect.y) * scale,
              rect.width * scale,
              rect.height * scale,
            );
          });
        };

        // Draw outer border (round or rectangular)
        if (geometry.borderWidth > 0) {
          if (isRound) {
            ctx.fillStyle = item.border.color;
            ctx.beginPath();
            ctx.ellipse(
              centerX,
              centerY,
              (geometry.outerWidth / 2) * scale,
              (geometry.outerHeight / 2) * scale,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
          } else if (geometry.rectangles.length > 0) {
            drawBorderRects(geometry.rectangles.slice(0, 4));
          }
        }

        // Draw image (clipped to circle/ellipse if isRound)
        if (isRound) {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            centerX,
            centerY,
            (item.width / 2) * scale,
            (item.height / 2) * scale,
            0,
            0,
            Math.PI * 2
          );
          ctx.clip();
          ctx.drawImage(
            img,
            item.x * scale,
            item.y * scale,
            item.width * scale,
            item.height * scale
          );
          ctx.restore();
        } else {
          ctx.drawImage(
            img,
            item.x * scale,
            item.y * scale,
            item.width * scale,
            item.height * scale
          );
        }

        // Inner border if outer-inner mode is active
        if (geometry.borderWidth > 0 && item.border.mode === 'outer-inner') {
          if (isRound) {
            ctx.strokeStyle = item.border.color;
            ctx.lineWidth = geometry.borderWidth * scale;
            ctx.beginPath();
            ctx.ellipse(
              centerX,
              centerY,
              (item.width / 2) * scale,
              (item.height / 2) * scale,
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          } else if (geometry.rectangles.length > 4) {
            drawBorderRects(geometry.rectangles.slice(4));
          }
        }

        ctx.restore();
        resolve();
      };
      img.onerror = () => {
        console.error('Falha ao carregar imagem para exportação:', item.name);
        resolve();
      };
      img.src = item.src;
    });
  }

  // Convert to blob and download
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpeg' ? 0.95 : undefined;

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.error('Falha ao gerar blob da imagem');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    mimeType,
    quality
  );
}
