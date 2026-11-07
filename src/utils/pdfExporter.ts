import jsPDF from 'jspdf';
import type { ArtItem, PaperDimensions, PaperFormat, PaperOrientation } from '../types';
import { getBorderGeometry, isOutsidePaper } from './borders';
import { toPdfCompatibleImage } from './imageRasterizer';

export interface PdfExportOptions {
  fileName?: string;
  format: PaperFormat;
  orientation: PaperOrientation;
  dimensions: PaperDimensions;
  items: ArtItem[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const { fileName = 'tg-studio-projeto.pdf', format, orientation, dimensions, items } = options;

  const pdfFormat: string = format.toLowerCase();

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pdfFormat,
    compress: true,
  });

  // Sort items by zIndex ascending
  const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

  for (const item of sortedItems) {
    // Only render items that touch the paper area
    const geometry = getBorderGeometry(item);
    const { outerX, outerY } = geometry;

    if (isOutsidePaper(geometry, dimensions.width, dimensions.height)) {
      continue;
    }

    const isRound = Boolean(item.isRound || item.shape === 'circle');
    const rgb = hexToRgb(item.border.color);

    const drawBorderRects = (rectangles: typeof geometry.rectangles) => {
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      rectangles.forEach((rect) => {
        doc.rect(outerX + rect.x, outerY + rect.y, rect.width, rect.height, 'F');
      });
    };

    // Draw outer round or rectangular border
    if (geometry.borderWidth > 0) {
      if (isRound) {
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        doc.ellipse(centerX, centerY, geometry.outerWidth / 2, geometry.outerHeight / 2, 'F');
      } else if (geometry.rectangles.length > 0) {
        drawBorderRects(geometry.rectangles.slice(0, 4));
      }
    }

    // Draw image stretched to exact mm dimensions (round-cut if isRound)
    try {
      const image = await toPdfCompatibleImage(
        item.src,
        item.naturalWidth,
        item.naturalHeight,
        isRound
      );
      doc.addImage(
        image.src,
        image.format,
        item.x,
        item.y,
        item.width,
        item.height,
        undefined,
        'FAST',
        item.rotation || 0
      );

      // Inner border if outer-inner mode is active
      if (geometry.borderWidth > 0 && item.border.mode === 'outer-inner') {
        if (isRound) {
          doc.setDrawColor(rgb.r, rgb.g, rgb.b);
          doc.setLineWidth(geometry.borderWidth);
          const centerX = item.x + item.width / 2;
          const centerY = item.y + item.height / 2;
          doc.ellipse(centerX, centerY, item.width / 2, item.height / 2, 'S');
        } else if (geometry.rectangles.length > 4) {
          drawBorderRects(geometry.rectangles.slice(4));
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar imagem ao PDF:', item.name, err);
    }
  }

  doc.save(fileName);
}
