import React, { useState } from 'react';
import type {
  PaperDimensions,
  PaperFormat,
  PaperOrientation,
  SnapReference,
  SnappingSettings,
} from '../../types';
import { PAPER_SIZES } from '../../types';
import { Magnet, FileText, LayoutTemplate, Trash2, Crosshair, ChevronDown, ChevronRight } from 'lucide-react';

interface SheetSettingsProps {
  paper: PaperDimensions;
  paperFormat: PaperFormat;
  paperOrientation: PaperOrientation;
  snapping: SnappingSettings;
  itemCount: number;
  onUpdateFormat: (format: PaperFormat) => void;
  onUpdateOrientation: (orientation: PaperOrientation) => void;
  onUpdateSnapping: (settings: Partial<SnappingSettings>) => void;
  onClearSheet: () => void;
  onCenterAllOnSheet?: () => void;
}

export const SheetSettings: React.FC<SheetSettingsProps> = ({
  paper,
  paperFormat,
  paperOrientation,
  snapping,
  itemCount,
  onUpdateFormat,
  onUpdateOrientation,
  onUpdateSnapping,
  onClearSheet,
  onCenterAllOnSheet,
}) => {
  const [isSnappingExpanded, setIsSnappingExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-5 p-4 text-zinc-200 text-xs select-none">
      {/* Paper Format Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold">
          <FileText size={16} className="text-indigo-400" />
          <span>Configuração da Folha de Impressão</span>
        </div>

        {/* Format Selector: A4 vs A3 */}
        <div className="grid grid-cols-2 gap-2">
          {(['A4', 'A3'] as PaperFormat[]).map((fmt) => {
            const isSelected = paperFormat === fmt;
            const dims = PAPER_SIZES[fmt];
            return (
              <button
                key={fmt}
                onClick={() => onUpdateFormat(fmt)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span className="font-bold text-sm">{fmt}</span>
                <span className="font-mono text-[10px] text-zinc-400 mt-0.5">
                  {dims.width} × {dims.height} mm
                </span>
              </button>
            );
          })}
        </div>

        {/* Orientation Selector: Portrait vs Landscape */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdateOrientation('portrait')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition ${
              paperOrientation === 'portrait'
                ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <LayoutTemplate size={14} className="rotate-90" />
            <span>Retrato</span>
          </button>
          <button
            onClick={() => onUpdateOrientation('landscape')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition ${
              paperOrientation === 'landscape'
                ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <LayoutTemplate size={14} />
            <span>Paisagem</span>
          </button>
        </div>

        {/* Current Dimensions summary */}
        <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between font-mono text-[11px] text-zinc-400">
          <span>Área útil física:</span>
          <span className="text-zinc-200 font-semibold">
            {paper.width} mm × {paper.height} mm
          </span>
        </div>
      </div>

      {/* Smart Snapping & Alignment Section */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSnappingExpanded((expanded) => !expanded)}
            className="flex items-center gap-2 text-zinc-100 font-semibold hover:text-white"
            title="Expandir/recolher configurações de encaixe"
          >
            {isSnappingExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Magnet size={16} className="text-rose-400" />
            <span>Encaixe Inteligente (Smart Snap)</span>
          </button>
          <button
            onClick={() => onUpdateSnapping({ enabled: !snapping.enabled })}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
              snapping.enabled ? 'bg-rose-600 justify-end' : 'bg-zinc-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm block" />
          </button>
        </div>

        {isSnappingExpanded && snapping.enabled && (
          <div className="space-y-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
            {/* Custom Spacing in mm */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                <span>Espaçamento de Encaixe:</span>
                <span className="font-mono text-rose-400 font-semibold">{snapping.spacing} mm</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={snapping.spacing}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      onUpdateSnapping({ spacing: val });
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 font-mono text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
                />
                <span className="text-zinc-500 font-mono">mm</span>
              </div>
              {/* Spacing Quick Presets */}
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2, 3, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateSnapping({ spacing: s })}
                    className={`flex-1 py-1 rounded font-mono text-[10px] transition ${
                      snapping.spacing === s
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {s}mm
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Choice: Outer Border vs Image Content */}
            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-[11px] text-zinc-400 mb-1.5">
                Referência de Alinhamento:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onUpdateSnapping({ reference: 'outer' as SnapReference })}
                  className={`py-1.5 px-2 rounded text-[10px] border transition ${
                    snapping.reference === 'outer'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-medium'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  title="Encaixe considerando a espessura total com a borda externa"
                >
                  Borda Externa
                </button>
                <button
                  onClick={() => onUpdateSnapping({ reference: 'content' as SnapReference })}
                  className={`py-1.5 px-2 rounded text-[10px] border transition ${
                    snapping.reference === 'content'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-medium'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  title="Encaixe pelas bordas originais da imagem (ignora espessura da borda)"
                >
                  Borda da Imagem
                </button>
              </div>
            </div>

            {/* Snap to Sheet & Margins */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapping.snapToSheet}
                  onChange={(e) => onUpdateSnapping({ snapToSheet: e.target.checked })}
                  className="rounded border-zinc-700 text-rose-600 focus:ring-0 bg-zinc-950"
                />
                <span className="text-[11px] text-zinc-300">Encaixar nas bordas e centro da folha</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapping.snapToMargins}
                  onChange={(e) => onUpdateSnapping({ snapToMargins: e.target.checked })}
                  className="rounded border-zinc-700 text-rose-600 focus:ring-0 bg-zinc-950"
                />
                <span className="text-[11px] text-zinc-300">Encaixar em margem de segurança ({snapping.margin}mm)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Project Status & Quick Reset */}
      <div className="pt-3 border-t border-zinc-800 space-y-2">
        <div className="flex justify-between text-zinc-400 text-[11px]">
          <span>Total de artes no projeto:</span>
          <span className="font-mono text-zinc-200 font-semibold">{itemCount}</span>
        </div>

        {itemCount > 0 && onCenterAllOnSheet && (
          <button
            onClick={onCenterAllOnSheet}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-cyan-200 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-lg transition text-xs font-medium"
            title="Centralizar todas as artes ao centro da folha mantendo a formação atual"
          >
            <Crosshair size={14} className="text-cyan-400" />
            <span>Centralizar Todas as Artes na Folha</span>
          </button>
        )}

        {itemCount > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja limpar todas as artes da folha?')) {
                onClearSheet();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
          >
            <Trash2 size={14} />
            <span>Limpar Todas as Artes</span>
          </button>
        )}
      </div>
    </div>
  );
};
