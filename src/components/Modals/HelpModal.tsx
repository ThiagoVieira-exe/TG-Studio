import React from 'react';
import { X, Keyboard, Lightbulb, Printer } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">
              Atalhos & Guia de Preparação Gráfica
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs text-zinc-300 max-h-[75vh] overflow-y-auto">
          {/* Shortcuts Table */}
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Keyboard size={14} className="text-indigo-400" />
              <span>Atalhos de Teclado</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Desfazer:</span>
                <span className="text-indigo-300 font-bold">Ctrl + Z</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Refazer:</span>
                <span className="text-indigo-300 font-bold">Ctrl + Y</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Duplicar:</span>
                <span className="text-indigo-300 font-bold">Ctrl + D</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Selecionar tudo:</span>
                <span className="text-indigo-300 font-bold">Ctrl + A</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Copiar / Colar:</span>
                <span className="text-indigo-300 font-bold">Ctrl + C / V</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Excluir:</span>
                <span className="text-rose-400 font-bold">Delete</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Agrupar Artes:</span>
                <span className="text-amber-400 font-bold">Ctrl + G</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Desagrupar:</span>
                <span className="text-amber-400 font-bold">Ctrl + Shift + G</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Mover Folha (Pan):</span>
                <span className="text-amber-300 font-bold">Espaço + Drag</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Encaixe Inteligente:</span>
                <span className="text-emerald-300 font-bold">Tecla S</span>
              </div>
            </div>
          </div>

          {/* Silhouette Studio Inspiration & Tips */}
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Lightbulb size={14} className="text-amber-400" />
              <span>Dicas de Montagem & Impressão</span>
            </h4>
            <ul className="space-y-2 text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-zinc-200">Redimensionamento Exato:</strong> Você pode digitar livremente qualquer largura e altura em milímetros (precisão 0,1 mm). A arte se ajusta esticando ou achatando sem cortar nenhuma parte!
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-zinc-200">Encaixe 0 mm para Guilhotina:</strong> Ao definir o espaçamento para 0 mm, artes encostam perfeitamente borda a borda para corte único sem desperdício de papel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-zinc-200">Conta-gotas da Borda:</strong> Ative a ferramenta conta-gotas para capturar a cor exata de qualquer pixel da sua logo ou arte e aplicar à borda externa.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-zinc-200">Área Externa (Mesa):</strong> Deixe artes e elementos de apoio na área escura fora da folha enquanto organiza a montagem final.
                </span>
              </li>
            </ul>
          </div>

          {/* Direct Printing Note */}
          <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-900/60 flex items-start gap-2.5">
            <Printer size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-indigo-200 leading-tight">
              <strong>Impressão 100% Escala Real:</strong> Na janela de impressão do navegador ou ao imprimir o PDF gerado, selecione <em>"Escala: Padrão"</em> ou <em>"100%"</em> e desative <em>"Ajustar à página"</em> para garantir medidas físicas idênticas à régua.
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
