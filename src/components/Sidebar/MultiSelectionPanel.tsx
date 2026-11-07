import React, { useState } from 'react';
import type { ArtItem } from '../../types';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Trash2,
  Lock,
  Unlock,
  Group,
  Ungroup,
  Crosshair,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { getCombinedBounds } from '../../utils/units';
import { formatMeasure } from '../../utils/units';

const parseMeasure = (value: string): number =>
  Number.parseFloat(value.trim().replace(',', '.'));

interface MultiSelectionPanelProps {
  selectedItems: ArtItem[];
  canGroup: boolean;
  canUngroup: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  onCenterOnSheet: (axis?: 'both' | 'horizontal' | 'vertical') => void;
  onAlign: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  onDistribute: (axis: 'horizontal' | 'vertical') => void;
  onBatchUpdate: (updates: Partial<ArtItem>) => void;
  onDeleteSelected: () => void;
  onRotateSelection?: (delta: number) => void;
}

export const MultiSelectionPanel: React.FC<MultiSelectionPanelProps> = ({
  selectedItems,
  canGroup,
  canUngroup,
  onGroup,
  onUngroup,
  onCenterOnSheet,
  onAlign,
  onDistribute,
  onBatchUpdate,
  onDeleteSelected,
  onRotateSelection,
}) => {
  const combined = getCombinedBounds(selectedItems, 'outer');
  const allLocked = selectedItems.every((i) => i.locked);
  const isUnifiedGroup =
    selectedItems.length > 1 &&
    Boolean(selectedItems[0].groupId) &&
    selectedItems.every((i) => i.groupId === selectedItems[0].groupId);

  const firstBorder = selectedItems[0]?.border;
  const sameBorderWidth = selectedItems.every((i) => i.border.width === firstBorder?.width);
  const sameBorderColor = selectedItems.every((i) => i.border.color.toUpperCase() === firstBorder?.color.toUpperCase());
  const [borderUnit, setBorderUnit] = useState<'mm' | 'pt'>('pt');
  const displayBorderWidth = sameBorderWidth
    ? (borderUnit === 'mm' ? firstBorder?.width : (firstBorder?.width ?? 0) * 72 / 25.4)
    : '';
  const [borderDraft, setBorderDraft] = useState(
    displayBorderWidth === '' ? '' : formatMeasure(displayBorderWidth)
  );

  const [prevSync, setPrevSync] = useState({ displayBorderWidth, borderUnit });
  if (prevSync.displayBorderWidth !== displayBorderWidth || prevSync.borderUnit !== borderUnit) {
    setPrevSync({ displayBorderWidth, borderUnit });
    setBorderDraft(displayBorderWidth === '' ? '' : formatMeasure(displayBorderWidth));
  }

  const updateBorders = (changes: Partial<ArtItem['border']>) => {
    onBatchUpdate({ border: { ...firstBorder, ...changes } });
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-zinc-200 text-xs select-none">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
            {isUnifiedGroup && <span className="text-amber-400">★</span>}
            <span>{isUnifiedGroup ? 'Grupo de Imagens' : 'Múltipla Seleção'}</span>
            <span className="text-zinc-400 font-normal">({selectedItems.length})</span>
          </h3>
        </div>
        {combined && (
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
            Área total: {formatMeasure(combined.width)} × {formatMeasure(combined.height)} mm
          </p>
        )}
      </div>

      {/* Grouping Actions */}
      <div className="space-y-2">
        <span className="font-semibold text-zinc-300">Organização em Grupo</span>
        <div className="grid grid-cols-2 gap-2">
          {canGroup && (
            <button
              onClick={onGroup}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold transition"
              title="Agrupar artes em um único bloco para mover e centralizar sem perder a formação (Ctrl+G)"
            >
              <Group size={15} />
              <span>Agrupar</span>
            </button>
          )}

          {canUngroup && (
            <button
              onClick={onUngroup}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 bg-zinc-850 hover:bg-zinc-800 text-amber-300 border border-zinc-700 rounded-lg transition ${
                !canGroup ? 'col-span-2' : ''
              }`}
              title="Desagrupar artes (Ctrl+Shift+G)"
            >
              <Ungroup size={15} />
              <span>Desagrupar</span>
            </button>
          )}
        </div>
        <p className="text-[10px] text-zinc-500">
          Agrupar torna o conjunto uma única unidade, preservando posições relativas ao centralizar ou mover.
        </p>
      </div>

      {/* Center on Sheet Section */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <span className="font-semibold text-zinc-300">Centralizar na Folha</span>
        <button
          onClick={() => onCenterOnSheet('both')}
          className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 rounded-lg font-medium transition shadow-xs"
          title="Centralizar toda a formação no centro exato da folha (Horizontal e Vertical)"
        >
          <Crosshair size={15} className="text-cyan-400" />
          <span>Centralizar Todo o Grupo na Folha</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onCenterOnSheet('horizontal')}
            className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded text-[11px] transition"
            title="Centralizar apenas Horizontalmente na Folha"
          >
            Centro Horizontal
          </button>
          <button
            onClick={() => onCenterOnSheet('vertical')}
            className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded text-[11px] transition"
            title="Centralizar apenas Verticalmente na Folha"
          >
            Centro Vertical
          </button>
        </div>
      </div>

      {/* Alignment Tools */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <span className="font-semibold text-zinc-300">Alinhamento Relativo</span>
        <div className="grid grid-cols-3 gap-1.5 bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => onAlign('left')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition"
            title="Alinhar à Esquerda"
          >
            <AlignLeft size={14} />
            <span className="text-[10px]">Esquerda</span>
          </button>
          <button
            onClick={() => onAlign('center-h')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition"
            title="Centralizar Horizontalmente"
          >
            <AlignCenter size={14} />
            <span className="text-[10px]">Centro H</span>
          </button>
          <button
            onClick={() => onAlign('right')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition"
            title="Alinhar à Direita"
          >
            <AlignRight size={14} />
            <span className="text-[10px]">Direita</span>
          </button>

          <button
            onClick={() => onAlign('top')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition"
            title="Alinhar ao Topo"
          >
            <AlignVerticalJustifyStart size={14} />
            <span className="text-[10px]">Topo</span>
          </button>
          <button
            onClick={() => onAlign('center-v')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition"
            title="Centralizar Verticalmente"
          >
            <AlignVerticalJustifyCenter size={14} />
            <span className="text-[10px]">Centro V</span>
          </button>
          <button
            onClick={() => onAlign('bottom')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition"
            title="Alinhar à Base"
          >
            <AlignVerticalJustifyEnd size={14} />
            <span className="text-[10px]">Base</span>
          </button>
        </div>
      </div>

      {/* Rotate Selection / Group */}
      {onRotateSelection && (
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-300">Girar Seleção / Grupo</span>
            <span className="text-[10px] text-zinc-500">Mantém arranjo relativo</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onRotateSelection(-90)}
              className="flex items-center justify-center gap-1 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-medium transition"
              title="Girar todas as artes selecionadas 90° anti-horário mantendo formação"
            >
              <RotateCcw size={13} className="text-indigo-400" />
              <span>-90°</span>
            </button>
            <button
              type="button"
              onClick={() => onRotateSelection(90)}
              className="flex items-center justify-center gap-1 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-medium transition"
              title="Girar todas as artes selecionadas 90° horário mantendo formação"
            >
              <RotateCw size={13} className="text-indigo-400" />
              <span>+90°</span>
            </button>
            <button
              type="button"
              onClick={() => onRotateSelection(180)}
              className="flex items-center justify-center gap-1 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-medium transition"
              title="Girar todas as artes selecionadas 180° invertendo posição mantendo formação"
            >
              <span>180°</span>
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">
            Gira todas as artes ao mesmo tempo em torno do centro do grupo, preservando as distâncias relativas entre elas.
          </p>
        </div>
      )}

      {/* Distribution Tools */}
      <div className="space-y-2">
        <span className="font-semibold text-zinc-300">Distribuição Uniforme</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDistribute('horizontal')}
            className="flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition border border-zinc-700"
            title="Distribuir com espaçamento uniforme na horizontal"
          >
            <AlignHorizontalDistributeCenter size={15} />
            <span>Horizontal</span>
          </button>
          <button
            onClick={() => onDistribute('vertical')}
            className="flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition border border-zinc-700"
            title="Distribuir com espaçamento uniforme na vertical"
          >
            <AlignVerticalDistributeCenter size={15} />
            <span>Vertical</span>
          </button>
        </div>
      </div>

      {/* Batch Actions */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <span className="font-semibold text-zinc-300">Borda das artes selecionadas</span>
        <label className="flex items-center gap-2 text-[11px] text-zinc-300">
          <input
            type="checkbox"
            checked={selectedItems.every((i) => i.border.enabled)}
            onChange={(e) => updateBorders({ enabled: e.target.checked })}
            className="rounded border-zinc-700 bg-zinc-950"
          />
          Aplicar borda a todas
        </label>
        <div className="flex items-center gap-2">
          <select
            value={borderUnit}
            onChange={(e) => {
              const nextUnit = e.target.value as 'mm' | 'pt';
              setBorderUnit(nextUnit);
              const width = firstBorder?.width ?? 0;
              setBorderDraft(formatMeasure(nextUnit === 'mm' ? width : width * 72 / 25.4));
            }}
            className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1 py-1.5 font-mono text-zinc-100 text-xs"
          >
            <option value="mm">mm</option>
            <option value="pt">pt</option>
          </select>
          <input
            type="text"
            inputMode="decimal"
            step="any"
            min="0"
            value={borderDraft}
            placeholder={sameBorderWidth ? undefined : 'variado'}
            onChange={(e) => setBorderDraft(e.target.value)}
            onBlur={() => {
              const value = parseMeasure(borderDraft);
              if (Number.isFinite(value) && value >= 0) {
                const widthMm = borderUnit === 'mm' ? value : value * 25.4 / 72;
                updateBorders({ width: widthMm, enabled: widthMm > 0 });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            className="w-24 bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 font-mono text-zinc-100 text-xs"
          />
          <span className="text-zinc-500">{borderUnit}</span>
          <input
            type="color"
            value={sameBorderColor ? firstBorder?.color : '#000000'}
            onChange={(e) => updateBorders({ color: e.target.value.toUpperCase(), enabled: true })}
            className="ml-auto w-8 h-7 rounded border border-zinc-700 bg-transparent"
            title="Cor da borda para todas as artes"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">Aplicação:</span>
          <select
            value={selectedItems.every((item) => (item.border.mode ?? 'outer') === 'outer-inner') ? 'outer-inner' : 'outer'}
            onChange={(e) => updateBorders({ mode: e.target.value as 'outer' | 'outer-inner' })}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 font-mono text-zinc-100 text-[10px]"
          >
            <option value="outer">Somente externa</option>
            <option value="outer-inner">Externa e interna</option>
          </select>
        </div>
        <p className="text-[10px] text-zinc-500">A espessura aceita qualquer valor decimal digitado.</p>
      </div>

      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <span className="font-semibold text-zinc-300">Ações em Massa</span>
        <div className="space-y-1.5">
          <button
            onClick={() => onBatchUpdate({ locked: !allLocked })}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition"
          >
            {allLocked ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{allLocked ? 'Destravar Todos' : 'Travar Todos'}</span>
          </button>

          <button
            onClick={onDeleteSelected}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded transition"
          >
            <Trash2 size={14} />
            <span>Excluir Selecionados</span>
          </button>
        </div>
      </div>
    </div>
  );
};
