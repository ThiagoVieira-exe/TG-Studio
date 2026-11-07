import React, { useState } from 'react';
import type {
  ArtItem,
  PaperDimensions,
  PaperFormat,
  PaperOrientation,
  SnappingSettings,
  ToolMode,
} from '../../types';
import { Sliders, FileText, Layers } from 'lucide-react';
import { PropertiesPanel } from './PropertiesPanel';
import { MultiSelectionPanel } from './MultiSelectionPanel';
import { SheetSettings } from './SheetSettings';
import { LayersPanel } from './LayersPanel';

interface SidebarProps {
  paper: PaperDimensions;
  paperFormat: PaperFormat;
  paperOrientation: PaperOrientation;
  snapping: SnappingSettings;
  items: ArtItem[];
  selectedIds: string[];
  toolMode: ToolMode;
  onUpdateFormat: (format: PaperFormat) => void;
  onUpdateOrientation: (orientation: PaperOrientation) => void;
  onUpdateSnapping: (settings: Partial<SnappingSettings>) => void;
  onClearSheet: () => void;
  onUpdateItem: (id: string, updates: Partial<ArtItem>) => void;
  onDuplicateItem: (item: ArtItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteSelected: () => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onSetToolMode: (mode: ToolMode) => void;
  onOpenGridModal: () => void;
  onSelectLayersItem: (id: string, multi: boolean) => void;
  onToggleLock: (id: string) => void;
  onAlign: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  onDistribute: (axis: 'horizontal' | 'vertical') => void;
  onBatchUpdate: (updates: Partial<ArtItem>) => void;
  canGroup: boolean;
  canUngroup: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  onCenterOnSheet: (axis?: 'both' | 'horizontal' | 'vertical') => void;
  onRotateSelection?: (delta: number) => void;
}

type TabType = 'properties' | 'sheet' | 'layers';

export const Sidebar: React.FC<SidebarProps> = ({
  paper,
  paperFormat,
  paperOrientation,
  snapping,
  items,
  selectedIds,
  toolMode,
  onUpdateFormat,
  onUpdateOrientation,
  onUpdateSnapping,
  onClearSheet,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onSetToolMode,
  onOpenGridModal,
  onSelectLayersItem,
  onToggleLock,
  onAlign,
  onDistribute,
  onBatchUpdate,
  canGroup,
  canUngroup,
  onGroup,
  onUngroup,
  onCenterOnSheet,
  onRotateSelection,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('properties');

  // Auto-switch to properties tab when user selects an item (adjust during render, avoiding effect setState)
  const [prevSelectedCount, setPrevSelectedCount] = useState(selectedIds.length);
  if (selectedIds.length !== prevSelectedCount) {
    setPrevSelectedCount(selectedIds.length);
    if (selectedIds.length > 0 && prevSelectedCount === 0) {
      setActiveTab('properties');
    }
  }

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const singleItem = selectedItems.length === 1 ? selectedItems[0] : null;

  return (
    <aside className="w-80 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col z-30 select-none shadow-xl">
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition border-b-2 ${
            activeTab === 'properties'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Sliders size={14} />
          <span>Propriedades</span>
        </button>

        <button
          onClick={() => setActiveTab('sheet')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition border-b-2 ${
            activeTab === 'sheet'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <FileText size={14} />
          <span>Folha</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition border-b-2 ${
            activeTab === 'layers'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Layers size={14} />
          <span>Camadas</span>
          {items.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
              {items.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' && (
          <>
            {singleItem ? (
              <PropertiesPanel
                item={singleItem}
                toolMode={toolMode}
                onUpdate={(updates) => onUpdateItem(singleItem.id, updates)}
                onDuplicate={onDuplicateItem}
                onDelete={onDeleteItem}
                onBringForward={onBringForward}
                onSendBackward={onSendBackward}
                onBringToFront={onBringToFront}
                onSendToBack={onSendToBack}
                onSetToolMode={onSetToolMode}
                onOpenGridModal={onOpenGridModal}
                onCenterOnSheet={onCenterOnSheet}
                onUngroup={singleItem.groupId ? onUngroup : undefined}
                onRotateSelection={onRotateSelection}
              />
            ) : selectedItems.length > 1 ? (
              <MultiSelectionPanel
                selectedItems={selectedItems}
                canGroup={canGroup}
                canUngroup={canUngroup}
                onGroup={onGroup}
                onUngroup={onUngroup}
                onCenterOnSheet={onCenterOnSheet}
                onAlign={onAlign}
                onDistribute={onDistribute}
                onBatchUpdate={onBatchUpdate}
                onDeleteSelected={onDeleteSelected}
                onRotateSelection={onRotateSelection}
              />
            ) : (
              <SheetSettings
                paper={paper}
                paperFormat={paperFormat}
                paperOrientation={paperOrientation}
                snapping={snapping}
                itemCount={items.length}
                onUpdateFormat={onUpdateFormat}
                onUpdateOrientation={onUpdateOrientation}
                onUpdateSnapping={onUpdateSnapping}
                onClearSheet={onClearSheet}
                onCenterAllOnSheet={() => onCenterOnSheet('both')}
              />
            )}
          </>
        )}

        {activeTab === 'sheet' && (
          <SheetSettings
            paper={paper}
            paperFormat={paperFormat}
            paperOrientation={paperOrientation}
            snapping={snapping}
            itemCount={items.length}
            onUpdateFormat={onUpdateFormat}
            onUpdateOrientation={onUpdateOrientation}
            onUpdateSnapping={onUpdateSnapping}
            onClearSheet={onClearSheet}
            onCenterAllOnSheet={() => onCenterOnSheet('both')}
          />
        )}

        {activeTab === 'layers' && (
          <LayersPanel
            items={items}
            selectedIds={selectedIds}
            paper={paper}
            onSelect={onSelectLayersItem}
            onToggleLock={onToggleLock}
            onDelete={onDeleteItem}
          />
        )}
      </div>
    </aside>
  );
};
