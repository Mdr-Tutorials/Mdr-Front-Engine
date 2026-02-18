/**
 * NodeGraph 控制流图数据契约（P0-01）。
 * 执行链路：NodeGraph model -> renderer/interaction -> runtime state patch。
 */
export type NodeGraphNodeType =
  | 'start'
  | 'end'
  | 'if-else'
  | 'switch'
  | 'for-each'
  | 'while'
  | 'break'
  | 'continue'
  | 'merge'
  | 'parallel-fork'
  | 'join'
  | (string & {});

export type NodeGraphPortRole = 'in' | 'out';
export type NodeGraphPortSide = 'left' | 'right';
export type NodeGraphPortKind = 'control' | 'condition' | 'data';
export type NodeGraphPortShape =
  | 'circle'
  | 'diamond'
  | 'square'
  | 'triangle'
  | 'hexagon';
export type NodeGraphPortMultiplicity = 'single' | 'multi';
export type NodeGraphEdgeKind = NodeGraphPortKind;

export type NodeGraphPosition = {
  x: number;
  y: number;
};

export type NodeGraphSize = {
  width: number;
  height: number;
};

export type NodeGraphPort = {
  id: string;
  role: NodeGraphPortRole;
  side: NodeGraphPortSide;
  slotOrder: number;
  kind: NodeGraphPortKind;
  multiplicity?: NodeGraphPortMultiplicity;
  acceptsKinds?: NodeGraphPortKind[];
  shape?: NodeGraphPortShape;
};

export type NodeGraphNode = {
  id: string;
  type: NodeGraphNodeType;
  position: NodeGraphPosition;
  size?: NodeGraphSize;
  title?: string;
  config?: Record<string, unknown>;
  ports?: NodeGraphPort[];
  metadata?: Record<string, unknown>;
};

export type NodeGraphEdge = {
  id: string;
  kind: NodeGraphEdgeKind;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  metadata?: Record<string, unknown>;
};

export type NodeGraphModel = {
  version: '1';
  nodes: NodeGraphNode[];
  edges: NodeGraphEdge[];
};

export type NodeGraphModelDraft = Partial<Omit<NodeGraphModel, 'version'>> & {
  version?: NodeGraphModel['version'];
};
