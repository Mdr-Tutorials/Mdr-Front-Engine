import type { NodeCanvasPoint } from './node';

type NodeGraphEditorCursorProps = {
  cursorPosition: NodeCanvasPoint | null;
};

export const NodeGraphEditorCursor = ({
  cursorPosition,
}: NodeGraphEditorCursorProps) => {
  if (!cursorPosition) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: cursorPosition.x, top: cursorPosition.y }}
        data-testid="nodegraph-custom-cursor"
      >
        <div className="relative h-4 w-4 rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.95)]">
          <div className="absolute inset-[3px] rounded-full border border-black" />
        </div>
      </div>
    </div>
  );
};
