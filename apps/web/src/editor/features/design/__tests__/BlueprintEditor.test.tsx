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
import BlueprintEditor from '../BlueprintEditor';
import {
    DEFAULT_BLUEPRINT_STATE,
    useEditorStore,
} from '@/editor/store/useEditorStore';
import {
    getComponentGroups,
    VIEWPORT_ZOOM_RANGE,
} from '../BlueprintEditor.data';
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
            <button
                type="button"
                data-testid="add-route"
                onClick={onAddRoute}
            />
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
            <button
                type="button"
                data-testid="reset-view"
                onClick={onResetView}
            />
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
    return (
        1 + children.reduce((total, child: any) => total + countNodes(child), 0)
    );
};

const getPaletteItemIds = () => {
    const ids = new Set<string>();
    getComponentGroups().forEach((group) => {
        group.items.forEach((item) => ids.add(item.id));
    });
    return Array.from(ids);
};

describe('BlueprintEditor', () => {
    it('initializes blueprint state from global viewport defaults', async () => {
        resetSettingsStore({ viewportWidth: '1600', viewportHeight: '900' });

        render(<BlueprintEditor />);

        await waitFor(() => {
            expect(getBlueprintState()).toBeTruthy();
        });

        const blueprintState = getBlueprintState();
        expect(blueprintState?.viewportWidth).toBe('1600');
        expect(blueprintState?.viewportHeight).toBe('900');
    });

    it('adds a route and updates the current path', async () => {
        render(<BlueprintEditor />);

        const addressBar = screen.getByTestId('address-bar');
        const initialRoutes = Number(
            addressBar.getAttribute('data-routes') ?? 0
        );

        fireEvent.click(screen.getByTestId('set-new-path'));
        fireEvent.click(screen.getByTestId('add-route'));

        await waitFor(() => {
            expect(Number(addressBar.getAttribute('data-routes') ?? 0)).toBe(
                initialRoutes + 1
            );
        });

        expect(addressBar.getAttribute('data-current')).toBe('/new-route');
    });

    it('falls back to timestamp-based route ids when crypto is unavailable', async () => {
        vi.stubGlobal('crypto', undefined);

        render(<BlueprintEditor />);

        const addressBar = screen.getByTestId('address-bar');
        const initialRoutes = Number(
            addressBar.getAttribute('data-routes') ?? 0
        );

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

        render(<BlueprintEditor />);

        await waitFor(() => {
            expect(
                screen.getByTestId('sidebar').getAttribute('data-collapsed')
            ).toBe('true');
        });
        expect(
            screen.getByTestId('inspector').getAttribute('data-collapsed')
        ).toBe('true');
    });

    it('opens inspector when selecting a component while collapsed', async () => {
        resetSettingsStore({ panelLayout: 'focus' });
        render(<BlueprintEditor />);

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

    it('toggles preview and group state from the sidebar', () => {
        render(<BlueprintEditor />);

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
        render(<BlueprintEditor />);

        const sidebar = screen.getByTestId('sidebar');
        fireEvent.click(screen.getByTestId('select-size'));
        fireEvent.click(screen.getByTestId('select-status'));

        expect(sidebar.getAttribute('data-size-selection')).toBe('L');
        expect(sidebar.getAttribute('data-status-selection')).toBe('1');
    });

    it('cycles status selections when requested', () => {
        vi.useFakeTimers();
        render(<BlueprintEditor />);

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
        render(<BlueprintEditor />);

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

        render(<BlueprintEditor />);

        fireEvent.click(screen.getByTestId('reset-view'));

        await waitFor(() => {
            expect(getBlueprintState()?.zoom).toBe(
                DEFAULT_BLUEPRINT_STATE.zoom
            );
        });
        expect(getBlueprintState()?.pan).toEqual(DEFAULT_BLUEPRINT_STATE.pan);
    });

    it('updates viewport dimensions from the viewport bar', async () => {
        render(<BlueprintEditor />);

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

    it('inserts palette items on canvas drop and selects the new node', async () => {
        render(<BlueprintEditor />);

        const dndProps = (
            globalThis as {
                __dndProps?: { onDragEnd?: (event: DragEndPayload) => void };
            }
        ).__dndProps;
        expect(dndProps?.onDragEnd).toBeTruthy();

        act(() => {
            dndProps?.onDragEnd?.({
                active: {
                    data: {
                        current: { kind: 'palette-item', itemId: 'button' },
                    },
                },
                over: {
                    id: 'canvas-drop',
                    data: { current: { kind: 'canvas' } },
                },
            });
        });

        await waitFor(() => {
            expect(getBlueprintState()?.selectedId).toBe('MdrButton-1');
        });

        const mirDoc = useEditorStore.getState().mirDoc;
        expect(mirDoc.ui.root.children?.[0].type).toBe('MdrButton');
    });

    it('shows the drag overlay while dragging a palette item', () => {
        render(<BlueprintEditor />);

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

        expect(screen.getByTestId('drag-overlay').textContent).toContain(
            'text'
        );
    });

    it('clears the drag overlay on cancel', () => {
        render(<BlueprintEditor />);

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

        expect(screen.getByTestId('drag-overlay').textContent).toContain(
            'text'
        );

        act(() => {
            dndProps?.onDragCancel?.();
        });

        expect(screen.getByTestId('drag-overlay').textContent).toBe('');
    });

    it('inserts new nodes as children when dropping on a node that supports children', async () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'div-1', type: 'MdrDiv', children: [] },
                { id: 'text-1', type: 'MdrText', text: 'Hello' },
            ]),
        });

        render(<BlueprintEditor />);

        const dndProps = (
            globalThis as {
                __dndProps?: { onDragEnd?: (event: DragEndPayload) => void };
            }
        ).__dndProps;

        act(() => {
            dndProps?.onDragEnd?.({
                active: {
                    data: {
                        current: { kind: 'palette-item', itemId: 'button' },
                    },
                },
                over: {
                    id: 'tree-node:div-1',
                    data: { current: { kind: 'tree-node', nodeId: 'div-1' } },
                },
            });
        });

        await waitFor(() => {
            expect(getBlueprintState()?.selectedId).toBe('MdrButton-1');
        });

        const mirDoc = useEditorStore.getState().mirDoc;
        const divNode = mirDoc.ui.root.children?.[0];
        expect(divNode?.id).toBe('div-1');
        expect(divNode?.children?.[0].type).toBe('MdrButton');
    });

    it('inserts new nodes after a node that does not support children', async () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'button-1', type: 'MdrButton', text: 'Button' },
                { id: 'text-1', type: 'MdrText', text: 'Hello' },
            ]),
        });

        render(<BlueprintEditor />);

        const dndProps = (
            globalThis as {
                __dndProps?: { onDragEnd?: (event: DragEndPayload) => void };
            }
        ).__dndProps;

        act(() => {
            dndProps?.onDragEnd?.({
                active: {
                    data: { current: { kind: 'palette-item', itemId: 'text' } },
                },
                over: {
                    id: 'tree-node:button-1',
                    data: {
                        current: { kind: 'tree-node', nodeId: 'button-1' },
                    },
                },
            });
        });

        await waitFor(() => {
            expect(getBlueprintState()?.selectedId).toBe('MdrText-2');
        });

        const children =
            useEditorStore.getState().mirDoc.ui.root.children ?? [];
        expect(children.map((child) => child.id)).toEqual([
            'button-1',
            'MdrText-2',
            'text-1',
        ]);
    });

    it('reorders nodes when dragging within the tree', async () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'node-a', type: 'MdrText', text: 'A' },
                { id: 'node-b', type: 'MdrText', text: 'B' },
            ]),
        });

        render(<BlueprintEditor />);

        const dndProps = (
            globalThis as {
                __dndProps?: { onDragEnd?: (event: DragEndPayload) => void };
            }
        ).__dndProps;

        act(() => {
            dndProps?.onDragEnd?.({
                active: {
                    data: {
                        current: {
                            kind: 'tree-sort',
                            nodeId: 'node-a',
                            parentId: 'root',
                        },
                    },
                },
                over: {
                    id: 'tree-node:node-b',
                    data: {
                        current: {
                            kind: 'tree-sort',
                            nodeId: 'node-b',
                            parentId: 'root',
                        },
                    },
                },
            });
        });

        const children =
            useEditorStore.getState().mirDoc.ui.root.children ?? [];
        expect(children.map((child) => child.id)).toEqual(['node-b', 'node-a']);
    });

    it('moves nodes across parents when dropping on another tree node', () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                {
                    id: 'div-a',
                    type: 'MdrDiv',
                    children: [{ id: 'child-1', type: 'MdrText', text: 'A' }],
                },
                { id: 'div-b', type: 'MdrDiv', children: [] },
            ]),
        });

        render(<BlueprintEditor />);

        const dndProps = (
            globalThis as {
                __dndProps?: { onDragEnd?: (event: DragEndPayload) => void };
            }
        ).__dndProps;

        act(() => {
            dndProps?.onDragEnd?.({
                active: {
                    data: {
                        current: {
                            kind: 'tree-sort',
                            nodeId: 'child-1',
                            parentId: 'div-a',
                        },
                    },
                },
                over: {
                    id: 'tree-node:div-b',
                    data: { current: { kind: 'tree-node', nodeId: 'div-b' } },
                },
            });
        });

        const children =
            useEditorStore.getState().mirDoc.ui.root.children ?? [];
        const divA = children.find((child) => child.id === 'div-a');
        const divB = children.find((child) => child.id === 'div-b');

        expect(divA?.children ?? []).toHaveLength(0);
        expect(divB?.children?.[0]?.id).toBe('child-1');
    });

    it('moves nodes within the same parent when dropping after a non-container node', () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'btn-1', type: 'MdrButton', text: 'A' },
                { id: 'btn-2', type: 'MdrButton', text: 'B' },
                { id: 'div-1', type: 'MdrDiv', children: [] },
            ]),
        });

        render(<BlueprintEditor />);

        const dndProps = (
            globalThis as {
                __dndProps?: { onDragEnd?: (event: DragEndPayload) => void };
            }
        ).__dndProps;

        act(() => {
            dndProps?.onDragEnd?.({
                active: {
                    data: {
                        current: {
                            kind: 'tree-sort',
                            nodeId: 'btn-1',
                            parentId: 'root',
                        },
                    },
                },
                over: {
                    id: 'tree-node:btn-2',
                    data: { current: { kind: 'tree-node', nodeId: 'btn-2' } },
                },
            });
        });

        const children =
            useEditorStore.getState().mirDoc.ui.root.children ?? [];
        expect(children.map((child) => child.id)).toEqual([
            'btn-2',
            'btn-1',
            'div-1',
        ]);
    });

    it('deletes the selected node and promotes selection to the parent', async () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'child-1', type: 'MdrText', text: 'Text' },
            ]),
            blueprintStateByProject: {
                [PROJECT_ID]: {
                    ...DEFAULT_BLUEPRINT_STATE,
                    selectedId: 'child-1',
                },
            },
        });

        render(<BlueprintEditor />);

        fireEvent.click(screen.getByTestId('delete-selected'));

        await waitFor(() => {
            expect(getBlueprintState()?.selectedId).toBe('root');
        });

        const mirDoc = useEditorStore.getState().mirDoc;
        expect(mirDoc.ui.root.children).toBeUndefined();
    });

    it('deletes a node without changing selection when another node is selected', async () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'child-1', type: 'MdrText', text: 'Text' },
                { id: 'child-2', type: 'MdrText', text: 'Text 2' },
            ]),
            blueprintStateByProject: {
                [PROJECT_ID]: {
                    ...DEFAULT_BLUEPRINT_STATE,
                    selectedId: 'child-2',
                },
            },
        });

        render(<BlueprintEditor />);

        fireEvent.click(screen.getByTestId('delete-node'));

        await waitFor(() => {
            expect(getBlueprintState()?.selectedId).toBe('child-2');
        });

        const children =
            useEditorStore.getState().mirDoc.ui.root.children ?? [];
        expect(children.map((child) => child.id)).toEqual(['child-2']);
    });

    it('copies a node and selects the cloned node', async () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'child-1', type: 'MdrText', text: 'Text' },
            ]),
            blueprintStateByProject: {
                [PROJECT_ID]: {
                    ...DEFAULT_BLUEPRINT_STATE,
                    selectedId: 'child-1',
                },
            },
        });

        render(<BlueprintEditor />);

        fireEvent.click(screen.getByTestId('copy-node'));

        await waitFor(() => {
            expect(getBlueprintState()?.selectedId).toBe('MdrText-2');
        });

        const children =
            useEditorStore.getState().mirDoc.ui.root.children ?? [];
        expect(children.map((child) => child.id)).toEqual([
            'child-1',
            'MdrText-2',
        ]);
    });

    it('moves nodes within the same parent', async () => {
        resetEditorStore({
            mirDoc: createMirDoc([
                { id: 'child-1', type: 'MdrText', text: 'Text' },
                { id: 'child-2', type: 'MdrText', text: 'Text 2' },
            ]),
        });

        render(<BlueprintEditor />);

        fireEvent.click(screen.getByTestId('move-up-2'));

        const children =
            useEditorStore.getState().mirDoc.ui.root.children ?? [];
        expect(children.map((child) => child.id)).toEqual([
            'child-2',
            'child-1',
        ]);
    });

    it('drops every palette item on the canvas without crashing', async () => {
        render(<BlueprintEditor />);

        await waitFor(() => {
            expect(getBlueprintState()).toBeTruthy();
        });

        const dndProps = (
            globalThis as {
                __dndProps?: { onDragEnd?: (event: DragEndPayload) => void };
            }
        ).__dndProps;
        const itemIds = getPaletteItemIds();
        let totalNodes = countNodes(useEditorStore.getState().mirDoc.ui.root);

        itemIds.forEach((itemId) => {
            act(() => {
                useEditorStore
                    .getState()
                    .setBlueprintState(PROJECT_ID, { selectedId: 'root' });
                dndProps?.onDragEnd?.({
                    active: {
                        data: { current: { kind: 'palette-item', itemId } },
                    },
                    over: {
                        id: 'canvas-drop',
                        data: { current: { kind: 'canvas' } },
                    },
                });
            });
            const nextTotal = countNodes(
                useEditorStore.getState().mirDoc.ui.root
            );
            expect(nextTotal).toBe(totalNodes + 1);
            totalNodes = nextTotal;
        });
    });
});
