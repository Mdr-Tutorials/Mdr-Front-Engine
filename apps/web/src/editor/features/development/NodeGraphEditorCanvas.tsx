import type { NodeGraphEditorController } from './NodeGraphEditor.controller';

type NodeGraphEditorCanvasProps = {
  canvas: NodeGraphEditorController['canvas'];
};

export const NodeGraphEditorCanvas = ({
  canvas,
}: NodeGraphEditorCanvasProps) => (
  <div
    ref={canvas.hostRef}
    className="absolute inset-0"
    style={canvas.style}
    onWheel={canvas.onWheel}
    onPointerDown={canvas.onPointerDown}
    onPointerMove={canvas.onPointerMove}
    onPointerUp={canvas.onPointerUp}
    onPointerCancel={canvas.onPointerCancel}
    onPointerLeave={canvas.onPointerLeave}
    onContextMenu={canvas.onContextMenu}
    data-testid="nodegraph-canvas-layer"
  >
    <canvas ref={canvas.canvasRef} className="absolute inset-0 h-full w-full" />
  </div>
);
