import React, { useState } from 'react';
import type { ArtItem, ToolMode } from '../../types';
import {
  Lock,
  Unlock,
  Pipette,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  RotateCw,
  RotateCcw,
  Grid,
  Check,
  Crosshair,
  Ungroup,
  ChevronDown,
  ChevronRight,
  Ban,
  ArrowLeftRight,
  Square,
  Circle,
} from 'lucide-react';
import { pickColorWithNativeEyeDropper } from '../../utils/colorSampler';
import { formatMeasure, POINT_IN_MM } from '../../utils/units';

interface PropertiesPanelProps {
  item: ArtItem;
  toolMode: ToolMode;
  onUpdate: (updates: Partial<ArtItem>) => void;
  onDuplicate: (item: ArtItem) => void;
  onDelete: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onSetToolMode: (mode: ToolMode) => void;
  onOpenGridModal: () => void;
  onCenterOnSheet?: (axis?: 'both' | 'horizontal' | 'vertical') => void;
  onUngroup?: () => void;
  onRotateSelection?: (delta: number) => void;
}

// ── Silhouette Studio 4.5 style palette ────────────────────────────────
// Organized in rows by hue family, 10 columns wide
const PALETTE_COLORS: string[][] = [
  // Row 1: Neutrals (black → white)
  ['#000000','#1a1a1a','#333333','#4d4d4d','#666666','#808080','#999999','#b3b3b3','#cccccc','#FFFFFF'],
  // Row 2: Warm reds → pinks
  ['#330000','#660000','#990000','#CC0000','#FF0000','#FF3333','#FF6666','#FF9999','#FFCCCC','#FFE5E5'],
  // Row 3: Oranges
  ['#331A00','#663300','#994D00','#CC6600','#FF8000','#FF9933','#FFB266','#FFCC99','#FFE0CC','#FFF0E5'],
  // Row 4: Yellows
  ['#333300','#666600','#999900','#CCCC00','#FFFF00','#FFFF33','#FFFF66','#FFFF99','#FFFFCC','#FFFFE5'],
  // Row 5: Greens
  ['#003300','#006600','#009900','#00CC00','#00FF00','#33FF33','#66FF66','#99FF99','#CCFFCC','#E5FFE5'],
  // Row 6: Teals / Cyans
  ['#003333','#006666','#009999','#00CCCC','#00FFFF','#33FFFF','#66FFFF','#99FFFF','#CCFFFF','#E5FFFF'],
  // Row 7: Blues
  ['#000033','#000066','#000099','#0000CC','#0000FF','#3333FF','#6666FF','#9999FF','#CCCCFF','#E5E5FF'],
  // Row 8: Purples
  ['#330033','#660066','#990099','#CC00CC','#FF00FF','#FF33FF','#FF66FF','#FF99FF','#FFCCFF','#FFE5FF'],
];

// Recent-use colors row (will be updated dynamically)
const DEFAULT_RECENT: string[] = [
  '#000000','#FFFFFF','#EF4444','#3B82F6','#10B981',
  '#FACC15','#6B7280','#EC4899','#06B6D4','#F97316',
];

const parseMeasure = (value: string): number =>
  Number.parseFloat(value.trim().replace(',', '.'));

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  item,
  toolMode,
  onUpdate,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onSetToolMode,
  onOpenGridModal,
  onCenterOnSheet,
  onUngroup,
  onRotateSelection,
}) => {
  const [customHex, setCustomHex] = useState(item.border.color);
  const [recentColors, setRecentColors] = useState<string[]>(DEFAULT_RECENT);
  const [showRotationLayer, setShowRotationLayer] = useState(false);
  const [borderUnit, setBorderUnit] = useState<'mm' | 'pt'>('pt');
  const [widthDraft, setWidthDraft] = useState(formatMeasure(item.width));
  const [heightDraft, setHeightDraft] = useState(formatMeasure(item.height));
  const [xDraft, setXDraft] = useState(formatMeasure(item.x));
  const [yDraft, setYDraft] = useState(formatMeasure(item.y));
  const [borderDraft, setBorderDraft] = useState(formatMeasure(item.border.width));

  const [prevSync, setPrevSync] = useState({
    id: item.id,
    w: item.width,
    h: item.height,
    x: item.x,
    y: item.y,
    bw: item.border.width,
    unit: borderUnit,
  });

  if (
    prevSync.id !== item.id ||
    prevSync.w !== item.width ||
    prevSync.h !== item.height ||
    prevSync.x !== item.x ||
    prevSync.y !== item.y ||
    prevSync.bw !== item.border.width ||
    prevSync.unit !== borderUnit
  ) {
    setPrevSync({
      id: item.id,
      w: item.width,
      h: item.height,
      x: item.x,
      y: item.y,
      bw: item.border.width,
      unit: borderUnit,
    });
    setWidthDraft(formatMeasure(item.width));
    setHeightDraft(formatMeasure(item.height));
    setXDraft(formatMeasure(item.x));
    setYDraft(formatMeasure(item.y));
    setBorderDraft(formatMeasure(borderUnit === 'mm' ? item.border.width : item.border.width * 72 / 25.4));
  }

  // Push color into recent list
  const pushRecent = (hex: string) => {
    setRecentColors((prev) => {
      const upper = hex.toUpperCase();
      const filtered = prev.filter((c) => c.toUpperCase() !== upper);
      return [upper, ...filtered].slice(0, 10);
    });
  };

  // Apply a border color
  const applyColor = (hex: string) => {
    onUpdate({
      border: {
        ...item.border,
        color: hex,
        enabled: true,
        width: item.border.width === 0 ? POINT_IN_MM : item.border.width,
      },
    });
    setCustomHex(hex);
    pushRecent(hex);
  };

  // Handle Width change with aspect ratio logic
  const handleWidthChange = (valStr: string) => {
    const val = parseMeasure(valStr);
    if (isNaN(val) || val <= 0) return;
    const rounded = val;

    if (item.aspectRatioLocked && item.width > 0) {
      const ratio = item.height / item.width;
      const newHeight = rounded * ratio;
      onUpdate({ width: rounded, height: Math.max(1, newHeight) });
    } else {
      onUpdate({ width: rounded });
    }
  };

  const commitWidth = () => {
    handleWidthChange(widthDraft);
  };

  // Handle Height change with aspect ratio logic
  const handleHeightChange = (valStr: string) => {
    const val = parseMeasure(valStr);
    if (isNaN(val) || val <= 0) return;
    const rounded = val;

    if (item.aspectRatioLocked && item.height > 0) {
      const ratio = item.width / item.height;
      const newWidth = rounded * ratio;
      onUpdate({ height: rounded, width: Math.max(1, newWidth) });
    } else {
      onUpdate({ height: rounded });
    }
  };

  const commitHeight = () => {
    handleHeightChange(heightDraft);
  };

  // Eyedropper click handler
  const handleEyedropperClick = async () => {
    // Try native EyeDropper first (Chrome/Edge)
    const picked = await pickColorWithNativeEyeDropper();
    if (picked) {
      applyColor(picked);
      return;
    }

    // Otherwise activate canvas eyedropper mode
    if (toolMode === 'eyedropper') {
      onSetToolMode('select');
    } else {
      onSetToolMode('eyedropper');
    }
  };

  const borderValueInSelectedUnit = borderUnit === 'mm'
    ? item.border.width
    : item.border.width * 72 / 25.4;

  const handleBorderUnitValueChange = (valStr: string) => {
    const val = parseMeasure(valStr);
    if (isNaN(val) || val < 0) return;
    const widthMm = borderUnit === 'mm' ? val : val * 25.4 / 72;
    onUpdate({
      border: {
        ...item.border,
        width: widthMm,
        enabled: widthMm > 0 ? true : item.border.enabled,
      },
    });
  };

  // Single color swatch component
  const Swatch: React.FC<{ hex: string; size?: number; title?: string }> = ({
    hex,
    size = 18,
    title,
  }) => {
    const isSelected = item.border.color.toUpperCase() === hex.toUpperCase();
    const isLight = hex.toUpperCase() === '#FFFFFF' || hex.toUpperCase() === '#FFFFE5' || hex.toUpperCase() === '#FFFFCC';
    return (
      <button
        onClick={() => applyColor(hex)}
        className={`rounded-[2px] border transition-all flex items-center justify-center shrink-0 ${
          isSelected
            ? 'border-indigo-400 ring-2 ring-indigo-500/60 scale-110 z-10'
            : 'border-zinc-700/60 hover:scale-110 hover:border-zinc-500'
        }`}
        style={{
          backgroundColor: hex,
          width: size,
          height: size,
        }}
        title={title || hex}
      >
        {isSelected && (
          <Check size={size > 16 ? 10 : 8} className={isLight ? 'text-black' : 'text-white'} />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-zinc-200 text-xs select-none">
      {/* Header with Title and Thumbnail */}
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={item.src}
            alt={item.name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-zinc-100 truncate" title={item.name}>
            {item.name}
          </p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            {item.naturalWidth} × {item.naturalHeight} px
          </p>
        </div>
        <button
          onClick={() => onUpdate({ locked: !item.locked })}
          className={`p-1.5 rounded transition ${
            item.locked
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
          title={item.locked ? 'Destravar objeto' : 'Travar objeto'}
        >
          {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>

      {/* ═══ Dimensions & Proportions ═══ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-300 text-[11px]">Dimensões (mm)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate({ width: item.height, height: item.width })}
              disabled={item.locked}
              className="flex items-center justify-center w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
              title="Inverter largura e altura"
            >
              <ArrowLeftRight size={12} />
            </button>
            <button
              onClick={() => onUpdate({ aspectRatioLocked: !item.aspectRatioLocked })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition ${
                item.aspectRatioLocked
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
              title="Bloquear/Desbloquear proporção"
            >
              {item.aspectRatioLocked ? <Lock size={9} /> : <Unlock size={9} />}
              <span>{item.aspectRatioLocked ? 'Proporcional' : 'Livre'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-0.5">Largura</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                step="any"
                min="1"
                value={widthDraft}
                disabled={item.locked}
                onChange={(e) => setWidthDraft(e.target.value)}
                onBlur={commitWidth}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 pr-8 font-mono text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <span className="absolute right-2 top-1.5 text-zinc-500 font-mono text-[10px]">
                mm
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-0.5">Altura</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                step="any"
                min="1"
                value={heightDraft}
                disabled={item.locked}
                onChange={(e) => setHeightDraft(e.target.value)}
                onBlur={commitHeight}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 pr-8 font-mono text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <span className="absolute right-2 top-1.5 text-zinc-500 font-mono text-[10px]">
                mm
              </span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-3 gap-1 w-full">
          {[
            { label: '55x55', w: 55.5, h: 55.5 },
            { label: '55x90', w: 55.5, h: 92 },
            { label: '67x67', w: 66, h: 66 },
            { label: '65x95', w: 65, h: 95 },
            { label: '7x10cm', w: 70, h: 100 },
            { label: '10x14cm', w: 100, h: 140 },
          ].map((preset) => (
            <button
              key={preset.label}
              disabled={item.locked}
              onClick={() => onUpdate({ width: preset.w, height: preset.h })}
              className="w-full px-1 py-1 bg-zinc-800/80 hover:bg-zinc-700 rounded text-[9px] font-mono text-zinc-400 transition disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Shape (Retangular vs Redonda / Circular) ═══ */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-300 text-[11px]">Formato da Arte</span>
          {(item.isRound || item.shape === 'circle') && (
            <span className="text-[10px] text-indigo-400 font-mono">Borda Redonda Ativa</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onUpdate({ isRound: false, shape: 'rectangle' })}
            disabled={item.locked}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium border transition ${
              !item.isRound && item.shape !== 'circle'
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60 font-semibold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
            }`}
            title="Formato retangular / quadrado padrão"
          >
            <Square size={13} />
            <span>Retangular</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ isRound: true, shape: 'circle' })}
            disabled={item.locked}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium border transition ${
              item.isRound || item.shape === 'circle'
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60 font-semibold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
            }`}
            title="Formato redondo / circular (com borda e recorte circulares)"
          >
            <Circle size={13} />
            <span>Redonda</span>
          </button>
        </div>
      </div>

      {/* ═══ Position X & Y ═══ */}
      <div className="space-y-2">
        <span className="font-semibold text-zinc-300 text-[11px]">Posição (mm)</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-0.5">X</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                step="any"
                value={xDraft}
                disabled={item.locked}
                onChange={(e) => setXDraft(e.target.value)}
                onBlur={() => {
                  const val = parseMeasure(xDraft);
                  if (!isNaN(val)) onUpdate({ x: val });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 pr-8 font-mono text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <span className="absolute right-2 top-1.5 text-zinc-500 font-mono text-[10px]">
                mm
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-0.5">Y</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                step="any"
                value={yDraft}
                disabled={item.locked}
                onChange={(e) => setYDraft(e.target.value)}
                onBlur={() => {
                  const val = parseMeasure(yDraft);
                  if (!isNaN(val)) onUpdate({ y: val });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 pr-8 font-mono text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <span className="absolute right-2 top-1.5 text-zinc-500 font-mono text-[10px]">
                mm
              </span>
            </div>
          </div>
        </div>

        {onCenterOnSheet && (
          <button
            onClick={() => onCenterOnSheet('both')}
            disabled={item.locked}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 rounded transition disabled:opacity-50 text-[11px]"
            title="Centralizar arte no centro da folha"
          >
            <Crosshair size={13} className="text-cyan-400" />
            <span>Centralizar na Folha</span>
          </button>
        )}
      </div>

      {/* ═══ Border Settings — Silhouette Studio 4.5 Style ═══ */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-300 text-[11px]">Borda Externa</span>
          <button
            onClick={() =>
              onUpdate({
                border: {
                  ...item.border,
                  enabled: !item.border.enabled,
                  width: item.border.width === 0 ? POINT_IN_MM : item.border.width,
                },
              })
            }
            className={`w-9 h-[18px] flex items-center rounded-full p-0.5 transition ${
              item.border.enabled ? 'bg-indigo-600 justify-end' : 'bg-zinc-700 justify-start'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm block" />
          </button>
        </div>

        {item.border.enabled && (
          <div className="space-y-2.5 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">
            {/* Thickness */}
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Espessura</span>
                <span className="font-mono text-indigo-400">{formatMeasure(borderValueInSelectedUnit)} {borderUnit}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max={borderUnit === 'mm' ? 10 : 10 * 72 / 25.4}
                  step="any"
                  value={borderValueInSelectedUnit}
                  onChange={(e) => handleBorderUnitValueChange(e.target.value)}
                  className="w-full accent-indigo-500 h-1"
                />
                <select
                  value={borderUnit}
                  onChange={(e) => {
                    const nextUnit = e.target.value as 'mm' | 'pt';
                    setBorderUnit(nextUnit);
                    setBorderDraft(formatMeasure(nextUnit === 'mm' ? item.border.width : item.border.width * 72 / 25.4));
                  }}
                  className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1 py-1 font-mono text-zinc-100 text-[10px]"
                  title="Unidade da espessura da borda"
                >
                  <option value="mm">mm</option>
                  <option value="pt">pt</option>
                </select>
                <input
                  type="text"
                  inputMode="decimal"
                  step="any"
                  min="0.1"
                  value={borderDraft}
                  onChange={(e) => setBorderDraft(e.target.value)}
                  onBlur={() => handleBorderUnitValueChange(borderDraft)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-20 bg-zinc-950 border border-zinc-700 rounded px-1 py-0.5 font-mono text-zinc-100 text-right text-[10px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="text-[10px] text-zinc-400">Aplicação da borda</label>
              <select
                value={item.border.mode ?? 'outer'}
                onChange={(e) => onUpdate({ border: { ...item.border, mode: e.target.value as 'outer' | 'outer-inner' } })}
                className="flex-1 max-w-[150px] bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1 font-mono text-zinc-100 text-[10px]"
              >
                <option value="outer">Somente externa</option>
                <option value="outer-inner">Externa e interna</option>
              </select>
            </div>

            {/* ── Silhouette Studio 4.5 Color Palette ── */}
            <div className="space-y-1.5">
              {/* Current color preview + No border option */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-zinc-600 shrink-0"
                  style={{ backgroundColor: item.border.color }}
                  title={`Cor atual: ${item.border.color}`}
                />
                <span className="font-mono text-[10px] text-zinc-400 flex-1">{item.border.color}</span>
                <button
                  onClick={() =>
                    onUpdate({
                      border: { ...item.border, enabled: false },
                    })
                  }
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 transition"
                  title="Remover borda"
                >
                  <Ban size={10} />
                  <span>Sem borda</span>
                </button>
              </div>

              {/* Main Color Grid (8 rows × 10 columns) */}
              <div className="bg-zinc-950/60 p-1.5 rounded border border-zinc-800">
                <div className="flex flex-col gap-[2px]">
                  {PALETTE_COLORS.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-[2px]">
                      {row.map((hex) => (
                        <Swatch key={hex} hex={hex} size={17} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Colors */}
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Recentes</span>
                <div className="flex gap-[2px] mt-0.5">
                  {recentColors.map((hex, i) => (
                    <Swatch key={`recent-${i}-${hex}`} hex={hex} size={16} />
                  ))}
                </div>
              </div>

              {/* Custom Color Input + Picker + Eyedropper */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="color"
                  value={item.border.color}
                  onChange={(e) => {
                    const color = e.target.value.toUpperCase();
                    applyColor(color);
                  }}
                  className="w-7 h-7 rounded border border-zinc-700 cursor-pointer bg-transparent shrink-0"
                  title="Seletor de cor personalizada"
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                      applyColor(e.target.value.toUpperCase());
                    }
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 font-mono text-zinc-100 uppercase text-[10px]"
                  placeholder="#000000"
                />
                <button
                  onClick={handleEyedropperClick}
                  className={`p-1.5 rounded border transition flex items-center gap-1 ${
                    toolMode === 'eyedropper'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                  title="Conta-gotas: capturar cor de um pixel"
                >
                  <Pipette size={13} />
                </button>
              </div>
              {toolMode === 'eyedropper' && (
                <p className="text-[9px] text-rose-400 bg-rose-950/40 p-1 rounded border border-rose-900/50">
                  Clique sobre a arte para capturar a cor.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Rotation & Layer Ordering (collapsible) ═══ */}
      <div className="pt-2 border-t border-zinc-800">
        <button
          onClick={() => setShowRotationLayer(!showRotationLayer)}
          className="flex items-center gap-1.5 w-full text-[11px] text-zinc-400 hover:text-zinc-200 transition py-0.5"
        >
          {showRotationLayer ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>Rotação e Camadas</span>
          <span className="text-[9px] text-zinc-600 font-mono ml-auto">{item.rotation}°</span>
        </button>
        {showRotationLayer && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <label className="flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1">
                  <span className="text-[9px] text-zinc-500">Ângulo</span>
                  <input
                    type="number"
                    step="any"
                    value={item.rotation}
                    disabled={item.locked}
                    onChange={(e) => {
                      const value = parseMeasure(e.target.value);
                      if (Number.isFinite(value)) onUpdate({ rotation: value });
                    }}
                    className="w-14 bg-transparent font-mono text-zinc-100 text-[10px] text-right outline-none disabled:opacity-50"
                  />
                  <span className="text-[9px] text-zinc-500">°</span>
                </label>
            <button
              onClick={() => onUpdate({ rotation: (item.rotation + 90) % 360 })}
              className="flex-1 flex items-center justify-center gap-1 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition text-[10px]"
              title="Girar 90°"
            >
              <RotateCw size={12} />
              <span>90°</span>
            </button>
            <button onClick={() => onBringToFront(item.id)} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Topo">
              <ChevronsUp size={13} />
            </button>
            <button onClick={() => onBringForward(item.id)} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Avançar">
              <ArrowUp size={13} />
            </button>
            <button onClick={() => onSendBackward(item.id)} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Recuar">
              <ArrowDown size={13} />
            </button>
            <button onClick={() => onSendToBack(item.id)} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Fundo">
              <ChevronsDown size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="pt-2 border-t border-zinc-800 space-y-2">
        {item.groupId && onUngroup && (
          <button
            onClick={onUngroup}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 rounded transition text-[11px] font-medium"
            title="Desagrupar"
          >
            <Ungroup size={13} />
            <span>Desagrupar</span>
          </button>
        )}

        {item.groupId && onRotateSelection && (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onRotateSelection(-90)}
              className="flex items-center justify-center gap-1 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded transition text-[10px] font-medium"
              title="Girar todo o grupo 90° anti-horário mantendo arranjo relativo"
            >
              <RotateCcw size={12} />
              <span>Girar Grupo -90°</span>
            </button>
            <button
              type="button"
              onClick={() => onRotateSelection(90)}
              className="flex items-center justify-center gap-1 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded transition text-[10px] font-medium"
              title="Girar todo o grupo 90° horário mantendo arranjo relativo"
            >
              <RotateCw size={12} />
              <span>Girar Grupo +90°</span>
            </button>
          </div>
        )}

        <button
          onClick={onOpenGridModal}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded transition text-[11px] font-medium"
        >
          <Grid size={13} />
          <span>Duplicar em Grade...</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onDuplicate(item)}
            className="flex items-center justify-center gap-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition text-[11px]"
          >
            <Copy size={12} />
            <span>Duplicar</span>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center justify-center gap-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded transition text-[11px]"
          >
            <Trash2 size={12} />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
