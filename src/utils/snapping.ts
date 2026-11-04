import type { ArtItem, PaperDimensions, SnapGuide, SnappingSettings } from '../types';
import { getItemBounds } from './units';

interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

export function computeSnapping(
  draggedItem: ArtItem,
  candidateX: number,
  candidateY: number,
  otherItems: ArtItem[],
  paper: PaperDimensions,
  settings: SnappingSettings,
  zoom: number = 1
): SnapResult {
  if (!settings.enabled) {
    return { x: candidateX, y: candidateY, guides: [] };
  }

  // Snapping threshold in millimeters (corresponds to approx 8 screen pixels)
  const thresholdMm = Math.max(1.0, 8 / (3.78 * zoom));

  const hasBorder = settings.reference === 'outer' && draggedItem.border.enabled && draggedItem.border.width > 0;
  const bWidth = hasBorder ? draggedItem.border.width : 0;

  // Dragged item dimensions based on reference
  const itemW = draggedItem.width + (bWidth * 2);
  const itemH = draggedItem.height + (bWidth * 2);

  // Outer bounds candidate
  let outerX = candidateX - bWidth;
  let outerY = candidateY - bWidth;

  let bestDiffX = thresholdMm;
  let bestSnapOuterX = outerX;
  const activeXGuides: SnapGuide[] = [];

  let bestDiffY = thresholdMm;
  let bestSnapOuterY = outerY;
  const activeYGuides: SnapGuide[] = [];

  const spacing = Math.max(0, settings.spacing);

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
      activeXGuides.length = 0; // Replace with better snap
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

  // 1. Snap to Sheet
  if (settings.snapToSheet) {
    // Sheet Left, Center, Right
    testSnapX(0, 0, 0, paper.height, 'Borda Folha');
    testSnapX((paper.width - itemW) / 2, paper.width / 2, 0, paper.height, 'Centro Folha');
    testSnapX(paper.width - itemW, paper.width, 0, paper.height, 'Borda Folha');

    // Sheet Top, Center, Bottom
    testSnapY(0, 0, 0, paper.width, 'Borda Folha');
    testSnapY((paper.height - itemH) / 2, paper.height / 2, 0, paper.width, 'Centro Folha');
    testSnapY(paper.height - itemH, paper.height, 0, paper.width, 'Borda Folha');

    // Margins
    if (settings.snapToMargins && settings.margin > 0) {
      const m = settings.margin;
      testSnapX(m, m, 0, paper.height, `Margem ${m}mm`);
      testSnapX(paper.width - m - itemW, paper.width - m, 0, paper.height, `Margem ${m}mm`);

      testSnapY(m, m, 0, paper.width, `Margem ${m}mm`);
      testSnapY(paper.height - m - itemH, paper.height - m, 0, paper.width, `Margem ${m}mm`);
    }
  }

  // 2. Snap to other items
  for (const other of otherItems) {
    if (other.id === draggedItem.id) continue;
    const b = getItemBounds(other, settings.reference);

    // --- X Snaps ---
    // Left align: dragged.left = other.left
    testSnapX(b.x, b.x, b.y, b.bottom, 'Alinhamento Esquerda');

    // Right align: dragged.right = other.right => outerX = b.right - itemW
    testSnapX(b.right - itemW, b.right, b.y, b.bottom, 'Alinhamento Direita');

    // Center X align: dragged.center = other.center => outerX = b.centerX - itemW / 2
    testSnapX(b.centerX - itemW / 2, b.centerX, b.y, b.bottom, 'Centro');

    // Left to Right edge: dragged.left = other.right
    testSnapX(b.right, b.right, b.y, b.bottom, 'Encaixe');

    // Right to Left edge: dragged.right = other.left => outerX = b.x - itemW
    testSnapX(b.x - itemW, b.x, b.y, b.bottom, 'Encaixe');

    // Side-by-side with custom spacing:
    // Placed to the right of other:
    testSnapX(b.right + spacing, b.right + spacing, b.y, b.bottom, spacing > 0 ? `Espaçamento ${spacing}mm` : 'Encaixe 0mm');

    // Placed to the left of other:
    testSnapX(b.x - spacing - itemW, b.x - spacing, b.y, b.bottom, spacing > 0 ? `Espaçamento ${spacing}mm` : 'Encaixe 0mm');

    // --- Y Snaps ---
    // Top align: dragged.top = other.top
    testSnapY(b.y, b.y, b.x, b.right, 'Alinhamento Topo');

    // Bottom align: dragged.bottom = other.bottom => outerY = b.bottom - itemH
    testSnapY(b.bottom - itemH, b.bottom, b.x, b.right, 'Alinhamento Base');

    // Center Y align: dragged.centerY = other.centerY => outerY = b.centerY - itemH / 2
    testSnapY(b.centerY - itemH / 2, b.centerY, b.x, b.right, 'Centro');

    // Top to Bottom edge: dragged.top = other.bottom
    testSnapY(b.bottom, b.bottom, b.x, b.right, 'Encaixe');

    // Bottom to Top edge: dragged.bottom = other.top => outerY = b.y - itemH
    testSnapY(b.y - itemH, b.y, b.x, b.right, 'Encaixe');

    // Stacked above/below with custom spacing:
    // Placed below other:
    testSnapY(b.bottom + spacing, b.bottom + spacing, b.x, b.right, spacing > 0 ? `Espaçamento ${spacing}mm` : 'Encaixe 0mm');

    // Placed above other:
    testSnapY(b.y - spacing - itemH, b.y - spacing, b.x, b.right, spacing > 0 ? `Espaçamento ${spacing}mm` : 'Encaixe 0mm');
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
