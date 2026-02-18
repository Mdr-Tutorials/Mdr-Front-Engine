import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  isPointNearNodeCanvasPolyline,
  normalizeNodeGraphModel,
  reduceNodeGraphInteraction,
  routeNodeCanvasMagneticPath,
  upsertEdge,
  type NodeCanvasPoint,
  type NodeGraphEdge,
  type NodeGraphHitTarget,
  type NodeGraphInteractionAction,
  type NodeGraphInteractionState,
  type NodeGraphModel,
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
  EDGE_COLOR_OPTIONS,
  EDGE_EXIT_OFFSET,
  GRID_SIZE,
  NODE_HEADER_HEIGHT,
  NODE_LIBRARY,
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
import type {
  GraphContextMenuState,
  GraphWorkspaceSnapshot,
} from './nodeGraph/types';

function NodeGraphEditor() {
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

  const selectedNode = useMemo(
    () =>
      interactionState.selectedNodeId
        ? (activeGraphModel.nodes.find(
            (node) => node.id === interactionState.selectedNodeId
          ) ?? null)
        : null,
    [activeGraphModel.nodes, interactionState.selectedNodeId]
  );
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
    if (!node?.ports?.length) return null;
    return (
      node.ports.find((port) => port.id === contextMenuState.portId) ?? null
    );
  }, [activeGraphModel.nodes, contextMenuState]);
  const canCreateNodeFromContextPort = useMemo(
    () =>
      contextMenuState?.kind === 'port' &&
      contextMenuState.role === 'out' &&
      ((contextMenuPort?.multiplicity ?? 'single') === 'multi' ||
        contextMenuPortConnectionCount === 0),
    [contextMenuPort, contextMenuPortConnectionCount, contextMenuState]
  );
  const activePortCreateGroup = useMemo(
    () =>
      portCreateGroupId
        ? (NODE_LIBRARY_GROUPS.find(
            (group) => group.id === portCreateGroupId
          ) ?? null)
        : null,
    [portCreateGroupId]
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
    if (!contextMenuState || contextMenuState.kind !== 'port') {
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      return;
    }
    if (!canCreateNodeFromContextPort) {
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      return;
    }
    if (!portCreateGroupId) {
      setPortCreateGroupId(NODE_LIBRARY_GROUPS[0]?.id ?? null);
      setPortCreateLeafMenuTop(0);
    }
  }, [canCreateNodeFromContextPort, contextMenuState, portCreateGroupId]);

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
      backgroundColor: '#ffffff',
      backgroundImage:
        'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
      backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
      backgroundPosition: `${pan.x}px ${pan.y}px`,
    }),
    [pan.x, pan.y, zoom]
  );

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

  const openPortCreateMenu = () => {
    if (!canCreateNodeFromContextPort) return;
    const rootMenuElement = contextMenuRef.current;
    const rootItemElement = portCreateRootItemRef.current;
    if (!rootMenuElement || !rootItemElement) return;
    const menuRect = rootMenuElement.getBoundingClientRect();
    const itemRect = rootItemElement.getBoundingClientRect();
    setPortCreateMenuTop(itemRect.top - menuRect.top);
    setPortCreateLeafMenuTop(0);
    setPortCreateGroupId(NODE_LIBRARY_GROUPS[0]?.id ?? null);
    setPortCreateMenuOpen(true);
  };

  const selectPortCreateGroup = (
    groupId: string,
    trigger: HTMLButtonElement | null
  ) => {
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
    if (activePointerIdRef.current !== event.pointerId) return;
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
    const viewportPoint = toViewportPoint(event.clientX, event.clientY, rect);
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
    if (
      target.type !== 'node' &&
      target.type !== 'edge' &&
      target.type !== 'port'
    ) {
      setContextMenuState(null);
      setPortCreateGroupId(null);
      setPortCreateMenuOpen(false);
      return;
    }

    const viewportPoint = toViewportPoint(event.clientX, event.clientY, rect);
    const estimatedMenuWidth =
      target.type === 'port'
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

  const handleCreateConnectedNode = (nodeType: NodeGraphNodeType) => {
    const selectedNodeId = interactionState.selectedNodeId;
    if (!selectedNodeId) {
      const host = canvasHostRef.current;
      const rect = host?.getBoundingClientRect();
      const center = {
        x: ((rect?.width ?? 800) / 2 - pan.x) / zoom,
        y: ((rect?.height ?? 500) / 2 - pan.y) / zoom,
      };
      updateActiveGraphModel((model) => ({
        ...model,
        nodes: [
          ...model.nodes,
          createNodeGraphNode(nodeType, center, nodeType),
        ],
      }));
      return;
    }

    const sourceNode = activeGraphModel.nodes.find(
      (node) => node.id === selectedNodeId
    );
    const position = sourceNode
      ? { x: sourceNode.position.x + 240, y: sourceNode.position.y + 84 }
      : { x: 340, y: 260 };

    updateActiveGraphModel((model) =>
      addNodeAndConnectNext(model, {
        sourceNodeId: selectedNodeId,
        nodeType,
        position,
        title: nodeType,
      })
    );
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenuState(null);
        setPortCreateGroupId(null);
        setPortCreateMenuOpen(false);
        dispatchInteraction({ type: 'escape' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className="relative h-full min-h-full w-full overflow-hidden"
      data-testid="nodegraph-editor-root"
    >
      <div
        ref={canvasHostRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={canvasStyle}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
        data-testid="nodegraph-canvas-layer"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

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
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {NODE_LIBRARY.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="h-7 rounded-md border border-black/12 px-2 text-left"
                  onClick={() => handleCreateConnectedNode(item.type)}
                >
                  {item.title}
                </button>
              ))}
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
          <div className="pointer-events-auto absolute bottom-4 right-4 h-[260px] w-[280px] rounded-[14px] border border-black/10 bg-[rgba(255,255,255,0.9)] px-3 py-3 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]">
            <div
              className="mb-2 text-[11px] font-semibold text-(--color-7)"
              onDoubleClick={() => setInspectorCollapsed(true)}
              title={t('common.collapse', { defaultValue: 'Collapse' })}
            >
              {t('nodeGraph.inspector.title', { defaultValue: 'Inspector' })}
            </div>
            {selectedNode ? (
              <div className="grid gap-1 text-[12px] text-(--color-8)">
                <div>{selectedNode.title || selectedNode.type}</div>
                <div className="text-[11px] text-(--color-6)">
                  {selectedNode.id}
                </div>
                <div className="mt-1 text-[11px] text-(--color-6)">
                  {selectedNode.position.x.toFixed(0)},{' '}
                  {selectedNode.position.y.toFixed(0)}
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-(--color-6)">
                {t('nodeGraph.inspector.placeholder', {
                  defaultValue: 'Select a node to inspect its properties.',
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {contextMenuState ? (
        <div
          ref={contextMenuRef}
          className="absolute z-30 w-[220px] rounded-[12px] border border-black/12 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur"
          style={{
            left: contextMenuState.x,
            top: contextMenuState.y,
          }}
          data-testid="nodegraph-context-menu"
        >
          {contextMenuState.kind === 'node' ? (
            <button
              type="button"
              className="flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
              onClick={() => {
                deleteNodeWithConnectedEdges(contextMenuState.nodeId);
                setContextMenuState(null);
                setPortCreateGroupId(null);
                setPortCreateMenuOpen(false);
              }}
            >
              {t('nodeGraph.contextMenu.deleteNode', {
                defaultValue: 'Delete node',
              })}
            </button>
          ) : contextMenuState.kind === 'port' ? (
            <div className="relative grid gap-1">
              {canCreateNodeFromContextPort ? (
                <button
                  ref={portCreateRootItemRef}
                  type="button"
                  className="flex h-8 items-center justify-between rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
                  onClick={() => {
                    if (isPortCreateMenuOpen) {
                      setPortCreateMenuOpen(false);
                      return;
                    }
                    openPortCreateMenu();
                  }}
                >
                  <span>
                    {t('nodeGraph.contextMenu.createNode', {
                      defaultValue: 'Create node',
                    })}
                  </span>
                  <span className="text-[10px] text-(--color-6)">›</span>
                </button>
              ) : null}

              <button
                type="button"
                className="flex h-8 items-center rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={contextMenuPortConnectionCount === 0}
                onClick={() => {
                  clearPortConnections(
                    contextMenuState.nodeId,
                    contextMenuState.portId,
                    contextMenuState.role
                  );
                  setContextMenuState(null);
                  setPortCreateGroupId(null);
                  setPortCreateMenuOpen(false);
                }}
              >
                {t('nodeGraph.contextMenu.disconnectPort', {
                  defaultValue: 'Disconnect',
                })}
              </button>
              {canCreateNodeFromContextPort && isPortCreateMenuOpen ? (
                <div
                  ref={portCreateGroupMenuRef}
                  className="absolute left-[calc(100%+6px)] w-[186px] rounded-[12px] border border-black/12 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)]"
                  style={{ top: portCreateMenuTop }}
                >
                  <div className="relative grid gap-1">
                    {NODE_LIBRARY_GROUPS.map((group) => (
                      <button
                        key={`port-create-group-${group.id}`}
                        type="button"
                        className="flex h-8 items-center justify-between rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
                        onMouseEnter={(event) =>
                          selectPortCreateGroup(group.id, event.currentTarget)
                        }
                        onClick={(event) =>
                          selectPortCreateGroup(group.id, event.currentTarget)
                        }
                      >
                        <span>{group.label}</span>
                        <span className="text-[10px] text-(--color-6)">›</span>
                      </button>
                    ))}
                    {activePortCreateGroup ? (
                      <div
                        className="absolute left-[calc(100%+6px)] w-[186px] rounded-[12px] border border-black/12 bg-[rgba(255,255,255,0.98)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)]"
                        style={{ top: portCreateLeafMenuTop }}
                      >
                        <div className="grid gap-1">
                          {activePortCreateGroup.items.map((item) => (
                            <button
                              key={`port-create-${activePortCreateGroup.id}-${item.type}`}
                              type="button"
                              className="flex h-8 items-center rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
                              onClick={() => {
                                handleCreateNodeAfterPort(
                                  contextMenuState.nodeId,
                                  contextMenuState.portId,
                                  item.type
                                );
                                setContextMenuState(null);
                                setPortCreateGroupId(null);
                                setPortCreateMenuOpen(false);
                              }}
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-1">
              <div className="px-2 pb-1 text-[11px] font-semibold text-(--color-7)">
                {t('nodeGraph.contextMenu.edgeColor', {
                  defaultValue: 'Edge color',
                })}
              </div>
              {EDGE_COLOR_OPTIONS.map((option) => {
                const currentColor =
                  contextMenuEdge?.metadata &&
                  typeof contextMenuEdge.metadata.color === 'string'
                    ? contextMenuEdge.metadata.color
                    : null;
                const isActive =
                  option.color === null
                    ? currentColor === null
                    : currentColor === option.color;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className="flex h-8 items-center gap-2 rounded-md px-2 text-left text-[12px] text-(--color-8) hover:bg-black/[0.05]"
                    onClick={() => {
                      setEdgeColor(contextMenuState.edgeId, option.color);
                      setContextMenuState(null);
                      setPortCreateGroupId(null);
                      setPortCreateMenuOpen(false);
                    }}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-black/25"
                      style={{
                        backgroundColor: option.color ?? 'transparent',
                      }}
                    />
                    <span className="flex-1">{option.label}</span>
                    {isActive ? <span>✓</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

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

export default NodeGraphEditor;
