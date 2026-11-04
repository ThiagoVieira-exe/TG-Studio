import React from 'react';
import type { PaperFormat, PaperOrientation, WorkspacePage } from '../types';
import {
  Printer,
  Download,
  FolderOpen,
  Save,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  pages: WorkspacePage[];
  currentPageId: string;
  onSwitchPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  paperFormat: PaperFormat;
  paperOrientation: PaperOrientation;
  onUpdateFormat: (fmt: PaperFormat) => void;
  onUpdateOrientation: (ori: PaperOrientation) => void;
  onSaveProject: () => void;
  onOpenProjectClick: () => void;
  onOpenExportModal: () => void;
  onPrintDirect: () => void;
  onOpenHelpModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pages,
  currentPageId,
  onSwitchPage,
  onAddPage,
  onDeletePage,
  paperFormat,
  paperOrientation,
  onUpdateFormat,
  onUpdateOrientation,
  onSaveProject,
  onOpenProjectClick,
  onOpenExportModal,
  onPrintDirect,
  onOpenHelpModal,
}) => {
  return (
    <header className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-40 select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-white/95 flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}tg-logo.png`}
              alt="Logo TG Studio"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-zinc-100 tracking-tight">TG STUDIO</span>
              <span className="text-[9px] px-1 py-0 bg-indigo-500/20 text-indigo-300 rounded font-mono border border-indigo-500/30">
                PRO
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-zinc-800" />

        <div className="h-7 w-px bg-zinc-800" />

        {/* Workspace pages */}
        <div className="flex items-center gap-1 max-w-[42vw] overflow-x-auto">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`flex items-center gap-1 rounded text-[11px] transition ${
                page.id === currentPageId
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              {pages.length > 1 && (
                <button
                  onClick={() => onDeletePage(page.id)}
                  className="pl-2 text-current/70 hover:text-rose-300 font-bold"
                  title="Excluir página"
                  aria-label={`Excluir ${page.name}`}
                >
                  ×
                </button>
              )}
              <button
                onClick={() => onSwitchPage(page.id)}
                className="whitespace-nowrap px-1.5 py-1"
                title={page.name}
              >
                {page.name.slice(0, 8)}
              </button>
            </div>
          ))}
          <button onClick={onAddPage} className="px-2 py-1 text-emerald-400 hover:bg-zinc-900 rounded text-sm" title="Nova página">+</button>
            {pages.length > 1 && (
            <button onClick={() => onDeletePage(currentPageId)} className="px-2 py-1 text-rose-400 hover:bg-zinc-900 rounded text-sm" title="Excluir página">×</button>
          )}
        </div>
      </div>

      {/* Quick Paper Format Bar */}
      <div className="hidden md:flex items-center gap-1.5 bg-zinc-900 p-0.5 rounded-md border border-zinc-800 text-xs">
        <button
          onClick={() => onUpdateFormat('A4')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
            paperFormat === 'A4'
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          A4
        </button>
        <button
          onClick={() => onUpdateFormat('A3')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
            paperFormat === 'A3'
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          A3
        </button>

        <div className="h-3.5 w-[1px] bg-zinc-800 mx-0.5" />

        <button
          onClick={() =>
            onUpdateOrientation(
              paperOrientation === 'portrait' ? 'landscape' : 'portrait'
            )
          }
          className="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-200 rounded font-mono text-[10px] transition"
          title="Alternar Retrato / Paisagem"
        >
          {paperOrientation === 'portrait' ? '↕' : '↔'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenHelpModal}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition"
          title="Atalhos e Dicas"
        >
          <HelpCircle size={16} />
        </button>

        <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block" />

        <button
          onClick={onOpenProjectClick}
          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-md text-[11px] font-medium transition"
          title="Abrir projeto (.tgstudio)"
        >
          <FolderOpen size={14} />
          <span className="hidden sm:inline">Abrir</span>
        </button>

        <button
          onClick={onSaveProject}
          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-md text-[11px] font-medium transition"
          title="Salvar projeto (.tgstudio)"
        >
          <Save size={14} />
          <span className="hidden sm:inline">Salvar</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/40 rounded-md text-[11px] font-medium transition"
          title="Exportar (PDF 300 DPI, PNG, JPG)"
        >
          <Download size={14} />
          <span>Exportar</span>
        </button>

        <button
          onClick={onPrintDirect}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:via-indigo-400 hover:to-cyan-400 text-white border border-indigo-400/60 rounded-md text-[11px] font-bold shadow-lg shadow-indigo-900/40 transition hover:scale-[1.02]"
          title="Imprimir — Ctrl+Shift+P"
        >
          <Printer size={15} />
          <span>Imprimir</span>
        </button>
      </div>
    </header>
  );
};
