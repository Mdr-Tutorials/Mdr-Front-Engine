import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import type { GraphNodeData, GraphNodeKind } from './GraphNode';
import { NODE_MENU_GROUPS } from './nodeCatalog';
import type { ConnectionValidationReason } from './graphConnectionValidation';

import {
  createNode,
  createStorageKey,
  loadProjectSnapshot,
  nodeTypes,
  type ContextMenuState,
  type GraphDocument,
  type NodeValidationText,
  type ProjectGraphSnapshot,
} from './nodeGraphEditorModel';

import { buildFlowNodes } from './nodeGraphFlowNodes';
import {
  buildContextMenuItems,
  buildMenuColumns,
  resolveMenuLayout,
  resolvePortMenuGroups,
} from './nodeGraphMenuModel';
import { applyNodeChangesWithGrouping } from './nodeGraphNodeChanges';
import { NodeGraphContextMenu } from './NodeGraphContextMenu';
import { NodeGraphGraphManager } from './NodeGraphGraphManager';
import { useNodeGraphColorMode } from './useNodeGraphColorMode';
import { useNodeGraphGraphActions } from './nodeGraphGraphActions';
import { useNodeGraphGroupLayout } from './nodeGraphGroupLayout';
import { useNodeGraphNodeActions } from './nodeGraphNodeActions';
import { useNodeGraphConnectionActions } from './nodeGraphConnectionActions';
export const NodeGraphEditorContent = () => {
  const { projectId } = useParams();
  const { t } = useTranslation('editor');
  const resolvedProjectId = projectId?.trim() || 'global';
  const projectSnapshot = useMemo(
    () => loadProjectSnapshot(resolvedProjectId),
    [resolvedProjectId]
  );
  const [graphDocs, setGraphDocs] = useState<GraphDocument[]>(
    projectSnapshot.graphs
  );
  const [activeGraphId, setActiveGraphId] = useState<string>(
    projectSnapshot.activeGraphId
  );
  const [nodes, setNodes] = useNodesState(
    projectSnapshot.graphs.find(
      (graph) => graph.id === projectSnapshot.activeGraphId
    )?.nodes ?? projectSnapshot.graphs[0].nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    projectSnapshot.graphs.find(
      (graph) => graph.id === projectSnapshot.activeGraphId
    )?.edges ?? projectSnapshot.graphs[0].edges
  );
  const [menu, setMenu] = useState<ContextMenuState>(null);
  const [menuPath, setMenuPath] = useState<number[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const colorMode = useNodeGraphColorMode();
  const reactFlow = useReactFlow<Node<GraphNodeData>, Edge>();
  const resolveCatalogNodeLabel = useCallback(
    (kind: GraphNodeKind, fallbackLabel: string) =>
      t(`nodeGraph.catalog.nodes.${kind}`, {
        defaultValue: fallbackLabel,
      }),
    [t]
  );
  const resolveCatalogGroupLabel = useCallback(
    (groupId: string, fallbackLabel: string) =>
      t(`nodeGraph.catalog.groups.${groupId}`, {
        defaultValue: fallbackLabel,
      }),
    [t]
  );
  const localizedNodeMenuGroups = useMemo(
    () =>
      NODE_MENU_GROUPS.map((group) => ({
        ...group,
        label: resolveCatalogGroupLabel(group.id, group.label),
        items: group.items.map((item) => ({
          ...item,
          label: resolveCatalogNodeLabel(item.kind, item.label),
        })),
      })),
    [resolveCatalogGroupLabel, resolveCatalogNodeLabel]
  );
  const connectionHintTextByReason = useMemo<
    Record<ConnectionValidationReason, string>
  >(
    () => ({
      'missing-endpoint': t('nodeGraph.connection.missingEndpoint', {
        defaultValue: 'Invalid connection: missing source or target.',
      }),
      'invalid-handle': t('nodeGraph.connection.invalidHandle', {
        defaultValue: 'Invalid connection: unable to resolve port handle.',
      }),
      'wrong-direction': t('nodeGraph.connection.wrongDirection', {
        defaultValue:
          'Invalid connection: connect from output port to input port.',
      }),
      'semantic-mismatch': t('nodeGraph.connection.semanticMismatch', {
        defaultValue: 'Invalid connection: port semantics do not match.',
      }),
      'node-not-found': t('nodeGraph.connection.nodeNotFound', {
        defaultValue: 'Invalid connection: node state changed, please retry.',
      }),
      'source-occupied': t('nodeGraph.connection.sourceOccupied', {
        defaultValue:
          'Invalid connection: source port is single-use and already occupied.',
      }),
      'target-occupied': t('nodeGraph.connection.targetOccupied', {
        defaultValue:
          'Invalid connection: target port is single-use and already occupied.',
      }),
    }),
    [t]
  );
  const hintText = useMemo(
    () => ({
      invalidConnectEnd: t('nodeGraph.hints.invalidConnectEnd', {
        defaultValue:
          'Unable to connect: connect output port to an input with matching semantic.',
      }),
      invalidPortHandle: t('nodeGraph.hints.invalidPortHandle', {
        defaultValue:
          'Unable to parse selected port semantic; node created without auto-connect.',
      }),
      noMatchingInput: t('nodeGraph.hints.noMatchingInput', {
        defaultValue:
          'Created node has no matching input port. Node created without connection.',
      }),
      noMatchingOutput: t('nodeGraph.hints.noMatchingOutput', {
        defaultValue:
          'Created node has no matching output port. Node created without connection.',
      }),
      keepAtLeastOneCase: t('nodeGraph.hints.keepAtLeastOneCase', {
        defaultValue: 'Switch must keep at least one case.',
      }),
      keepAtLeastOneStatus: t('nodeGraph.hints.keepAtLeastOneStatus', {
        defaultValue: 'Fetch must keep at least one status branch.',
      }),
      keepAtLeastOneBranch: t('nodeGraph.hints.keepAtLeastOneBranch', {
        defaultValue: 'Parallel branches must keep at least one branch.',
      }),
      keepAtLeastOneEntry: t('nodeGraph.hints.keepAtLeastOneEntry', {
        defaultValue: 'Current node must keep at least one mapping entry.',
      }),
      keepAtLeastOneBinding: t('nodeGraph.hints.keepAtLeastOneBinding', {
        defaultValue: 'Subflow bindings must keep at least one entry.',
      }),
      keepAtLeastOneGraph: t('nodeGraph.hints.keepAtLeastOneGraph', {
        defaultValue: 'Keep at least one graph.',
      }),
    }),
    [t]
  );
  const validationText = useMemo<NodeValidationText>(
    () => ({
      playAnimationRequired: t('nodeGraph.validation.playAnimationRequired', {
        defaultValue: 'targetId and timelineName are required.',
      }),
      scrollToSelectorRequired: t('nodeGraph.validation.scrollToSelector', {
        defaultValue: 'selector target mode requires selector.',
      }),
      focusControlSelectorRequired: t('nodeGraph.validation.focusSelector', {
        defaultValue: 'selector is required.',
      }),
      validateSchemaOrRulesRequired: t(
        'nodeGraph.validation.validateSchemaOrRules',
        {
          defaultValue:
            'Configure schema or provide rules from in.data.rules input.',
        }
      ),
      envVarKeyRequired: t('nodeGraph.validation.envVarKeyRequired', {
        defaultValue: 'key is required.',
      }),
    }),
    [t]
  );
  const localizeNodeLabel = useCallback(
    (node: Node<GraphNodeData>): Node<GraphNodeData> => ({
      ...node,
      data: {
        ...node.data,
        label: resolveCatalogNodeLabel(node.data.kind, node.data.label),
      },
    }),
    [resolveCatalogNodeLabel]
  );
  const createLocalizedNode = useCallback(
    (kind: GraphNodeKind, position: { x: number; y: number }) =>
      localizeNodeLabel(createNode(kind, position)),
    [localizeNodeLabel]
  );

  useEffect(() => {
    setGraphDocs(projectSnapshot.graphs);
    setActiveGraphId(projectSnapshot.activeGraphId);
    const activeGraph =
      projectSnapshot.graphs.find(
        (graph) => graph.id === projectSnapshot.activeGraphId
      ) ?? projectSnapshot.graphs[0];
    setNodes(activeGraph.nodes);
    setEdges(activeGraph.edges);
  }, [projectSnapshot, setEdges, setNodes]);

  useEffect(() => {
    setGraphDocs((current) =>
      current.map((graph) =>
        graph.id === activeGraphId
          ? {
              ...graph,
              nodes,
              edges,
            }
          : graph
      )
    );
  }, [activeGraphId, edges, nodes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: ProjectGraphSnapshot = {
      version: 2,
      activeGraphId,
      graphs: graphDocs,
    };
    window.localStorage.setItem(
      createStorageKey(resolvedProjectId),
      JSON.stringify(payload)
    );
  }, [activeGraphId, graphDocs, resolvedProjectId]);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), 2200);
    return () => window.clearTimeout(timer);
  }, [hint]);

  useEffect(() => {
    setMenuPath([]);
  }, [menu]);

  const {
    activeGraphName,
    createGraph,
    deleteGraph,
    duplicateGraph,
    renameActiveGraph,
    switchGraph,
  } = useNodeGraphGraphActions({
    activeGraphId,
    graphDocs,
    keepAtLeastOneGraphHint: hintText.keepAtLeastOneGraph,
    localizeNodeLabel,
    setActiveGraphId,
    setEdges,
    setGraphDocs,
    setHint,
    setNodes,
    t,
  });

  const groupAutoLayoutById = useNodeGraphGroupLayout({
    nodes,
    setNodes,
  });

  const flowNodes = useMemo(
    () =>
      buildFlowNodes({
        edges,
        groupAutoLayoutById,
        hintText,
        nodes,
        setEdges,
        setHint,
        setMenu,
        setNodes,
        validationText,
      }),
    [
      edges,
      groupAutoLayoutById,
      hintText,
      nodes,
      setEdges,
      setHint,
      setMenu,
      setNodes,
      validationText,
    ]
  );

  const confirmAttachToGroup = useCallback(
    (groupLabel: string) => {
      if (typeof window === 'undefined') return false;
      return window.confirm(
        t('nodeGraph.confirm.attachToBox', {
          groupLabel,
          defaultValue: 'Add node to "{{groupLabel}}"?',
        })
      );
    },
    [t]
  );

  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChangesWithGrouping>[0]) => {
      setNodes((current) =>
        applyNodeChangesWithGrouping(changes, current, confirmAttachToGroup)
      );
    },
    [confirmAttachToGroup, setNodes]
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const portMenuGroups = useMemo(
    () => resolvePortMenuGroups({ localizedNodeMenuGroups, menu }),
    [localizedNodeMenuGroups, menu]
  );

  const { isValidConnection, onConnect } = useNodeGraphConnectionActions({
    connectionHintTextByReason,
    edges,
    nodes,
    setEdges,
    setHint,
  });

  const {
    createNodeFromCanvas,
    createNodeFromGroupBox,
    createNodeFromPort,
    deleteNode,
    detachNodeFromBox,
    disconnectPort,
    duplicateNode,
    updateNodeColorTheme,
  } = useNodeGraphNodeActions({
    closeMenu,
    connectionHintTextByReason,
    createLocalizedNode,
    groupAutoLayoutById,
    hintText: {
      invalidPortHandle: hintText.invalidPortHandle,
      noMatchingInput: hintText.noMatchingInput,
      noMatchingOutput: hintText.noMatchingOutput,
    },
    menu,
    nodes,
    setEdges,
    setHint,
    setNodes,
  });

  const menuItems = useMemo(
    () =>
      buildContextMenuItems({
        createNodeFromCanvas,
        createNodeFromGroupBox,
        createNodeFromPort,
        deleteNode,
        detachNodeFromBox,
        disconnectPort,
        duplicateNode,
        localizedNodeMenuGroups,
        menu,
        nodes,
        portMenuGroups,
        t,
        updateNodeColorTheme,
      }),
    [
      createNodeFromCanvas,
      createNodeFromGroupBox,
      createNodeFromPort,
      deleteNode,
      detachNodeFromBox,
      disconnectPort,
      duplicateNode,
      localizedNodeMenuGroups,
      menu,
      nodes,
      portMenuGroups,
      t,
      updateNodeColorTheme,
    ]
  );

  const menuColumns = useMemo(
    () => buildMenuColumns(menuItems, menuPath),
    [menuItems, menuPath]
  );

  const onMenuItemEnter = useCallback(
    (level: number, index: number, hasChildren: boolean) => {
      setMenuPath((current) => {
        const next = current.slice(0, level);
        if (hasChildren) next[level] = index;
        return next;
      });
    },
    []
  );

  const menuLayout = useMemo(
    () =>
      resolveMenuLayout({
        menu,
        menuColumns,
        menuItems,
      }),
    [menu, menuColumns, menuItems]
  );

  return (
    <div
      className="nodegraph-native-root"
      data-theme={colorMode}
      onClick={closeMenu}
    >
      <NodeGraphGraphManager
        activeGraphId={activeGraphId}
        activeGraphName={activeGraphName}
        graphDocs={graphDocs}
        onCreateGraph={createGraph}
        onDeleteGraph={deleteGraph}
        onDuplicateGraph={duplicateGraph}
        onRenameGraph={renameActiveGraph}
        onSwitchGraph={switchGraph}
        t={t}
      />
      <ReactFlow<Node<GraphNodeData>, Edge>
        nodes={flowNodes}
        edges={edges}
        elevateNodesOnSelect={false}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        nodesConnectable
        edgesReconnectable
        nodesDraggable
        fitView
        minZoom={0.4}
        maxZoom={2}
        connectionMode={ConnectionMode.Strict}
        colorMode={colorMode}
        className="nodegraph-native-canvas"
        proOptions={{ hideAttribution: true }}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          const flowPos = reactFlow.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          setMenu({
            kind: 'canvas',
            x: event.clientX,
            y: event.clientY,
            flowX: flowPos.x,
            flowY: flowPos.y,
          });
        }}
        onNodeContextMenu={(event, node) => {
          event.preventDefault();
          const flowPos = reactFlow.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          setMenu({
            kind: 'node',
            x: event.clientX,
            y: event.clientY,
            nodeId: node.id,
            flowX: flowPos.x,
            flowY: flowPos.y,
          });
        }}
        onConnectEnd={(_, state) => {
          if (!state?.isValid) {
            setHint(hintText.invalidConnectEnd);
          }
        }}
      >
        <Background
          gap={20}
          size={1}
          color={
            colorMode === 'dark'
              ? 'rgb(255 255 255 / 0.14)'
              : 'rgb(15 23 42 / 0.18)'
          }
        />
        <MiniMap pannable zoomable />
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
      {hint ? <div className="nodegraph-native-hint">{hint}</div> : null}

      <NodeGraphContextMenu
        menu={menu}
        menuColumns={menuColumns}
        menuLayout={menuLayout}
        onMenuItemEnter={onMenuItemEnter}
      />
    </div>
  );
};
