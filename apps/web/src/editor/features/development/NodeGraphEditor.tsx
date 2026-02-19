import { useNodeGraphEditorController } from './NodeGraphEditor.controller';
import { NodeGraphEditorCanvas } from './NodeGraphEditorCanvas';
import { NodeGraphEditorContextMenu } from './NodeGraphEditorContextMenu';
import { NodeGraphEditorCursor } from './NodeGraphEditorCursor';
import { NodeGraphEditorDebugOverlay } from './NodeGraphEditorDebugOverlay';
import { NodeGraphEditorFloatingIslands } from './NodeGraphEditorFloatingIslands';
import { NodeGraphEditorGraphModal } from './NodeGraphEditorGraphModal';

function NodeGraphEditor() {
  const controller = useNodeGraphEditorController();

  return (
    <div
      className="relative h-full min-h-full w-full cursor-none overflow-hidden"
      data-testid="nodegraph-editor-root"
      onPointerMove={controller.root.onPointerMove}
      onPointerLeave={controller.root.onPointerLeave}
    >
      <NodeGraphEditorCanvas canvas={controller.canvas} />
      <NodeGraphEditorCursor cursorPosition={controller.root.cursorPosition} />
      <NodeGraphEditorDebugOverlay debug={controller.debug} />

      <div className="pointer-events-none absolute inset-0 z-10">
        <NodeGraphEditorFloatingIslands
          manager={controller.manager}
          viewport={controller.viewport}
        />
      </div>

      <NodeGraphEditorContextMenu contextMenu={controller.contextMenu} />
      <NodeGraphEditorGraphModal modal={controller.modal} />
    </div>
  );
}

export default NodeGraphEditor;
