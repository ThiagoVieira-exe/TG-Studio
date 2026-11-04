import React, { useState } from 'react';
import type { ArtItem, PaperDimensions, PaperFormat, PaperOrientation } from '../../types';
import { exportToPdf } from '../../utils/pdfExporter';
import { exportToImage } from '../../utils/imageExporter';
import { X, Download, FileText, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  paperFormat: PaperFormat;
  paperOrientation: PaperOrientation;
  dimensions: PaperDimensions;
  items: ArtItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  paperFormat,
  paperOrientation,
  dimensions,
  items,
}) => {
  const [exportType, setExportType] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [dpi, setDpi] = useState<number>(300);
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate resolution in pixels
  const pxWidth = Math.round((dimensions.width / 25.4) * dpi);
  const pxHeight = Math.round((dimensions.height / 25.4) * dpi);

  const handleExport = async () => {
    setIsExporting(true);
    setSuccess(false);

    try {
      const cleanName = (projectName || 'tg-studio').trim().replace(/[^a-zA-Z0-9_-]/g, '_');

      if (exportType === 'pdf') {
        await exportToPdf({
          fileName: `${cleanName}-${paperFormat.toLowerCase()}-${paperOrientation}.pdf`,
          format: paperFormat,
          orientation: paperOrientation,
          dimensions,
          items,
        });
      } else {
        await exportToImage({
          format: exportType,
          dpi,
          dimensions,
          items,
          fileName: `${cleanName}-${paperFormat.toLowerCase()}-${dpi}dpi.${exportType === 'jpeg' ? 'jpg' : 'png'}`,
          backgroundColor: '#ffffff',
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Erro na exportação:', err);
      alert('Ocorreu um erro ao exportar o arquivo. Verifique o console.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">Exportar para Impressão</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-zinc-300">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="block text-zinc-400 font-medium">Formato do Arquivo:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setExportType('pdf')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                  exportType === 'pdf'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <FileText size={20} className={exportType === 'pdf' ? 'text-emerald-400' : 'text-zinc-500'} />
                <span className="font-bold mt-1 text-sm">PDF</span>
                <span className="text-[10px] text-zinc-500">Tamanho Real (mm)</span>
              </button>

              <button
                onClick={() => setExportType('png')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                  exportType === 'png'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <ImageIcon size={20} className={exportType === 'png' ? 'text-emerald-400' : 'text-zinc-500'} />
                <span className="font-bold mt-1 text-sm">PNG</span>
                <span className="text-[10px] text-zinc-500">Imagem Nítida</span>
              </button>

              <button
                onClick={() => setExportType('jpeg')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                  exportType === 'jpeg'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <ImageIcon size={20} className={exportType === 'jpeg' ? 'text-emerald-400' : 'text-zinc-500'} />
                <span className="font-bold mt-1 text-sm">JPG</span>
                <span className="text-[10px] text-zinc-500">Alta Qualidade</span>
              </button>
            </div>
          </div>

          {/* DPI Resolution for raster images or preview */}
          {exportType !== 'pdf' && (
            <div className="space-y-2">
              <label className="block text-zinc-400 font-medium">Resolução de Impressão (DPI):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 300, name: '300 DPI', desc: 'Gráfica / Alta' },
                  { val: 150, name: '150 DPI', desc: 'Média Resolução' },
                  { val: 72, name: '72 DPI', desc: 'Web / Prévia' },
                ].map((d) => (
                  <button
                    key={d.val}
                    onClick={() => setDpi(d.val)}
                    className={`p-2.5 rounded-lg border text-center transition ${
                      dpi === d.val
                        ? 'bg-emerald-600/20 border-emerald-500 text-white font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                    }`}
                  >
                    <div>{d.name}</div>
                    <div className="text-[10px] text-zinc-500 font-normal">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Physical Specifications Summary */}
          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-zinc-400">
              <span>Dimensões Físicas:</span>
              <span className="text-zinc-200 font-semibold">
                {paperFormat} ({dimensions.width} × {dimensions.height} mm)
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Orientação:</span>
              <span className="text-zinc-200">
                {paperOrientation === 'portrait' ? 'Retrato (Vertical)' : 'Paisagem (Horizontal)'}
              </span>
            </div>
            {exportType !== 'pdf' && (
              <div className="flex justify-between text-zinc-400">
                <span>Resolução em Pixels:</span>
                <span className="text-emerald-400 font-bold">
                  {pxWidth} × {pxHeight} px
                </span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Objetos na Folha:</span>
              <span className="text-zinc-200">{items.length} elementos</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow transition"
          >
            {isExporting ? (
              <span className="animate-spin">⏳ Gerando...</span>
            ) : success ? (
              <>
                <CheckCircle2 size={16} />
                <span>Exportado!</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Exportar Arquivo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
