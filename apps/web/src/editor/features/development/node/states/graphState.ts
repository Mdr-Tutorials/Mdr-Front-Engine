import { resolveNodeDefaultPorts } from '../canvas/renderer';
import type {
  NodeGraphEdge,
  NodeGraphEdgeKind,
  NodeGraphModel,
  NodeGraphNode,
  NodeGraphNodeType,
  NodeGraphPort,
  NodeGraphPortKind,
  NodeGraphPortMultiplicity,
  NodeGraphPortRole,
  NodeGraphPortShape,
  NodeGraphPosition,
} from '../types';

const PORT_KIND_SET = new Set<NodeGraphPortKind>([
  'control',
  'condition',
  'data',
]);
const PORT_MULTIPLICITY_SET = new Set<NodeGraphPortMultiplicity>([
  'single',
  'multi',
]);
const PORT_SHAPE_SET = new Set<NodeGraphPortShape>([
  'circle',
  'diamond',
  'square',
  'triangle',
  'hexagon',
]);

const createEntityId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPortKind = (value: unknown): value is NodeGraphPortKind =>
  typeof value === 'string' && PORT_KIND_SET.has(value as NodeGraphPortKind);

const isPortMultiplicity = (
  value: unknown
): value is NodeGraphPortMultiplicity =>
  typeof value === 'string' &&
  PORT_MULTIPLICITY_SET.has(value as NodeGraphPortMultiplicity);

const isPortShape = (value: unknown): value is NodeGraphPortShape =>
  typeof value === 'string' && PORT_SHAPE_SET.has(value as NodeGraphPortShape);

const normalizeAcceptKinds = (
  value: unknown,
  fallback?: NodeGraphPortKind[]
) => {
  if (!Array.isArray(value)) {
    return fallback?.length ? [...fallback] : undefined;
  }
  const kinds = value.filter(isPortKind);
  if (!kinds.length) return undefined;
  return Array.from(new Set(kinds));
};

const clonePort = (port: NodeGraphPort): NodeGraphPort => ({
  ...port,
  acceptsKinds: port.acceptsKinds ? [...port.acceptsKinds] : undefined,
});

const clonePorts = (ports: NodeGraphPort[]) => ports.map(clonePort);

const resolveNodePorts = (node: NodeGraphNode): NodeGraphPort[] =>
  node.ports?.length ? node.ports : resolveNodeDefaultPorts(node.type);

const findPortById = (
  node: NodeGraphNode,
  portId: string
): NodeGraphPort | null =>
  resolveNodePorts(node).find((port) => port.id === portId) ?? null;

const findNodePortByRole = (
  node: NodeGraphNode,
  role: NodeGraphPortRole
): NodeGraphPort | null =>
  resolveNodePorts(node).find((port) => port.role === role) ?? null;

const resolvePortMultiplicity = (
  port: NodeGraphPort
): NodeGraphPortMultiplicity =>
  port.multiplicity === 'multi' ? 'multi' : 'single';

const canTargetAcceptKind = (
  sourceKind: NodeGraphPortKind,
  targetPort: NodeGraphPort
) => {
  const acceptedKinds = normalizeAcceptKinds(targetPort.acceptsKinds);
  if (acceptedKinds?.length) return acceptedKinds.includes(sourceKind);
  return targetPort.kind === sourceKind;
};

const isConnectionCompatible = (
  sourcePort: NodeGraphPort,
  targetPort: NodeGraphPort
) =>
  sourcePort.role === 'out' &&
  targetPort.role === 'in' &&
  canTargetAcceptKind(sourcePort.kind, targetPort);

const sortPorts = (ports: NodeGraphPort[]) =>
  [...ports].sort((left, right) => {
    if (left.slotOrder !== right.slotOrder)
      return left.slotOrder - right.slotOrder;
    return left.id.localeCompare(right.id);
  });

const normalizeNodePorts = (
  nodeType: NodeGraphNodeType,
  rawPorts: unknown
): NodeGraphPort[] => {
  const defaults = resolveNodeDefaultPorts(nodeType);
  const templateById = new Map(defaults.map((port) => [port.id, port]));
  if (!Array.isArray(rawPorts) || !rawPorts.length) {
    return clonePorts(defaults);
  }

  const normalized = rawPorts.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.id !== 'string') return [];
    const template = templateById.get(candidate.id);

    const role =
      candidate.role === 'in' || candidate.role === 'out'
        ? candidate.role
        : template?.role;
    const side =
      candidate.side === 'left' || candidate.side === 'right'
        ? candidate.side
        : template?.side;
    if (!role || !side) return [];

    const slotOrder = isFiniteNumber(candidate.slotOrder)
      ? candidate.slotOrder
      : (template?.slotOrder ?? 0);
    const kind = isPortKind(candidate.kind)
      ? candidate.kind
      : (template?.kind ?? 'control');
    const multiplicity = isPortMultiplicity(candidate.multiplicity)
      ? candidate.multiplicity
      : (template?.multiplicity ?? 'single');
    const acceptsKinds = normalizeAcceptKinds(
      candidate.acceptsKinds,
      template?.acceptsKinds
    );
    const shape = isPortShape(candidate.shape)
      ? candidate.shape
      : template?.shape;

    return [
      {
        id: candidate.id,
        role,
        side,
        slotOrder,
        kind,
        multiplicity,
        acceptsKinds,
        shape,
      },
    ];
  });

  if (!normalized.length) return clonePorts(defaults);
  return sortPorts(normalized);
};

const createNodeGraphEdge = (
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string,
  kind: NodeGraphEdgeKind,
  edgeId?: string,
  metadata?: Record<string, unknown>
): NodeGraphEdge => ({
  id: edgeId ?? createEntityId('edge'),
  kind,
  sourceNodeId,
  sourcePortId,
  targetNodeId,
  targetPortId,
  metadata: metadata ? { ...metadata } : {},
});

export const createNodeGraphNode = (
  type: NodeGraphNodeType,
  position: NodeGraphPosition,
  title?: string
): NodeGraphNode => ({
  id: createEntityId('node'),
  type,
  position,
  title,
  ports: clonePorts(resolveNodeDefaultPorts(type)),
  config: {},
  metadata: {},
});

export const createDefaultNodeGraphModel = (): NodeGraphModel => {
  const startNode = createNodeGraphNode('start', { x: 160, y: 220 }, 'Start');
  const endNode = createNodeGraphNode('end', { x: 520, y: 220 }, 'End');
  const startPort = findNodePortByRole(startNode, 'out');
  const endPort = findNodePortByRole(endNode, 'in');
  return {
    version: '1',
    nodes: [startNode, endNode],
    edges:
      startPort && endPort
        ? [
            createNodeGraphEdge(
              startNode.id,
              startPort.id,
              endNode.id,
              endPort.id,
              startPort.kind
            ),
          ]
        : [],
  };
};

export const normalizeNodeGraphModel = (value: unknown): NodeGraphModel => {
  if (!isRecord(value)) {
    return createDefaultNodeGraphModel();
  }

  const input = value as Partial<NodeGraphModel>;
  const nodes = Array.isArray(input.nodes)
    ? input.nodes.flatMap((candidate) => {
        if (!isRecord(candidate)) return [];
        const position = candidate.position;
        if (
          typeof candidate.id !== 'string' ||
          typeof candidate.type !== 'string' ||
          !isRecord(position) ||
          !isFiniteNumber(position.x) ||
          !isFiniteNumber(position.y)
        ) {
          return [];
        }

        const size = isRecord(candidate.size)
          ? {
              width: isFiniteNumber(candidate.size.width)
                ? candidate.size.width
                : undefined,
              height: isFiniteNumber(candidate.size.height)
                ? candidate.size.height
                : undefined,
            }
          : null;

        return [
          {
            id: candidate.id,
            type: candidate.type,
            position: {
              x: position.x,
              y: position.y,
            },
            title:
              typeof candidate.title === 'string' ? candidate.title : undefined,
            size:
              size && isFiniteNumber(size.width) && isFiniteNumber(size.height)
                ? { width: size.width, height: size.height }
                : undefined,
            config: isRecord(candidate.config) ? { ...candidate.config } : {},
            ports: normalizeNodePorts(candidate.type, candidate.ports),
            metadata: isRecord(candidate.metadata)
              ? { ...candidate.metadata }
              : {},
          } satisfies NodeGraphNode,
        ];
      })
    : [];

  if (!nodes.length) {
    return createDefaultNodeGraphModel();
  }

  let normalized: NodeGraphModel = {
    version: '1',
    nodes,
    edges: [],
  };

  if (Array.isArray(input.edges)) {
    input.edges.forEach((candidate) => {
      if (
        !isRecord(candidate) ||
        typeof candidate.id !== 'string' ||
        typeof candidate.sourceNodeId !== 'string' ||
        typeof candidate.sourcePortId !== 'string' ||
        typeof candidate.targetNodeId !== 'string' ||
        typeof candidate.targetPortId !== 'string'
      ) {
        return;
      }

      normalized = upsertEdge(
        normalized,
        candidate.sourceNodeId,
        candidate.sourcePortId,
        candidate.targetNodeId,
        candidate.targetPortId,
        candidate.id,
        isRecord(candidate.metadata) ? candidate.metadata : undefined
      );
    });
  }

  return normalized;
};

export const findNodeById = (model: NodeGraphModel, nodeId: string) =>
  model.nodes.find((node) => node.id === nodeId) ?? null;

export const findPortByRole = (
  node: NodeGraphNode,
  role: NodeGraphPortRole
): NodeGraphPort | null => findNodePortByRole(node, role);

export const upsertEdge = (
  model: NodeGraphModel,
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string,
  edgeId?: string,
  metadata?: Record<string, unknown>
): NodeGraphModel => {
  const sourceNode = findNodeById(model, sourceNodeId);
  const targetNode = findNodeById(model, targetNodeId);
  if (!sourceNode || !targetNode) return model;

  const sourcePort = findPortById(sourceNode, sourcePortId);
  const targetPort = findPortById(targetNode, targetPortId);
  if (!sourcePort || !targetPort) return model;
  if (!isConnectionCompatible(sourcePort, targetPort)) return model;

  const nextEdgeId = edgeId ?? createEntityId('edge');
  const previousEdge = model.edges.find((edge) => edge.id === nextEdgeId);
  let nextEdges = model.edges.filter((edge) => edge.id !== nextEdgeId);

  if (resolvePortMultiplicity(sourcePort) === 'single') {
    nextEdges = nextEdges.filter(
      (edge) =>
        edge.sourceNodeId !== sourceNodeId || edge.sourcePortId !== sourcePortId
    );
  }

  if (resolvePortMultiplicity(targetPort) === 'single') {
    nextEdges = nextEdges.filter(
      (edge) =>
        edge.targetNodeId !== targetNodeId || edge.targetPortId !== targetPortId
    );
  }

  nextEdges = nextEdges.filter(
    (edge) =>
      edge.sourceNodeId !== sourceNodeId ||
      edge.sourcePortId !== sourcePortId ||
      edge.targetNodeId !== targetNodeId ||
      edge.targetPortId !== targetPortId
  );

  const nextMetadata = metadata
    ? { ...metadata }
    : isRecord(previousEdge?.metadata)
      ? { ...previousEdge.metadata }
      : {};

  return {
    ...model,
    edges: [
      ...nextEdges,
      createNodeGraphEdge(
        sourceNodeId,
        sourcePortId,
        targetNodeId,
        targetPortId,
        sourcePort.kind,
        nextEdgeId,
        nextMetadata
      ),
    ],
  };
};

export const removeEdgeById = (
  model: NodeGraphModel,
  edgeId: string
): NodeGraphModel => ({
  ...model,
  edges: model.edges.filter((edge) => edge.id !== edgeId),
});

export const addNodeAndConnectNext = (
  model: NodeGraphModel,
  options: {
    sourceNodeId: string;
    sourcePortId?: string;
    nodeType: NodeGraphNodeType;
    position: NodeGraphPosition;
    title?: string;
  }
): NodeGraphModel => {
  const sourceNode = findNodeById(model, options.sourceNodeId);
  if (!sourceNode) return model;

  const sourcePort =
    options.sourcePortId && findPortById(sourceNode, options.sourcePortId)
      ? options.sourcePortId
      : findNodePortByRole(sourceNode, 'out')?.id;

  if (!sourcePort) return model;

  const newNode = createNodeGraphNode(
    options.nodeType,
    options.position,
    options.title
  );
  const targetPort = findNodePortByRole(newNode, 'in');
  if (!targetPort) return model;

  const nextModel: NodeGraphModel = {
    ...model,
    nodes: [...model.nodes, newNode],
  };
  return upsertEdge(
    nextModel,
    sourceNode.id,
    sourcePort,
    newNode.id,
    targetPort.id
  );
};
