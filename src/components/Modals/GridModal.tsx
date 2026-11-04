import React, { useState } from 'react';
import type { ArtItem, PaperDimensions } from '../../types';
import { X, Grid, Sparkles, Layers } from 'lucide-react';
import { formatMeasure } from '../../utils/units';

interface GridModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: ArtItem | null;
  paper: PaperDimensions;
  margin?: number;
  onApplyGrid: (
    updatedTarget: { id: string; x: number; y: number; groupId?: string },
    newItems: ArtItem[]
  ) => void;
}

export const GridModal: React.FC<GridModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  paper,
  margin = 5,
  onApplyGrid,
}) => {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(4);
  const [spacingX, setSpacingX] = useState(2.0);
  const [spacingY, setSpacingY] = useState(2.0);
  const [startFromMargin, setStartFromMargin] = useState(true);
  const [autoGroup, setAutoGroup] = useState(true);

  if (!isOpen || !targetItem) return null;

  const bWidth = targetItem.border.enabled && targetItem.border.width > 0 ? targetItem.border.width : 0;
  const totalItemW = targetItem.width + bWidth * 2;
  const totalItemH = targetItem.height + bWidth * 2;

  // Auto calculate maximum copies fitting on the sheet
  const handleAutoFill = () => {
    const availW = paper.width - margin * 2;
    const availH = paper.height - margin * 2;

    const maxCols = Math.max(1, Math.floor((availW + spacingX) / (totalItemW + spacingX)));
    const maxRows = Math.max(1, Math.floor((availH + spacingY) / (totalItemH + spacingY)));

    setCols(maxCols);
    setRows(maxRows);
    setStartFromMargin(true);
  };

  const handleGenerate = () => {
    const startX = startFromMargin ? margin + bWidth : targetItem.x;
    const startY = startFromMargin ? margin + bWidth : targetItem.y;

    const groupId = autoGroup ? `group-grid-${Date.now()}` : targetItem.groupId;

    // 1. Updated target item (cell 0, 0)
    const updatedTarget = {
      id: targetItem.id,
      x: startX,
      y: startY,
      groupId,
    };

    // 2. Clones for all other cells
    const itemsToAdd: ArtItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip position (0, 0) because that is the targetItem itself
        if (r === 0 && c === 0) continue;

        const posX = startX + c * (totalItemW + spacingX);
        const posY = startY + r * (totalItemH + spacingY);

        itemsToAdd.push({
          ...targetItem,
          id: `item-${Date.now()}-${r}-${c}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${targetItem.name} (${c + 1},${r + 1})`,
          x: posX,
          y: posY,
          groupId,
          zIndex: targetItem.zIndex + (r * cols + c),
        });
      }
    }

    onApplyGrid(updatedTarget, itemsToAdd);
    onClose();
  };

  const totalCopies = cols * rows;
  const gridTotalW = cols * totalItemW + (cols - 1) * spacingX;
  const gridTotalH = rows * totalItemH + (rows - 1) * spacingY;
  const fitsWidth = gridTotalW <= paper.width - margin * 2;
  const fitsHeight = gridTotalH <= paper.height - margin * 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Grid size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">
              Duplicar em Grade (Aproveitamento de Folha)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-zinc-300">
          {/* Target Item Info & Auto fill button */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <div>
              <span className="font-medium text-zinc-200">{targetItem.name}</span>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Tamanho com borda: {formatMeasure(totalItemW)} × {formatMeasure(totalItemH)} mm
              </p>
            </div>
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition"
              title="Calcular automaticamente o número máximo de cópias que cabem na folha"
            >
              <Sparkles size={13} />
              <span>Preencher Máximo</span>
            </button>
          </div>

          {/* Columns & Rows */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Colunas (Horizontal):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 font-mono text-zinc-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Linhas (Vertical):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 font-mono text-zinc-100 text-sm"
              />
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Espaço Horizontal (mm):</label>
              <input
                type="number"
                step="any"
                min="0"
                value={spacingX}
                onChange={(e) => setSpacingX(Math.max(0, Number.parseFloat(e.target.value.replace(',', '.')) || 0))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 font-mono text-zinc-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Espaço Vertical (mm):</label>
              <input
                type="number"
                step="any"
                min="0"
                value={spacingY}
                onChange={(e) => setSpacingY(Math.max(0, Number.parseFloat(e.target.value.replace(',', '.')) || 0))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 font-mono text-zinc-100 text-sm"
              />
            </div>
          </div>

          {/* Start Position Options */}
          <div className="space-y-2 pt-1 border-t border-zinc-800">
            <label className="block text-zinc-400 font-medium">Posição de Início da Grade:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStartFromMargin(true)}
                className={`py-2 px-2.5 rounded-lg border text-[11px] transition text-left ${
                  startFromMargin
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div>Alinhar na Margem</div>
                <div className="text-[10px] text-zinc-500">
                  {margin}mm do topo/esquerda
                </div>
              </button>
              <button
                type="button"
                onClick={() => setStartFromMargin(false)}
                className={`py-2 px-2.5 rounded-lg border text-[11px] transition text-left ${
                  !startFromMargin
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div>Posição Atual da Arte</div>
                <div className="text-[10px] text-zinc-500">
                  X: {formatMeasure(targetItem.x)} / Y: {formatMeasure(targetItem.y)} mm
                </div>
              </button>
            </div>
          </div>

          {/* Auto Group checkbox */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGroup}
                onChange={(e) => setAutoGroup(e.target.checked)}
                className="rounded border-zinc-700 text-indigo-600 focus:ring-0 bg-zinc-950"
              />
              <span className="text-[11px] text-zinc-200 flex items-center gap-1.5">
                <Layers size={13} className="text-amber-400" />
                <span>Agrupar todas as cópias da grade como um único objeto</span>
              </span>
            </label>
            <p className="text-[10px] text-zinc-500 ml-5 mt-0.5">
              Permite mover e centralizar a grade inteira na folha sem desfazer a formação.
            </p>
          </div>

          {/* Grid Summary */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1 text-[11px] font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Total de artes:</span>
              <span className="text-indigo-400 font-bold text-sm">{totalCopies} cópias</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Área ocupada pela grade:</span>
              <span className="text-zinc-200">
                {formatMeasure(gridTotalW)} × {formatMeasure(gridTotalH)} mm
              </span>
            </div>
            {(!fitsWidth || !fitsHeight) && (
              <p className="text-amber-400 text-[10px] pt-1">
                ⚠️ A grade ultrapassa as margens da folha ({paper.width}×{paper.height}mm).
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow transition"
          >
            Gerar Grade na Folha
          </button>
        </div>
      </div>
    </div>
  );
};
