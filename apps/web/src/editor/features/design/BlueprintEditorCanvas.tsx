import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { useSettingsStore } from '@/editor/store/useSettingsStore';
import { MIRRenderer } from '@/mir/renderer/MIRRenderer';
import {
  createOrderedComponentRegistry,
  parseResolverOrder,
} from '@/mir/renderer/registry';
import { VIEWPORT_ZOOM_RANGE } from './BlueprintEditor.data';

type BlueprintEditorCanvasProps = {
  viewportWidth: string;
  viewportHeight: string;
  zoom: number;
  pan: { x: number; y: number };
  selectedId?: string;
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (value: number) => void;
  onSelectNode: (nodeId: string) => void;
  onNavigateRequest?: (options: {
    params?: Record<string, unknown>;
    nodeId: string;
    trigger: string;
    eventKey: string;
    payload?: unknown;
  }) => void;
  onExecuteGraphRequest?: (options: {
    params?: Record<string, unknown>;
    nodeId: string;
    trigger: string;
    eventKey: string;
    payload?: unknown;
  }) => void;
};

type PanState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

const DRAG_THRESHOLD = 3;
const WHEEL_LINE_HEIGHT = 16;
const WHEEL_PAGE_SIZE = 800;
const getTimestamp = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const parseDimension = (value: string, fallback: number, min: number) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(min, parsed);
};

const isInteractiveTarget = (target: HTMLElement | null) => {
  if (!target) return false;
  return Boolean(
    target.closest(
      'button, input, textarea, select, option, a, label, [contenteditable="true"]'
    )
  );
};

const normalizeWheelDelta = (event: WheelEvent) => {
  if (event.deltaMode === 1) {
    return {
      x: event.deltaX * WHEEL_LINE_HEIGHT,
      y: event.deltaY * WHEEL_LINE_HEIGHT,
    };
  }
  if (event.deltaMode === 2) {
    const pageWidth =
      typeof window === 'undefined' ? WHEEL_PAGE_SIZE : window.innerWidth;
    const pageHeight =
      typeof window === 'undefined' ? WHEEL_PAGE_SIZE : window.innerHeight;
    return { x: event.deltaX * pageWidth, y: event.deltaY * pageHeight };
  }
  return { x: event.deltaX, y: event.deltaY };
};

export function BlueprintEditorCanvas({
  viewportWidth,
  viewportHeight,
  zoom,
  pan,
  selectedId,
  onPanChange,
  onZoomChange,
  onSelectNode,
  onNavigateRequest,
  onExecuteGraphRequest,
}: BlueprintEditorCanvasProps) {
  const { t } = useTranslation('blueprint');
  const assist = useSettingsStore((state) => state.global.assist);
  const panInertia = useSettingsStore((state) => state.global.panInertia);
  const zoomStep = useSettingsStore((state) => state.global.zoomStep);
  const renderMode = useSettingsStore((state) => state.global.renderMode);
  const allowExternalProps = useSettingsStore(
    (state) => state.global.allowExternalProps
  );
  const resolverOrder = useSettingsStore((state) => state.global.resolverOrder);
  const diagnostics = useSettingsStore((state) => state.global.diagnostics);
  const [isPanning, setIsPanning] = useState(false);
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const panState = useRef<PanState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const zoomStepRef = useRef(zoomStep);
  const onPanChangeRef = useRef(onPanChange);
  const onZoomChangeRef = useRef(onZoomChange);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });
  const inertiaFrameRef = useRef<number | null>(null);
  const suppressSelectRef = useRef(false);
  const canvasWidth = parseDimension(viewportWidth, 1440, 320);
  const canvasHeight = parseDimension(viewportHeight, 900, 240);
  const scale = Math.min(2, Math.max(0.4, zoom / 100));
  const showGrid = assist.includes('grid');
  const showSelectionDiagnostics = diagnostics.includes('selection');
  const registry = useMemo(
    () => createOrderedComponentRegistry(parseResolverOrder(resolverOrder)),
    [resolverOrder]
  );
  const { setNodeRef: setCanvasDropRef, isOver: isCanvasOver } = useDroppable({
    id: 'canvas-drop',
    data: { kind: 'canvas' },
  });

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    zoomStepRef.current = zoomStep;
  }, [zoomStep]);

  useEffect(() => {
    onPanChangeRef.current = onPanChange;
  }, [onPanChange]);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      if (inertiaFrameRef.current) {
        window.cancelAnimationFrame(inertiaFrameRef.current);
      }
    };
  }, []);

  const stopInertia = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (inertiaFrameRef.current) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  const applyPan = useCallback((nextPan: { x: number; y: number }) => {
    panRef.current = nextPan;
    onPanChangeRef.current(nextPan);
  }, []);

  const applyZoom = useCallback((nextZoom: number) => {
    const clamped = Math.min(
      VIEWPORT_ZOOM_RANGE.max,
      Math.max(VIEWPORT_ZOOM_RANGE.min, nextZoom)
    );
    zoomRef.current = clamped;
    onZoomChangeRef.current(clamped);
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const handleWheel = (event: WheelEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (isInteractiveTarget(target)) return;
      const { x, y } = normalizeWheelDelta(event);
      const shouldZoom = event.ctrlKey || event.metaKey;
      stopInertia();
      if (shouldZoom) {
        const zoomAxis = y !== 0 ? y : x;
        if (zoomAxis === 0) return;
        event.preventDefault();
        const direction = zoomAxis > 0 ? -1 : 1;
        applyZoom(zoomRef.current + direction * zoomStepRef.current);
        return;
      }
      const panX = event.shiftKey ? -y : -x;
      const panY = event.shiftKey ? 0 : -y;
      if (panX === 0 && panY === 0) return;
      event.preventDefault();
      applyPan({ x: panRef.current.x + panX, y: panRef.current.y + panY });
    };
    surface.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      surface.removeEventListener('wheel', handleWheel);
    };
  }, [applyPan, applyZoom, stopInertia]);

  const setSurfaceNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      surfaceRef.current = node;
      setCanvasDropRef(node);
    },
    [setCanvasDropRef]
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (isInteractiveTarget(event.target as HTMLElement)) return;
    event.currentTarget.focus();
    stopInertia();
    panState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    };
    velocityRef.current = { x: 0, y: 0 };
    lastMoveRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: getTimestamp(),
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (panState.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - panState.current.startX;
    const deltaY = event.clientY - panState.current.startY;
    const now = getTimestamp();
    const lastMove = lastMoveRef.current;
    const deltaTime = now - lastMove.time;
    if (deltaTime > 0) {
      velocityRef.current = {
        x: (event.clientX - lastMove.x) / deltaTime,
        y: (event.clientY - lastMove.y) / deltaTime,
      };
    }
    lastMoveRef.current = { x: event.clientX, y: event.clientY, time: now };
    if (
      !panState.current.moved &&
      Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD
    ) {
      panState.current.moved = true;
      setIsPanning(true);
    }
    if (!panState.current.moved) return;
    event.preventDefault();
    applyPan({
      x: panState.current.originX + deltaX,
      y: panState.current.originY + deltaY,
    });
  };

  const startInertia = () => {
    if (typeof window === 'undefined') return;
    if (panInertia <= 0) return;
    const baseVelocity = velocityRef.current;
    let velocityX = baseVelocity.x * 16;
    let velocityY = baseVelocity.y * 16;
    if (Math.abs(velocityX) + Math.abs(velocityY) < 0.1) return;
    const inertiaStrength = Math.min(1, Math.max(0, panInertia / 100));
    const damping = 0.86 + inertiaStrength * 0.12;
    const step = () => {
      velocityX *= damping;
      velocityY *= damping;
      if (Math.abs(velocityX) + Math.abs(velocityY) < 0.1) {
        inertiaFrameRef.current = null;
        return;
      }
      applyPan({
        x: panRef.current.x + velocityX,
        y: panRef.current.y + velocityY,
      });
      inertiaFrameRef.current = window.requestAnimationFrame(step);
    };
    inertiaFrameRef.current = window.requestAnimationFrame(step);
  };

  const endPan = (event: PointerEvent<HTMLDivElement>) => {
    if (panState.current.pointerId !== event.pointerId) return;
    const shouldInertia = panState.current.moved;
    if (panState.current.moved) {
      suppressSelectRef.current = true;
      setTimeout(() => {
        suppressSelectRef.current = false;
      }, 0);
    }
    panState.current.pointerId = null;
    panState.current.moved = false;
    setIsPanning(false);
    if (shouldInertia) {
      startInertia();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (isInteractiveTarget(event.target as HTMLElement)) return;
    const isZoomIn =
      event.key === '+' ||
      event.key === '=' ||
      event.code === 'Equal' ||
      event.code === 'NumpadAdd';
    const isZoomOut =
      event.key === '-' ||
      event.key === '_' ||
      event.code === 'Minus' ||
      event.code === 'NumpadSubtract';
    if (!isZoomIn && !isZoomOut) return;
    event.preventDefault();
    stopInertia();
    const delta = (isZoomIn ? 1 : -1) * zoomStepRef.current;
    applyZoom(zoomRef.current + delta);
  };

  const handleNodeSelect = (nodeId: string) => {
    if (suppressSelectRef.current) return;
    onSelectNode(nodeId);
  };

  const hasChildren = Boolean(mirDoc?.ui?.root?.children?.length);

  return (
    <section
      className={`BlueprintEditorCanvas relative z-1 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[18px] border border-black/6 bg-(--color-1) dark:border-white/8 max-[1100px]:min-h-80 ${showSelectionDiagnostics ? '' : 'HideSelectionDiagnostics [&_.BlueprintEditorCanvasArtboard_[data-mir-selected=true]]:outline-none'}`}
    >
      <div
        className={`BlueprintEditorCanvasSurface relative min-h-0 flex-1 touch-none overflow-hidden ${isPanning ? 'IsPanning cursor-grabbing select-none' : 'cursor-grab'} ${isCanvasOver ? 'IsOver outline-2 outline-dashed outline-[rgba(0,0,0,0.18)] -outline-offset-2 dark:outline-[rgba(255,255,255,0.22)]' : ''}`}
        ref={setSurfaceNodeRef}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onPointerLeave={endPan}
        onKeyDown={handleKeyDown}
      >
        {showGrid && (
          <div className="BlueprintEditorCanvasGrid pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(rgba(0,0,0,0.12)_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)]" />
        )}
        <div
          className="BlueprintEditorCanvasPanLayer absolute inset-0 origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <div
            className="BlueprintEditorCanvasZoomLayer h-full w-full origin-top-left"
            style={{ transform: `scale(${scale})` }}
          >
            <div
              className="BlueprintEditorCanvasArtboard relative overflow-hidden border border-black/8 bg-(--color-0) shadow-[0_22px_45px_rgba(0,0,0,0.12)] dark:border-white/10 dark:shadow-[0_24px_46px_rgba(0,0,0,0.45)] **:data-[mir-selected=true]:outline-2 **:data-[mir-selected=true]:outline-offset-2 **:data-[mir-selected=true]:outline-(--color-primary,var(--color-9)) **:data-[mir-missing=true]:outline **:data-[mir-missing=true]:outline-dashed **:data-[mir-missing=true]:outline-[rgba(240,82,82,0.9)] **:data-[mir-missing=true]:outline-offset-2"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              {hasChildren ? (
                <MIRRenderer
                  node={mirDoc.ui.root}
                  mirDoc={mirDoc}
                  selectedId={selectedId}
                  onNodeSelect={handleNodeSelect}
                  registry={registry}
                  renderMode={renderMode}
                  allowExternalProps={allowExternalProps === 'enabled'}
                  builtInActions={{
                    ...(onNavigateRequest ? { navigate: onNavigateRequest } : {}),
                    ...(onExecuteGraphRequest
                      ? { executeGraph: onExecuteGraphRequest }
                      : {}),
                  }}
                />
              ) : (
                <div className="BlueprintEditorCanvasPlaceholder relative z-1 flex h-full flex-col items-center justify-center gap-1.5 p-10 text-center text-(--color-7)">
                  <h3 className="m-0 text-base text-(--color-9)">
                    {t('canvas.placeholderTitle')}
                  </h3>
                  <p className="m-0 max-w-80 text-xs">
                    {t('canvas.placeholderDescription')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
