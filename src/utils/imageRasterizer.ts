/** Loads a data URL as an image and optionally rasterizes SVG to PNG for PDF engines. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem'));
    image.src = src;
  });
}

export async function rasterizeSvgToPng(
  src: string,
  width: number,
  height: number,
): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width || image.naturalWidth || 1));
  canvas.height = Math.max(1, Math.round(height || image.naturalHeight || 1));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível rasterizar o SVG');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

export async function toPdfCompatibleImage(
  src: string,
  naturalWidth: number,
  naturalHeight: number,
): Promise<{ src: string; format: 'PNG' | 'JPEG' }> {
  if (src.startsWith('data:image/svg+xml')) {
    return {
      src: await rasterizeSvgToPng(src, naturalWidth, naturalHeight),
      format: 'PNG',
    };
  }

  return {
    src,
    format: src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg') ? 'JPEG' : 'PNG',
  };
}
