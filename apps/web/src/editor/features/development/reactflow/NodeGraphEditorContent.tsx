import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import { useParams } from 'react-router';
import {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import {
  GraphNode,
  type FetchStatusItem,
  type GraphNodeData,
  type GraphNodeKind,
  type SwitchCaseItem,
} from './GraphNode';

type ContextMenuState =
  | null
  | { kind: 'canvas'; x: number; y: number; flowX: number; flowY: number }
  | { kind: 'node'; x: number; y: number; nodeId: string }
  | {
      kind: 'port';
      x: number;
      y: number;
      nodeId: string;
      handleId: string;
      role: 'source' | 'target';
    };

const STORAGE_PREFIX = 'mdr:nodegraph:native';

const nodeTypes = {
  graphNode: GraphNode,
};

const NODE_MENU_GROUPS: Array<{
  id: string;
  label: string;
  items: Array<{ kind: GraphNodeKind; label: string; icon: string }>;
}> = [
  {
    id: 'terminal',
    label: 'Terminal',
    items: [
      { kind: 'start', label: 'Start', icon: '○' },
      { kind: 'end', label: 'End', icon: '○' },
    ],
  },
  {
    id: 'flow',
    label: 'Flow',
    items: [
      { kind: 'process', label: 'Process', icon: '○' },
      { kind: 'fetch', label: 'Fetch', icon: '○' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    items: [
      { kind: 'string', label: 'String', icon: '■' },
      { kind: 'number', label: 'Number', icon: '■' },
      { kind: 'expression', label: 'Expression', icon: '◇' },
    ],
  },
  {
    id: 'branch',
    label: 'Branch',
    items: [{ kind: 'switch', label: 'Switch', icon: '◇' }],
  },
];

const createStorageKey = (projectId: string) =>
  `${STORAGE_PREFIX}:${projectId}`;
const createNodeId = () =>
  `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const createSwitchCaseId = () =>
  `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
const createFetchStatusId = () =>
  `status-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

type PortSemantic = 'control' | 'data' | 'condition';
type PortRole = 'in' | 'out';
type HandleInfo = { role: PortRole; semantic: PortSemantic };

const parseHandleInfo = (handleId?: string | null): HandleInfo | null => {
  if (!handleId) return null;
  const matched = handleId.match(/^(in|out)\.(control|data|condition)\./);
  if (!matched) return null;
  return {
    role: matched[1] as PortRole,
    semantic: matched[2] as PortSemantic,
  };
};

const normalizeHandleId = (handleId?: string | null): string | null => {
  if (!handleId) return null;
  if (handleId.startsWith('in.control.') || handleId.startsWith('out.control.'))
    return handleId;
  if (handleId.startsWith('in.data.') || handleId.startsWith('out.data.'))
    return handleId;
  if (
    handleId.startsWith('in.condition.') ||
    handleId.startsWith('out.condition.')
  )
    return handleId;
  if (handleId === 'in.prev') return 'in.control.prev';
  if (handleId === 'out.next') return 'out.control.next';
  if (handleId.startsWith('out.case-'))
    return `out.control.${handleId.slice(4)}`;
  if (handleId.startsWith('in.case-'))
    return `in.condition.${handleId.slice(3)}`;
  if (handleId === 'in.value') return 'in.data.value';
  return handleId;
};

const normalizeSwitchCases = (
  cases?: GraphNodeData['cases']
): SwitchCaseItem[] => {
  if (!Array.isArray(cases)) return [];
  return cases
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: `${index}`, label: item || `case-${index + 1}` };
      }
      return {
        id: item.id || `${index}`,
        label: item.label || `case-${index + 1}`,
      };
    })
    .filter((item) => Boolean(item.id));
};

const normalizeFetchStatusCodes = (
  statusCodes?: GraphNodeData['statusCodes']
): FetchStatusItem[] => {
  if (!Array.isArray(statusCodes)) return [];
  return statusCodes
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: `${index}`, code: item || `${200 + index}` };
      }
      return {
        id: item.id || `${index}`,
        code: item.code || `${200 + index}`,
      };
    })
    .filter((item) => Boolean(item.id));
};

const isMultiHandle = (handleId: string) => {
  const handle = parseHandleInfo(handleId);
  if (!handle) return false;
  if (handle.role === 'in' && handle.semantic === 'control') return true;
  if (handle.role === 'out' && handle.semantic === 'data') return true;
  if (handleId === 'out.condition.result') return true;
  return false;
};

const getDefaultHandleForNode = (
  node: Node<GraphNodeData>,
  role: PortRole,
  semantic: PortSemantic
): string | null => {
  const switchCases = normalizeSwitchCases(node.data.cases);
  const fetchStatusCodes = normalizeFetchStatusCodes(node.data.statusCodes);
  if (role === 'in') {
    if (semantic === 'control') {
      if (node.data.kind === 'start') return null;
      return 'in.control.prev';
    }
    if (semantic === 'data') {
      if (node.data.kind === 'switch') return 'in.data.value';
      return null;
    }
    if (node.data.kind !== 'switch') return null;
    if (!switchCases.length) return null;
    return `in.condition.case-${switchCases[0].id}`;
  }

  if (semantic === 'control') {
    if (node.data.kind === 'end') return null;
    if (node.data.kind === 'switch') {
      if (!switchCases.length) return 'out.control.default';
      return `out.control.case-${switchCases[0].id}`;
    }
    if (node.data.kind === 'fetch') {
      if (fetchStatusCodes.length)
        return `out.control.status-${fetchStatusCodes[0].id}`;
      return 'out.control.error-request';
    }
    if (node.data.kind === 'start' || node.data.kind === 'process')
      return 'out.control.next';
    return null;
  }

  if (semantic === 'data') {
    if (node.data.kind === 'fetch') return 'in.data.url';
    if (
      node.data.kind === 'string' ||
      node.data.kind === 'number' ||
      node.data.kind === 'expression'
    ) {
      return 'out.data.value';
    }
    return null;
  }

  if (node.data.kind === 'expression') return 'out.condition.result';
  return null;
};

const createNode = (
  kind: GraphNodeKind,
  position: { x: number; y: number }
): Node<GraphNodeData> => {
  if (kind === 'switch') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: {
        label: 'Switch',
        kind: 'switch',
        collapsed: false,
        cases: [
          { id: createSwitchCaseId(), label: 'case-1' },
          { id: createSwitchCaseId(), label: 'case-2' },
        ],
      },
    };
  }
  if (kind === 'fetch') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: {
        label: 'Fetch',
        kind: 'fetch',
        collapsed: false,
        value: '',
        method: 'GET',
        statusCodes: [
          { id: createFetchStatusId(), code: '200' },
          { id: createFetchStatusId(), code: '201' },
        ],
      },
    };
  }
  if (kind === 'string') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: {
        label: 'String',
        kind: 'string',
        value: 'hello',
        collapsed: false,
      },
    };
  }
  if (kind === 'number') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: { label: 'Number', kind: 'number', value: '42', collapsed: false },
    };
  }
  if (kind === 'expression') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: {
        label: 'Expression',
        kind: 'expression',
        collapsed: false,
        expression: 'a > b',
      },
    };
  }
  return {
    id: createNodeId(),
    type: 'graphNode',
    position,
    data: { label: kind[0].toUpperCase() + kind.slice(1), kind },
  };
};

const createInitialNodes = (): Node<GraphNodeData>[] => [
  createNode('start', { x: 100, y: 180 }),
  createNode('switch', { x: 380, y: 120 }),
  createNode('process', { x: 720, y: 120 }),
  createNode('end', { x: 980, y: 250 }),
];

const createInitialEdges = (nodes: Node<GraphNodeData>[]): Edge[] => [
  {
    id: 'e-initial-1',
    source: nodes[0].id,
    sourceHandle: 'out.control.next',
    target: nodes[1].id,
    targetHandle: 'in.control.prev',
    type: 'smoothstep',
  },
  (() => {
    const switchCases = normalizeSwitchCases(nodes[1].data.cases);
    return {
      id: 'e-initial-2',
      source: nodes[1].id,
      sourceHandle: switchCases.length
        ? `out.control.case-${switchCases[0].id}`
        : 'out.control.default',
      target: nodes[2].id,
      targetHandle: 'in.control.prev',
      type: 'smoothstep',
    };
  })(),
  {
    id: 'e-initial-3',
    source: nodes[2].id,
    sourceHandle: 'out.control.next',
    target: nodes[3].id,
    targetHandle: 'in.control.prev',
    type: 'smoothstep',
  },
];

const loadSnapshot = (
  projectId: string
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } => {
  const fallbackNodes = createInitialNodes();
  const fallbackEdges = createInitialEdges(fallbackNodes);
  if (typeof window === 'undefined')
    return { nodes: fallbackNodes, edges: fallbackEdges };
  try {
    const raw = window.localStorage.getItem(createStorageKey(projectId));
    if (!raw) return { nodes: fallbackNodes, edges: fallbackEdges };
    const parsed = JSON.parse(raw) as {
      nodes?: Node<GraphNodeData>[];
      edges?: Edge[];
    };
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return { nodes: fallbackNodes, edges: fallbackEdges };
    }
    const normalizedEdges = parsed.edges.map((edge) => ({
      ...edge,
      sourceHandle: normalizeHandleId(edge.sourceHandle) ?? undefined,
      targetHandle: normalizeHandleId(edge.targetHandle) ?? undefined,
    }));
    const normalizedNodes = parsed.nodes.map((node) => {
      if (node.data.kind === 'switch') {
        return {
          ...node,
          data: {
            ...node.data,
            collapsed: Boolean(node.data.collapsed),
            cases: normalizeSwitchCases(node.data.cases),
          },
        };
      }
      if (node.data.kind === 'fetch') {
        return {
          ...node,
          data: {
            ...node.data,
            collapsed: Boolean(node.data.collapsed),
            statusCodes: normalizeFetchStatusCodes(node.data.statusCodes),
            method: node.data.method || 'GET',
          },
        };
      }
      if (
        node.data.kind === 'expression' ||
        node.data.kind === 'string' ||
        node.data.kind === 'number'
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            collapsed: Boolean(node.data.collapsed),
          },
        };
      }
      return node;
    });
    return { nodes: normalizedNodes, edges: normalizedEdges };
  } catch {
    return { nodes: fallbackNodes, edges: fallbackEdges };
  }
};

export const NodeGraphEditorContent = () => {
  const { projectId } = useParams();
  const resolvedProjectId = projectId?.trim() || 'global';
  const snapshot = useMemo(
    () => loadSnapshot(resolvedProjectId),
    [resolvedProjectId]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(snapshot.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(snapshot.edges);
  const [menu, setMenu] = useState<ContextMenuState>(null);
  const [hint, setHint] = useState<string | null>(null);
  const reactFlow = useReactFlow<Node<GraphNodeData>, Edge>();

  useEffect(() => {
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
  }, [setEdges, setNodes, snapshot.edges, snapshot.nodes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      createStorageKey(resolvedProjectId),
      JSON.stringify({ nodes, edges })
    );
  }, [edges, nodes, resolvedProjectId]);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), 2200);
    return () => window.clearTimeout(timer);
  }, [hint]);

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onPortContextMenu: (
            event: MouseEvent,
            nodeId: string,
            handleId: string,
            role: 'source' | 'target'
          ) => {
            event.preventDefault();
            event.stopPropagation();
            const x = event.clientX;
            const y = event.clientY;
            setMenu({ kind: 'port', x, y, nodeId, handleId, role });
          },
          onAddCase: (nodeId: string) => {
            setNodes((current) =>
              current.map((item) => {
                if (item.id !== nodeId || item.data.kind !== 'switch')
                  return item;
                const cases = normalizeSwitchCases(item.data.cases);
                return {
                  ...item,
                  data: {
                    ...item.data,
                    cases: [
                      ...cases,
                      {
                        id: createSwitchCaseId(),
                        label: `case-${cases.length + 1}`,
                      },
                    ],
                  },
                };
              })
            );
          },
          onRemoveCase: (nodeId: string, caseId: string) => {
            setNodes((current) =>
              current.map((item) => {
                if (item.id !== nodeId || item.data.kind !== 'switch')
                  return item;
                const cases = normalizeSwitchCases(item.data.cases);
                return {
                  ...item,
                  data: {
                    ...item.data,
                    cases: cases.filter((caseItem) => caseItem.id !== caseId),
                  },
                };
              })
            );
            setEdges((current) =>
              current.filter(
                (edge) =>
                  !(
                    (edge.source === nodeId &&
                      edge.sourceHandle === `out.control.case-${caseId}`) ||
                    (edge.target === nodeId &&
                      edge.targetHandle === `in.condition.case-${caseId}`)
                  )
              )
            );
          },
          onAddStatusCode: (nodeId: string) => {
            setNodes((current) =>
              current.map((item) => {
                if (item.id !== nodeId || item.data.kind !== 'fetch')
                  return item;
                const statusCodes = normalizeFetchStatusCodes(
                  item.data.statusCodes
                );
                return {
                  ...item,
                  data: {
                    ...item.data,
                    statusCodes: [
                      ...statusCodes,
                      { id: createFetchStatusId(), code: '200' },
                    ],
                  },
                };
              })
            );
          },
          onRemoveStatusCode: (nodeId: string, statusId: string) => {
            setNodes((current) =>
              current.map((item) => {
                if (item.id !== nodeId || item.data.kind !== 'fetch')
                  return item;
                const statusCodes = normalizeFetchStatusCodes(
                  item.data.statusCodes
                );
                return {
                  ...item,
                  data: {
                    ...item.data,
                    statusCodes: statusCodes.filter(
                      (entry) => entry.id !== statusId
                    ),
                  },
                };
              })
            );
            setEdges((current) =>
              current.filter(
                (edge) =>
                  !(
                    edge.source === nodeId &&
                    edge.sourceHandle === `out.control.status-${statusId}`
                  )
              )
            );
          },
          onChangeStatusCode: (
            nodeId: string,
            statusId: string,
            code: string
          ) => {
            setNodes((current) =>
              current.map((item) => {
                if (item.id !== nodeId || item.data.kind !== 'fetch')
                  return item;
                const statusCodes = normalizeFetchStatusCodes(
                  item.data.statusCodes
                );
                return {
                  ...item,
                  data: {
                    ...item.data,
                    statusCodes: statusCodes.map((entry) =>
                      entry.id === statusId ? { ...entry, code } : entry
                    ),
                  },
                };
              })
            );
          },
          onChangeMethod: (nodeId: string, method: string) => {
            setNodes((current) =>
              current.map((item) =>
                item.id === nodeId && item.data.kind === 'fetch'
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        method,
                      },
                    }
                  : item
              )
            );
          },
          onToggleCollapse: (nodeId: string) => {
            setNodes((current) =>
              current.map((item) =>
                item.id === nodeId &&
                (item.data.kind === 'switch' ||
                  item.data.kind === 'fetch' ||
                  item.data.kind === 'expression' ||
                  item.data.kind === 'string' ||
                  item.data.kind === 'number')
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        collapsed: !item.data.collapsed,
                      },
                    }
                  : item
              )
            );
          },
          onChangeValue: (nodeId: string, value: string) => {
            setNodes((current) =>
              current.map((item) =>
                item.id === nodeId &&
                (item.data.kind === 'string' ||
                  item.data.kind === 'number' ||
                  item.data.kind === 'fetch')
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        value,
                      },
                    }
                  : item
              )
            );
          },
          onChangeExpression: (nodeId: string, expression: string) => {
            setNodes((current) =>
              current.map((item) =>
                item.id === nodeId && item.data.kind === 'expression'
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        expression,
                      },
                    }
                  : item
              )
            );
          },
          hasUrlInput:
            node.data.kind === 'fetch'
              ? edges.some(
                  (edge) =>
                    edge.target === node.id &&
                    edge.targetHandle === 'in.data.url'
                )
              : undefined,
        },
      })),
    [edges, nodes, setEdges, setNodes]
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return false;
      const sourceHandleId = normalizeHandleId(connection.sourceHandle);
      const targetHandleId = normalizeHandleId(connection.targetHandle);
      const sourceInfo = parseHandleInfo(sourceHandleId);
      const targetInfo = parseHandleInfo(targetHandleId);
      if (!sourceInfo || !targetInfo) return false;
      if (sourceInfo.role !== 'out' || targetInfo.role !== 'in') return false;
      if (sourceInfo.semantic !== targetInfo.semantic) return false;

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      if (!sourceNode || !targetNode || !sourceHandleId || !targetHandleId)
        return false;

      const sourceUsed = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.sourceHandle === sourceHandleId &&
          !(
            edge.target === connection.target &&
            edge.targetHandle === targetHandleId
          )
      );
      if (!isMultiHandle(sourceHandleId) && sourceUsed) return false;

      const targetUsed = edges.some(
        (edge) =>
          edge.target === connection.target &&
          edge.targetHandle === targetHandleId &&
          !(
            edge.source === connection.source &&
            edge.sourceHandle === sourceHandleId
          )
      );
      if (!isMultiHandle(targetHandleId) && targetUsed) return false;

      return true;
    },
    [edges, nodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const normalizedConnection = {
        ...connection,
        sourceHandle: normalizeHandleId(connection.sourceHandle) ?? undefined,
        targetHandle: normalizeHandleId(connection.targetHandle) ?? undefined,
      };
      if (!isValidConnection(normalizedConnection)) {
        setHint('连接无效：端口方向或语义不匹配，或单接口已被占用。');
        return;
      }
      setEdges((current) =>
        addEdge({ ...normalizedConnection, type: 'smoothstep' }, current)
      );
    },
    [isValidConnection, setEdges]
  );

  const createNodeFromCanvas = useCallback(
    (kind: GraphNodeKind) => {
      if (!menu || menu.kind !== 'canvas') return;
      setNodes((current) => [
        ...current,
        createNode(kind, { x: menu.flowX, y: menu.flowY }),
      ]);
      closeMenu();
    },
    [closeMenu, menu, setNodes]
  );

  const deleteNode = useCallback(() => {
    if (!menu || menu.kind !== 'node') return;
    setNodes((current) => current.filter((node) => node.id !== menu.nodeId));
    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== menu.nodeId && edge.target !== menu.nodeId
      )
    );
    closeMenu();
  }, [closeMenu, menu, setEdges, setNodes]);

  const duplicateNode = useCallback(() => {
    if (!menu || menu.kind !== 'node') return;
    setNodes((current) => {
      const target = current.find((node) => node.id === menu.nodeId);
      if (!target) return current;
      const copy = {
        ...target,
        id: createNodeId(),
        position: { x: target.position.x + 36, y: target.position.y + 36 },
      };
      return [...current, copy];
    });
    closeMenu();
  }, [closeMenu, menu, setNodes]);

  const disconnectPort = useCallback(() => {
    if (!menu || menu.kind !== 'port') return;
    const handleId = normalizeHandleId(menu.handleId) ?? menu.handleId;
    setEdges((current) =>
      current.filter((edge) =>
        menu.role === 'source'
          ? !(edge.source === menu.nodeId && edge.sourceHandle === handleId)
          : !(edge.target === menu.nodeId && edge.targetHandle === handleId)
      )
    );
    closeMenu();
  }, [closeMenu, menu, setEdges]);

  const createNodeFromPort = useCallback(
    (kind: GraphNodeKind) => {
      if (!menu || menu.kind !== 'port') return;
      const sourceNode = nodes.find((node) => node.id === menu.nodeId);
      if (!sourceNode) return;
      const handleInfo = parseHandleInfo(menu.handleId);
      if (!handleInfo) {
        setHint('该端口语义无法解析，无法自动连线。');
        closeMenu();
        return;
      }
      const xOffset = menu.role === 'source' ? 260 : -260;
      const newNode = createNode(kind, {
        x: sourceNode.position.x + xOffset,
        y: sourceNode.position.y + 24,
      });
      setNodes((current) => [...current, newNode]);
      setEdges((current) => {
        const next = [...current];
        const sourceHandleId = normalizeHandleId(menu.handleId);
        if (menu.role === 'source') {
          const targetHandle = getDefaultHandleForNode(
            newNode,
            'in',
            handleInfo.semantic
          );
          if (!targetHandle || !sourceHandleId) {
            setHint('新建节点没有可匹配的输入端口，已创建节点但未连线。');
            return next;
          }
          const connection = {
            source: menu.nodeId,
            sourceHandle: sourceHandleId,
            target: newNode.id,
            targetHandle,
          };
          if (!isValidConnection(connection)) {
            setHint('新建节点端口语义不匹配，已创建节点但未连线。');
            return next;
          }
          next.push({
            id: `e-${createNodeId()}`,
            ...connection,
            type: 'smoothstep',
          });
        } else {
          const sourceHandle = getDefaultHandleForNode(
            newNode,
            'out',
            handleInfo.semantic
          );
          if (!sourceHandle || !sourceHandleId) {
            setHint('新建节点没有可匹配的输出端口，已创建节点但未连线。');
            return next;
          }
          const connection = {
            source: newNode.id,
            sourceHandle,
            target: menu.nodeId,
            targetHandle: sourceHandleId,
          };
          if (!isValidConnection(connection)) {
            setHint('新建节点端口语义不匹配，已创建节点但未连线。');
            return next;
          }
          next.push({
            id: `e-${createNodeId()}`,
            ...connection,
            type: 'smoothstep',
          });
        }
        return next;
      });
      closeMenu();
    },
    [closeMenu, isValidConnection, menu, nodes, setEdges, setNodes]
  );

  return (
    <div className="nodegraph-native-root" onClick={closeMenu}>
      <ReactFlow<Node<GraphNodeData>, Edge>
        nodes={flowNodes}
        edges={edges}
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
          setMenu({
            kind: 'node',
            x: event.clientX,
            y: event.clientY,
            nodeId: node.id,
          });
        }}
        onConnectEnd={(_, state) => {
          if (!state?.isValid) {
            setHint('无法连接：请从输出端口连到同语义的输入端口。');
          }
        }}
      >
        <Background gap={20} size={1} />
        <MiniMap pannable zoomable />
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
      {hint ? <div className="nodegraph-native-hint">{hint}</div> : null}

      {menu ? (
        <div
          className="native-context-menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {menu.kind === 'canvas'
            ? NODE_MENU_GROUPS.map((group) => (
                <div key={group.id} className="native-context-menu__group">
                  <div className="native-context-menu__title">
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={`${group.id}-${item.kind}`}
                      type="button"
                      onClick={() => createNodeFromCanvas(item.kind)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))
            : null}

          {menu.kind === 'node' ? (
            <>
              <button type="button" onClick={duplicateNode}>
                Duplicate
              </button>
              <button type="button" onClick={deleteNode}>
                Delete
              </button>
            </>
          ) : null}

          {menu.kind === 'port' ? (
            <>
              <button type="button" onClick={disconnectPort}>
                Disconnect
              </button>
              {NODE_MENU_GROUPS.map((group) => (
                <div
                  key={`port-${group.id}`}
                  className="native-context-menu__group"
                >
                  <div className="native-context-menu__title">
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={`port-${group.id}-${item.kind}`}
                      type="button"
                      onClick={() => createNodeFromPort(item.kind)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label} + Connect</span>
                    </button>
                  ))}
                </div>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
