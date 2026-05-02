import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KeyboardEvent, ReactNode } from 'react';
import { useAuthStore } from '@/auth/useAuthStore';
import { editorApi } from '@/editor/editorApi';
import BlueprintEditor from '@/editor/features/design/BlueprintEditor';
import { EditorShortcutProvider } from '@/editor/shortcuts';
import {
  DEFAULT_BLUEPRINT_STATE,
  useEditorStore,
} from '@/editor/store/useEditorStore';
import {
  getComponentGroups,
  VIEWPORT_ZOOM_RANGE,
} from '@/editor/features/design/BlueprintEditor.data';
import {
  createMirDoc,
  resetEditorStore,
  resetSettingsStore,
} from '@/test-utils/editorStore';

const PROJECT_ID = 'project-1';

type AddressBarProps = {
  currentPath: string;
  newPath: string;
  routes: { id: string; path: string }[];
  onCurrentPathChange: (value: string) => void;
  onNewPathChange: (value: string) => void;
  onAddRoute: () => void;
  statusIndicator?: ReactNode;
};

type ViewportBarProps = {
  viewportWidth: string;
  viewportHeight: string;
  onViewportWidthChange: (value: string) => void;
  onViewportHeightChange: (value: string) => void;
  zoom: number;
  zoomStep: number;
  onZoomChange: (value: number) => void;
  onResetView: () => void;
};

type ComponentTreeProps = {
  isCollapsed: boolean;
  selectedId?: string;
  dropHint?: {
    overNodeId: string;
    placement: 'before' | 'after' | 'child';
  } | null;
  onToggleCollapse: () => void;
  onSelectNode: (nodeId: string) => void;
  onDeleteSelected: () => void;
  onDeleteNode: (nodeId: string) => void;
  onCopyNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, direction: 'up' | 'down') => void;
};

type SidebarProps = {
  isCollapsed: boolean;
  collapsedGroups: Record<string, boolean>;
  expandedPreviews: Record<string, boolean>;
  sizeSelections: Record<string, string>;
  statusSelections: Record<string, number>;
  onToggleCollapse: () => void;
  onToggleGroup: (groupId: string) => void;
  onTogglePreview: (previewId: string) => void;
  onPreviewKeyDown: (
    event: KeyboardEvent<HTMLDivElement>,
    previewId: string,
    hasVariants: boolean
  ) => void;
  onSizeSelect: (itemId: string, sizeId: string) => void;
  onStatusSelect: (itemId: string, index: number) => void;
  onStatusCycleStart: (itemId: string, total: number) => void;
  onStatusCycleStop: (itemId: string) => void;
};

type InspectorProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

type CanvasProps = {
  viewportWidth: string;
  viewportHeight: string;
  zoom: number;
  pan: { x: number; y: number };
  selectedId?: string;
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (value: number) => void;
  onSelectNode: (nodeId: string) => void;
};

type DragEndPayload = {
  active: {
    data: {
      current: {
        kind: string;
        itemId?: string;
        nodeId?: string;
        parentId?: string;
      };
    };
  };
  over: {
    id?: string;
    data: {
      current?: { kind?: string; nodeId?: string; parentId?: string };
    };
  } | null;
};

vi.mock('react-router', () => ({
  useParams: () => ({ projectId: PROJECT_ID }),
}));

vi.mock('@dnd-kit/core', () => {
  const DndContext = ({ children, ...props }: { children: ReactNode }) => {
    (globalThis as { __dndProps?: unknown }).__dndProps = props;
    return <div data-testid="dnd-context">{children}</div>;
  };
  const DragOverlay = ({ children }: { children?: ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  );
  class PointerSensor {}
  const useSensor = () => ({});
  const useSensors = (...sensors: unknown[]) => sensors;
  return { DndContext, DragOverlay, PointerSensor, useSensor, useSensors };
});

vi.mock('../BlueprintEditorAddressBar', () => ({
  BlueprintEditorAddressBar: ({
    currentPath,
    newPath,
    routes,
    onCurrentPathChange,
    onNewPathChange,
    onAddRoute,
    statusIndicator,
  }: AddressBarProps) => (
    <div
      data-testid="address-bar"
      data-current={currentPath}
      data-new={newPath}
      data-routes={routes.length}
    >
      {statusIndicator}
      <button
        type="button"
        data-testid="set-new-path"
        onClick={() => onNewPathChange('/new-route')}
      />
      <button
        type="button"
        data-testid="set-current-path"
        onClick={() => onCurrentPathChange('/search')}
      />
      <button type="button" data-testid="add-route" onClick={onAddRoute} />
    </div>
  ),
}));

vi.mock('../BlueprintEditorViewportBar', () => ({
  BlueprintEditorViewportBar: ({
    viewportWidth,
    viewportHeight,
    zoom,
    onViewportWidthChange,
    onViewportHeightChange,
    onZoomChange,
    onResetView,
  }: ViewportBarProps) => (
    <div
      data-testid="viewport-bar"
      data-width={viewportWidth}
      data-height={viewportHeight}
      data-zoom={zoom}
    >
      <button
        type="button"
        data-testid="zoom-max"
        onClick={() => onZoomChange(VIEWPORT_ZOOM_RANGE.max + 50)}
      />
      <button
        type="button"
        data-testid="zoom-min"
        onClick={() => onZoomChange(VIEWPORT_ZOOM_RANGE.min - 20)}
      />
      <button type="button" data-testid="reset-view" onClick={onResetView} />
      <button
        type="button"
        data-testid="set-width"
        onClick={() => onViewportWidthChange('1111')}
      />
      <button
        type="button"
        data-testid="set-height"
        onClick={() => onViewportHeightChange('777')}
      />
    </div>
  ),
}));

vi.mock('../BlueprintEditorComponentTree', () => ({
  BlueprintEditorComponentTree: ({
    isCollapsed,
    selectedId,
    onToggleCollapse,
    onSelectNode,
    onDeleteSelected,
    onDeleteNode,
    onCopyNode,
    onMoveNode,
  }: ComponentTreeProps) => (
    <div
      data-testid="component-tree"
      data-collapsed={String(isCollapsed)}
      data-selected={selectedId ?? ''}
    >
      <button
        type="button"
        data-testid="toggle-tree"
        onClick={onToggleCollapse}
      />
      <button
        type="button"
        data-testid="select-node"
        onClick={() => onSelectNode('node-1')}
      />
      <button
        type="button"
        data-testid="delete-selected"
        onClick={onDeleteSelected}
      />
      <button
        type="button"
        data-testid="delete-node"
        onClick={() => onDeleteNode('child-1')}
      />
      <button
        type="button"
        data-testid="copy-node"
        onClick={() => onCopyNode('child-1')}
      />
      <button
        type="button"
        data-testid="move-up"
        onClick={() => onMoveNode('child-1', 'up')}
      />
      <button
        type="button"
        data-testid="move-up-2"
        onClick={() => onMoveNode('child-2', 'up')}
      />
    </div>
  ),
}));

vi.mock('../BlueprintEditorSidebar', () => ({
  BlueprintEditorSidebar: ({
    isCollapsed,
    collapsedGroups,
    expandedPreviews,
    sizeSelections,
    statusSelections,
    onToggleCollapse,
    onToggleGroup,
    onTogglePreview,
    onPreviewKeyDown,
    onSizeSelect,
    onStatusSelect,
    onStatusCycleStart,
    onStatusCycleStop,
  }: SidebarProps) => (
    <aside
      data-testid="sidebar"
      data-collapsed={String(isCollapsed)}
      data-group-collapsed={String(Boolean(collapsedGroups.base))}
      data-preview-expanded={String(Boolean(expandedPreviews.button))}
      data-size-selection={sizeSelections.button ?? ''}
      data-status-selection={
        typeof statusSelections.button === 'number'
          ? String(statusSelections.button)
          : ''
      }
    >
      <button
        type="button"
        data-testid="toggle-sidebar"
        onClick={onToggleCollapse}
      />
      <button
        type="button"
        data-testid="toggle-group"
        onClick={() => onToggleGroup('base')}
      />
      <button
        type="button"
        data-testid="toggle-preview"
        onClick={() => onTogglePreview('button')}
      />
      <button
        type="button"
        data-testid="preview-key"
        onKeyDown={(event) => onPreviewKeyDown(event, 'button', true)}
      />
      <button
        type="button"
        data-testid="select-size"
        onClick={() => onSizeSelect('button', 'L')}
      />
      <button
        type="button"
        data-testid="select-status"
        onClick={() => onStatusSelect('button', 1)}
      />
      <button
        type="button"
        data-testid="start-status"
        onClick={() => onStatusCycleStart('button', 2)}
      />
      <button
        type="button"
        data-testid="stop-status"
        onClick={() => onStatusCycleStop('button')}
      />
    </aside>
  ),
}));

vi.mock('../BlueprintEditorInspector', () => ({
  BlueprintEditorInspector: ({
    isCollapsed,
    onToggleCollapse,
  }: InspectorProps) => (
    <aside data-testid="inspector" data-collapsed={String(isCollapsed)}>
      <button
        type="button"
        data-testid="toggle-inspector"
        onClick={onToggleCollapse}
      />
    </aside>
  ),
}));

vi.mock('../BlueprintEditorCanvas', () => ({
  BlueprintEditorCanvas: ({
    viewportWidth,
    viewportHeight,
    zoom,
    pan,
    selectedId,
    onPanChange,
    onZoomChange,
    onSelectNode,
  }: CanvasProps) => (
    <section
      data-testid="canvas"
      data-width={viewportWidth}
      data-height={viewportHeight}
      data-zoom={zoom}
      data-pan={`${pan.x},${pan.y}`}
      data-selected={selectedId ?? ''}
    >
      <button
        type="button"
        data-testid="pan-right"
        onClick={() => onPanChange({ x: pan.x + 20, y: pan.y })}
      />
      <button
        type="button"
        data-testid="zoom-in"
        onClick={() => onZoomChange(zoom + 10)}
      />
      <button
        type="button"
        data-testid="select-canvas-node"
        onClick={() => onSelectNode('node-2')}
      />
    </section>
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  resetEditorStore();
  resetSettingsStore();
  useAuthStore.setState({
    token: null,
    expiresAt: null,
    user: null,
  });
});

const getBlueprintState = () =>
  useEditorStore.getState().blueprintStateByProject[PROJECT_ID];

const countNodes = (node: { children?: unknown[] }): number => {
  const children = Array.isArray(node.children) ? node.children : [];
  return 1 + children.reduce((total, child) => total + countNodes(child), 0);
};

const getPaletteItemIds = () => {
  const ids = new Set<string>();
  getComponentGroups().forEach((group) => {
    group.items.forEach((item) => ids.add(item.id));
  });
  return Array.from(ids);
};

const renderBlueprintEditor = () =>
  render(
    <EditorShortcutProvider>
      <BlueprintEditor />
    </EditorShortcutProvider>
  );

describe('BlueprintEditor', () => {
  it('initializes blueprint state from global viewport defaults', async () => {
    resetSettingsStore({ viewportWidth: '1600', viewportHeight: '900' });

    renderBlueprintEditor();

    await waitFor(() => {
      expect(getBlueprintState()).toBeTruthy();
    });

    const blueprintState = getBlueprintState();
    expect(blueprintState?.viewportWidth).toBe('1600');
    expect(blueprintState?.viewportHeight).toBe('900');
  });

  it('adds a route and updates the current path', async () => {
    renderBlueprintEditor();

    const addressBar = screen.getByTestId('address-bar');
    const initialRoutes = Number(addressBar.getAttribute('data-routes') ?? 0);

    fireEvent.click(screen.getByTestId('set-new-path'));
    fireEvent.click(screen.getByTestId('add-route'));

    await waitFor(() => {
      expect(Number(addressBar.getAttribute('data-routes') ?? 0)).toBe(
        initialRoutes + 1
      );
    });

    expect(addressBar.getAttribute('data-current')).toBe('/new-route');
  });

  it('syncs route manifest to workspace backend after route changes', async () => {
    const applyWorkspaceIntent = vi
      .spyOn(editorApi, 'applyWorkspaceIntent')
      .mockResolvedValue({
        workspaceId: 'ws-1',
        workspaceRev: 6,
        routeRev: 8,
        opSeq: 9,
      });

    useAuthStore.setState({
      token: 'token-1',
      expiresAt: Date.now() + 60_000,
      user: null,
    });
    resetEditorStore({
      workspaceId: 'ws-1',
      workspaceRev: 5,
      routeRev: 7,
      workspaceCapabilitiesLoaded: true,
      workspaceCapabilities: {
        'core.route.manifest.update@1.0': true,
      },
      routeManifest: {
        version: '1',
        root: {
          id: 'root',
          children: [{ id: 'route-home', index: true }],
        },
      },
      activeRouteNodeId: 'route-home',
    });

    renderBlueprintEditor();

    fireEvent.click(screen.getByTestId('set-new-path'));
    fireEvent.click(screen.getByTestId('add-route'));

    await waitFor(
      () => {
        expect(applyWorkspaceIntent).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
    const payload = applyWorkspaceIntent.mock.calls[0]?.[2];
    expect(payload?.intent.namespace).toBe('core.route');
    expect(payload?.intent.type).toBe('manifest.update');
    expect(payload?.intent.payload).toHaveProperty('routeManifest');
  });

  it('falls back to timestamp-based route ids when crypto is unavailable', async () => {
    vi.stubGlobal('crypto', undefined);

    renderBlueprintEditor();

    const addressBar = screen.getByTestId('address-bar');
    const initialRoutes = Number(addressBar.getAttribute('data-routes') ?? 0);

    fireEvent.click(screen.getByTestId('set-new-path'));
    fireEvent.click(screen.getByTestId('add-route'));

    await waitFor(() => {
      expect(Number(addressBar.getAttribute('data-routes') ?? 0)).toBe(
        initialRoutes + 1
      );
    });

    vi.unstubAllGlobals();
  });

  it('honors focus layout by collapsing the sidebar and inspector', async () => {
    resetSettingsStore({ panelLayout: 'focus' });

    renderBlueprintEditor();

    await waitFor(() => {
      expect(screen.getByTestId('sidebar').getAttribute('data-collapsed')).toBe(
        'true'
      );
    });
    expect(screen.getByTestId('inspector').getAttribute('data-collapsed')).toBe(
      'true'
    );
  });

  it('opens inspector when selecting a component while collapsed', async () => {
    resetSettingsStore({ panelLayout: 'focus' });
    renderBlueprintEditor();

    await waitFor(() => {
      expect(
        screen.getByTestId('inspector').getAttribute('data-collapsed')
      ).toBe('true');
    });

    fireEvent.click(screen.getByTestId('select-node'));

    await waitFor(() => {
      expect(
        screen.getByTestId('inspector').getAttribute('data-collapsed')
      ).toBe('false');
    });
  });

  it('toggles sidebar, tree, and inspector with Ctrl+Alt+J/K/L', () => {
    renderBlueprintEditor();

    const sidebar = screen.getByTestId('sidebar');
    const tree = screen.getByTestId('component-tree');
    const inspector = screen.getByTestId('inspector');

    expect(sidebar.getAttribute('data-collapsed')).toBe('false');
    expect(tree.getAttribute('data-collapsed')).toBe('false');
    expect(inspector.getAttribute('data-collapsed')).toBe('false');

    fireEvent.keyDown(window, { key: 'j', ctrlKey: true, altKey: true });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true, altKey: true });
    fireEvent.keyDown(window, { key: 'l', ctrlKey: true, altKey: true });

    expect(sidebar.getAttribute('data-collapsed')).toBe('true');
    expect(tree.getAttribute('data-collapsed')).toBe('true');
    expect(inspector.getAttribute('data-collapsed')).toBe('true');
  });

  it('toggles preview and group state from the sidebar', () => {
    renderBlueprintEditor();

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.getAttribute('data-group-collapsed')).toBe('false');

    fireEvent.click(screen.getByTestId('toggle-group'));
    expect(sidebar.getAttribute('data-group-collapsed')).toBe('true');

    fireEvent.click(screen.getByTestId('toggle-preview'));
    expect(sidebar.getAttribute('data-preview-expanded')).toBe('true');

    fireEvent.keyDown(screen.getByTestId('preview-key'), { key: 'Enter' });
    expect(sidebar.getAttribute('data-preview-expanded')).toBe('false');
  });

  it('updates size and status selections from the sidebar', () => {
    renderBlueprintEditor();

    const sidebar = screen.getByTestId('sidebar');
    fireEvent.click(screen.getByTestId('select-size'));
    fireEvent.click(screen.getByTestId('select-status'));

    expect(sidebar.getAttribute('data-size-selection')).toBe('L');
    expect(sidebar.getAttribute('data-status-selection')).toBe('1');
  });

  it('cycles status selections when requested', () => {
    vi.useFakeTimers();
    renderBlueprintEditor();

    const sidebar = screen.getByTestId('sidebar');
    fireEvent.click(screen.getByTestId('start-status'));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(sidebar.getAttribute('data-status-selection')).toBe('1');
    fireEvent.click(screen.getByTestId('stop-status'));
    vi.useRealTimers();
  });

  it('clamps zoom values to the allowed range', async () => {
    renderBlueprintEditor();

    await waitFor(() => {
      expect(getBlueprintState()).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('zoom-max'));

    await waitFor(() => {
      expect(getBlueprintState()?.zoom).toBe(VIEWPORT_ZOOM_RANGE.max);
    });

    fireEvent.click(screen.getByTestId('zoom-min'));

    await waitFor(() => {
      expect(getBlueprintState()?.zoom).toBe(VIEWPORT_ZOOM_RANGE.min);
    });
  });

  it('resets zoom and pan to defaults', async () => {
    resetEditorStore({
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          zoom: 140,
          pan: { x: 240, y: 120 },
        },
      },
    });

    renderBlueprintEditor();

    fireEvent.click(screen.getByTestId('reset-view'));

    await waitFor(() => {
      expect(getBlueprintState()?.zoom).toBe(DEFAULT_BLUEPRINT_STATE.zoom);
    });
    expect(getBlueprintState()?.pan).toEqual(DEFAULT_BLUEPRINT_STATE.pan);
  });

  it('updates viewport dimensions from the viewport bar', async () => {
    renderBlueprintEditor();

    await waitFor(() => {
      expect(getBlueprintState()).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('set-width'));
    fireEvent.click(screen.getByTestId('set-height'));

    await waitFor(() => {
      expect(getBlueprintState()?.viewportWidth).toBe('1111');
    });
    expect(getBlueprintState()?.viewportHeight).toBe('777');
  });

  it('shows the drag overlay while dragging a palette item', () => {
    renderBlueprintEditor();

    const dndProps = (
      globalThis as {
        __dndProps?: { onDragStart?: (event: DragEndPayload) => void };
      }
    ).__dndProps;
    expect(dndProps?.onDragStart).toBeTruthy();

    act(() => {
      dndProps?.onDragStart?.({
        active: {
          data: { current: { kind: 'palette-item', itemId: 'text' } },
        },
        over: null,
      });
    });

    expect(screen.getByTestId('drag-overlay').textContent).toContain('text');
  });

  it('clears the drag overlay on cancel', () => {
    renderBlueprintEditor();

    const dndProps = (
      globalThis as {
        __dndProps?: {
          onDragStart?: (event: DragEndPayload) => void;
          onDragCancel?: () => void;
        };
      }
    ).__dndProps;

    act(() => {
      dndProps?.onDragStart?.({
        active: {
          data: { current: { kind: 'palette-item', itemId: 'text' } },
        },
        over: null,
      });
    });

    expect(screen.getByTestId('drag-overlay').textContent).toContain('text');

    act(() => {
      dndProps?.onDragCancel?.();
    });

    expect(screen.getByTestId('drag-overlay').textContent).toBe('');
  });
});
