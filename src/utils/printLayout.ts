import type { ArtItem, PaperDimensions } from '../types';
import { getBorderGeometry, isOutsidePaper } from './borders';

export interface PrintableItemLayout {
  item: ArtItem;
  borderWidth: number;
  outerX: number;
  outerY: number;
  outerWidth: number;
  outerHeight: number;
}

/** Creates the exact physical layout consumed by PrintView and its tests. */
export function getPrintableItemLayouts(
  items: ArtItem[],
  paper: PaperDimensions,
): PrintableItemLayout[] {
  return [...items]
    .sort((a, b) => a.zIndex - b.zIndex)
    .flatMap((item) => {
      const geometry = getBorderGeometry(item);
      if (isOutsidePaper(geometry, paper.width, paper.height)) return [];

      return [{
        item,
        borderWidth: geometry.borderWidth,
        outerX: geometry.outerX,
        outerY: geometry.outerY,
        outerWidth: geometry.outerWidth,
        outerHeight: geometry.outerHeight,
      }];
    });
}
