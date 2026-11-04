import React from 'react';
import type { ArtItem, PaperDimensions } from '../../types';
import { Lock, Unlock, Trash2, Layers } from 'lucide-react';
import { formatMeasure } from '../../utils/units';

interface LayersPanelProps {
  items: ArtItem[];
  selectedIds: string[];
  paper: PaperDimensions;
  onSelect: (id: string, multi: boolean) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  items,
  selectedIds,
  paper,
  onSelect,
  onToggleLock,
  onDelete,
}) => {
  // Sort descending by zIndex so highest layer appears at top of list
  const sorted = [...items].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex flex-col h-full text-zinc-200 text-xs select-none">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-zinc-100">
          <Layers size={15} className="text-indigo-400" />
          <span>Camadas e Objetos ({items.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-2 space-y-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-center p-4">
            <Layers size={32} className="stroke-zinc-600 mb-2 opacity-50" />
            <p className="font-medium">Nenhum objeto na folha</p>
            <p className="text-[11px] mt-1 text-zinc-600">
              Arraste imagens para o canvas ou clique em "Importar Imagens"
            </p>
          </div>
        ) : (
          sorted.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isOnSheet =
              item.x >= 0 &&
              item.y >= 0 &&
              item.x + item.width <= paper.width &&
              item.y + item.height <= paper.height;

            return (
              <div
                key={item.id}
                onClick={(e) => onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey)}
                className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-indigo-600/25 border border-indigo-500/60 text-white'
                    : 'bg-zinc-900/50 hover:bg-zinc-800/80 border border-transparent text-zinc-300'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded bg-zinc-950 border border-zinc-700/80 shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                  <img
                    src={item.src}
                    alt={item.name}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs truncate leading-tight" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5 font-mono">
                    <span>
                      {formatMeasure(item.width)}×{formatMeasure(item.height)}mm
                    </span>
                    {item.groupId && (
                      <span className="px-1 py-0.2 bg-amber-500/25 text-amber-300 rounded text-[9px] font-sans font-medium">
                        Grupo
                      </span>
                    )}
                    {!isOnSheet && (
                      <span className="px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[9px]">
                        Área Externa
                      </span>
                    )}
                    {item.border.enabled && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-zinc-600 inline-block"
                        style={{ backgroundColor: item.border.color }}
                        title={`Borda ${formatMeasure(item.border.width)}mm`}
                      />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(item.id);
                    }}
                    className={`p-1 rounded transition ${
                      item.locked
                        ? 'text-amber-400 bg-amber-500/20'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
                    }`}
                    title={item.locked ? 'Destravar' : 'Travar'}
                  >
                    {item.locked ? <Lock size={13} /> : <Unlock size={13} />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
