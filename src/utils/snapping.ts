import type { ArtItem, PaperDimensions, SnapGuide, SnappingSettings } from '../types';
import { getItemBounds } from './units';

interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

/**
 * Computes magnetic snapping for art items aligned against other art items on the page.
 * References are strictly the other items' outer bounds (measures + borders) in rows and columns.
 */
export function computeSnapping(
  draggedItem: ArtItem,
  candidateX: number,
  candidateY: number,
  otherItems: ArtItem[],
  _paper?: PaperDimensions,
  settings?: SnappingSettings,
  zoom: number = 1
): SnapResult {
  if (settings && !settings.enabled) {
    return { x: candidateX, y: candidateY, guides: [] };
  }

  // Snapping threshold in millimeters (corresponds to approx 8-10 screen pixels)
  const thresholdMm = Math.max(1.0, 8 / (3.78 * zoom));

  const bWidth = draggedItem.border.enabled && draggedItem.border.width > 0 ? draggedItem.border.width : 0;
  const itemW = draggedItem.width + bWidth * 2;
  const itemH = draggedItem.height + bWidth * 2;

  // Outer bounds candidate
  const outerX = candidateX - bWidth;
  const outerY = candidateY - bWidth;

  let bestDiffX = thresholdMm;
  let bestSnapOuterX = outerX;
  const activeXGuides: SnapGuide[] = [];

  let bestDiffY = thresholdMm;
  let bestSnapOuterY = outerY;
  const activeYGuides: SnapGuide[] = [];

  // Helper to test X snaps
  const testSnapX = (
    targetOuterX: number,
    guideX: number,
    guideStartY: number,
    guideEndY: number,
    label?: string
  ) => {
    const diff = Math.abs(outerX - targetOuterX);
    if (diff < bestDiffX) {
      bestDiffX = diff;
      bestSnapOuterX = targetOuterX;
      activeXGuides.length = 0;
      activeXGuides.push({
        type: 'vertical',
        position: guideX,
        start: Math.min(guideStartY, outerY),
        end: Math.max(guideEndY, outerY + itemH),
        label,
      });
    } else if (Math.abs(diff - bestDiffX) < 0.001 && diff < thresholdMm) {
      activeXGuides.push({
        type: 'vertical',
        position: guideX,
        start: Math.min(guideStartY, outerY),
        end: Math.max(guideEndY, outerY + itemH),
        label,
      });
    }
  };

  // Helper to test Y snaps
  const testSnapY = (
    targetOuterY: number,
    guideY: number,
    guideStartX: number,
    guideEndX: number,
    label?: string
  ) => {
    const diff = Math.abs(outerY - targetOuterY);
    if (diff < bestDiffY) {
      bestDiffY = diff;
      bestSnapOuterY = targetOuterY;
      activeYGuides.length = 0;
      activeYGuides.push({
        type: 'horizontal',
        position: guideY,
        start: Math.min(guideStartX, outerX),
        end: Math.max(guideEndX, outerX + itemW),
        label,
      });
    } else if (Math.abs(diff - bestDiffY) < 0.001 && diff < thresholdMm) {
      activeYGuides.push({
        type: 'horizontal',
        position: guideY,
        start: Math.min(guideStartX, outerX),
        end: Math.max(guideEndX, outerX + itemW),
        label,
      });
    }
  };

  // Snap against other items on the sheet by outer boundaries (measure + border)
  for (const other of otherItems) {
    if (other.id === draggedItem.id) continue;
    const b = getItemBounds(other, 'outer');

    // --- Column (X) alignments ---
    // Left align: dragged.left = other.left
    testSnapX(b.x, b.x, b.y, b.bottom, 'Alinhamento Esquerda');

    // Center X align: dragged.centerX = other.centerX
    testSnapX(b.centerX - itemW / 2, b.centerX, b.y, b.bottom, 'Centro');

    // Right align: dragged.right = other.right
    testSnapX(b.right - itemW, b.right, b.y, b.bottom, 'Alinhamento Direita');

    // Encosto Lado a Lado: dragged.left = other.right
    testSnapX(b.right, b.right, b.y, b.bottom, 'Encaixe Lateral');

    // Encosto Lado a Lado: dragged.right = other.left
    testSnapX(b.x - itemW, b.x, b.y, b.bottom, 'Encaixe Lateral');

    // --- Row (Y) alignments ---
    // Top align: dragged.top = other.top
    testSnapY(b.y, b.y, b.x, b.right, 'Alinhamento Topo');

    // Center Y align: dragged.centerY = other.centerY
    testSnapY(b.centerY - itemH / 2, b.centerY, b.x, b.right, 'Centro');

    // Bottom align: dragged.bottom = other.bottom
    testSnapY(b.bottom - itemH, b.bottom, b.x, b.right, 'Alinhamento Base');

    // Encosto Empilhado: dragged.top = other.bottom
    testSnapY(b.bottom, b.bottom, b.x, b.right, 'Encaixe Vertical');

    // Encosto Empilhado: dragged.bottom = other.top
    testSnapY(b.y - itemH, b.y, b.x, b.right, 'Encaixe Vertical');
  }

  // Convert snapped outer coordinates back to content candidate (candidate = outer + bWidth)
  const finalX = bestSnapOuterX + bWidth;
  const finalY = bestSnapOuterY + bWidth;

  return {
    x: finalX,
    y: finalY,
    guides: [...activeXGuides, ...activeYGuides],
  };
}
