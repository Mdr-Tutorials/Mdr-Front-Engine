import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

type GraphMeta = {
  id: string;
  name: string;
};

type GraphWorkspaceSnapshot = {
  activeGraphId: string;
  graphs: GraphMeta[];
};

const GRID_SIZE = 128;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.1;
const STORAGE_PREFIX = 'mdr:nodegraph:workspace';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const createStorageKey = (projectId: string) =>
  `${STORAGE_PREFIX}:${projectId}`;

const createGraphId = () =>
  `graph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const createDefaultSnapshot = (): GraphWorkspaceSnapshot => ({
  activeGraphId: 'graph-main',
  graphs: [{ id: 'graph-main', name: 'Main Graph' }],
});

const normalizeSnapshot = (raw: unknown): GraphWorkspaceSnapshot => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createDefaultSnapshot();
  }
  const source = raw as { activeGraphId?: unknown; graphs?: unknown };
  const graphs = Array.isArray(source.graphs)
    ? source.graphs
        .map((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item))
            return null;
          const graph = item as { id?: unknown; name?: unknown };
          const id = typeof graph.id === 'string' ? graph.id.trim() : '';
          const name = typeof graph.name === 'string' ? graph.name.trim() : '';
          if (!id || !name) return null;
          return { id, name };
        })
        .filter((item): item is GraphMeta => Boolean(item))
    : [];
  if (!graphs.length) return createDefaultSnapshot();
  const activeGraphId =
    typeof source.activeGraphId === 'string' &&
    graphs.some((graph) => graph.id === source.activeGraphId)
      ? source.activeGraphId
      : graphs[0].id;
  return { activeGraphId, graphs };
};

const loadSnapshot = (projectId: string): GraphWorkspaceSnapshot => {
  if (typeof window === 'undefined') return createDefaultSnapshot();
  const raw = window.localStorage.getItem(createStorageKey(projectId));
  if (!raw) return createDefaultSnapshot();
  try {
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return createDefaultSnapshot();
  }
};

const saveSnapshot = (projectId: string, snapshot: GraphWorkspaceSnapshot) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    createStorageKey(projectId),
    JSON.stringify(snapshot)
  );
};

function NodeGraph() {
  const { t } = useTranslation('editor');
  const { projectId } = useParams();
  const resolvedProjectId = projectId?.trim() || 'global';
  const [workspace, setWorkspace] = useState<GraphWorkspaceSnapshot>(() =>
    loadSnapshot(resolvedProjectId)
  );
  const [graphNameDraft, setGraphNameDraft] = useState('');
  const [isGraphModalOpen, setGraphModalOpen] = useState(false);
  const [isManagerCollapsed, setManagerCollapsed] = useState(false);
  const [isViewportCollapsed, setViewportCollapsed] = useState(false);
  const [isPaletteCollapsed, setPaletteCollapsed] = useState(false);
  const [isInspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isResetVisible, setResetVisible] = useState(false);
  const panSession = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });
  const resetTimeoutRef = useRef<number | null>(null);

  const activeGraph = useMemo(
    () =>
      workspace.graphs.find((graph) => graph.id === workspace.activeGraphId) ??
      workspace.graphs[0],
    [workspace.activeGraphId, workspace.graphs]
  );

  useEffect(() => {
    const next = loadSnapshot(resolvedProjectId);
    setWorkspace(next);
    setGraphNameDraft(
      next.graphs.find((graph) => graph.id === next.activeGraphId)?.name ?? ''
    );
  }, [resolvedProjectId]);

  useEffect(() => {
    saveSnapshot(resolvedProjectId, workspace);
  }, [resolvedProjectId, workspace]);

  useEffect(() => {
    setGraphNameDraft(activeGraph?.name ?? '');
  }, [activeGraph?.id, activeGraph?.name]);

  useEffect(
    () => () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    },
    []
  );

  const triggerResetVisibility = () => {
    setResetVisible(true);
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = window.setTimeout(() => {
      setResetVisible(false);
      resetTimeoutRef.current = null;
    }, 3000);
  };

  const canvasStyle = useMemo(
    () => ({
      backgroundColor: 'var(--color-0)',
      backgroundImage:
        'linear-gradient(to right, var(--color-2) 1px, transparent 1px), linear-gradient(to bottom, var(--color-2) 1px, transparent 1px)',
      backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
      backgroundPosition: `${pan.x}px ${pan.y}px`,
    }),
    [pan.x, pan.y, zoom]
  );

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    triggerResetVisibility();
    setZoom((current) =>
      clamp(
        current + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
        ZOOM_MIN,
        ZOOM_MAX
      )
    );
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    panSession.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (!panSession.current.active) return;
    const deltaX = event.clientX - panSession.current.x;
    const deltaY = event.clientY - panSession.current.y;
    panSession.current = { active: true, x: event.clientX, y: event.clientY };
    triggerResetVisibility();
    setPan((current) => ({ x: current.x + deltaX, y: current.y + deltaY }));
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    panSession.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleCreateGraph = () => {
    const name = graphNameDraft.trim();
    if (!name) return;
    const nextGraph = { id: createGraphId(), name };
    setWorkspace((current) => ({
      activeGraphId: nextGraph.id,
      graphs: [...current.graphs, nextGraph],
    }));
  };

  const handleRenameGraph = () => {
    const name = graphNameDraft.trim();
    if (!name || !activeGraph) return;
    setWorkspace((current) => ({
      ...current,
      graphs: current.graphs.map((graph) =>
        graph.id === current.activeGraphId ? { ...graph, name } : graph
      ),
    }));
  };

  const handleDeleteGraph = () => {
    if (!activeGraph || workspace.graphs.length <= 1) return;
    setWorkspace((current) => {
      const nextGraphs = current.graphs.filter(
        (graph) => graph.id !== current.activeGraphId
      );
      return {
        activeGraphId:
          nextGraphs[0]?.id ?? createDefaultSnapshot().activeGraphId,
        graphs: nextGraphs.length ? nextGraphs : createDefaultSnapshot().graphs,
      };
    });
  };

  const handleOpenGraph = (graphId: string) => {
    setWorkspace((current) => ({ ...current, activeGraphId: graphId }));
    setGraphModalOpen(false);
  };

  return (
    <div
      className="relative h-full min-h-full w-full overflow-hidden"
      data-testid="nodegraph-editor-root"
    >
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={canvasStyle}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        data-testid="nodegraph-canvas-layer"
      />

      <div className="pointer-events-none absolute inset-0 z-10">
        {isManagerCollapsed ? (
          <button
            type="button"
            className="pointer-events-auto absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-[rgba(255,255,255,0.9)] text-[11px] font-semibold text-(--color-8) shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]"
            onDoubleClick={() => setManagerCollapsed(false)}
            title="Node Graph"
          >
            NG
          </button>
        ) : (
          <div className="pointer-events-auto absolute left-4 top-4 w-[280px] rounded-[14px] border border-black/10 bg-[rgba(255,255,255,0.9)] px-3 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]">
            <div
              className="text-[13px] font-semibold text-(--color-10)"
              onDoubleClick={() => setManagerCollapsed(true)}
              title={t('common.collapse', { defaultValue: 'Collapse' })}
            >
              {t('projectHome.actions.nodegraph.label', {
                defaultValue: 'Node Graph',
              })}
            </div>
            <div className="text-[11px] text-(--color-6)">
              {resolvedProjectId}
            </div>
            <div className="mt-2 rounded-md border border-black/10 bg-[rgba(0,0,0,0.02)] px-2 py-1 text-[11px] text-(--color-8)">
              {t('nodeGraph.manager.current', { defaultValue: 'Current:' })}{' '}
              <span data-testid="nodegraph-active-graph-name">
                {activeGraph?.name ?? '-'}
              </span>
            </div>
            <div className="mt-2 grid gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                  onClick={() => setGraphModalOpen(true)}
                  data-testid="nodegraph-open-modal-button"
                >
                  {t('nodeGraph.manager.open', { defaultValue: 'Open' })}
                </button>
                <button
                  type="button"
                  className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                  onClick={handleDeleteGraph}
                  disabled={workspace.graphs.length <= 1}
                >
                  {t('nodeGraph.manager.delete', { defaultValue: 'Delete' })}
                </button>
              </div>
              <input
                className="h-7 rounded-md border border-black/10 bg-transparent px-2 text-[12px]"
                value={graphNameDraft}
                onChange={(event) => setGraphNameDraft(event.target.value)}
                placeholder={t('nodeGraph.manager.name', {
                  defaultValue: 'Graph name',
                })}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                  onClick={handleCreateGraph}
                >
                  {t('nodeGraph.manager.create', { defaultValue: 'Create' })}
                </button>
                <button
                  type="button"
                  className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                  onClick={handleRenameGraph}
                >
                  {t('nodeGraph.manager.rename', { defaultValue: 'Rename' })}
                </button>
              </div>
            </div>
          </div>
        )}

        {isViewportCollapsed ? (
          <button
            type="button"
            className="pointer-events-auto absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-[rgba(255,255,255,0.9)] text-[11px] font-semibold text-(--color-8) shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]"
            onDoubleClick={() => setViewportCollapsed(false)}
            title="Viewport"
          >
            VP
          </button>
        ) : (
          <div className="pointer-events-auto absolute right-4 top-4 flex items-center gap-2 rounded-[14px] border border-black/10 bg-[rgba(255,255,255,0.9)] px-3 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]">
            <div
              className="text-[11px] font-semibold text-(--color-8)"
              onDoubleClick={() => setViewportCollapsed(true)}
              title={t('common.collapse', { defaultValue: 'Collapse' })}
            >
              View
            </div>
            <button
              type="button"
              className="h-7 w-7 rounded-md border border-black/12 text-[12px]"
              onClick={() => {
                triggerResetVisibility();
                setZoom((current) =>
                  clamp(current - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)
                );
              }}
            >
              -
            </button>
            <span className="min-w-[56px] text-center text-[12px] text-(--color-8)">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="h-7 w-7 rounded-md border border-black/12 text-[12px]"
              onClick={() => {
                triggerResetVisibility();
                setZoom((current) =>
                  clamp(current + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)
                );
              }}
            >
              +
            </button>
            {isResetVisible ? (
              <button
                type="button"
                className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                onClick={() => {
                  setPan({ x: 0, y: 0 });
                  setZoom(1);
                  setResetVisible(false);
                  if (resetTimeoutRef.current !== null) {
                    window.clearTimeout(resetTimeoutRef.current);
                    resetTimeoutRef.current = null;
                  }
                }}
              >
                {t('common.reset', { defaultValue: 'Reset' })}
              </button>
            ) : null}
          </div>
        )}

        {isPaletteCollapsed ? (
          <button
            type="button"
            className="pointer-events-auto absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-[rgba(255,255,255,0.9)] text-[11px] font-semibold text-(--color-8) shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]"
            onDoubleClick={() => setPaletteCollapsed(false)}
            title="Palette"
          >
            NP
          </button>
        ) : (
          <div className="pointer-events-auto absolute bottom-4 left-4 w-[220px] rounded-[14px] border border-black/10 bg-[rgba(255,255,255,0.9)] px-3 py-3 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]">
            <div
              className="mb-2 text-[11px] font-semibold text-(--color-7)"
              onDoubleClick={() => setPaletteCollapsed(true)}
              title={t('common.collapse', { defaultValue: 'Collapse' })}
            >
              {t('nodeGraph.palette.title', { defaultValue: 'Node Palette' })}
            </div>
            <div className="grid gap-1 text-[12px] text-(--color-8)">
              <span>
                {t('nodeGraph.palette.logic', { defaultValue: 'Logic Nodes' })}
              </span>
              <span>
                {t('nodeGraph.palette.data', { defaultValue: 'Data Nodes' })}
              </span>
              <span>
                {t('nodeGraph.palette.flow', { defaultValue: 'Flow Nodes' })}
              </span>
            </div>
          </div>
        )}

        {isInspectorCollapsed ? (
          <button
            type="button"
            className="pointer-events-auto absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-[rgba(255,255,255,0.9)] text-[11px] font-semibold text-(--color-8) shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]"
            onDoubleClick={() => setInspectorCollapsed(false)}
            title="Inspector"
          >
            IN
          </button>
        ) : (
          <div className="pointer-events-auto absolute bottom-4 right-4 h-[240px] w-[260px] rounded-[14px] border border-black/10 bg-[rgba(255,255,255,0.9)] px-3 py-3 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]">
            <div
              className="mb-2 text-[11px] font-semibold text-(--color-7)"
              onDoubleClick={() => setInspectorCollapsed(true)}
              title={t('common.collapse', { defaultValue: 'Collapse' })}
            >
              {t('nodeGraph.inspector.title', { defaultValue: 'Inspector' })}
            </div>
            <div className="text-[12px] text-(--color-6)">
              {t('nodeGraph.inspector.placeholder', {
                defaultValue: 'Select a node to inspect its properties.',
              })}
            </div>
          </div>
        )}

      </div>

      {isGraphModalOpen ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(0,0,0,0.28)]"
          data-testid="nodegraph-graph-modal"
        >
          <div className="w-[520px] max-w-[92vw] rounded-[16px] border border-black/10 bg-[var(--color-0)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.24)] dark:border-white/14">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[14px] font-semibold text-(--color-10)">
                {t('nodeGraph.manager.openTitle', {
                  defaultValue: 'Open Node Graph',
                })}
              </div>
              <button
                type="button"
                className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                onClick={() => setGraphModalOpen(false)}
              >
                {t('common.close', { defaultValue: 'Close' })}
              </button>
            </div>
            <div className="grid max-h-[52vh] gap-2 overflow-auto">
              {workspace.graphs.map((graph, index) => (
                <div
                  key={graph.id}
                  className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-(--color-9)">
                      {graph.name}
                    </div>
                    <div className="text-[11px] text-(--color-6)">
                      {graph.id}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                    data-testid={`nodegraph-open-graph-${index}`}
                    onClick={() => handleOpenGraph(graph.id)}
                  >
                    {t('nodeGraph.manager.openAction', {
                      defaultValue: 'Open',
                    })}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NodeGraph;
