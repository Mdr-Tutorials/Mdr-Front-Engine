import { DndContext, DragOverlay } from '@dnd-kit/core';
import { BlueprintEditorAddressBar } from './BlueprintEditorAddressBar';
import { BlueprintEditorCanvas } from './BlueprintEditorCanvas';
import { BlueprintEditorComponentTree } from './BlueprintEditorComponentTree';
import { useBlueprintEditorController } from './BlueprintEditor.controller';
import { BlueprintEditorInspector } from './BlueprintEditorInspector';
import { BlueprintEditorSaveIndicator } from './BlueprintEditorSaveIndicator';
import { BlueprintEditorSidebar } from './BlueprintEditorSidebar';
import { BlueprintEditorViewportBar } from './BlueprintEditorViewportBar';

export { createNodeFromPaletteItem } from './BlueprintEditor.palette';
export { getTreeDropPlacement } from './BlueprintEditor.tree';

function BlueprintEditor() {
  const {
    addressBar,
    canvas,
    componentTree,
    dnd,
    inspector,
    saveIndicator,
    sidebar,
    viewportBar,
  } = useBlueprintEditorController();

  return (
    <div className="relative flex h-full min-h-screen flex-col text-(--color-10)">
      <BlueprintEditorAddressBar
        currentPath={addressBar.currentPath}
        newPath={addressBar.newPath}
        routes={addressBar.routes}
        onCurrentPathChange={addressBar.onCurrentPathChange}
        onNewPathChange={addressBar.onNewPathChange}
        onAddRoute={addressBar.onAddRoute}
        statusIndicator={
          <BlueprintEditorSaveIndicator
            status={saveIndicator.saveStatus}
            transport={saveIndicator.saveTransport}
            label={saveIndicator.saveIndicatorLabel}
            tone={saveIndicator.saveIndicatorTone}
            isWorkspaceSaveDisabled={saveIndicator.isWorkspaceSaveDisabled}
          />
        }
      />
      <DndContext
        sensors={dnd.sensors}
        onDragStart={dnd.handleDragStart}
        onDragMove={dnd.handleDragMove}
        onDragCancel={dnd.handleDragCancel}
        onDragEnd={dnd.handleDragEnd}
      >
        <div
          className={`BlueprintEditorBody relative flex min-h-0 flex-1 overflow-hidden p-[14px_20px_20px] [--sidebar-width:400px] [--tree-width:400px] [--inspector-width:360px] [--collapsed-panel-width:36px] [--component-tree-height:450px] max-[1100px]:p-[12px_16px_16px] max-[1100px]:[--sidebar-width:220px] max-[1100px]:[--tree-width:220px] max-[1100px]:[--inspector-width:240px] max-[1100px]:[--component-tree-height:340px] ${sidebar.isCollapsed ? '[--sidebar-width:var(--collapsed-panel-width)]' : ''}`}
        >
          <BlueprintEditorSidebar
            isCollapsed={sidebar.isCollapsed}
            isTreeCollapsed={sidebar.isTreeCollapsed}
            collapsedGroups={sidebar.collapsedGroups}
            expandedPreviews={sidebar.expandedPreviews}
            sizeSelections={sidebar.sizeSelections}
            statusSelections={sidebar.statusSelections}
            onToggleCollapse={sidebar.onToggleCollapse}
            onToggleGroup={sidebar.onToggleGroup}
            onTogglePreview={sidebar.onTogglePreview}
            onPreviewKeyDown={sidebar.onPreviewKeyDown}
            onSizeSelect={sidebar.onSizeSelect}
            onStatusSelect={sidebar.onStatusSelect}
            onStatusCycleStart={sidebar.onStatusCycleStart}
            onStatusCycleStop={sidebar.onStatusCycleStop}
          />
          <BlueprintEditorComponentTree
            isCollapsed={componentTree.isCollapsed}
            isTreeCollapsed={componentTree.isTreeCollapsed}
            selectedId={componentTree.selectedId}
            dropHint={componentTree.dropHint}
            onToggleCollapse={componentTree.onToggleCollapse}
            onSelectNode={componentTree.onSelectNode}
            onDeleteSelected={componentTree.onDeleteSelected}
            onDeleteNode={componentTree.onDeleteNode}
            onCopyNode={componentTree.onCopyNode}
            onMoveNode={componentTree.onMoveNode}
          />
          <BlueprintEditorCanvas
            viewportWidth={canvas.viewportWidth}
            viewportHeight={canvas.viewportHeight}
            zoom={canvas.zoom}
            pan={canvas.pan}
            selectedId={canvas.selectedId}
            onPanChange={canvas.onPanChange}
            onZoomChange={canvas.onZoomChange}
            onSelectNode={canvas.onSelectNode}
            onNavigateRequest={canvas.onNavigateRequest}
            onExecuteGraphRequest={canvas.onExecuteGraphRequest}
          />
          <BlueprintEditorInspector
            isCollapsed={inspector.isCollapsed}
            onToggleCollapse={inspector.onToggleCollapse}
          />
        </div>
        <DragOverlay>
          {dnd.activePaletteItemId ? (
            <div className="pointer-events-none">
              <div className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/92 px-2.5 py-2 text-xs font-bold tracking-[0.01em] text-(--color-9) shadow-[0_14px_30px_rgba(0,0,0,0.18)] dark:border-white/14 dark:bg-[rgba(10,10,10,0.92)]">
                {dnd.activePaletteItemId}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <BlueprintEditorViewportBar
        viewportWidth={viewportBar.viewportWidth}
        viewportHeight={viewportBar.viewportHeight}
        onViewportWidthChange={viewportBar.onViewportWidthChange}
        onViewportHeightChange={viewportBar.onViewportHeightChange}
        zoom={viewportBar.zoom}
        zoomStep={viewportBar.zoomStep}
        onZoomChange={viewportBar.onZoomChange}
        onResetView={viewportBar.onResetView}
      />
    </div>
  );
}

export default BlueprintEditor;
