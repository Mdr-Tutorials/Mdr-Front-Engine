import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import {
  addNodeAndConnectNext,
  createDefaultNodeGraphModel,
  createNodeCanvasTextMeasureCache,
  createNodeGraphInteractionState,
  createNodeGraphNode,
  createNodeRendererRegistry,
  drawNodeCanvasRoutedEdge,
  getNodePortAnchors,
  getNodeRenderer,
  hitTestSwitchControl,
  isPointNearNodeCanvasPolyline,
  normalizeNodeGraphModel,
  reduceNodeGraphInteraction,
  resolveNodeDefaultPorts,
  routeNodeCanvasMagneticPath,
  upsertEdge,
  type NodeCanvasPoint,
  type NodeGraphEdge,
  type NodeGraphHitTarget,
  type NodeGraphInteractionAction,
  type NodeGraphInteractionState,
  type NodeGraphModel,
  type NodeGraphNode,
  type NodeGraphNodeType,
  type NodeGraphPort,
} from './node';
import {
  clamp,
  buildNodeRenderCache,
  isNear,
  moveNodeByDelta,
  resolveBorderPoint,
  resolveOutsidePoint,
  toPortAnchorKey,
  toViewportPoint,
  toWorldPoint,
} from './nodeGraph/canvasHelpers';
import {
  CONTEXT_MENU_SAFE_MARGIN,
  CONTEXT_MENU_WIDTH,
  EDGE_EXIT_OFFSET,
  GRID_SIZE,
  NODE_HEADER_HEIGHT,
  NODE_LIBRARY_GROUPS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from './nodeGraph/constants';
import {
  createDefaultSnapshot,
  createGraphId,
  ensureDocuments,
  loadSnapshot,
  saveSnapshot,
} from './nodeGraph/workspace';
import {
  createSwitchCaseDraft,
  normalizeSwitchNodeConfig,
  type SwitchNodeConfig,
} from './node/switchNode';
import type {
  GraphContextMenuState,
  GraphWorkspaceSnapshot,
} from './nodeGraph/types';

const resolvePortAcceptedKinds = (port: NodeGraphPort) => {
  if (Array.isArray(port.acceptsKinds) && port.acceptsKinds.length > 0) {
    return port.acceptsKinds;
  }
  return [port.kind];
};

const isPortConnectionCompatible = (
  sourcePort: NodeGraphPort,
  targetPort: NodeGraphPort
) => {
  if (sourcePort.role !== 'out' || targetPort.role !== 'in') return false;
  return resolvePortAcceptedKinds(targetPort).includes(sourcePort.kind);
};

const canNodeTypeConnectFromSourcePort = (
  nodeType: NodeGraphNodeType,
  sourcePort: NodeGraphPort
) =>
  resolveNodeDefaultPorts(nodeType).some((targetPort) =>
    isPortConnectionCompatible(sourcePort, targetPort)
  );

export const useNodeGraphEditorController = () => {
  const { projectId } = useParams();
  const resolvedProjectId = projectId?.trim() || 'global';
  const [workspace, setWorkspace] = useState<GraphWorkspaceSnapshot>(() =>
    loadSnapshot(resolvedProjectId)
  );
  const [graphNameDraft, setGraphNameDraft] = useState('');
  const [isGraphModalOpen, setGraphModalOpen] = useState(false);
  const [isManagerCollapsed, setManagerCollapsed] = useState(false);
  const [isViewportCollapsed, setViewportCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isResetVisible, setResetVisible] = useState(false);
  const [isDebugVisible, setDebugVisible] = useState(false);
  const [isGridVisible, setGridVisible] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [cursorPosition, setCursorPosition] = useState<NodeCanvasPoint | null>(
    null
  );
  const [pointerViewportPoint, setPointerViewportPoint] =
    useState<NodeCanvasPoint | null>(null);
  const [pointerWorldPoint, setPointerWorldPoint] =
    useState<NodeCanvasPoint | null>(null);
  const [interactionState, setInteractionState] =
    useState<NodeGraphInteractionState>(() =>
      createNodeGraphInteractionState()
    );
  const [contextMenuState, setContextMenuState] =
    useState<GraphContextMenuState>(null);
  const [portCreateGroupId, setPortCreateGroupId] = useState<string | null>(
    null
  );
  const [isPortCreateMenuOpen, setPortCreateMenuOpen] = useState(false);
  const [portCreateMenuTop, setPortCreateMenuTop] = useState(0);
  const [portCreateLeafMenuTop, setPortCreateLeafMenuTop] = useState(0);

  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const portCreateRootItemRef = useRef<HTMLButtonElement | null>(null);
  const portCreateGroupMenuRef = useRef<HTMLDivElement | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const isF3PressedRef = useRef(false);
  const isF3ComboConsumedRef = useRef(false);
  const nodeDragRef = useRef<{
    pointerId: number;
    nodeId: string;
    lastWorldPoint: NodeCanvasPoint;
  } | null>(null);

  const activeGraph = useMemo(
    () =>
      workspace.graphs.find((graph) => graph.id === workspace.activeGraphId) ??
      workspace.graphs[0],
    [workspace.activeGraphId, workspace.graphs]
  );

  const activeGraphModel = useMemo(() => {
    if (!activeGraph) return createDefaultNodeGraphModel();
    return normalizeNodeGraphModel(workspace.documents[activeGraph.id]);
  }, [activeGraph, workspace.documents]);

  const contextMenuEdge = useMemo(() => {
    if (!contextMenuState || contextMenuState.kind !== 'edge') return null;
    return (
      activeGraphModel.edges.find(
        (edge) => edge.id === contextMenuState.edgeId
      ) ?? null
    );
  }, [activeGraphModel.edges, contextMenuState]);
  const contextMenuPortConnectionCount = useMemo(() => {
    if (!contextMenuState || contextMenuState.kind !== 'port') return 0;
    return activeGraphModel.edges.filter((edge) =>
      contextMenuState.role === 'out'
        ? edge.sourceNodeId === contextMenuState.nodeId &&
          edge.sourcePortId === contextMenuState.portId
        : edge.targetNodeId === contextMenuState.nodeId &&
          edge.targetPortId === contextMenuState.portId
    ).length;
  }, [activeGraphModel.edges, contextMenuState]);
  const contextMenuPort = useMemo<NodeGraphPort | null>(() => {
    if (!contextMenuState || contextMenuState.kind !== 'port') return null;
    const node = activeGraphModel.nodes.find(
      (item) => item.id === contextMenuState.nodeId
    );
    if (!node) return null;
    return (
      (node.ports ?? resolveNodeDefaultPorts(node.type)).find(
        (port) => port.id === contextMenuState.portId
      ) ?? null
    );
  }, [activeGraphModel.nodes, contextMenuState]);
  const createNodeGroups = useMemo(() => {
    if (contextMenuState?.kind !== 'port' || contextMenuState.role !== 'out') {
      return NODE_LIBRARY_GROUPS;
    }
    if (!contextMenuPort) return [];
    return NODE_LIBRARY_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canNodeTypeConnectFromSourcePort(item.type, contextMenuPort)
      ),
    })).filter((group) => group.items.length > 0);
  }, [contextMenuPort, contextMenuState]);
  const canCreateNodeFromContextPort = useMemo(
    () =>
      contextMenuState?.kind === 'port' &&
      contextMenuState.role === 'out' &&
      ((contextMenuPort?.multiplicity ?? 'single') === 'multi' ||
        contextMenuPortConnectionCount === 0) &&
      createNodeGroups.length > 0,
    [
      contextMenuPort,
      contextMenuPortConnectionCount,
      contextMenuState,
      createNodeGroups.length,
    ]
  );
  const canCreateNodeFromContextMenu = useMemo(
    () =>
      (contextMenuState?.kind === 'canvas' && createNodeGroups.length > 0) ||
      canCreateNodeFromContextPort,
    [canCreateNodeFromContextPort, contextMenuState, createNodeGroups.length]
  );
  const activePortCreateGroup = useMemo(
    () =>
      portCreateGroupId
        ? (createNodeGroups.find((group) => group.id === portCreateGroupId) ??
          null)
        : null,
    [createNodeGroups, portCreateGroupId]
  );

  useEffect(() => {
    const next = loadSnapshot(resolvedProjectId);
    setWorkspace(next);
    setInteractionState(createNodeGraphInteractionState());
    setContextMenuState(null);
    setPortCreateGroupId(null);
    setPortCreateMenuOpen(false);
    setPortCreateMenuTop(0);
    setPortCreateLeafMenuTop(0);
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

  useEffect(() => {
    setContextMenuState(null);
    setPortCreateGroupId(null);
    setPortCreateMenuOpen(false);
    setPortCreateMenuTop(0);
    setPortCreateLeafMenuTop(0);
  }, [activeGraph?.id]);

  useEffect(() => {
    if (
      !contextMenuState ||
      (contextMenuState.kind !== 'port' && contextMenuState.kind !== 'canvas')
    ) {
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      return;
    }
    if (!canCreateNodeFromContextMenu) {
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      return;
    }
    const hasActiveGroup =
      portCreateGroupId &&
      createNodeGroups.some((group) => group.id === portCreateGroupId);
    if (!hasActiveGroup) {
      setPortCreateGroupId(createNodeGroups[0]?.id ?? null);
      setPortCreateLeafMenuTop(0);
    }
  }, [
    canCreateNodeFromContextMenu,
    contextMenuState,
    createNodeGroups,
    portCreateGroupId,
  ]);

  useEffect(
    () => () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!contextMenuState) return;
    const handlePointerDown = (event: PointerEvent) => {
      const menuElement = contextMenuRef.current;
      if (
        menuElement &&
        event.target instanceof Node &&
        menuElement.contains(event.target)
      ) {
        return;
      }
      setContextMenuState(null);
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [contextMenuState]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    const updateSize = () => {
      setViewportSize({
        width: host.clientWidth,
        height: host.clientHeight,
      });
    };
    updateSize();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
    const observer = new ResizeObserver(updateSize);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isDebugVisible) return;
    setPointerViewportPoint(null);
    setPointerWorldPoint(null);
  }, [isDebugVisible]);

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

  const updatePointerDebugPosition = (
    clientX: number,
    clientY: number,
    containerRect: DOMRect
  ) => {
    if (!isDebugVisible) return;
    setPointerViewportPoint(toViewportPoint(clientX, clientY, containerRect));
    setPointerWorldPoint(
      toWorldPoint(clientX, clientY, containerRect, pan, zoom)
    );
  };

  const canvasStyle = useMemo(
    () => ({
      backgroundColor: '#ffffff',
      backgroundImage: isGridVisible
        ? 'linear-gradient(to right, var(--color-2) 1px, transparent 1px), linear-gradient(to bottom, var(--color-2) 1px, transparent 1px)'
        : 'none',
      backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
      backgroundPosition: `${pan.x}px ${pan.y}px`,
    }),
    [isGridVisible, pan.x, pan.y, zoom]
  );

  const debugGridCoordinates = useMemo(() => {
    if (!isDebugVisible || !isGridVisible) {
      return {
        x: [] as Array<{ key: string; value: number; screen: number }>,
        y: [] as Array<{ key: string; value: number; screen: number }>,
      };
    }
    const { width, height } = viewportSize;
    if (width <= 0 || height <= 0) {
      return {
        x: [] as Array<{ key: string; value: number; screen: number }>,
        y: [] as Array<{ key: string; value: number; screen: number }>,
      };
    }

    const xFrom = Math.floor(-pan.x / zoom / GRID_SIZE) - 1;
    const xTo = Math.ceil((width - pan.x) / zoom / GRID_SIZE) + 1;
    const yFrom = Math.floor(-pan.y / zoom / GRID_SIZE) - 1;
    const yTo = Math.ceil((height - pan.y) / zoom / GRID_SIZE) + 1;
    const x = [] as Array<{ key: string; value: number; screen: number }>;
    const y = [] as Array<{ key: string; value: number; screen: number }>;

    for (let index = xFrom; index <= xTo; index += 1) {
      const value = index * GRID_SIZE;
      const screen = pan.x + value * zoom;
      if (screen < 0 || screen > width) continue;
      x.push({ key: `x-${index}`, value, screen });
    }

    for (let index = yFrom; index <= yTo; index += 1) {
      const value = index * GRID_SIZE;
      const screen = pan.y + value * zoom;
      if (screen < 0 || screen > height) continue;
      y.push({ key: `y-${index}`, value, screen });
    }

    return { x, y };
  }, [
    isDebugVisible,
    isGridVisible,
    pan.x,
    pan.y,
    viewportSize.height,
    viewportSize.width,
    zoom,
  ]);

  const updateActiveGraphModel = (
    updater: (model: NodeGraphModel) => NodeGraphModel
  ) => {
    if (!activeGraph) return;
    setWorkspace((current) => {
      const currentModel = normalizeNodeGraphModel(
        current.documents[activeGraph.id]
      );
      return {
        ...current,
        documents: {
          ...current.documents,
          [activeGraph.id]: updater(currentModel),
        },
      };
    });
  };

  const deleteNodeWithConnectedEdges = (nodeId: string) => {
    updateActiveGraphModel((model) => ({
      ...model,
      nodes: model.nodes.filter((node) => node.id !== nodeId),
      edges: model.edges.filter(
        (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
      ),
    }));
    setInteractionState((current) => ({
      ...current,
      selectedNodeId:
        current.selectedNodeId === nodeId ? null : current.selectedNodeId,
      selectedEdgeId: null,
    }));
  };

  const setEdgeColor = (edgeId: string, color: string | null) => {
    updateActiveGraphModel((model) => ({
      ...model,
      edges: model.edges.map((edge) => {
        if (edge.id !== edgeId) return edge;
        const nextMetadata = {
          ...(edge.metadata ?? {}),
        };
        if (color) {
          nextMetadata.color = color;
        } else {
          delete nextMetadata.color;
        }
        return {
          ...edge,
          metadata: nextMetadata,
        };
      }),
    }));
  };

  const clearPortConnections = (
    nodeId: string,
    portId: string,
    role: 'in' | 'out'
  ) => {
    updateActiveGraphModel((model) => ({
      ...model,
      edges: model.edges.filter((edge) =>
        role === 'out'
          ? edge.sourceNodeId !== nodeId || edge.sourcePortId !== portId
          : edge.targetNodeId !== nodeId || edge.targetPortId !== portId
      ),
    }));
    setInteractionState((current) => ({
      ...current,
      selectedEdgeId: null,
    }));
  };

  const updateSwitchNodeConfig = (
    nodeId: string,
    updater: (config: SwitchNodeConfig) => SwitchNodeConfig
  ) => {
    updateActiveGraphModel((model) => {
      let nextEdges = model.edges;
      const nextNodes = model.nodes.map((node) => {
        if (node.id !== nodeId || node.type !== 'switch') {
          return node;
        }
        const currentConfig = normalizeSwitchNodeConfig(
          node.config,
          node.ports
        );
        const nextConfig = normalizeSwitchNodeConfig(updater(currentConfig));
        const nextPorts = resolveNodeDefaultPorts('switch', nextConfig);
        const validPortIds = new Set(nextPorts.map((port) => port.id));
        nextEdges = nextEdges.filter((edge) => {
          if (
            edge.sourceNodeId === node.id &&
            !validPortIds.has(edge.sourcePortId)
          ) {
            return false;
          }
          if (
            edge.targetNodeId === node.id &&
            !validPortIds.has(edge.targetPortId)
          ) {
            return false;
          }
          return true;
        });
        return {
          ...node,
          config: nextConfig,
          ports: nextPorts,
        };
      });
      return {
        ...model,
        nodes: nextNodes,
        edges: nextEdges,
      };
    });
  };

  const openPortCreateMenu = () => {
    if (!canCreateNodeFromContextMenu) return;
    const rootMenuElement = contextMenuRef.current;
    const rootItemElement = portCreateRootItemRef.current;
    if (!rootMenuElement || !rootItemElement) return;
    const menuRect = rootMenuElement.getBoundingClientRect();
    const itemRect = rootItemElement.getBoundingClientRect();
    setPortCreateMenuTop(itemRect.top - menuRect.top);
    setPortCreateLeafMenuTop(0);
    setPortCreateGroupId(createNodeGroups[0]?.id ?? null);
    setPortCreateMenuOpen(true);
  };

  const selectPortCreateGroup = (
    groupId: string,
    trigger: HTMLButtonElement | null
  ) => {
    if (!createNodeGroups.some((group) => group.id === groupId)) return;
    setPortCreateGroupId(groupId);
    if (!trigger) return;
    const menuElement = portCreateGroupMenuRef.current;
    if (!menuElement) return;
    const menuRect = menuElement.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    setPortCreateLeafMenuTop(triggerRect.top - menuRect.top);
  };

  const applyInteractionActions = (actions: NodeGraphInteractionAction[]) => {
    actions.forEach((action) => {
      if (action.type === 'pan.delta') {
        triggerResetVisibility();
        setPan((current) => ({
          x: current.x + action.deltaX,
          y: current.y + action.deltaY,
        }));
        return;
      }

      if (action.type === 'select.node') {
        setInteractionState((current) => ({
          ...current,
          selectedNodeId: action.nodeId,
          selectedEdgeId: null,
        }));
        return;
      }

      if (action.type === 'select.edge') {
        setInteractionState((current) => ({
          ...current,
          selectedNodeId: null,
          selectedEdgeId: action.edgeId,
        }));
        return;
      }

      if (action.type === 'clear.selection') {
        setInteractionState((current) => ({
          ...current,
          selectedNodeId: null,
          selectedEdgeId: null,
        }));
        return;
      }

      if (action.type === 'edge.create') {
        updateActiveGraphModel((model) =>
          upsertEdge(
            model,
            action.sourceNodeId,
            action.sourcePortId,
            action.targetNodeId,
            action.targetPortId
          )
        );
        return;
      }

      if (action.type === 'edge.reconnect') {
        updateActiveGraphModel((model) =>
          upsertEdge(
            model,
            action.sourceNodeId,
            action.sourcePortId,
            action.targetNodeId,
            action.targetPortId,
            action.edgeId
          )
        );
      }
    });
  };

  const resolveHitTarget = (point: NodeCanvasPoint): NodeGraphHitTarget => {
    const canvas = canvasRef.current;
    if (!canvas) return { type: 'canvas' };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { type: 'canvas' };

    const measureCache = createNodeCanvasTextMeasureCache(ctx);
    const renderCache = buildNodeRenderCache(
      activeGraphModel.nodes,
      measureCache.measure
    );
    measureCache.clear();

    for (
      let nodeIndex = activeGraphModel.nodes.length - 1;
      nodeIndex >= 0;
      nodeIndex -= 1
    ) {
      const node = activeGraphModel.nodes[nodeIndex];
      const rect = renderCache.rectByNodeId[node.id];
      if (!rect) continue;
      const anchors = getNodePortAnchors(node, rect);
      const hitAnchor = anchors.find((anchor) =>
        isNear(point, anchor, anchor.hitRadius)
      );
      if (hitAnchor) {
        return {
          type: 'port',
          nodeId: node.id,
          portId: hitAnchor.port.id,
          role: hitAnchor.port.role,
        };
      }

      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        return {
          type: 'node',
          nodeId: node.id,
          area: point.y <= rect.y + NODE_HEADER_HEIGHT ? 'header' : 'body',
        };
      }
    }

    for (
      let edgeIndex = activeGraphModel.edges.length - 1;
      edgeIndex >= 0;
      edgeIndex -= 1
    ) {
      const edge = activeGraphModel.edges[edgeIndex];
      const sourceAnchor =
        renderCache.anchorByNodePort[
          toPortAnchorKey(edge.sourceNodeId, edge.sourcePortId)
        ];
      const targetAnchor =
        renderCache.anchorByNodePort[
          toPortAnchorKey(edge.targetNodeId, edge.targetPortId)
        ];
      const sourceRect = renderCache.rectByNodeId[edge.sourceNodeId];
      const targetRect = renderCache.rectByNodeId[edge.targetNodeId];
      if (!sourceAnchor || !targetAnchor || !sourceRect || !targetRect)
        continue;

      if (isNear(point, targetAnchor, 10)) {
        return {
          type: 'edge',
          edgeId: edge.id,
          handle: 'target',
          nodeId: edge.sourceNodeId,
          portId: edge.sourcePortId,
          role: 'out',
        };
      }

      const obstacles = activeGraphModel.nodes.flatMap((node) => {
        const rect = renderCache.rectByNodeId[node.id];
        return rect ? [rect] : [];
      });
      const sourceBorderPoint = resolveBorderPoint(sourceAnchor, sourceRect);
      const targetBorderPoint = resolveBorderPoint(targetAnchor, targetRect);
      const sourceOutsidePoint = resolveOutsidePoint(
        sourceAnchor,
        sourceBorderPoint,
        EDGE_EXIT_OFFSET
      );
      const targetOutsidePoint = resolveOutsidePoint(
        targetAnchor,
        targetBorderPoint,
        EDGE_EXIT_OFFSET
      );
      const routePoints = routeNodeCanvasMagneticPath({
        start: sourceOutsidePoint,
        end: targetOutsidePoint,
        obstacles,
      });
      const hitPoints = [
        sourceAnchor,
        sourceBorderPoint,
        sourceOutsidePoint,
        ...routePoints.slice(1, -1),
        targetOutsidePoint,
        targetBorderPoint,
        targetAnchor,
      ];
      if (isPointNearNodeCanvasPolyline(point, { points: hitPoints })) {
        return {
          type: 'edge',
          edgeId: edge.id,
          handle: 'source',
          nodeId: edge.sourceNodeId,
          portId: edge.sourcePortId,
          role: 'out',
        };
      }
    }

    return { type: 'canvas' };
  };

  const handleSwitchControlClickAtPoint = (point: NodeCanvasPoint) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const measureCache = createNodeCanvasTextMeasureCache(ctx);
    const renderCache = buildNodeRenderCache(
      activeGraphModel.nodes,
      measureCache.measure
    );
    measureCache.clear();

    for (
      let nodeIndex = activeGraphModel.nodes.length - 1;
      nodeIndex >= 0;
      nodeIndex -= 1
    ) {
      const node = activeGraphModel.nodes[nodeIndex];
      if (node.type !== 'switch') continue;
      const rect = renderCache.rectByNodeId[node.id];
      if (!rect) continue;
      const hit = hitTestSwitchControl(node, rect, point);
      if (!hit) continue;
      setInteractionState((current) => ({
        ...current,
        selectedNodeId: node.id,
        selectedEdgeId: null,
      }));
      if (hit.disabled) return true;
      updateSwitchNodeConfig(node.id, (current) => ({
        ...current,
        collapsed:
          hit.action === 'toggle-collapse'
            ? !current.collapsed
            : current.collapsed,
        cases:
          hit.action === 'add-case'
            ? [...current.cases, createSwitchCaseDraft()]
            : hit.action === 'remove-case'
              ? current.cases.filter((item) => item.id !== hit.caseId)
              : current.cases,
      }));
      return true;
    }
    return false;
  };

  const dispatchInteraction = (
    event:
      | {
          type: 'pointer.down';
          pointerId: number;
          point: NodeCanvasPoint;
          target: NodeGraphHitTarget;
        }
      | { type: 'pointer.move'; pointerId: number; point: NodeCanvasPoint }
      | {
          type: 'pointer.up';
          pointerId: number;
          point: NodeCanvasPoint;
          target: NodeGraphHitTarget;
        }
      | { type: 'pointer.cancel'; pointerId: number }
      | { type: 'escape' }
  ) => {
    setInteractionState((current) => {
      const result = reduceNodeGraphInteraction(current, event);
      applyInteractionActions(result.actions);
      return result.state;
    });
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    triggerResetVisibility();
    const host = canvasHostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const viewportPoint = toViewportPoint(event.clientX, event.clientY, rect);
    const nextZoom = clamp(
      zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
      ZOOM_MIN,
      ZOOM_MAX
    );
    if (nextZoom === zoom) return;

    setPan((current) => {
      const worldX = (viewportPoint.x - current.x) / zoom;
      const worldY = (viewportPoint.y - current.y) / zoom;
      return {
        x: viewportPoint.x - worldX * nextZoom,
        y: viewportPoint.y - worldY * nextZoom,
      };
    });
    setZoom(nextZoom);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (event.button !== 0) return;
    if (contextMenuState) {
      setContextMenuState(null);
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
    }
    const host = canvasHostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const worldPoint = toWorldPoint(
      event.clientX,
      event.clientY,
      rect,
      pan,
      zoom
    );
    updatePointerDebugPosition(event.clientX, event.clientY, rect);
    if (handleSwitchControlClickAtPoint(worldPoint)) {
      return;
    }
    const target = resolveHitTarget(worldPoint);
    const viewportPoint = toViewportPoint(event.clientX, event.clientY, rect);
    const pointerPoint = target.type === 'canvas' ? viewportPoint : worldPoint;
    if (target.type === 'node' && target.area === 'header') {
      nodeDragRef.current = {
        pointerId: event.pointerId,
        nodeId: target.nodeId,
        lastWorldPoint: worldPoint,
      };
    }
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    dispatchInteraction({
      type: 'pointer.down',
      pointerId: event.pointerId,
      point: pointerPoint,
      target,
    });
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    const host = canvasHostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const worldPoint = toWorldPoint(
      event.clientX,
      event.clientY,
      rect,
      pan,
      zoom
    );
    const viewportPoint = toViewportPoint(event.clientX, event.clientY, rect);
    if (isDebugVisible) {
      setPointerViewportPoint(viewportPoint);
      setPointerWorldPoint(worldPoint);
    }
    if (activePointerIdRef.current !== event.pointerId) return;
    const draggingNode = nodeDragRef.current;
    if (draggingNode && draggingNode.pointerId === event.pointerId) {
      const delta = {
        x: worldPoint.x - draggingNode.lastWorldPoint.x,
        y: worldPoint.y - draggingNode.lastWorldPoint.y,
      };
      nodeDragRef.current = { ...draggingNode, lastWorldPoint: worldPoint };
      if (delta.x !== 0 || delta.y !== 0) {
        updateActiveGraphModel((model) =>
          moveNodeByDelta(model, draggingNode.nodeId, delta)
        );
      }
      return;
    }
    dispatchInteraction({
      type: 'pointer.move',
      pointerId: event.pointerId,
      point: interactionState.mode === 'pan' ? viewportPoint : worldPoint,
    });
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    const host = canvasHostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const worldPoint = toWorldPoint(
      event.clientX,
      event.clientY,
      rect,
      pan,
      zoom
    );
    updatePointerDebugPosition(event.clientX, event.clientY, rect);
    const viewportPoint = toViewportPoint(event.clientX, event.clientY, rect);
    const target = resolveHitTarget(worldPoint);
    if (
      nodeDragRef.current &&
      nodeDragRef.current.pointerId === event.pointerId
    ) {
      nodeDragRef.current = null;
    }
    const pointerPoint =
      interactionState.mode === 'pan' ? viewportPoint : worldPoint;
    dispatchInteraction({
      type: 'pointer.up',
      pointerId: event.pointerId,
      point: pointerPoint,
      target,
    });
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerIdRef.current = null;
  };

  const handleCanvasPointerLeave: React.PointerEventHandler<
    HTMLDivElement
  > = () => {
    if (!isDebugVisible) return;
    setPointerViewportPoint(null);
    setPointerWorldPoint(null);
  };

  const handlePointerCancel: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (
      nodeDragRef.current &&
      nodeDragRef.current.pointerId === event.pointerId
    ) {
      nodeDragRef.current = null;
    }
    dispatchInteraction({ type: 'pointer.cancel', pointerId: event.pointerId });
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerIdRef.current = null;
    setPointerViewportPoint(null);
    setPointerWorldPoint(null);
  };

  const handleRootPointerMove: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (event.pointerType !== 'mouse') {
      if (cursorPosition) {
        setCursorPosition(null);
      }
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleRootPointerLeave: React.PointerEventHandler<
    HTMLDivElement
  > = () => {
    if (cursorPosition) {
      setCursorPosition(null);
    }
  };

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (
    event
  ) => {
    event.preventDefault();
    const host = canvasHostRef.current;
    if (!host) {
      setContextMenuState(null);
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      return;
    }

    const rect = host.getBoundingClientRect();
    const worldPoint = toWorldPoint(
      event.clientX,
      event.clientY,
      rect,
      pan,
      zoom
    );
    const target = resolveHitTarget(worldPoint);

    const viewportPoint = toViewportPoint(event.clientX, event.clientY, rect);
    const estimatedMenuWidth =
      target.type === 'port' || target.type === 'canvas'
        ? CONTEXT_MENU_WIDTH + 186 + CONTEXT_MENU_SAFE_MARGIN
        : CONTEXT_MENU_WIDTH;
    const safeX = clamp(
      viewportPoint.x,
      CONTEXT_MENU_SAFE_MARGIN,
      Math.max(
        CONTEXT_MENU_SAFE_MARGIN,
        rect.width - estimatedMenuWidth - CONTEXT_MENU_SAFE_MARGIN
      )
    );
    const safeY = clamp(
      viewportPoint.y,
      CONTEXT_MENU_SAFE_MARGIN,
      Math.max(CONTEXT_MENU_SAFE_MARGIN, rect.height - 220)
    );

    if (target.type === 'canvas') {
      setInteractionState((current) => ({
        ...current,
        selectedNodeId: null,
        selectedEdgeId: null,
      }));
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      setContextMenuState({
        kind: 'canvas',
        x: safeX,
        y: safeY,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
      });
      return;
    }

    if (target.type === 'node') {
      setInteractionState((current) => ({
        ...current,
        selectedNodeId: target.nodeId,
        selectedEdgeId: null,
      }));
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      setContextMenuState({
        kind: 'node',
        nodeId: target.nodeId,
        x: safeX,
        y: safeY,
      });
      return;
    }

    if (target.type === 'port') {
      setInteractionState((current) => ({
        ...current,
        selectedNodeId: target.nodeId,
        selectedEdgeId: null,
      }));
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      setContextMenuState({
        kind: 'port',
        nodeId: target.nodeId,
        portId: target.portId,
        role: target.role,
        x: safeX,
        y: safeY,
      });
      return;
    }

    setInteractionState((current) => ({
      ...current,
      selectedNodeId: null,
      selectedEdgeId: target.edgeId,
    }));
    setPortCreateGroupId(null);
    setPortCreateMenuOpen(false);
    setContextMenuState({
      kind: 'edge',
      edgeId: target.edgeId,
      x: safeX,
      y: safeY,
    });
  };

  const handleCreateGraph = () => {
    const name = graphNameDraft.trim();
    if (!name) return;
    const nextGraph = { id: createGraphId(), name };
    setWorkspace((current) => ({
      activeGraphId: nextGraph.id,
      graphs: [...current.graphs, nextGraph],
      documents: {
        ...current.documents,
        [nextGraph.id]: createDefaultNodeGraphModel(),
      },
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
      const nextDocuments = { ...current.documents };
      delete nextDocuments[current.activeGraphId];
      const fallback = createDefaultSnapshot();
      return {
        activeGraphId: nextGraphs[0]?.id ?? fallback.activeGraphId,
        graphs: nextGraphs.length ? nextGraphs : fallback.graphs,
        documents: nextGraphs.length
          ? ensureDocuments(nextGraphs, nextDocuments)
          : fallback.documents,
      };
    });
    setInteractionState(createNodeGraphInteractionState());
  };
  const handleOpenGraph = (graphId: string) => {
    setWorkspace((current) => ({ ...current, activeGraphId: graphId }));
    setInteractionState(createNodeGraphInteractionState());
    setGraphModalOpen(false);
  };

  const handleCreateStandaloneNode = (
    nodeType: NodeGraphNodeType,
    position: NodeCanvasPoint
  ) => {
    const createdNode = createNodeGraphNode(nodeType, {
      x: position.x,
      y: position.y,
    });
    updateActiveGraphModel((model) => ({
      ...model,
      nodes: [...model.nodes, createdNode],
    }));
    setInteractionState((current) => ({
      ...current,
      selectedNodeId: createdNode.id,
      selectedEdgeId: null,
    }));
  };

  const duplicateNodeInPlace = (nodeId: string) => {
    const sourceNode = activeGraphModel.nodes.find(
      (node) => node.id === nodeId
    );
    if (!sourceNode) return;

    const createdNode = createNodeGraphNode(
      sourceNode.type,
      {
        x: sourceNode.position.x,
        y: sourceNode.position.y,
      },
      sourceNode.title
    );

    const nextNode: NodeGraphNode = {
      ...sourceNode,
      id: createdNode.id,
      position: {
        x: sourceNode.position.x,
        y: sourceNode.position.y,
      },
      size: sourceNode.size
        ? {
            width: sourceNode.size.width,
            height: sourceNode.size.height,
          }
        : undefined,
      ports: (sourceNode.ports ?? createdNode.ports ?? []).map((port) => ({
        ...port,
        acceptsKinds: port.acceptsKinds ? [...port.acceptsKinds] : undefined,
      })),
      config: sourceNode.config ? { ...sourceNode.config } : {},
      metadata: sourceNode.metadata ? { ...sourceNode.metadata } : {},
    };

    updateActiveGraphModel((model) => ({
      ...model,
      nodes: [...model.nodes, nextNode],
    }));
    setInteractionState((current) => ({
      ...current,
      selectedNodeId: nextNode.id,
      selectedEdgeId: null,
    }));
  };

  const handleCreateNodeAfterPort = (
    sourceNodeId: string,
    sourcePortId: string,
    nodeType: NodeGraphNodeType
  ) => {
    const sourceNode = activeGraphModel.nodes.find(
      (node) => node.id === sourceNodeId
    );
    const position = sourceNode
      ? { x: sourceNode.position.x + 240, y: sourceNode.position.y + 84 }
      : { x: 340, y: 260 };

    updateActiveGraphModel((model) =>
      addNodeAndConnectNext(model, {
        sourceNodeId,
        sourcePortId,
        nodeType,
        position,
        title: nodeType,
      })
    );
  };

  const handleCreateNodeFromContextMenu = (nodeType: NodeGraphNodeType) => {
    if (!contextMenuState) return;
    if (contextMenuState.kind === 'port') {
      handleCreateNodeAfterPort(
        contextMenuState.nodeId,
        contextMenuState.portId,
        nodeType
      );
    } else if (contextMenuState.kind === 'canvas') {
      handleCreateStandaloneNode(nodeType, {
        x: contextMenuState.worldX,
        y: contextMenuState.worldY,
      });
    } else {
      return;
    }

    setContextMenuState(null);
    setPortCreateGroupId(null);
    setPortCreateMenuOpen(false);
  };

  useEffect(() => {
    const host = canvasHostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = host.clientWidth;
    const height = host.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const registry = createNodeRendererRegistry();
    const textCache = createNodeCanvasTextMeasureCache(ctx);
    const renderCache = buildNodeRenderCache(
      activeGraphModel.nodes,
      textCache.measure
    );

    activeGraphModel.nodes.forEach((node) => {
      const renderer = getNodeRenderer(node.type, registry);
      const rect = renderCache.rectByNodeId[node.id];
      if (!rect) return;
      renderer.draw(
        node,
        rect,
        {
          selected: interactionState.selectedNodeId === node.id,
        },
        ctx
      );
    });

    activeGraphModel.edges.forEach((edge: NodeGraphEdge) => {
      const source =
        renderCache.anchorByNodePort[
          toPortAnchorKey(edge.sourceNodeId, edge.sourcePortId)
        ];
      const target =
        renderCache.anchorByNodePort[
          toPortAnchorKey(edge.targetNodeId, edge.targetPortId)
        ];
      const sourceRect = renderCache.rectByNodeId[edge.sourceNodeId];
      const targetRect = renderCache.rectByNodeId[edge.targetNodeId];
      if (!source || !target || !sourceRect || !targetRect) return;
      const obstacles = activeGraphModel.nodes.flatMap((node) => {
        const rect = renderCache.rectByNodeId[node.id];
        return rect ? [rect] : [];
      });
      const sourceBorderPoint = resolveBorderPoint(source, sourceRect);
      const targetBorderPoint = resolveBorderPoint(target, targetRect);
      const sourceOutsidePoint = resolveOutsidePoint(
        source,
        sourceBorderPoint,
        EDGE_EXIT_OFFSET
      );
      const targetOutsidePoint = resolveOutsidePoint(
        target,
        targetBorderPoint,
        EDGE_EXIT_OFFSET
      );
      const routePoints = routeNodeCanvasMagneticPath({
        start: sourceOutsidePoint,
        end: targetOutsidePoint,
        obstacles,
      });
      const finalPoints = [
        source,
        sourceBorderPoint,
        sourceOutsidePoint,
        ...routePoints.slice(1, -1),
        targetOutsidePoint,
        targetBorderPoint,
        target,
      ];
      const edgeColor =
        edge.metadata && typeof edge.metadata.color === 'string'
          ? edge.metadata.color
          : undefined;
      drawNodeCanvasRoutedEdge(
        ctx,
        { points: finalPoints },
        {
          selected: interactionState.selectedEdgeId === edge.id,
          strokeStyle: edgeColor,
          selectedStrokeStyle: edgeColor,
        }
      );
    });

    if (interactionState.connectionDraft) {
      const draft = interactionState.connectionDraft;
      const source =
        renderCache.anchorByNodePort[
          toPortAnchorKey(draft.sourceNodeId, draft.sourcePortId)
        ];
      if (source) {
        drawNodeCanvasRoutedEdge(
          ctx,
          {
            points: [source, draft.cursor],
          },
          {
            preview: true,
          }
        );
      }
    }

    textCache.clear();
    ctx.restore();
  }, [
    activeGraphModel,
    interactionState.connectionDraft,
    interactionState.selectedEdgeId,
    interactionState.selectedNodeId,
    pan.x,
    pan.y,
    zoom,
  ]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F3') {
        event.preventDefault();
        if (!event.repeat) {
          isF3PressedRef.current = true;
          isF3ComboConsumedRef.current = false;
        }
        return;
      }
      if (
        isF3PressedRef.current &&
        !event.repeat &&
        event.key.toLowerCase() === 'g' &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setGridVisible((current) => !current);
        isF3ComboConsumedRef.current = true;
        return;
      }
      if (event.key === 'Escape') {
        setContextMenuState(null);
        setPortCreateGroupId(null);
        setPortCreateMenuOpen(false);
        dispatchInteraction({ type: 'escape' });
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'F3') {
        event.preventDefault();
        if (!isF3ComboConsumedRef.current) {
          setDebugVisible((current) => !current);
        }
        isF3PressedRef.current = false;
        isF3ComboConsumedRef.current = false;
      }
    };
    const handleBlur = () => {
      isF3PressedRef.current = false;
      isF3ComboConsumedRef.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  });

  const closeContextMenu = () => {
    setContextMenuState(null);
    setPortCreateGroupId(null);
    setPortCreateMenuOpen(false);
  };

  const togglePortCreateMenu = () => {
    if (isPortCreateMenuOpen) {
      setPortCreateMenuOpen(false);
      return;
    }
    openPortCreateMenu();
  };

  const handleContextNodeDuplicate = (nodeId: string) => {
    duplicateNodeInPlace(nodeId);
    closeContextMenu();
  };

  const handleContextNodeDelete = (nodeId: string) => {
    deleteNodeWithConnectedEdges(nodeId);
    closeContextMenu();
  };

  const handleContextPortDisconnect = (
    nodeId: string,
    portId: string,
    role: 'in' | 'out'
  ) => {
    clearPortConnections(nodeId, portId, role);
    closeContextMenu();
  };

  const handleContextEdgeColorChange = (
    edgeId: string,
    color: string | null
  ) => {
    setEdgeColor(edgeId, color);
    closeContextMenu();
  };

  const handleViewportZoomOut = () => {
    triggerResetVisibility();
    setZoom((current) => clamp(current - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  };

  const handleViewportZoomIn = () => {
    triggerResetVisibility();
    setZoom((current) => clamp(current + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  };

  const handleViewportReset = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setResetVisible(false);
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  return {
    root: {
      cursorPosition,
      onPointerMove: handleRootPointerMove,
      onPointerLeave: handleRootPointerLeave,
    },
    canvas: {
      hostRef: canvasHostRef,
      canvasRef,
      style: canvasStyle,
      onWheel: handleWheel,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handleCanvasPointerLeave,
      onContextMenu: handleContextMenu,
    },
    debug: {
      isVisible: isDebugVisible,
      isGridVisible,
      pointerViewportPoint,
      pointerWorldPoint,
      nodeCount: activeGraphModel.nodes.length,
      edgeCount: activeGraphModel.edges.length,
      gridCoordinates: debugGridCoordinates,
    },
    manager: {
      projectId: resolvedProjectId,
      workspace,
      activeGraph,
      graphNameDraft,
      isCollapsed: isManagerCollapsed,
      setCollapsed: setManagerCollapsed,
      setGraphNameDraft,
      onOpenModal: () => setGraphModalOpen(true),
      onCreateGraph: handleCreateGraph,
      onRenameGraph: handleRenameGraph,
      onDeleteGraph: handleDeleteGraph,
    },
    viewport: {
      isCollapsed: isViewportCollapsed,
      setCollapsed: setViewportCollapsed,
      zoom,
      isResetVisible,
      onZoomOut: handleViewportZoomOut,
      onZoomIn: handleViewportZoomIn,
      onReset: handleViewportReset,
    },
    contextMenu: {
      state: contextMenuState,
      edge: contextMenuEdge,
      portConnectionCount: contextMenuPortConnectionCount,
      port: contextMenuPort,
      canCreateNode: canCreateNodeFromContextMenu,
      createNodeGroups,
      activeCreateGroup: activePortCreateGroup,
      isCreateMenuOpen: isPortCreateMenuOpen,
      createMenuTop: portCreateMenuTop,
      createLeafMenuTop: portCreateLeafMenuTop,
      refs: {
        menuRef: contextMenuRef,
        createRootItemRef: portCreateRootItemRef,
        createGroupMenuRef: portCreateGroupMenuRef,
      },
      onClose: closeContextMenu,
      onToggleCreateMenu: togglePortCreateMenu,
      onSelectCreateGroup: selectPortCreateGroup,
      onCreateNode: handleCreateNodeFromContextMenu,
      onDisconnectPort: handleContextPortDisconnect,
      onChangeEdgeColor: handleContextEdgeColorChange,
      onDeleteNode: handleContextNodeDelete,
      onDuplicateNode: handleContextNodeDuplicate,
    },
    modal: {
      isOpen: isGraphModalOpen,
      graphs: workspace.graphs,
      onClose: () => setGraphModalOpen(false),
      onOpenGraph: handleOpenGraph,
    },
  };
};

export type NodeGraphEditorController = ReturnType<
  typeof useNodeGraphEditorController
>;
