import React from 'react';
import type { ToolMode } from '../types';
import {
  MousePointer,
  Hand,
  ImagePlus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Magnet,
  Copy,
  Trash2,
  Grid,
  Group,
  Ungroup,
  Crosshair,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface ToolbarProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onImportClick: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoom100: () => void;
  snappingEnabled: boolean;
  onToggleSnapping: () => void;
  selectedCount: number;
  hasSelectedLocked: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  onCenterOnSheet: (axis?: 'both' | 'horizontal' | 'vertical') => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onToggleLockSelected: () => void;
  onAlignSelected: (align: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  onOpenGridModal: () => void;
  onRotateSelection?: (delta: number) => void;
}

const ToolbarSeparator: React.FC = () => (
  <div className="h-5 w-[1px] bg-zinc-800 mx-0.5 shrink-0" />
);

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  active,
  onClick,
  title,
  className,
  children,
}) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded transition text-xs ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : className || 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
    }`}
    title={title}
  >
    {children}
  </button>
);

export const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  onSetToolMode,
  onImportClick,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoom100,
  snappingEnabled,
  onToggleSnapping,
  selectedCount,
  canGroup,
  canUngroup,
  onGroup,
  onUngroup,
  onCenterOnSheet,
  onDuplicateSelected,
  onDeleteSelected,
  onOpenGridModal,
  onRotateSelection,
}) => {
  return (
    <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-2 z-30 select-none text-zinc-300">
      {/* ── Left: Navigation + Import + Key Actions ── */}
      <div className="flex items-center gap-1">
        {/* Select / Pan */}
        <div className="flex items-center bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
          <ToolbarButton
            active={toolMode === 'select'}
            onClick={() => onSetToolMode('select')}
            title="Selecionar (V)"
          >
            <MousePointer size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={toolMode === 'pan'}
            onClick={() => onSetToolMode('pan')}
            title="Mão (H)"
          >
            <Hand size={15} />
          </ToolbarButton>
        </div>

          <ToolbarSeparator />

        {/* Import — Primary Action */}
        <button
          onClick={onImportClick}
          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-medium transition shadow-sm"
          title="Importar imagens (PNG, JPG, SVG, PDF)"
        >
          <ImagePlus size={14} />
          <span>Importar</span>
        </button>

        {/* ── Context Actions (visible when items selected) ── */}
        {selectedCount > 0 && (
          <>
            <ToolbarSeparator />

            {/* Duplicate — Highlighted */}
            <button
              onClick={onDuplicateSelected}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-[11px] transition border border-zinc-700"
              title="Duplicar (Ctrl+D)"
            >
              <Copy size={13} />
              <span>Duplicar</span>
            </button>

            {/* Grid — Highlighted */}
            {selectedCount === 1 && (
              <button
                onClick={onOpenGridModal}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-md text-[11px] transition border border-indigo-500/40 font-medium"
                title="Duplicar em Grade"
              >
                <Grid size={13} />
                <span>Grade</span>
              </button>
            )}

            {/* Center on Sheet — Highlighted */}
            <button
              onClick={() => onCenterOnSheet('both')}
              className="flex items-center gap-1 px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 rounded-md text-[11px] transition border border-cyan-500/40 font-medium"
              title="Centralizar na Folha"
            >
              <Crosshair size={13} className="text-cyan-400" />
              <span>Centralizar</span>
            </button>

            {/* Rotate Selection / Group */}
            {onRotateSelection && (
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
                <button
                  type="button"
                  onClick={() => onRotateSelection(-90)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                  title="Girar artes selecionadas 90° anti-horário (mantém formação relativa)"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onRotateSelection(90)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                  title="Girar artes selecionadas 90° horário (mantém formação relativa)"
                >
                  <RotateCw size={13} />
                </button>
              </div>
            )}

            <ToolbarSeparator />

            {/* Group / Ungroup */}
            {canGroup && (
              <button
                onClick={onGroup}
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-md text-[11px] transition border border-amber-500/30"
                title="Agrupar (Ctrl+G)"
              >
                <Group size={13} />
                <span>Agrupar</span>
              </button>
            )}

            {canUngroup && (
              <button
                onClick={onUngroup}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-md text-[11px] transition border border-zinc-700"
                title="Desagrupar (Ctrl+Shift+G)"
              >
                <Ungroup size={13} />
              </button>
            )}

            {/* Delete */}
            <ToolbarButton
              onClick={onDeleteSelected}
              title="Excluir (Delete)"
              className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 size={14} />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* ── Center: Undo/Redo + Snapping ── */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
          <ToolbarButton
            onClick={onUndo}
            title="Desfazer (Ctrl+Z)"
            className={`text-zinc-400 ${!canUndo ? 'opacity-30' : 'hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <Undo2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={onRedo}
            title="Refazer (Ctrl+Y)"
            className={`text-zinc-400 ${!canRedo ? 'opacity-30' : 'hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <Redo2 size={15} />
          </ToolbarButton>
        </div>

        <button
          onClick={onToggleSnapping}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition ${
            snappingEnabled
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
          title="Encaixe Inteligente (S)"
        >
          <Magnet size={13} />
          <span>Snap</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              snappingEnabled ? 'bg-rose-500 animate-pulse' : 'bg-zinc-600'
            }`}
          />
        </button>
      </div>

      {/* ── Right: Zoom ── */}
      <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-md border border-zinc-800 text-xs">
        <ToolbarButton onClick={onZoomOut} title="Zoom − (−)">
          <ZoomOut size={14} />
        </ToolbarButton>
        <button
          onClick={onZoom100}
          className="px-1.5 py-0.5 text-zinc-300 hover:text-white font-mono rounded hover:bg-zinc-800 transition text-[11px] min-w-[40px] text-center"
          title="100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolbarButton onClick={onZoomIn} title="Zoom + (+)">
          <ZoomIn size={14} />
        </ToolbarButton>
        <div className="h-3.5 w-[1px] bg-zinc-800 mx-0.5" />
        <ToolbarButton onClick={onZoomFit} title="Ajustar à Tela">
          <Maximize2 size={13} />
        </ToolbarButton>
      </div>
    </div>
  );
};
