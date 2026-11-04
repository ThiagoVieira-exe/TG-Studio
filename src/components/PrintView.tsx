import React from 'react';
import type { ArtItem, PaperDimensions } from '../types';
import { BorderOverlay } from './BorderOverlay';
import { getPrintableItemLayouts } from '../utils/printLayout';

interface PrintViewProps {
  paper: PaperDimensions;
  items: ArtItem[];
}

export const PrintView: React.FC<PrintViewProps> = ({
  paper,
  items,
}) => {
  const printableItems = getPrintableItemLayouts(items, paper);

  return (
    <div
      id="print-container"
      className="hidden print:block bg-white"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: `${paper.width}mm`,
        height: `${paper.height}mm`,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @page {
          size: ${paper.width}mm ${paper.height}mm;
          margin: 0mm;
        }
      `}</style>

      {printableItems.map(({ item, borderWidth, outerX, outerY, outerWidth, outerHeight }) => {
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${outerX}mm`,
              top: `${outerY}mm`,
              width: `${outerWidth}mm`,
              height: `${outerHeight}mm`,
              backgroundColor: 'transparent',
              boxSizing: 'border-box',
              overflow: 'hidden',
              transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
              transformOrigin: 'center center',
              zIndex: item.zIndex,
            }}
          >
            {borderWidth > 0 && <BorderOverlay item={item} style={{ zIndex: 2 }} />}
            <img
              src={item.src}
              alt={item.name}
              style={{
                position: 'absolute',
                left: `${borderWidth}mm`,
                top: `${borderWidth}mm`,
                width: `${item.width}mm`,
                height: `${item.height}mm`,
                objectFit: 'fill',
                display: 'block',
                zIndex: 1,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
