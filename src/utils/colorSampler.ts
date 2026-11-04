/**
 * Eyedropper color picker utility
 * Supports both native window.EyeDropper API (Chrome/Edge) and canvas pixel sampling fallback (Firefox/Safari/offline)
 */

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export async function pickColorWithNativeEyeDropper(): Promise<string | null> {
  // Check if browser supports EyeDropper API
  if (typeof window !== 'undefined' && 'EyeDropper' in window) {
    try {
      // @ts-expect-error EyeDropper is supported in Chromium
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      return result.sRGBHex.toUpperCase();
    } catch {
      // User cancelled or aborted
      return null;
    }
  }
  return null;
}

export function samplePixelFromImage(
  imgElement: HTMLImageElement,
  relativeX: number, // 0.0 to 1.0 (click position inside image)
  relativeY: number  // 0.0 to 1.0
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const naturalW = imgElement.naturalWidth || 100;
      const naturalH = imgElement.naturalHeight || 100;
      canvas.width = naturalW;
      canvas.height = naturalH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('#000000');
        return;
      }

      ctx.drawImage(imgElement, 0, 0);

      const px = Math.min(naturalW - 1, Math.max(0, Math.floor(relativeX * naturalW)));
      const py = Math.min(naturalH - 1, Math.max(0, Math.floor(relativeY * naturalH)));

      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      resolve(hex);
    } catch (e) {
      console.warn('Canvas pixel sample tainted or failed:', e);
      resolve('#000000');
    }
  });
}
