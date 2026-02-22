import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { VIEWPORT_ZOOM_RANGE } from './BlueprintEditor.data';
import { useBlueprintAutosave } from './BlueprintEditor.autosave';
import { useBlueprintDragDrop } from './BlueprintEditor.dragdrop';
import { executeBlueprintGraph } from './BlueprintGraphExecutor';
import { createNodeIdFactory } from './BlueprintEditor.palette';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';
import {
  cloneNodeWithNewIds,
  findNodeById,
  findParentId,
  insertAfterById,
  insertIntoMirDoc,
  moveChildById,
  removeNodeById,
} from './BlueprintEditor.tree';
import { normalizeAnimationDefinition } from '../animation/animationEditorModel';
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
import {
  flattenRouteItems,
  normalizeRoutePath,
} from '@/editor/store/routeManifest';

const CAPABILITY_MIR_DOCUMENT_UPDATE = 'core.mir.document.update@1.0';
const CAPABILITY_ROUTE_MANIFEST_UPDATE = 'core.route.manifest.update@1.0';

const createRouteId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `route-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const createIntentId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `intent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

type InteractionRequest = {
  params?: Record<string, unknown>;
  nodeId: string;
  trigger: string;
  eventKey: string;
};

/**
 * Blueprint 编辑器的编排层（controller）。
 *
 * 复杂链路集中在这里：
 * - UI 交互 -> updateMirDoc -> autosave（workspace/project）
 * - Canvas 内置动作 -> 导航确认/图执行事件 -> 页面或外部系统
 * - DnD 结果 -> MIR 树变换 -> 选中态与面板状态同步
 */
export const useBlueprintEditorController = () => {
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
  const runtimeState = useEditorStore(
    (state) => state.runtimeStateByProject[blueprintKey]
  );
  const patchRuntimeState = useEditorStore((state) => state.patchRuntimeState);
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const updateMirDoc = useEditorStore((state) => state.updateMirDoc);
  const workspaceId = useEditorStore((state) => state.workspaceId);
  const workspaceRev = useEditorStore((state) => state.workspaceRev);
  const routeRev = useEditorStore((state) => state.routeRev);
  const activeDocumentId = useEditorStore((state) => state.activeDocumentId);
  const activeDocumentContentRev = useEditorStore((state) =>
    state.activeDocumentId
      ? state.workspaceDocumentsById[state.activeDocumentId]?.contentRev
      : undefined
  );
  const workspaceCapabilitiesLoaded = useEditorStore(
    (state) => state.workspaceCapabilitiesLoaded
  );
  const routeManifest = useEditorStore((state) => state.routeManifest);
  const activeRouteNodeId = useEditorStore((state) => state.activeRouteNodeId);
  const applyRouteIntent = useEditorStore((state) => state.applyRouteIntent);
  const setActiveRouteNodeId = useEditorStore(
    (state) => state.setActiveRouteNodeId
  );
  const canUpdateWorkspaceDocument = useEditorStore(
    (state) =>
      state.workspaceCapabilities[CAPABILITY_MIR_DOCUMENT_UPDATE] === true
  );
  const canUpdateRouteManifest = useEditorStore(
    (state) =>
      state.workspaceCapabilities[CAPABILITY_ROUTE_MANIFEST_UPDATE] === true
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
  const routes = useMemo(
    () => flattenRouteItems(routeManifest.root, '/'),
    [routeManifest]
  );
  const activeRoute = useMemo(
    () =>
      activeRouteNodeId
        ? (routes.find((route) => route.id === activeRouteNodeId) ?? null)
        : null,
    [activeRouteNodeId, routes]
  );
  const currentPath = activeRoute?.path ?? routes[0]?.path ?? '/';
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );
  // 保存链路：mirDoc 变化 -> useBlueprintAutosave -> editorApi 保存 -> applyWorkspaceMutation
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
  const routeSyncRequestSeqRef = useRef(0);
  const syncedRouteManifestRef = useRef<string>(JSON.stringify(routeManifest));

  useEffect(() => {
    if (!workspaceId) return;
    if (typeof routeRev !== 'number' || routeRev <= 0) return;
    syncedRouteManifestRef.current = JSON.stringify(routeManifest);
  }, [workspaceId, routeRev]);

  useEffect(() => {
    if (!token) return;
    if (!workspaceId) return;
    if (!workspaceCapabilitiesLoaded) return;
    if (!canUpdateRouteManifest) return;
    if (typeof workspaceRev !== 'number' || workspaceRev <= 0) return;
    if (typeof routeRev !== 'number' || routeRev <= 0) return;

    const serializedRouteManifest = JSON.stringify(routeManifest);
    if (serializedRouteManifest === syncedRouteManifestRef.current) return;

    let disposed = false;
    const requestSeq = routeSyncRequestSeqRef.current + 1;
    routeSyncRequestSeqRef.current = requestSeq;
    const timeoutId = window.setTimeout(() => {
      void editorApi
        .applyWorkspaceIntent(token, workspaceId, {
          expectedWorkspaceRev: workspaceRev,
          expectedRouteRev: routeRev,
          intent: {
            id: createIntentId(),
            namespace: 'core.route',
            type: 'manifest.update',
            version: '1.0',
            payload: { routeManifest },
            issuedAt: new Date().toISOString(),
          },
        })
        .then((mutation) => {
          if (disposed || routeSyncRequestSeqRef.current !== requestSeq) {
            return;
          }
          applyWorkspaceMutation(mutation);
          syncedRouteManifestRef.current = serializedRouteManifest;
        })
        .catch((error) => {
          if (disposed || routeSyncRequestSeqRef.current !== requestSeq) {
            return;
          }
          console.warn('[blueprint] route manifest sync failed', error);
        });
    }, 500);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    applyWorkspaceMutation,
    canUpdateRouteManifest,
    routeManifest,
    routeRev,
    token,
    workspaceCapabilitiesLoaded,
    workspaceId,
    workspaceRev,
  ]);

  const handleAddRoute = () => {
    const value = newPath.trim();
    if (!value) return;
    const nextPath = normalizeRoutePath(value);
    const existingRoute = routes.find((route) => route.path === nextPath);
    if (existingRoute) {
      setActiveRouteNodeId(existingRoute.id);
      setNewPath('');
      return;
    }
    const nextRouteId = createRouteId();
    applyRouteIntent({
      type: 'create-page',
      path: nextPath,
      routeNodeId: nextRouteId,
    });
    if (nextRouteId) {
      setActiveRouteNodeId(nextRouteId);
    }
    setNewPath('');
  };

  const findRouteIdByPath = (path: string): string | null => {
    const normalizedPath = normalizeRoutePath(path);
    const existing = routes.find((route) => route.path === normalizedPath);
    return existing?.id ?? null;
  };

  /**
   * Canvas built-in `navigate` 的控制器出口。
   *
   * 调用链路：
   * MIR 节点 click -> MIRRenderer capture -> BlueprintEditorCanvas builtInActions.navigate
   * -> controller.handleNavigateRequest
   */
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
        ? t('inspector.groups.triggers.navigation.confirm.targetOverridden', {
            defaultValue:
              'Configured target: {{configuredTarget}} (opened as {{effectiveTarget}} in Blueprint preview for safety).',
            configuredTarget,
            effectiveTarget,
          })
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
              ? t('inspector.groups.triggers.navigation.confirm.yes', {
                  defaultValue: 'Yes',
                })
              : t('inspector.groups.triggers.navigation.confirm.no', {
                  defaultValue: 'No',
                }),
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
      const routeId = findRouteIdByPath(to);
      if (routeId) setActiveRouteNodeId(routeId);
    }
  };

  /**
   * Canvas built-in `executeGraph` 的控制器出口。
   *
   * 调用链路：
   * MIR 事件 -> MIRRenderer -> Canvas builtInActions.executeGraph ->
   * controller -> `window` 事件总线 `mdr:execute-graph`
   */
  const handleExecuteGraphRequest = useCallback(
    (options: InteractionRequest) => {
      void executeBlueprintGraph({
        nodeId: options.nodeId,
        trigger: options.trigger,
        eventKey: options.eventKey,
        params: options.params,
      }).then((result) => {
        if (!Object.keys(result.statePatch).length) return;
        patchRuntimeState(blueprintKey, result.statePatch);
      });
    },
    [blueprintKey, patchRuntimeState]
  );

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
  const handleToggleSidebarCollapse = useCallback(() => {
    setLibraryCollapsed((prev) => !prev);
  }, []);
  const handleToggleTreeCollapse = useCallback(() => {
    setTreeCollapsed((prev) => !prev);
  }, []);
  const handleToggleInspectorCollapse = useCallback(() => {
    setInspectorCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (blueprintState) return;
    setBlueprintState(blueprintKey, initialBlueprintState);
  }, [blueprintKey, blueprintState, initialBlueprintState, setBlueprintState]);

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

  useEffect(() => {
    if (!selectedId) return;
    setInspectorCollapsed(false);
  }, [selectedId]);

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

  // 拖拽链路：DndContext 事件 -> useBlueprintDragDrop -> updateMirDoc -> 选中态更新
  const {
    activePaletteItemId,
    treeDropHint,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  } = useBlueprintDragDrop({
    mirDoc,
    currentPath,
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
      const nextDoc = {
        ...doc,
        ui: { ...doc.ui, root: removal.node },
      };
      return cleanupDeletedNodeAnimationBindings(nextDoc);
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
      const nextDoc = {
        ...doc,
        ui: { ...doc.ui, root: removal.node },
      };
      return cleanupDeletedNodeAnimationBindings(nextDoc);
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
      const result = moveChildById(doc.ui.root, parentId, nodeId, direction);
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
      onCurrentPathChange: (value: string) => {
        const routeId = findRouteIdByPath(value);
        if (routeId) setActiveRouteNodeId(routeId);
      },
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
      onToggleCollapse: handleToggleSidebarCollapse,
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
      onToggleCollapse: handleToggleTreeCollapse,
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
      runtimeState,
      onPanChange: handlePanChange,
      onZoomChange: handleZoomChange,
      onSelectNode: handleNodeSelect,
      onNavigateRequest: handleNavigateRequest,
      onExecuteGraphRequest: handleExecuteGraphRequest,
    },
    inspector: {
      isCollapsed: isInspectorCollapsed,
      onToggleCollapse: handleToggleInspectorCollapse,
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

const cleanupDeletedNodeAnimationBindings = (doc: MIRDocument): MIRDocument => {
  const animation = normalizeAnimationDefinition(doc.animation);
  if (!animation) return doc;

  const validNodeIds = new Set<string>();
  collectNodeIds(doc.ui.root, validNodeIds);

  let changed = false;
  const nextTimelines = animation.timelines.map((timeline) => {
    let timelineChanged = false;
    const nextBindings = timeline.bindings.reduce<typeof timeline.bindings>(
      (result, binding) => {
        const targetNodeId = binding.targetNodeId.trim();
        if (!targetNodeId || !validNodeIds.has(targetNodeId)) {
          timelineChanged = true;
          return result;
        }
        if (targetNodeId !== binding.targetNodeId) {
          timelineChanged = true;
          result.push({ ...binding, targetNodeId });
          return result;
        }
        result.push(binding);
        return result;
      },
      []
    );
    if (!timelineChanged) return timeline;
    changed = true;
    return {
      ...timeline,
      bindings: nextBindings,
    };
  });

  if (!changed) return doc;

  return {
    ...doc,
    animation: {
      ...animation,
      timelines: nextTimelines,
    },
  };
};

const collectNodeIds = (node: ComponentNode, bucket: Set<string>) => {
  bucket.add(node.id);
  (node.children ?? []).forEach((child) => collectNodeIds(child, bucket));
};
