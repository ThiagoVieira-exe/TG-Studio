import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
} catch (e) {
  console.warn('Could not load local pdf.worker, fallback might be needed', e);
}

export interface LoadedImageResult {
  name: string;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  widthMm: number;
  heightMm: number;
}

export async function loadFile(file: File): Promise<LoadedImageResult[]> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'pdf' || file.type === 'application/pdf') {
    return loadPdfFile(file);
  } else {
    const result = await loadImageFile(file);
    return [result];
  }
}

async function loadImageFile(file: File): Promise<LoadedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth || 800;
        const naturalHeight = img.naturalHeight || 600;

        // Calculate initial mm size assuming 300 DPI, bounded to reasonable default (max 120mm)
        let widthMm = (naturalWidth / 300) * 25.4;
        let heightMm = (naturalHeight / 300) * 25.4;

        if (widthMm > 140 || heightMm > 140) {
          const ratio = naturalWidth / naturalHeight;
          if (ratio >= 1) {
            widthMm = 120;
            heightMm = 120 / ratio;
          } else {
            heightMm = 120;
            widthMm = 120 * ratio;
          }
        } else if (widthMm < 30 && heightMm < 30) {
          // If too small, give at least 40mm
          const ratio = naturalWidth / naturalHeight;
          if (ratio >= 1) {
            widthMm = 50;
            heightMm = 50 / ratio;
          } else {
            heightMm = 50;
            widthMm = 50 * ratio;
          }
        }

        resolve({
          name: file.name.replace(/\.[^/.]+$/, ''),
          src,
          naturalWidth,
          naturalHeight,
          widthMm,
          heightMm,
        });
      };
      img.onerror = () => reject(new Error(`Erro ao carregar imagem ${file.name}`));
      img.src = src;
    };
    reader.onerror = () => reject(new Error(`Erro ao ler arquivo ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function loadPdfFile(file: File): Promise<LoadedImageResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const results: LoadedImageResult[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    // Render at high resolution (scale 3 = approx 216-300 DPI)
    const viewport = page.getViewport({ scale: 2.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/png');

    // PDF dimensions in points (72 points = 1 inch = 25.4 mm)
    const origViewport = page.getViewport({ scale: 1.0 });
    const widthMm = (origViewport.width / 72) * 25.4;
    const heightMm = (origViewport.height / 72) * 25.4;

    results.push({
      name: `${file.name.replace(/\.[^/.]+$/, '')}_p${i}`,
      src: dataUrl,
      naturalWidth: canvas.width,
      naturalHeight: canvas.height,
      widthMm,
      heightMm,
    });
  }

  return results;
}
