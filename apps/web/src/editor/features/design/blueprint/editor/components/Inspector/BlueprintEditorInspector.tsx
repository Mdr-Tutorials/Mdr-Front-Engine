import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconPickerModal } from '@/editor/features/design/inspector/components/IconPickerModal';
import { MountedCssEditorModal } from '@/editor/features/design/inspector/components/classProtocol/MountedCssEditorModal';
import { InspectorContext } from '@/editor/features/design/inspector/InspectorContext';
import { InspectorTabBar } from '@/editor/features/design/inspector/components/InspectorTabBar';
import { InspectorBasicTab } from '@/editor/features/design/inspector/tabs/InspectorBasicTab';
import { InspectorStyleTab } from '@/editor/features/design/inspector/tabs/InspectorStyleTab';
import { InspectorDataTab } from '@/editor/features/design/inspector/tabs/InspectorDataTab';
import { InspectorCodeTab } from '@/editor/features/design/inspector/tabs/InspectorCodeTab';
import { useBlueprintEditorInspectorController } from '@/editor/features/design/BlueprintEditorInspector.controller';
import type { InspectorTab } from '@/editor/features/design/inspector/InspectorContext.types';

type BlueprintEditorInspectorProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function BlueprintEditorInspector({
  isCollapsed,
  onToggleCollapse,
}: BlueprintEditorInspectorProps) {
  const {
    t,
    selectedNode,
    isIconPickerOpen,
    setIconPickerOpen,
    selectedIconRef,
    applyIconRef,
    sectionContextValue,
    mountedCssEditor,
  } = useBlueprintEditorInspectorController();

  const [activeTab, setActiveTab] = useState<InspectorTab>('basic');

  if (isCollapsed) {
    return (
      <aside className="BlueprintEditorInspector Collapsed absolute top-3 right-0 z-7 h-0 w-0 overflow-visible border-0 bg-transparent shadow-none">
        <button
          type="button"
          className="BlueprintEditorCollapse absolute top-0 right-0 inline-flex h-8 w-6 items-center justify-center rounded-l-full rounded-r-none border border-r-0 border-(--border-default) bg-(--bg-canvas) p-0 pl-0.5 text-(--text-muted) shadow-(--shadow-md) hover:text-(--text-primary)"
          onClick={onToggleCollapse}
          aria-label={t('inspector.toggle')}
        >
          <ChevronLeft size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="BlueprintEditorInspector absolute top-0 right-0 bottom-0 z-4 flex min-h-0 w-(--inspector-width) flex-col rounded-[14px] bg-(--bg-canvas) shadow-(--shadow-md) ring-1 ring-(--border-subtle)">
      <div className="InspectorHeader flex items-center justify-between border-b border-(--border-subtle) px-4 py-2.5 text-[13px] font-semibold text-(--text-primary)">
        <span>{t('inspector.title')}</span>
        <button
          type="button"
          className="BlueprintEditorCollapse inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--text-muted) hover:text-(--text-primary)"
          onClick={onToggleCollapse}
          aria-label={t('inspector.toggle')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {selectedNode ? (
        <InspectorContext.Provider value={sectionContextValue}>
          <InspectorTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
            {activeTab === 'basic' && <InspectorBasicTab />}
            {activeTab === 'style' && <InspectorStyleTab />}
            {activeTab === 'data' && <InspectorDataTab />}
            {activeTab === 'code' && <InspectorCodeTab />}
          </div>
        </InspectorContext.Provider>
      ) : (
        <div className="InspectorPlaceholder px-4 pt-2 pb-3">
          <p className="m-0 text-xs text-(--text-muted)">
            {t('inspector.placeholder')}
          </p>
          <div className="InspectorSkeleton mt-3 grid gap-2">
            <span className="h-2 rounded-full bg-(--bg-raised)" />
            <span className="h-2 w-[80%] rounded-full bg-(--bg-raised)" />
            <span className="h-2 w-[65%] rounded-full bg-(--bg-raised)" />
            <span className="h-2 w-[90%] rounded-full bg-(--bg-raised)" />
          </div>
        </div>
      )}
      <IconPickerModal
        open={isIconPickerOpen}
        initialIconRef={selectedIconRef}
        onClose={() => setIconPickerOpen(false)}
        onSelect={applyIconRef}
      />
      <MountedCssEditorModal
        isOpen={mountedCssEditor.isMountedCssEditorOpen}
        path={mountedCssEditor.mountedCssEditorPath}
        value={mountedCssEditor.mountedCssEditorValue}
        highlightedClassName={mountedCssEditor.mountedCssEditorFocusClass}
        highlightedLine={mountedCssEditor.mountedCssEditorFocusLine}
        highlightedColumn={mountedCssEditor.mountedCssEditorFocusColumn}
        onChange={mountedCssEditor.setMountedCssEditorValue}
        onClose={mountedCssEditor.closeMountedCssEditor}
        onSave={mountedCssEditor.saveMountedCss}
      />
    </aside>
  );
}
