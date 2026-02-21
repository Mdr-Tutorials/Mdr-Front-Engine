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
  applyNodeChanges,
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
  type NodeChange,
  type Node,
} from '@xyflow/react';
import { GraphNode, type GraphNodeData, type GraphNodeKind } from './GraphNode';
import {
  estimateStickyNoteSize,
  normalizeBindingEntries,
  normalizeBranches,
  normalizeCases,
  normalizeStatusCodes,
  type PortSemantic,
} from './graphNodeShared';
import {
  NODE_MENU_GROUPS,
  getNodeCatalogItem,
  getNodePortHandle,
  supportsPortSemantic,
} from './nodeCatalog';
import {
  normalizePersistedEdge,
  normalizePersistedNode,
} from './graphNodePersistence';
import {
  parseHandleInfo,
  normalizeHandleId,
  type PortRole,
} from './graphPortUtils';
import {
  CONNECTION_HINT_BY_REASON,
  validateConnectionWithState,
} from './graphConnectionValidation';

type ContextMenuState =
  | null
  | { kind: 'canvas'; x: number; y: number; flowX: number; flowY: number }
  | {
      kind: 'node';
      x: number;
      y: number;
      nodeId: string;
      flowX: number;
      flowY: number;
    }
  | {
      kind: 'port';
      x: number;
      y: number;
      nodeId: string;
      handleId: string;
      role: 'source' | 'target';
    };

type ContextMenuItem = {
  id: string;
  label: string;
  icon?: string;
  onSelect?: () => void;
  children?: ContextMenuItem[];
  tone?: 'default' | 'danger';
};

type GraphDocument = {
  id: string;
  name: string;
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
};

type ProjectGraphSnapshot = {
  version: 2;
  activeGraphId: string;
  graphs: GraphDocument[];
};

const STORAGE_PREFIX = 'mdr:nodegraph:native';

const nodeTypes = {
  graphNode: GraphNode,
};

const createStorageKey = (projectId: string) =>
  `${STORAGE_PREFIX}:${projectId}`;
const createNodeId = () =>
  `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const createGraphId = () =>
  `graph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const createSwitchCaseId = () =>
  `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
const createFetchStatusId = () =>
  `status-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
const createBranchId = () =>
  `branch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
const createBindingId = () =>
  `bind-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
const MENU_VIEWPORT_PADDING = 8;
const MENU_COLUMN_WIDTH = 220;
const MENU_COLUMN_GAP = 0;
const HINT_TEXT = {
  invalidConnectEnd: '无法连接：请从输出端口连到同语义的输入端口。',
  invalidPortHandle: '该端口语义无法解析，无法自动连线。',
  noMatchingInput: '新建节点没有可匹配的输入端口，已创建节点但未连线。',
  noMatchingOutput: '新建节点没有可匹配的输出端口，已创建节点但未连线。',
  keepAtLeastOneCase: 'Switch 至少保留一个 case。',
  keepAtLeastOneStatus: 'Fetch 至少保留一个状态码分支。',
  keepAtLeastOneBranch: '并行分支至少保留一个。',
  keepAtLeastOneEntry: '当前节点至少保留一个映射项。',
  keepAtLeastOneBinding: '子流程绑定至少保留一项。',
} as const;

const GROUP_BOX_THEME_OPTIONS = [
  { value: 'minimal', label: '极简' },
  { value: 'mono', label: '黑白' },
  { value: 'slate', label: 'Slate' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'amber', label: 'Amber' },
  { value: 'rose', label: 'Rose' },
] as const;

const STICKY_NOTE_THEME_OPTIONS = [
  { value: 'minimal', label: '极简' },
  { value: 'mono', label: '黑白' },
  { value: 'amber', label: 'Amber' },
  { value: 'lime', label: 'Lime' },
  { value: 'sky', label: 'Sky' },
  { value: 'rose', label: 'Rose' },
] as const;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const NON_NEGATIVE_NUMBER_FIELDS = new Set([
  'timeoutMs',
  'waitMs',
  'maxWaitMs',
  'reconnectMs',
  'heartbeatMs',
  'maxSizeMB',
  'mobileMax',
  'tabletMax',
  'debounceMs',
  'ttlMs',
  'maxSize',
  'iterations',
  'boxWidth',
  'boxHeight',
]);

const sanitizeFieldValue = (field: string, value: string) => {
  if (NON_NEGATIVE_NUMBER_FIELDS.has(field)) {
    const digitsOnly = value.replace(/[^\d]/g, '');
    if (!digitsOnly) return '';
    const parsed = Number.parseInt(digitsOnly, 10);
    if (!Number.isFinite(parsed)) return '';
    return `${clampNumber(parsed, 0, 1_000_000)}`;
  }
  if (field === 'offset') {
    const normalized = value.replace(/[^\d-]/g, '');
    if (!normalized || normalized === '-') return '';
    const parsed = Number.parseInt(normalized, 10);
    if (!Number.isFinite(parsed)) return '';
    return `${clampNumber(parsed, -100_000, 100_000)}`;
  }
  if (field === 'speed') {
    const normalized = value.replace(/[^\d.]/g, '');
    if (!normalized) return '';
    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) return '';
    return `${clampNumber(parsed, 0, 100)}`;
  }
  return value;
};

const getMenuTreeDepth = (items: ContextMenuItem[]): number => {
  if (!items.length) return 0;
  let depth = 1;
  for (const item of items) {
    if (!item.children?.length) continue;
    depth = Math.max(depth, 1 + getMenuTreeDepth(item.children));
  }
  return depth;
};

const resolveNodeValidationMessage = (
  node: Node<GraphNodeData>,
  edgesSnapshot: Edge[]
): string | undefined => {
  const data = node.data;
  if (data.kind === 'playAnimation') {
    if (!data.targetId?.trim() || !data.timelineName?.trim()) {
      return 'targetId 和 timelineName 为必填项。';
    }
    return undefined;
  }
  if (data.kind === 'scrollTo') {
    if (data.target === 'selector' && !data.selector?.trim()) {
      return 'selector 模式下必须填写 selector。';
    }
    return undefined;
  }
  if (data.kind === 'focusControl') {
    if (!data.selector?.trim()) {
      return 'selector 为必填项。';
    }
    return undefined;
  }
  if (data.kind === 'validate') {
    const hasRulesInput = edgesSnapshot.some(
      (edge) => edge.target === node.id && edge.targetHandle === 'in.data.rules'
    );
    if (!data.schema?.trim() && !data.rules?.trim() && !hasRulesInput) {
      return '请配置 schema 或从 in.data.rules 输入规则。';
    }
    return undefined;
  }
  if (data.kind === 'envVar') {
    if (!data.key?.trim()) {
      return 'key 为必填项。';
    }
    return undefined;
  }
  return undefined;
};

const resolveGroupBoxSize = (nodeData: GraphNodeData) => ({
  width: clampNumber(
    Number.parseInt(
      `${nodeData.autoBoxWidth ?? nodeData.boxWidth ?? ''}` || '360',
      10
    ) || 360,
    160,
    2200
  ),
  height: clampNumber(
    Number.parseInt(
      `${nodeData.autoBoxHeight ?? nodeData.boxHeight ?? ''}` || '220',
      10
    ) || 220,
    120,
    1800
  ),
});

const GROUP_BOX_HEADER_HEIGHT = 34;

const GROUP_BOX_PADDING = {
  top: 16,
  right: 34,
  bottom: 24,
  left: 34,
} as const;

const resolveNodeSize = (
  node: Node<GraphNodeData>,
  sizeOverride?: { width: number; height: number }
) => {
  if (node.data.kind === 'groupBox') {
    const fallback = resolveGroupBoxSize(node.data);
    return {
      width: clampNumber(
        Math.round(sizeOverride?.width ?? node.width ?? fallback.width),
        220,
        2200
      ),
      height: clampNumber(
        Math.round(sizeOverride?.height ?? node.height ?? fallback.height),
        140,
        1800
      ),
    };
  }
  if (node.data.kind === 'stickyNote') {
    const noteContent = node.data.description ?? node.data.value ?? '';
    const estimated = estimateStickyNoteSize(noteContent);
    return {
      width: clampNumber(
        Math.round(sizeOverride?.width ?? node.width ?? estimated.width),
        24,
        1200
      ),
      height: clampNumber(
        Math.round(sizeOverride?.height ?? node.height ?? estimated.height),
        30,
        1200
      ),
    };
  }
  return {
    width: clampNumber(Math.round(node.width ?? 220), 120, 2200),
    height: clampNumber(Math.round(node.height ?? 96), 64, 1800),
  };
};

const resolveNodeBounds = (
  node: Node<GraphNodeData>,
  sizeOverride?: { width: number; height: number }
) => {
  const size = resolveNodeSize(node, sizeOverride);
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + size.width,
    bottom: node.position.y + size.height,
    ...size,
  };
};

const resolveGroupBodyBounds = (
  groupNode: Node<GraphNodeData>,
  sizeOverride?: { width: number; height: number }
) => {
  const groupSize = resolveNodeSize(groupNode, sizeOverride);
  const left = groupNode.position.x + GROUP_BOX_PADDING.left;
  const right = Math.max(
    left + 1,
    groupNode.position.x + groupSize.width - GROUP_BOX_PADDING.right
  );
  const top =
    groupNode.position.y + GROUP_BOX_HEADER_HEIGHT + GROUP_BOX_PADDING.top;
  const bottom = Math.max(
    top + 1,
    groupNode.position.y + groupSize.height - GROUP_BOX_PADDING.bottom
  );
  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
};

const isNodeCenterInsideGroupBody = (
  node: Node<GraphNodeData>,
  groupNode: Node<GraphNodeData>,
  groupSizeOverride?: { width: number; height: number }
) => {
  if (node.id === groupNode.id) return false;
  const nodeBounds = resolveNodeBounds(node);
  const bodyBounds = resolveGroupBodyBounds(groupNode, groupSizeOverride);
  const centerX = (nodeBounds.left + nodeBounds.right) / 2;
  const centerY = (nodeBounds.top + nodeBounds.bottom) / 2;
  return (
    centerX >= bodyBounds.left &&
    centerX <= bodyBounds.right &&
    centerY >= bodyBounds.top &&
    centerY <= bodyBounds.bottom
  );
};

const resolveDropTargetGroup = (
  node: Node<GraphNodeData>,
  nodesSnapshot: Node<GraphNodeData>[]
) => {
  if (node.data.kind === 'groupBox') return undefined;
  const candidates = nodesSnapshot
    .filter((item) => item.data.kind === 'groupBox' && item.id !== node.id)
    .filter((groupNode) => isNodeCenterInsideGroupBody(node, groupNode));
  if (!candidates.length) return undefined;
  return candidates.reduce((best, current) => {
    const bestArea =
      resolveGroupBodyBounds(best).width * resolveGroupBodyBounds(best).height;
    const currentArea =
      resolveGroupBodyBounds(current).width *
      resolveGroupBodyBounds(current).height;
    return currentArea < bestArea ? current : best;
  });
};

const resolveAttachedGroupBoxId = (
  node: Node<GraphNodeData>,
  nodesSnapshot: Node<GraphNodeData>[]
) => {
  if (node.data.kind === 'groupBox') return undefined;
  if (!node.data.groupBoxId) return undefined;
  return nodesSnapshot.some(
    (item) => item.data.kind === 'groupBox' && item.id === node.data.groupBoxId
  )
    ? node.data.groupBoxId
    : undefined;
};

const getDefaultHandleForNode = (
  node: Node<GraphNodeData>,
  role: PortRole,
  semantic: PortSemantic
): string | null => {
  const switchCases = normalizeCases(node.data.cases);
  const fetchStatusCodes = normalizeStatusCodes(node.data.statusCodes);
  if (role === 'in') {
    if (semantic === 'condition' && node.data.kind === 'switch') {
      if (!switchCases.length) return null;
      return `in.condition.case-${switchCases[0].id}`;
    }
    return getNodePortHandle(node.data.kind, role, semantic);
  }

  if (semantic === 'control') {
    if (node.data.kind === 'if') return 'out.control.true';
    if (node.data.kind === 'tryCatch') return 'out.control.try';
    if (node.data.kind === 'forEach') return 'out.control.body';
    if (node.data.kind === 'parallel' || node.data.kind === 'race') {
      const branches = normalizeBranches(node.data.branches);
      if (branches.length) return `out.control.branch-${branches[0].id}`;
      return 'out.control.done';
    }
    if (node.data.kind === 'switch') {
      if (!switchCases.length) return 'out.control.default';
      return `out.control.case-${switchCases[0].id}`;
    }
    if (node.data.kind === 'fetch') {
      if (fetchStatusCodes.length)
        return `out.control.status-${fetchStatusCodes[0].id}`;
      return 'out.control.error-request';
    }
    return getNodePortHandle(node.data.kind, role, semantic);
  }

  if (semantic === 'data') {
    return getNodePortHandle(node.data.kind, role, semantic);
  }

  return getNodePortHandle(node.data.kind, role, semantic);
};

const createNode = (
  kind: GraphNodeKind,
  position: { x: number; y: number }
): Node<GraphNodeData> => {
  const catalogItem = getNodeCatalogItem(kind);
  const baseData: GraphNodeData = {
    label: catalogItem.label,
    kind,
    ...catalogItem.defaults,
  };

  if (kind === 'switch') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: {
        ...baseData,
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
        ...baseData,
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
  if (kind === 'parallel' || kind === 'race') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: {
        ...baseData,
        collapsed: false,
        branches: [
          { id: createBranchId(), label: 'branch-1' },
          { id: createBranchId(), label: 'branch-2' },
        ],
      },
    };
  }
  if (kind === 'subFlowCall') {
    return {
      id: createNodeId(),
      type: 'graphNode',
      position,
      data: {
        ...baseData,
        inputBindings: [{ id: createBindingId(), key: 'payload', value: '' }],
        outputBindings: [{ id: createBindingId(), key: 'result', value: '' }],
      },
    };
  }
  return {
    id: createNodeId(),
    type: 'graphNode',
    position,
    data: baseData,
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
    const switchCases = normalizeCases(nodes[1].data.cases);
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

const createStarterGraph = (name: string): GraphDocument => {
  const nodes = createInitialNodes();
  return {
    id: createGraphId(),
    name,
    nodes,
    edges: createInitialEdges(nodes),
  };
};

const loadProjectSnapshot = (projectId: string): ProjectGraphSnapshot => {
  const fallbackGraph = createStarterGraph('Main');
  const fallback: ProjectGraphSnapshot = {
    version: 2,
    activeGraphId: fallbackGraph.id,
    graphs: [fallbackGraph],
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(createStorageKey(projectId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as
      | {
          nodes?: Node<GraphNodeData>[];
          edges?: Edge[];
        }
      | ProjectGraphSnapshot;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'graphs' in parsed &&
      Array.isArray(parsed.graphs)
    ) {
      const normalizedGraphs = parsed.graphs
        .map((graph) => ({
          id: typeof graph.id === 'string' ? graph.id : createGraphId(),
          name:
            typeof graph.name === 'string' && graph.name.trim()
              ? graph.name.trim()
              : 'Untitled',
          nodes: Array.isArray(graph.nodes)
            ? graph.nodes.map(normalizePersistedNode)
            : [],
          edges: Array.isArray(graph.edges)
            ? graph.edges.map(normalizePersistedEdge)
            : [],
        }))
        .filter((graph) => Boolean(graph.id));
      if (!normalizedGraphs.length) return fallback;
      const activeGraphId = normalizedGraphs.some(
        (graph) => graph.id === parsed.activeGraphId
      )
        ? parsed.activeGraphId
        : normalizedGraphs[0].id;
      return {
        version: 2,
        activeGraphId,
        graphs: normalizedGraphs,
      };
    }
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('nodes' in parsed) ||
      !('edges' in parsed) ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.edges)
    ) {
      return fallback;
    }
    const migratedGraph: GraphDocument = {
      id: createGraphId(),
      name: 'Main',
      nodes: parsed.nodes.map(normalizePersistedNode),
      edges: parsed.edges.map(normalizePersistedEdge),
    };
    return {
      version: 2,
      activeGraphId: migratedGraph.id,
      graphs: [migratedGraph],
    };
  } catch {
    return fallback;
  }
};

export const NodeGraphEditorContent = () => {
  const { projectId } = useParams();
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
  const reactFlow = useReactFlow<Node<GraphNodeData>, Edge>();

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

  const activeGraphName = useMemo(
    () => graphDocs.find((graph) => graph.id === activeGraphId)?.name ?? '',
    [activeGraphId, graphDocs]
  );

  const switchGraph = useCallback(
    (nextGraphId: string) => {
      const nextGraph = graphDocs.find((graph) => graph.id === nextGraphId);
      if (!nextGraph) return;
      setActiveGraphId(nextGraph.id);
      setNodes(nextGraph.nodes);
      setEdges(nextGraph.edges);
    },
    [graphDocs, setEdges, setNodes]
  );

  const createGraph = useCallback(() => {
    const existingNames = new Set(graphDocs.map((graph) => graph.name));
    let index = graphDocs.length + 1;
    let nextName = `Flow ${index}`;
    while (existingNames.has(nextName)) {
      index += 1;
      nextName = `Flow ${index}`;
    }
    const nextGraph = createStarterGraph(nextName);
    setGraphDocs((current) => [...current, nextGraph]);
    setActiveGraphId(nextGraph.id);
    setNodes(nextGraph.nodes);
    setEdges(nextGraph.edges);
  }, [graphDocs, setEdges, setNodes]);

  const duplicateGraph = useCallback(() => {
    const source = graphDocs.find((graph) => graph.id === activeGraphId);
    if (!source) return;
    const nodeIdMap = new Map<string, string>();
    const clonedNodes = source.nodes.map((node) => {
      const nextId = createNodeId();
      nodeIdMap.set(node.id, nextId);
      return { ...node, id: nextId };
    });
    const clonedEdges = source.edges.map((edge) => ({
      ...edge,
      id: `e-${createNodeId()}`,
      source: nodeIdMap.get(edge.source) ?? edge.source,
      target: nodeIdMap.get(edge.target) ?? edge.target,
    }));
    const duplicated: GraphDocument = {
      id: createGraphId(),
      name: `${source.name} Copy`,
      nodes: clonedNodes,
      edges: clonedEdges,
    };
    setGraphDocs((current) => [...current, duplicated]);
    setActiveGraphId(duplicated.id);
    setNodes(duplicated.nodes);
    setEdges(duplicated.edges);
  }, [activeGraphId, graphDocs, setEdges, setNodes]);

  const deleteGraph = useCallback(() => {
    if (graphDocs.length <= 1) {
      setHint('至少保留一个节点图。');
      return;
    }
    const currentIndex = graphDocs.findIndex(
      (graph) => graph.id === activeGraphId
    );
    if (currentIndex < 0) return;
    const nextGraphs = graphDocs.filter((graph) => graph.id !== activeGraphId);
    const nextActive =
      nextGraphs[currentIndex] ?? nextGraphs[Math.max(0, currentIndex - 1)];
    setGraphDocs(nextGraphs);
    setActiveGraphId(nextActive.id);
    setNodes(nextActive.nodes);
    setEdges(nextActive.edges);
  }, [activeGraphId, graphDocs, setEdges, setNodes]);

  const renameActiveGraph = useCallback(
    (name: string) => {
      setGraphDocs((current) =>
        current.map((graph) =>
          graph.id === activeGraphId
            ? { ...graph, name: name.trimStart().slice(0, 40) || 'Untitled' }
            : graph
        )
      );
    },
    [activeGraphId]
  );

  const groupAutoLayoutById = useMemo(() => {
    const result = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    for (const groupNode of nodes) {
      if (groupNode.data.kind !== 'groupBox') continue;
      const fallback = resolveGroupBoxSize(groupNode.data);
      const currentSize = {
        width: clampNumber(
          Math.round(groupNode.width ?? fallback.width),
          220,
          2200
        ),
        height: clampNumber(
          Math.round(groupNode.height ?? fallback.height),
          140,
          1800
        ),
      };
      const members = nodes.filter(
        (node) =>
          node.id !== groupNode.id &&
          node.data.kind !== 'groupBox' &&
          resolveAttachedGroupBoxId(node, nodes) === groupNode.id
      );
      if (!members.length) {
        result.set(groupNode.id, {
          x: groupNode.position.x,
          y: groupNode.position.y,
          ...currentSize,
        });
        continue;
      }
      const bounds = members.map((node) => resolveNodeBounds(node));
      const minLeft = Math.min(...bounds.map((item) => item.left));
      const minTop = Math.min(...bounds.map((item) => item.top));
      const maxRight = Math.max(...bounds.map((item) => item.right));
      const maxBottom = Math.max(...bounds.map((item) => item.bottom));
      const nextX = Math.round(minLeft - GROUP_BOX_PADDING.left);
      const nextY = Math.round(
        minTop - GROUP_BOX_HEADER_HEIGHT - GROUP_BOX_PADDING.top
      );
      result.set(groupNode.id, {
        x: nextX,
        y: nextY,
        width: clampNumber(
          Math.ceil(
            maxRight -
              minLeft +
              GROUP_BOX_PADDING.left +
              GROUP_BOX_PADDING.right
          ),
          220,
          2200
        ),
        height: clampNumber(
          Math.ceil(
            maxBottom -
              minTop +
              GROUP_BOX_HEADER_HEIGHT +
              GROUP_BOX_PADDING.top +
              GROUP_BOX_PADDING.bottom
          ),
          140,
          1800
        ),
      });
    }
    return result;
  }, [nodes]);

  useEffect(() => {
    const groupIds = new Set(
      nodes
        .filter((node) => node.data.kind === 'groupBox')
        .map((groupNode) => groupNode.id)
    );
    let changed = false;
    const nextNodes = nodes.map((node) => {
      if (node.data.kind === 'groupBox') return node;
      if (!node.data.groupBoxId || groupIds.has(node.data.groupBoxId))
        return node;
      changed = true;
      return {
        ...node,
        data: {
          ...node.data,
          groupBoxId: undefined,
        },
      };
    });
    if (changed) {
      setNodes(nextNodes);
    }
  }, [nodes, setNodes]);

  useEffect(() => {
    setNodes((current) => {
      let updated = false;
      const next = current.map((node) => {
        if (node.data.kind !== 'groupBox' || node.dragging) return node;
        const layout = groupAutoLayoutById.get(node.id);
        if (!layout) return node;
        if (
          Math.abs(node.position.x - layout.x) < 0.5 &&
          Math.abs(node.position.y - layout.y) < 0.5
        ) {
          return node;
        }
        updated = true;
        return {
          ...node,
          position: {
            x: layout.x,
            y: layout.y,
          },
        };
      });
      return updated ? next : current;
    });
  }, [groupAutoLayoutById, setNodes]);

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => {
        const isAnnotationNode =
          node.data.kind === 'groupBox' || node.data.kind === 'stickyNote';
        const isMinimalStickyNote =
          node.data.kind === 'stickyNote' &&
          (node.data.color ?? 'minimal') === 'minimal';
        const className = [
          node.className,
          node.data.kind === 'stickyNote' ? 'nodegraph-node-sticky-note' : '',
          isMinimalStickyNote ? 'nodegraph-node-sticky-note-minimal' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return {
          ...node,
          className: className || undefined,
          style: isAnnotationNode
            ? {
                ...(node.style ?? {}),
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
                borderRadius: 0,
              }
            : node.style,
          zIndex: node.data.kind === 'groupBox' ? -10 : 10,
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
                  const cases = normalizeCases(item.data.cases);
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
              let blocked = false;
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId || item.data.kind !== 'switch')
                    return item;
                  const cases = normalizeCases(item.data.cases);
                  if (cases.length <= 1) {
                    blocked = true;
                    return item;
                  }
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      cases: cases.filter((caseItem) => caseItem.id !== caseId),
                    },
                  };
                })
              );
              if (blocked) {
                setHint(HINT_TEXT.keepAtLeastOneCase);
                return;
              }
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
            onChangeBranchLabel: (
              nodeId: string,
              branchId: string,
              label: string
            ) => {
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId) return item;
                  if (item.data.kind === 'switch') {
                    const cases = normalizeCases(item.data.cases);
                    return {
                      ...item,
                      data: {
                        ...item.data,
                        cases: cases.map((caseItem) =>
                          caseItem.id === branchId
                            ? { ...caseItem, label }
                            : caseItem
                        ),
                      },
                    };
                  }
                  if (
                    item.data.kind !== 'parallel' &&
                    item.data.kind !== 'race'
                  )
                    return item;
                  const branches = normalizeBranches(item.data.branches);
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      branches: branches.map((branch) =>
                        branch.id === branchId ? { ...branch, label } : branch
                      ),
                    },
                  };
                })
              );
            },
            onAddBranch: (nodeId: string) => {
              setNodes((current) =>
                current.map((item) => {
                  if (
                    item.id !== nodeId ||
                    (item.data.kind !== 'parallel' && item.data.kind !== 'race')
                  ) {
                    return item;
                  }
                  const branches = normalizeBranches(item.data.branches);
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      branches: [
                        ...branches,
                        {
                          id: createBranchId(),
                          label: `branch-${branches.length + 1}`,
                        },
                      ],
                    },
                  };
                })
              );
            },
            onRemoveBranch: (nodeId: string, branchId: string) => {
              let blocked = false;
              setNodes((current) =>
                current.map((item) => {
                  if (
                    item.id !== nodeId ||
                    (item.data.kind !== 'parallel' && item.data.kind !== 'race')
                  ) {
                    return item;
                  }
                  const branches = normalizeBranches(item.data.branches);
                  if (branches.length <= 1) {
                    blocked = true;
                    return item;
                  }
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      branches: branches.filter(
                        (branch) => branch.id !== branchId
                      ),
                    },
                  };
                })
              );
              if (blocked) {
                setHint(HINT_TEXT.keepAtLeastOneBranch);
                return;
              }
              setEdges((current) =>
                current.filter(
                  (edge) =>
                    !(
                      edge.source === nodeId &&
                      edge.sourceHandle === `out.control.branch-${branchId}`
                    )
                )
              );
            },
            onAddStatusCode: (nodeId: string) => {
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId || item.data.kind !== 'fetch')
                    return item;
                  const statusCodes = normalizeStatusCodes(
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
              let blocked = false;
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId || item.data.kind !== 'fetch')
                    return item;
                  const statusCodes = normalizeStatusCodes(
                    item.data.statusCodes
                  );
                  if (statusCodes.length <= 1) {
                    blocked = true;
                    return item;
                  }
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
              if (blocked) {
                setHint(HINT_TEXT.keepAtLeastOneStatus);
                return;
              }
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
                  const statusCodes = normalizeStatusCodes(
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
            onChangeField: (nodeId: string, field: string, value: string) => {
              const nextValue = sanitizeFieldValue(field, value);
              setNodes((current) =>
                current.map((item) =>
                  item.id === nodeId
                    ? {
                        ...item,
                        data: {
                          ...item.data,
                          [field]: nextValue,
                        },
                      }
                    : item
                )
              );
            },
            onAddKeyValueEntry: (nodeId: string) => {
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId) return item;
                  const entries = Array.isArray(item.data.keyValueEntries)
                    ? item.data.keyValueEntries
                    : [];
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      keyValueEntries: [
                        ...entries,
                        {
                          id: createNodeId(),
                          key: '',
                          value: '',
                        },
                      ],
                    },
                  };
                })
              );
            },
            onRemoveKeyValueEntry: (nodeId: string, entryId: string) => {
              let blocked = false;
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId) return item;
                  const entries = Array.isArray(item.data.keyValueEntries)
                    ? item.data.keyValueEntries
                    : [];
                  const requireMinOne =
                    item.data.kind === 'setState' ||
                    item.data.kind === 'computed' ||
                    item.data.kind === 'renderComponent' ||
                    item.data.kind === 'conditionalRender' ||
                    item.data.kind === 'listRender';
                  if (requireMinOne && entries.length <= 1) {
                    blocked = true;
                    return item;
                  }
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      keyValueEntries: entries.filter(
                        (entry) => entry.id !== entryId
                      ),
                    },
                  };
                })
              );
              if (blocked) {
                setHint(HINT_TEXT.keepAtLeastOneEntry);
              }
            },
            onChangeKeyValueEntry: (
              nodeId: string,
              entryId: string,
              field: 'key' | 'value',
              value: string
            ) => {
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId) return item;
                  const entries = Array.isArray(item.data.keyValueEntries)
                    ? item.data.keyValueEntries
                    : [];
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      keyValueEntries: entries.map((entry) =>
                        entry.id === entryId
                          ? { ...entry, [field]: value }
                          : entry
                      ),
                    },
                  };
                })
              );
            },
            onAddBindingEntry: (
              nodeId: string,
              binding: 'inputBindings' | 'outputBindings'
            ) => {
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId || item.data.kind !== 'subFlowCall')
                    return item;
                  const entries = normalizeBindingEntries(item.data[binding]);
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      [binding]: [
                        ...entries,
                        {
                          id: createBindingId(),
                          key: '',
                          value: '',
                        },
                      ],
                    },
                  };
                })
              );
            },
            onRemoveBindingEntry: (
              nodeId: string,
              binding: 'inputBindings' | 'outputBindings',
              entryId: string
            ) => {
              let blocked = false;
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId || item.data.kind !== 'subFlowCall')
                    return item;
                  const entries = normalizeBindingEntries(item.data[binding]);
                  if (entries.length <= 1) {
                    blocked = true;
                    return item;
                  }
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      [binding]: entries.filter(
                        (entry) => entry.id !== entryId
                      ),
                    },
                  };
                })
              );
              if (blocked) {
                setHint(HINT_TEXT.keepAtLeastOneBinding);
              }
            },
            onChangeBindingEntry: (
              nodeId: string,
              binding: 'inputBindings' | 'outputBindings',
              entryId: string,
              field: 'key' | 'value',
              value: string
            ) => {
              setNodes((current) =>
                current.map((item) => {
                  if (item.id !== nodeId || item.data.kind !== 'subFlowCall')
                    return item;
                  const entries = normalizeBindingEntries(item.data[binding]);
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      [binding]: entries.map((entry) =>
                        entry.id === entryId
                          ? { ...entry, [field]: value }
                          : entry
                      ),
                    },
                  };
                })
              );
            },
            onToggleCollapse: (nodeId: string) => {
              setNodes((current) =>
                current.map((item) =>
                  item.id === nodeId
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
                    item.data.kind === 'boolean' ||
                    item.data.kind === 'object' ||
                    item.data.kind === 'array' ||
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
            onChangeCode: (nodeId: string, code: string) => {
              setNodes((current) =>
                current.map((item) =>
                  item.id === nodeId && item.data.kind === 'code'
                    ? {
                        ...item,
                        data: {
                          ...item.data,
                          code,
                        },
                      }
                    : item
                )
              );
            },
            onChangeCodeLanguage: (
              nodeId: string,
              language: NonNullable<GraphNodeData['codeLanguage']>
            ) => {
              setNodes((current) =>
                current.map((item) =>
                  item.id === nodeId && item.data.kind === 'code'
                    ? {
                        ...item,
                        data: {
                          ...item.data,
                          codeLanguage: language,
                        },
                      }
                    : item
                )
              );
            },
            onChangeCodeSize: (
              nodeId: string,
              size: NonNullable<GraphNodeData['codeSize']>
            ) => {
              setNodes((current) =>
                current.map((item) =>
                  item.id === nodeId && item.data.kind === 'code'
                    ? {
                        ...item,
                        data: {
                          ...item.data,
                          codeSize: size,
                        },
                      }
                    : item
                )
              );
            },
            autoBoxWidth:
              node.data.kind === 'groupBox'
                ? groupAutoLayoutById.get(node.id)?.width
                : undefined,
            autoBoxHeight:
              node.data.kind === 'groupBox'
                ? groupAutoLayoutById.get(node.id)?.height
                : undefined,
            autoNoteWidth:
              node.data.kind === 'stickyNote'
                ? estimateStickyNoteSize(
                    node.data.description ?? node.data.value ?? ''
                  ).width
                : undefined,
            autoNoteHeight:
              node.data.kind === 'stickyNote'
                ? estimateStickyNoteSize(
                    node.data.description ?? node.data.value ?? ''
                  ).height
                : undefined,
            validationMessage: resolveNodeValidationMessage(node, edges),
            hasUrlInput:
              node.data.kind === 'fetch'
                ? edges.some(
                    (edge) =>
                      edge.target === node.id &&
                      edge.targetHandle === 'in.data.url'
                  )
                : undefined,
          },
        };
      }),
    [edges, groupAutoLayoutById, nodes, setEdges, setNodes]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<GraphNodeData>>[]) => {
      setNodes((current) => {
        const previousById = new Map(
          current.map((node) => [node.id, node] as const)
        );
        let next = applyNodeChanges(changes, current);
        const pendingGroupAttach = new Map<string, string>();
        for (const change of changes) {
          if (change.type !== 'position') continue;
          const previousNode = previousById.get(change.id);
          const movedNode = next.find((node) => node.id === change.id);
          if (!previousNode || !movedNode) continue;

          if (previousNode.data.kind !== 'groupBox') {
            if (movedNode.data.kind === 'groupBox') continue;
            if ('dragging' in change && change.dragging) continue;
            const targetGroup = resolveDropTargetGroup(movedNode, next);
            if (!targetGroup) continue;
            if (movedNode.data.groupBoxId === targetGroup.id) continue;
            pendingGroupAttach.set(movedNode.id, targetGroup.id);
            continue;
          }

          const previousGroup = previousById.get(change.id);
          if (!previousGroup || previousGroup.data.kind !== 'groupBox')
            continue;
          const movedGroup = movedNode;
          if (!movedGroup) continue;
          const deltaX = movedGroup.position.x - previousGroup.position.x;
          const deltaY = movedGroup.position.y - previousGroup.position.y;
          if (!deltaX && !deltaY) continue;
          next = next.map((node) => {
            if (node.id === movedGroup.id || node.data.kind === 'groupBox')
              return node;
            const groupedByData = node.data.groupBoxId === movedGroup.id;
            if (!groupedByData) return node;
            return {
              ...node,
              position: {
                x: node.position.x + deltaX,
                y: node.position.y + deltaY,
              },
            };
          });
        }
        for (const [nodeId, targetGroupId] of pendingGroupAttach) {
          const node = next.find((item) => item.id === nodeId);
          const targetGroup = next.find((item) => item.id === targetGroupId);
          if (!node || !targetGroup || node.data.kind === 'groupBox') continue;
          const groupLabel =
            targetGroup.data.value?.trim() || targetGroup.data.label;
          const shouldAttach =
            typeof window !== 'undefined'
              ? window.confirm(`将节点加入 "${groupLabel}" 吗？`)
              : false;
          if (!shouldAttach) continue;
          next = next.map((item) =>
            item.id === nodeId
              ? {
                  ...item,
                  data: {
                    ...item.data,
                    groupBoxId: targetGroupId,
                  },
                }
              : item
          );
        }
        return next;
      });
    },
    [setNodes]
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const portMenuGroups = useMemo(() => {
    if (!menu || menu.kind !== 'port') return NODE_MENU_GROUPS;
    const normalizedHandleId = normalizeHandleId(menu.handleId);
    const handleInfo = parseHandleInfo(normalizedHandleId);
    if (!handleInfo) return [];
    const requiredRole: PortRole = menu.role === 'source' ? 'in' : 'out';
    return NODE_MENU_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        supportsPortSemantic(item.kind, requiredRole, handleInfo.semantic)
      ),
    })).filter((group) => group.items.length > 0);
  }, [menu]);

  const isValidConnection = useCallback(
    (connection: Connection) =>
      validateConnectionWithState(connection, nodes, edges).valid,
    [edges, nodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const normalizedConnection = {
        ...connection,
        sourceHandle: normalizeHandleId(connection.sourceHandle) ?? undefined,
        targetHandle: normalizeHandleId(connection.targetHandle) ?? undefined,
      };
      const validation = validateConnectionWithState(
        normalizedConnection,
        nodes,
        edges
      );
      if (!validation.valid) {
        const reason =
          'reason' in validation ? validation.reason : 'invalid-handle';
        setHint(CONNECTION_HINT_BY_REASON[reason]);
        return;
      }
      setEdges((current) =>
        addEdge({ ...normalizedConnection, type: 'smoothstep' }, current)
      );
    },
    [edges, nodes, setEdges]
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

  const createNodeFromGroupBox = useCallback(
    (kind: GraphNodeKind) => {
      if (!menu || menu.kind !== 'node') return;
      const groupNode = nodes.find(
        (node) => node.id === menu.nodeId && node.data.kind === 'groupBox'
      );
      if (!groupNode) return;
      const groupLayout = groupAutoLayoutById.get(groupNode.id) ?? {
        width: resolveGroupBoxSize(groupNode.data).width,
        height: resolveGroupBoxSize(groupNode.data).height,
      };
      const groupBodyBounds = resolveGroupBodyBounds(groupNode, groupLayout);
      const draftNode = createNode(kind, {
        x: menu.flowX,
        y: menu.flowY,
      });
      const draftSize = resolveNodeSize(draftNode);
      const x = clampNumber(
        menu.flowX,
        groupBodyBounds.left + 8,
        Math.max(
          groupBodyBounds.left + 8,
          groupBodyBounds.right - draftSize.width
        )
      );
      const y = clampNumber(
        menu.flowY,
        groupBodyBounds.top + 8,
        Math.max(
          groupBodyBounds.top + 8,
          groupBodyBounds.bottom - draftSize.height
        )
      );
      const createdNode = createNode(kind, { x, y });
      if (createdNode.data.kind !== 'groupBox') {
        createdNode.data.groupBoxId = groupNode.id;
      }
      setNodes((current) => [...current, createdNode]);
      closeMenu();
    },
    [closeMenu, groupAutoLayoutById, menu, nodes, setNodes]
  );

  const updateNodeColorTheme = useCallback(
    (nodeId: string, color: string) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  color,
                },
              }
            : node
        )
      );
      closeMenu();
    },
    [closeMenu, setNodes]
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

  const detachNodeFromBox = useCallback(() => {
    if (!menu || menu.kind !== 'node') return;
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== menu.nodeId || node.data.kind === 'groupBox')
          return node;
        if (!node.data.groupBoxId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            groupBoxId: undefined,
          },
        };
      })
    );
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
      const normalizedHandleId = normalizeHandleId(menu.handleId);
      const handleInfo = parseHandleInfo(normalizedHandleId);
      if (!handleInfo) {
        setHint(HINT_TEXT.invalidPortHandle);
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
        const sourceHandleId = normalizedHandleId;
        if (menu.role === 'source') {
          const targetHandle = getDefaultHandleForNode(
            newNode,
            'in',
            handleInfo.semantic
          );
          if (!targetHandle || !sourceHandleId) {
            setHint(HINT_TEXT.noMatchingInput);
            return next;
          }
          const connection = {
            source: menu.nodeId,
            sourceHandle: sourceHandleId,
            target: newNode.id,
            targetHandle,
          };
          const validation = validateConnectionWithState(
            connection,
            [...nodes, newNode],
            current
          );
          if (!validation.valid) {
            const reason =
              'reason' in validation ? validation.reason : 'invalid-handle';
            setHint(CONNECTION_HINT_BY_REASON[reason]);
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
            setHint(HINT_TEXT.noMatchingOutput);
            return next;
          }
          const connection = {
            source: newNode.id,
            sourceHandle,
            target: menu.nodeId,
            targetHandle: sourceHandleId,
          };
          const validation = validateConnectionWithState(
            connection,
            [...nodes, newNode],
            current
          );
          if (!validation.valid) {
            const reason =
              'reason' in validation ? validation.reason : 'invalid-handle';
            setHint(CONNECTION_HINT_BY_REASON[reason]);
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
    [closeMenu, menu, nodes, setEdges, setNodes]
  );

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu) return [];

    if (menu.kind === 'canvas') {
      return [
        {
          id: 'canvas-create-node',
          label: '新建节点',
          icon: '＋',
          children: NODE_MENU_GROUPS.map((group) => ({
            id: `canvas-group-${group.id}`,
            label: group.label,
            children: group.items.map((item) => ({
              id: `canvas-node-${group.id}-${item.kind}`,
              label: item.label,
              icon: item.icon,
              onSelect: () => createNodeFromCanvas(item.kind),
            })),
          })),
        },
      ];
    }

    if (menu.kind === 'node') {
      const targetNode = nodes.find((node) => node.id === menu.nodeId);
      const isGroupBoxTarget = targetNode?.data.kind === 'groupBox';
      const isStickyNoteTarget = targetNode?.data.kind === 'stickyNote';
      const attachedGroupId =
        targetNode && targetNode.data.kind !== 'groupBox'
          ? resolveAttachedGroupBoxId(targetNode, nodes)
          : undefined;
      const canCreateInGroup = Boolean(isGroupBoxTarget);
      const groupedMenuItems = canCreateInGroup
        ? NODE_MENU_GROUPS.map((group) => ({
            id: `group-node-${group.id}`,
            label: group.label,
            children: group.items
              .filter((item) => item.kind !== 'groupBox')
              .map((item) => ({
                id: `group-node-${group.id}-${item.kind}`,
                label: item.label,
                icon: item.icon,
                onSelect: () => createNodeFromGroupBox(item.kind),
              })),
          })).filter((group) => group.children.length > 0)
        : [];
      const themeOptions = isGroupBoxTarget
        ? GROUP_BOX_THEME_OPTIONS
        : isStickyNoteTarget
          ? STICKY_NOTE_THEME_OPTIONS
          : [];
      return [
        ...(canCreateInGroup
          ? [
              {
                id: 'group-create-node',
                label: '在 Box 内新建',
                icon: '＋',
                children: groupedMenuItems,
              } satisfies ContextMenuItem,
            ]
          : []),
        ...(targetNode && themeOptions.length
          ? [
              {
                id: 'node-theme',
                label: '主题',
                icon: '◐',
                children: themeOptions.map((item) => ({
                  id: `node-theme-${item.value}`,
                  label: item.label,
                  onSelect: () =>
                    updateNodeColorTheme(targetNode.id, item.value),
                })),
              } satisfies ContextMenuItem,
            ]
          : []),
        {
          id: 'node-duplicate',
          label: '复制节点',
          icon: '⧉',
          onSelect: duplicateNode,
        },
        ...(attachedGroupId
          ? [
              {
                id: 'node-detach-box',
                label: '脱离 box',
                icon: '⤴',
                onSelect: detachNodeFromBox,
              } satisfies ContextMenuItem,
            ]
          : []),
        {
          id: 'node-delete',
          label: '删除节点',
          icon: '×',
          tone: 'danger',
          onSelect: deleteNode,
        },
      ];
    }

    return [
      {
        id: 'port-disconnect',
        label: '断开连接',
        icon: '⨯',
        onSelect: disconnectPort,
      },
      {
        id: 'port-create-connect',
        label: '新建并连接',
        icon: '＋',
        children: portMenuGroups.map((group) => ({
          id: `port-group-${group.id}`,
          label: group.label,
          children: group.items.map((item) => ({
            id: `port-node-${group.id}-${item.kind}`,
            label: item.label,
            icon: item.icon,
            onSelect: () => createNodeFromPort(item.kind),
          })),
        })),
      },
    ];
  }, [
    createNodeFromCanvas,
    createNodeFromGroupBox,
    createNodeFromPort,
    deleteNode,
    detachNodeFromBox,
    disconnectPort,
    duplicateNode,
    menu,
    nodes,
    portMenuGroups,
    updateNodeColorTheme,
  ]);

  const menuColumns = useMemo(() => {
    if (!menuItems.length) return [] as ContextMenuItem[][];
    const columns: ContextMenuItem[][] = [menuItems];
    let levelItems = menuItems;
    let levelIndex = 0;
    while (true) {
      const selectedIndex = menuPath[levelIndex];
      if (typeof selectedIndex !== 'number') break;
      const selectedItem = levelItems[selectedIndex];
      if (!selectedItem?.children?.length) break;
      columns.push(selectedItem.children);
      levelItems = selectedItem.children;
      levelIndex += 1;
    }
    return columns;
  }, [menuItems, menuPath]);

  const menuMaxDepth = useMemo(() => getMenuTreeDepth(menuItems), [menuItems]);

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

  const menuLayout = useMemo(() => {
    if (!menu || !menuColumns.length) return null;
    if (typeof window === 'undefined') {
      return {
        top: menu.y,
        lefts: menuColumns.map((_, index) => menu.x + index * 224),
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minLeft = MENU_VIEWPORT_PADDING;
    const maxLeft = Math.max(
      MENU_VIEWPORT_PADDING,
      viewportWidth - MENU_COLUMN_WIDTH - MENU_VIEWPORT_PADDING
    );
    const rootLeft = clampNumber(menu.x, minLeft, maxLeft);
    const maxSpan =
      (Math.max(1, menuMaxDepth) - 1) * (MENU_COLUMN_WIDTH + MENU_COLUMN_GAP);
    const canOpenRight =
      rootLeft + maxSpan + MENU_COLUMN_WIDTH <=
      viewportWidth - MENU_VIEWPORT_PADDING;
    const canOpenLeft = rootLeft - maxSpan >= MENU_VIEWPORT_PADDING;
    const direction = canOpenRight || !canOpenLeft ? 1 : -1;
    const top = clampNumber(
      menu.y,
      MENU_VIEWPORT_PADDING,
      Math.max(MENU_VIEWPORT_PADDING, viewportHeight - 120)
    );

    return {
      top,
      lefts: menuColumns.map((_, level) =>
        clampNumber(
          rootLeft + direction * level * (MENU_COLUMN_WIDTH + MENU_COLUMN_GAP),
          minLeft,
          maxLeft
        )
      ),
    };
  }, [menu, menuColumns, menuMaxDepth]);

  return (
    <div className="nodegraph-native-root" onClick={closeMenu}>
      <div
        className="nodegraph-graph-manager nodrag nopan"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nodegraph-graph-manager__title">Node Graphs</div>
        <select
          className="nodegraph-graph-manager__select"
          value={activeGraphId}
          onChange={(event) => switchGraph(event.target.value)}
        >
          {graphDocs.map((graph) => (
            <option key={graph.id} value={graph.id}>
              {graph.name}
            </option>
          ))}
        </select>
        <input
          className="nodegraph-graph-manager__name"
          value={activeGraphName}
          onChange={(event) => renameActiveGraph(event.target.value)}
          placeholder="Graph name"
          spellCheck={false}
        />
        <div className="nodegraph-graph-manager__actions">
          <button type="button" onClick={createGraph}>
            New
          </button>
          <button type="button" onClick={duplicateGraph}>
            Clone
          </button>
          <button type="button" onClick={deleteGraph}>
            Delete
          </button>
        </div>
      </div>
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
            setHint(HINT_TEXT.invalidConnectEnd);
          }
        }}
      >
        <Background gap={20} size={1} />
        <MiniMap pannable zoomable />
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
      {hint ? <div className="nodegraph-native-hint">{hint}</div> : null}

      {menu
        ? menuColumns.map((items, level) => (
            <div
              key={`menu-column-${level}`}
              className="native-context-menu"
              style={{
                left:
                  menuLayout?.lefts[level] ??
                  menu.x + level * (MENU_COLUMN_WIDTH + MENU_COLUMN_GAP),
                top: menuLayout?.top ?? menu.y,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.tone === 'danger' ? 'is-danger' : undefined}
                  onMouseEnter={() =>
                    onMenuItemEnter(
                      level,
                      index,
                      Boolean(item.children?.length)
                    )
                  }
                  onClick={() => {
                    if (item.children?.length) {
                      onMenuItemEnter(level, index, true);
                      return;
                    }
                    item.onSelect?.();
                  }}
                >
                  <span>{item.icon ?? ''}</span>
                  <span>{item.label}</span>
                  <span className="native-context-menu__arrow">
                    {item.children?.length ? '›' : ''}
                  </span>
                </button>
              ))}
            </div>
          ))
        : null}
    </div>
  );
};
