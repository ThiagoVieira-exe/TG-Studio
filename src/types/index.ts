export type PaperFormat = 'A4' | 'A3';
export type PaperOrientation = 'portrait' | 'landscape';

export interface PaperDimensions {
  width: number;  // in millimeters
  height: number; // in millimeters
}

export const PAPER_SIZES: Record<PaperFormat, PaperDimensions> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

export interface ItemBorder {
  enabled: boolean;
  width: number;     // in millimeters; preserves the exact entered value
  color: string;     // Hex color (e.g. #000000)
  mode?: BorderMode; // outside only, or outside plus inside
}

export type BorderMode = 'outer' | 'outer-inner';

export interface ArtItem {
  id: string;
  name: string;
  src: string;              // Data URL (image/png, image/jpeg, image/svg+xml)
  naturalWidth: number;     // Original image pixel width
  naturalHeight: number;    // Original image pixel height
  x: number;                // in millimeters (relative to top-left of sheet)
  y: number;                // in millimeters (relative to top-left of sheet)
  width: number;            // in millimeters (content width)
  height: number;           // in millimeters (content height)
  rotation: number;         // in degrees (0-360)
  aspectRatioLocked: boolean; // whether width & height change proportionally
  locked: boolean;          // whether item is locked against movement/editing
  border: ItemBorder;
  zIndex: number;
  groupId?: string;
}

export type SnapReference = 'outer' | 'content';

export interface SnappingSettings {
  enabled: boolean;
  spacing: number;          // in millimeters (e.g. 0.0, 2.0, 5.0)
  reference: SnapReference; // snap by outer border or image content
  snapToSheet: boolean;
  snapToMargins: boolean;
  margin: number;           // in millimeters (e.g. 5.0)
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;        // coordinate in mm
  start: number;           // start coordinate in mm
  end: number;             // end coordinate in mm
  label?: string;
}

export type ToolMode = 'select' | 'pan' | 'eyedropper';

export interface ViewportTransform {
  zoom: number;            // 1 = 100%
  panX: number;            // screen pixels
  panY: number;            // screen pixels
}

export interface ProjectData {
  version: string;
  name: string;
  paperFormat: PaperFormat;
  paperOrientation: PaperOrientation;
  snapping: SnappingSettings;
  items: ArtItem[];
  pages?: WorkspacePage[];
}

export interface WorkspacePage {
  id: string;
  name: string;
  paperFormat: PaperFormat;
  paperOrientation: PaperOrientation;
  snapping: SnappingSettings;
  items: ArtItem[];
}

/** Complete editable workspace state, including all pages and the active page. */
export interface WorkspaceState {
  pages: WorkspacePage[];
  currentPageId: string;
}
