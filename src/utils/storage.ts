import type { ProjectData } from '../types';

const STORAGE_KEY = 'tg_studio_autosave_v1';

export function saveProjectToFile(project: ProjectData, filename: string = 'projeto.tgstudio'): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.tgstudio') ? filename : `${filename}.tgstudio`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function loadProjectFromFile(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;
        if (!data.items || !data.paperFormat) {
          throw new Error('Formato de arquivo TG Studio inválido');
        }
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

export function saveToLocalStorage(project: ProjectData): void {
  try {
    const json = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.warn('Não foi possível salvar no localStorage (limite de cota atingido):', err);
  }
}

export function loadFromLocalStorage(): ProjectData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as ProjectData;
  } catch (err) {
    console.warn('Erro ao carregar do localStorage:', err);
    return null;
  }
}

/**
 * Creates sample starter items (stickers / badges / logos) for first-time use
 */
export function createSampleProject(): ProjectData {
  // Generate sample SVG data URLs
  const sampleBadgeSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="30" fill="url(#grad1)" />
      <circle cx="200" cy="200" r="140" fill="#ffffff" opacity="0.15" />
      <polygon points="200,90 230,165 310,165 245,210 270,285 200,240 130,285 155,210 90,165 170,165" fill="#FBBF24" />
      <text x="200" y="340" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="2">TG STUDIO</text>
    </svg>
  `)}`;

  const sampleTagSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="600" height="350">
      <rect width="600" height="350" rx="20" fill="#18181B" />
      <rect x="15" y="15" width="570" height="320" rx="12" fill="none" stroke="#F59E0B" stroke-width="4" stroke-dasharray="8 6" />
      <circle cx="60" cy="175" r="16" fill="#F59E0B" />
      <text x="330" y="145" font-family="Arial, sans-serif" font-weight="bold" font-size="36" fill="#FFFFFF" text-anchor="middle">QUALIDADE PREMIUM</text>
      <text x="330" y="195" font-family="Arial, sans-serif" font-size="22" fill="#D4D4D8" text-anchor="middle">100% ALGODÃO • ED. ESPECIAL</text>
      <text x="330" y="250" font-family="monospace" font-weight="bold" font-size="26" fill="#10B981" text-anchor="middle">R$ 89,90</text>
    </svg>
  `)}`;

  const sampleCardSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="500" height="300">
      <defs>
        <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#E11D48;" />
          <stop offset="100%" style="stop-color:#FB7185;" />
        </linearGradient>
      </defs>
      <rect width="500" height="300" rx="16" fill="url(#roseGrad)" />
      <circle cx="100" cy="150" r="55" fill="#FFFFFF" opacity="0.25" />
      <text x="100" y="165" font-family="Arial, sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle">ART</text>
      <text x="300" y="130" font-family="Arial, sans-serif" font-weight="800" font-size="30" fill="#FFFFFF">CARTÃO DE VISITA</text>
      <text x="300" y="170" font-family="Arial, sans-serif" font-size="18" fill="#FFE4E6">contato@grafica.com.br</text>
      <text x="300" y="200" font-family="Arial, sans-serif" font-size="18" fill="#FFE4E6">(11) 99999-8888</text>
    </svg>
  `)}`;

  return {
    version: '1.0.0',
    name: 'Projeto Inicial',
    paperFormat: 'A4',
    paperOrientation: 'portrait',
    snapping: {
      enabled: true,
      spacing: 2.0,
      reference: 'outer',
      snapToSheet: true,
      snapToMargins: true,
      margin: 5.0,
    },
    items: [
      {
        id: 'sample-1',
        name: 'Selo TG Studio',
        src: sampleBadgeSvg,
        naturalWidth: 400,
        naturalHeight: 400,
        x: 15,
        y: 15,
        width: 50,
        height: 50,
        rotation: 0,
        aspectRatioLocked: true,
        locked: false,
        border: {
          enabled: true,
          width: 1.5,
          color: '#4F46E5',
        },
        zIndex: 1,
      },
      {
        id: 'sample-2',
        name: 'Etiqueta Premium',
        src: sampleTagSvg,
        naturalWidth: 600,
        naturalHeight: 350,
        x: 70,
        y: 15,
        width: 80,
        height: 46.7,
        rotation: 0,
        aspectRatioLocked: true,
        locked: false,
        border: {
          enabled: true,
          width: 1.0,
          color: '#F59E0B',
        },
        zIndex: 2,
      },
      {
        id: 'sample-3',
        name: 'Cartão de Visita',
        src: sampleCardSvg,
        naturalWidth: 500,
        naturalHeight: 300,
        x: 15,
        y: 72,
        width: 90,
        height: 54,
        rotation: 0,
        aspectRatioLocked: false,
        locked: false,
        border: {
          enabled: true,
          width: 1.0,
          color: '#E11D48',
        },
        zIndex: 3,
      },
      // Also add an item parked in the pasteboard area (outside the sheet: x < 0)
      {
        id: 'sample-pasteboard',
        name: 'Arte em Espera (Mesa)',
        src: sampleBadgeSvg,
        naturalWidth: 400,
        naturalHeight: 400,
        x: -70,
        y: 20,
        width: 50,
        height: 50,
        rotation: 0,
        aspectRatioLocked: true,
        locked: false,
        border: {
          enabled: false,
          width: 1.0,
          color: '#000000',
        },
        zIndex: 4,
      },
    ],
  };
}
