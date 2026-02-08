import {
    type KeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { DEFAULT_ROUTES, VIEWPORT_ZOOM_RANGE } from './BlueprintEditor.data';
import { useBlueprintAutosave } from './BlueprintEditor.autosave';
import { useBlueprintDragDrop } from './BlueprintEditor.dragdrop';
import { createNodeIdFactory } from './BlueprintEditor.palette';
import {
    cloneNodeWithNewIds,
    findNodeById,
    findParentId,
    insertAfterById,
    insertIntoMirDoc,
    moveChildById,
    removeNodeById,
} from './BlueprintEditor.tree';
import type { RouteItem } from './BlueprintEditor.types';
import {
    getNavigateLinkKind,
    resolveNavigateTarget,
} from '@/mir/actions/registry';
import {
    DEFAULT_BLUEPRINT_STATE,
    useEditorStore,
} from '@/editor/store/useEditorStore';
import { useSettingsStore } from '@/editor/store/useSettingsStore';
import { useAuthStore } from '@/auth/useAuthStore';
import { editorApi } from '@/editor/editorApi';

const CAPABILITY_MIR_DOCUMENT_UPDATE = 'core.mir.document.update@1.0';

const createRouteId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `route-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

type InteractionRequest = {
    params?: Record<string, unknown>;
    nodeId: string;
    trigger: string;
    eventKey: string;
};

export const useBlueprintEditorController = () => {
    const [routes, setRoutes] = useState<RouteItem[]>(DEFAULT_ROUTES);
    const [currentPath, setCurrentPath] = useState(DEFAULT_ROUTES[0].path);
    const [newPath, setNewPath] = useState('');
    const panelLayout = useSettingsStore((state) => state.global.panelLayout);
    const [isLibraryCollapsed, setLibraryCollapsed] = useState(
        () => panelLayout === 'focus'
    );
    const [isInspectorCollapsed, setInspectorCollapsed] = useState(
        () => panelLayout === 'focus' || panelLayout === 'wide'
    );
    const [isTreeCollapsed, setTreeCollapsed] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<
        Record<string, boolean>
    >({});
    const [expandedPreviews, setExpandedPreviews] = useState<
        Record<string, boolean>
    >({});
    const [sizeSelections, setSizeSelections] = useState<Record<string, string>>(
        {}
    );
    const [statusSelections, setStatusSelections] = useState<
        Record<string, number>
    >({});
    const statusTimers = useRef<Record<string, number>>({});
    const { t } = useTranslation('blueprint');
    const { projectId } = useParams();
    const blueprintKey = projectId ?? 'global';
    const blueprintState = useEditorStore(
        (state) => state.blueprintStateByProject[blueprintKey]
    );
    const setBlueprintState = useEditorStore((state) => state.setBlueprintState);
    const mirDoc = useEditorStore((state) => state.mirDoc);
    const updateMirDoc = useEditorStore((state) => state.updateMirDoc);
    const workspaceId = useEditorStore((state) => state.workspaceId);
    const activeDocumentId = useEditorStore((state) => state.activeDocumentId);
    const activeDocumentContentRev = useEditorStore((state) =>
        state.activeDocumentId
            ? state.workspaceDocumentsById[state.activeDocumentId]?.contentRev
            : undefined
    );
    const workspaceCapabilitiesLoaded = useEditorStore(
        (state) => state.workspaceCapabilitiesLoaded
    );
    const canUpdateWorkspaceDocument = useEditorStore(
        (state) =>
            state.workspaceCapabilities[CAPABILITY_MIR_DOCUMENT_UPDATE] === true
    );
    const applyWorkspaceMutation = useEditorStore(
        (state) => state.applyWorkspaceMutation
    );
    const token = useAuthStore((state) => state.token);
    const zoomStep = useSettingsStore((state) => state.global.zoomStep);
    const defaultViewportWidth = useSettingsStore(
        (state) => state.global.viewportWidth
    );
    const defaultViewportHeight = useSettingsStore(
        (state) => state.global.viewportHeight
    );
    const initialBlueprintState = useMemo(
        () => ({
            ...DEFAULT_BLUEPRINT_STATE,
            viewportWidth: defaultViewportWidth,
            viewportHeight: defaultViewportHeight,
        }),
        [defaultViewportWidth, defaultViewportHeight]
    );
    const resolvedBlueprintState = blueprintState ?? DEFAULT_BLUEPRINT_STATE;
    const { viewportWidth, viewportHeight, zoom, pan, selectedId } =
        resolvedBlueprintState;
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );
    const {
        saveStatus,
        saveTransport,
        saveIndicatorTone,
        saveIndicatorLabel,
        isWorkspaceSaveDisabled,
    } = useBlueprintAutosave({
        token,
        projectId: projectId ?? undefined,
        mirDoc,
        workspaceId,
        activeDocumentId: activeDocumentId ?? undefined,
        activeDocumentContentRev,
        canUpdateWorkspaceDocument,
        workspaceCapabilitiesLoaded,
        applyWorkspaceMutation,
    });

    const handleAddRoute = () => {
        const value = newPath.trim();
        if (!value) return;
        const next = { id: createRouteId(), path: value };
        setRoutes((prev) => [...prev, next]);
        setCurrentPath(value);
        setNewPath('');
    };

    const ensureRouteExists = (path: string) => {
        setRoutes((prev) => {
            if (prev.some((route) => route.path === path)) return prev;
            return [...prev, { id: createRouteId(), path }];
        });
    };

    const handleNavigateRequest = (options: InteractionRequest) => {
        const params = options.params ?? {};
        const to = typeof params.to === 'string' ? params.to.trim() : '';
        if (!to) return;
        const linkKind = getNavigateLinkKind(to);
        if (linkKind === 'external') {
            if (typeof window === 'undefined') return;
            const { configuredTarget, effectiveTarget, openedAsBlankForSafety } =
                resolveNavigateTarget(params.target, {
                    forceBlankForExternalSafety: true,
                });
            const replace = Boolean(params.replace);
            const targetLine = openedAsBlankForSafety
                ? t(
                      'inspector.groups.triggers.navigation.confirm.targetOverridden',
                      {
                          defaultValue:
                              'Configured target: {{configuredTarget}} (opened as {{effectiveTarget}} in Blueprint preview for safety).',
                          configuredTarget,
                          effectiveTarget,
                      }
                  )
                : t('inspector.groups.triggers.navigation.confirm.target', {
                      defaultValue: 'Target: {{effectiveTarget}}',
                      effectiveTarget,
                  });
            const confirmed = window.confirm(
                [
                    t('inspector.groups.triggers.navigation.confirm.title', {
                        defaultValue: 'Open external link?',
                    }),
                    t('inspector.groups.triggers.navigation.confirm.url', {
                        defaultValue: 'URL: {{to}}',
                        to,
                    }),
                    targetLine,
                    t('inspector.groups.triggers.navigation.confirm.replace', {
                        defaultValue: 'Replace history: {{replace}}',
                        replace: replace
                            ? t(
                                  'inspector.groups.triggers.navigation.confirm.yes',
                                  {
                                      defaultValue: 'Yes',
                                  }
                              )
                            : t(
                                  'inspector.groups.triggers.navigation.confirm.no',
                                  {
                                      defaultValue: 'No',
                                  }
                              ),
                    }),
                    t('inspector.groups.triggers.navigation.confirm.source', {
                        defaultValue: 'Source: {{nodeId}} · {{trigger}}',
                        nodeId: options.nodeId,
                        trigger: options.trigger,
                    }),
                ].join('\n')
            );
            if (!confirmed) return;
            window.open(to, '_blank', 'noopener,noreferrer');
            return;
        }

        if (linkKind === 'internal') {
            setCurrentPath(to);
            ensureRouteExists(to);
        }
    };

    const handleExecuteGraphRequest = (options: InteractionRequest) => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(
            new CustomEvent('mdr:execute-graph', {
                detail: {
                    nodeId: options.nodeId,
                    trigger: options.trigger,
                    eventKey: options.eventKey,
                    ...(options.params ?? {}),
                },
            })
        );
    };

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const togglePreview = (previewId: string) => {
        setExpandedPreviews((prev) => ({
            ...prev,
            [previewId]: !prev[previewId],
        }));
    };

    const handlePreviewKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
        previewId: string,
        hasVariants: boolean
    ) => {
        if (!hasVariants) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePreview(previewId);
        }
    };

    const handleSizeSelect = (itemId: string, sizeId: string) => {
        setSizeSelections((prev) => ({ ...prev, [itemId]: sizeId }));
    };

    const handleStatusSelect = (itemId: string, index: number) => {
        setStatusSelections((prev) => ({ ...prev, [itemId]: index }));
    };

    const startStatusCycle = (itemId: string, total: number) => {
        if (typeof window === 'undefined' || total < 2) return;
        window.clearInterval(statusTimers.current[itemId]);
        statusTimers.current[itemId] = window.setInterval(() => {
            setStatusSelections((prev) => ({
                ...prev,
                [itemId]: ((prev[itemId] ?? 0) + 1) % total,
            }));
        }, 1200);
    };

    const stopStatusCycle = (itemId: string) => {
        if (typeof window === 'undefined') return;
        window.clearInterval(statusTimers.current[itemId]);
        delete statusTimers.current[itemId];
    };

    useEffect(() => {
        if (blueprintState) return;
        setBlueprintState(blueprintKey, initialBlueprintState);
    }, [
        blueprintKey,
        blueprintState,
        initialBlueprintState,
        setBlueprintState,
    ]);

    useEffect(() => {
        if (panelLayout === 'focus') {
            setLibraryCollapsed(true);
            setInspectorCollapsed(true);
            return;
        }
        if (panelLayout === 'wide') {
            setLibraryCollapsed(false);
            setInspectorCollapsed(true);
            return;
        }
        setLibraryCollapsed(false);
        setInspectorCollapsed(false);
    }, [panelLayout]);

    const handleZoomChange = (value: number) => {
        const next = Math.min(
            VIEWPORT_ZOOM_RANGE.max,
            Math.max(VIEWPORT_ZOOM_RANGE.min, value)
        );
        setBlueprintState(blueprintKey, { zoom: next });
    };

    const handleViewportWidthChange = (value: string) => {
        setBlueprintState(blueprintKey, { viewportWidth: value });
    };

    const handleViewportHeightChange = (value: string) => {
        setBlueprintState(blueprintKey, { viewportHeight: value });
    };

    const handlePanChange = (nextPan: { x: number; y: number }) => {
        setBlueprintState(blueprintKey, { pan: nextPan });
    };

    const handleResetView = () => {
        setBlueprintState(blueprintKey, {
            zoom: DEFAULT_BLUEPRINT_STATE.zoom,
            pan: DEFAULT_BLUEPRINT_STATE.pan,
        });
    };

    const handleNodeSelect = (nodeId: string) => {
        setInspectorCollapsed(false);
        setBlueprintState(blueprintKey, { selectedId: nodeId });
    };

    const {
        activePaletteItemId,
        treeDropHint,
        handleDragStart,
        handleDragMove,
        handleDragCancel,
        handleDragEnd,
    } = useBlueprintDragDrop({
        mirDoc,
        selectedId,
        updateMirDoc,
        onNodeSelect: handleNodeSelect,
    });

    const handleDeleteSelected = () => {
        if (!selectedId) return;
        let nextSelectedId: string | undefined;
        let removed = false;
        updateMirDoc((doc) => {
            if (selectedId === doc.ui.root.id) return doc;
            const parentId = findParentId(doc.ui.root, selectedId);
            const removal = removeNodeById(doc.ui.root, selectedId);
            removed = removal.removed;
            if (!removal.removed) return doc;
            nextSelectedId = parentId ?? undefined;
            return {
                ...doc,
                ui: { ...doc.ui, root: removal.node },
            };
        });
        if (removed) {
            setBlueprintState(blueprintKey, { selectedId: nextSelectedId });
        }
    };

    const handleDeleteNode = (nodeId: string) => {
        if (!nodeId) return;
        let nextSelectedId: string | undefined;
        let removed = false;
        updateMirDoc((doc) => {
            if (nodeId === doc.ui.root.id) return doc;
            const parentId = findParentId(doc.ui.root, nodeId);
            const removal = removeNodeById(doc.ui.root, nodeId);
            removed = removal.removed;
            if (!removal.removed) return doc;
            if (selectedId === nodeId) {
                nextSelectedId = parentId ?? undefined;
            }
            return {
                ...doc,
                ui: { ...doc.ui, root: removal.node },
            };
        });
        if (removed && selectedId === nodeId) {
            setBlueprintState(blueprintKey, { selectedId: nextSelectedId });
        }
    };

    const handleCopyNode = (nodeId: string) => {
        if (!nodeId) return;
        let nextNodeId = '';
        updateMirDoc((doc) => {
            if (nodeId === doc.ui.root.id) return doc;
            const source = findNodeById(doc.ui.root, nodeId);
            if (!source) return doc;
            const createId = createNodeIdFactory(doc);
            const cloned = cloneNodeWithNewIds(source, createId);
            nextNodeId = cloned.id;
            const insertedSibling = insertAfterById(doc.ui.root, nodeId, cloned);
            if (insertedSibling.inserted) {
                return {
                    ...doc,
                    ui: { ...doc.ui, root: insertedSibling.node },
                };
            }
            return insertIntoMirDoc(doc, doc.ui.root.id, cloned);
        });
        if (nextNodeId) {
            handleNodeSelect(nextNodeId);
        }
    };

    const handleMoveNode = (nodeId: string, direction: 'up' | 'down') => {
        if (!nodeId) return;
        let moved = false;
        updateMirDoc((doc) => {
            if (nodeId === doc.ui.root.id) return doc;
            const parentId = findParentId(doc.ui.root, nodeId);
            if (!parentId) return doc;
            const result = moveChildById(
                doc.ui.root,
                parentId,
                nodeId,
                direction
            );
            moved = result.moved;
            return result.moved
                ? { ...doc, ui: { ...doc.ui, root: result.node } }
                : doc;
        });
        if (moved) {
            handleNodeSelect(nodeId);
        }
    };

    useEffect(() => {
        return () => {
            if (typeof window === 'undefined') return;
            Object.values(statusTimers.current).forEach((timer) =>
                window.clearInterval(timer)
            );
            statusTimers.current = {};
        };
    }, []);

    return {
        dnd: {
            sensors,
            activePaletteItemId,
            handleDragStart,
            handleDragMove,
            handleDragCancel,
            handleDragEnd,
        },
        saveIndicator: {
            saveStatus,
            saveTransport,
            saveIndicatorTone,
            saveIndicatorLabel,
            isWorkspaceSaveDisabled,
        },
        addressBar: {
            currentPath,
            newPath,
            routes,
            onCurrentPathChange: setCurrentPath,
            onNewPathChange: setNewPath,
            onAddRoute: handleAddRoute,
        },
        sidebar: {
            isCollapsed: isLibraryCollapsed,
            isTreeCollapsed,
            collapsedGroups,
            expandedPreviews,
            sizeSelections,
            statusSelections,
            onToggleCollapse: () => setLibraryCollapsed((prev) => !prev),
            onToggleGroup: toggleGroup,
            onTogglePreview: togglePreview,
            onPreviewKeyDown: handlePreviewKeyDown,
            onSizeSelect: handleSizeSelect,
            onStatusSelect: handleStatusSelect,
            onStatusCycleStart: startStatusCycle,
            onStatusCycleStop: stopStatusCycle,
        },
        componentTree: {
            isCollapsed: isTreeCollapsed,
            isTreeCollapsed,
            selectedId,
            dropHint: treeDropHint,
            onToggleCollapse: () => setTreeCollapsed((prev) => !prev),
            onSelectNode: handleNodeSelect,
            onDeleteSelected: handleDeleteSelected,
            onDeleteNode: handleDeleteNode,
            onCopyNode: handleCopyNode,
            onMoveNode: handleMoveNode,
        },
        canvas: {
            viewportWidth,
            viewportHeight,
            zoom,
            pan,
            selectedId,
            onPanChange: handlePanChange,
            onZoomChange: handleZoomChange,
            onSelectNode: handleNodeSelect,
            onNavigateRequest: handleNavigateRequest,
            onExecuteGraphRequest: handleExecuteGraphRequest,
        },
        inspector: {
            isCollapsed: isInspectorCollapsed,
            onToggleCollapse: () => setInspectorCollapsed((prev) => !prev),
        },
        viewportBar: {
            viewportWidth,
            viewportHeight,
            onViewportWidthChange: handleViewportWidthChange,
            onViewportHeightChange: handleViewportHeightChange,
            zoom,
            zoomStep,
            onZoomChange: handleZoomChange,
            onResetView: handleResetView,
        },
    };
};
