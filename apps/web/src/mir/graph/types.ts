import type {
  ComponentNode,
  ComponentNodeData,
  MIRDocument,
  NodeId,
  UiGraph,
} from '@/core/types/engine.types';

export type { ComponentNode, ComponentNodeData, MIRDocument, NodeId, UiGraph };

export type GraphParentRef = {
  parentId: NodeId;
  regionName?: string;
  index: number;
};

export type GraphMutationResult = {
  graph: UiGraph;
  changed: boolean;
};
