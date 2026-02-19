import type { NodeGraphEditorController } from './NodeGraphEditor.controller';

type NodeGraphEditorDebugOverlayProps = {
  debug: NodeGraphEditorController['debug'];
};

export const NodeGraphEditorDebugOverlay = ({
  debug,
}: NodeGraphEditorDebugOverlayProps) => {
  if (!debug.isVisible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden text-[10px] text-(--color-7)"
      data-testid="nodegraph-debug-overlay"
    >
      <div className="absolute left-4 top-4 rounded-md border border-black/12 bg-white/95 px-2 py-1 font-mono shadow-[0_6px_14px_rgba(0,0,0,0.12)]">
        <div data-testid="nodegraph-debug-mouse">
          mouse: v(
          {debug.pointerViewportPoint
            ? `${debug.pointerViewportPoint.x.toFixed(0)}, ${debug.pointerViewportPoint.y.toFixed(0)}`
            : '-, -'}
          ) w(
          {debug.pointerWorldPoint
            ? `${debug.pointerWorldPoint.x.toFixed(1)}, ${debug.pointerWorldPoint.y.toFixed(1)}`
            : '-, -'}
          )
        </div>
        <div data-testid="nodegraph-debug-counts">
          nodes: {debug.nodeCount} | edges: {debug.edgeCount}
        </div>
        <div>grid: {debug.isGridVisible ? 'on' : 'off'}</div>
      </div>
      {debug.isGridVisible ? (
        <>
          {debug.gridCoordinates.x.map((label) => (
            <div
              key={label.key}
              className="absolute top-0"
              style={{ left: label.screen }}
            >
              <div className="absolute left-1 top-0 rounded-sm bg-white/90 px-1 py-[1px] font-mono text-[9px] leading-none text-(--color-6)">
                {label.value}
              </div>
            </div>
          ))}
          {debug.gridCoordinates.y.map((label) => (
            <div
              key={label.key}
              className="absolute left-0"
              style={{ top: label.screen }}
            >
              <div className="absolute left-0 top-1 rounded-sm bg-white/90 px-1 py-[1px] font-mono text-[9px] leading-none text-(--color-6)">
                {label.value}
              </div>
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
};
