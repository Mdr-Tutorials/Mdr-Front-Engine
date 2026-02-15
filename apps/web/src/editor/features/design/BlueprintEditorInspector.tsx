import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconPickerModal } from './inspector/components/IconPickerModal';
import { MountedCssEditorModal } from './inspector/classProtocol/MountedCssEditorModal';
import { InspectorSectionContext } from './inspector/sections/InspectorSectionContext';
import { InspectorBasicSection } from './inspector/sections/InspectorBasicSection';
import { InspectorStyleSection } from './inspector/sections/InspectorStyleSection';
import { InspectorTriggersSection } from './inspector/sections/InspectorTriggersSection';
import { useBlueprintEditorInspectorController } from './BlueprintEditorInspector.controller';

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

  if (isCollapsed) {
    return (
      <aside className="BlueprintEditorInspector Collapsed absolute right-0 top-3 z-7 h-0 w-0 overflow-visible border-0 bg-transparent shadow-none">
        <button
          type="button"
          className="BlueprintEditorCollapse absolute right-0 top-0 inline-flex h-8 w-6 items-center justify-center rounded-r-none rounded-l-full border border-r-0 border-black/8 bg-(--color-0) p-0 pl-0.5 text-(--color-6) shadow-[0_10px_22px_rgba(0,0,0,0.14)] hover:text-(--color-9) dark:border-white/16 dark:shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
          onClick={onToggleCollapse}
          aria-label={t('inspector.toggle')}
        >
          <ChevronLeft size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="BlueprintEditorInspector absolute bottom-0 right-0 top-0 z-4 flex w-(--inspector-width) min-h-0 flex-col rounded-[14px] border border-black/6 bg-(--color-0) shadow-[0_12px_26px_rgba(0,0,0,0.08)] dark:border-transparent">
      <div className="InspectorHeader flex items-center justify-between border-b border-black/6 px-3 py-2.5 text-[13px] font-semibold text-(--color-9) dark:border-white/8">
        <span>{t('inspector.title')}</span>
        <button
          type="button"
          className="BlueprintEditorCollapse inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--color-6) hover:text-(--color-9)"
          onClick={onToggleCollapse}
          aria-label={t('inspector.toggle')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {selectedNode ? (
        <InspectorSectionContext.Provider value={sectionContextValue}>
          <div className="InspectorSection flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
            <InspectorBasicSection />
            <InspectorStyleSection />
            <InspectorTriggersSection />
          </div>
        </InspectorSectionContext.Provider>
      ) : (
        <div className="InspectorPlaceholder px-3 pb-3 pt-2">
          <p className="m-0 text-xs text-(--color-6)">
            {t('inspector.placeholder')}
          </p>
          <div className="InspectorSkeleton mt-3 grid gap-2">
            <span className="h-2 rounded-full bg-(--color-2)" />
            <span className="h-2 w-[80%] rounded-full bg-(--color-2)" />
            <span className="h-2 w-[65%] rounded-full bg-(--color-2)" />
            <span className="h-2 w-[90%] rounded-full bg-(--color-2)" />
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
