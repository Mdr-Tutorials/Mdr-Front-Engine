import { create } from 'zustand';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { Edge, Node } from '@xyflow/react';
import type { GraphNodeData } from './GraphNode';
import type {
  ContextMenuState,
  NodeValidationText,
} from './nodeGraphEditorModel';

export type FlowNodesHintText = {
  keepAtLeastOneBinding: string;
  keepAtLeastOneBranch: string;
  keepAtLeastOneCase: string;
  keepAtLeastOneEntry: string;
  keepAtLeastOneStatus: string;
};

export type NodeGraphRenderRuntime = {
  edges: Edge[];
  groupAutoLayoutById: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  hintText: FlowNodesHintText;
  nodesById: Map<string, Node<GraphNodeData>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setHint: Dispatch<SetStateAction<string | null>>;
  setMenu: Dispatch<SetStateAction<ContextMenuState>>;
  setNodes: Dispatch<SetStateAction<Node<GraphNodeData>[]>>;
  validationText: NodeValidationText;
};

type NodeGraphRenderStoreState = NodeGraphRenderRuntime & {
  setRuntime: (runtime: NodeGraphRenderRuntime) => void;
};

const noop = () => undefined;
const emptyMap = new Map();

export const useNodeGraphRenderStore = create<NodeGraphRenderStoreState>(
  (set) => ({
    edges: [],
    groupAutoLayoutById: emptyMap,
    hintText: {
      keepAtLeastOneBinding: '',
      keepAtLeastOneBranch: '',
      keepAtLeastOneCase: '',
      keepAtLeastOneEntry: '',
      keepAtLeastOneStatus: '',
    },
    nodesById: emptyMap,
    setEdges: noop as Dispatch<SetStateAction<Edge[]>>,
    setHint: noop as Dispatch<SetStateAction<string | null>>,
    setMenu: noop as Dispatch<SetStateAction<ContextMenuState>>,
    setNodes: noop as Dispatch<SetStateAction<Node<GraphNodeData>[]>>,
    validationText: {
      envVarKeyRequired: '',
      focusControlSelectorRequired: '',
      playAnimationRequired: '',
      scrollToSelectorRequired: '',
      validateSchemaOrRulesRequired: '',
    },
    setRuntime: (runtime) =>
      set((current) => {
        if (
          current.edges === runtime.edges &&
          current.groupAutoLayoutById === runtime.groupAutoLayoutById &&
          current.hintText === runtime.hintText &&
          current.nodesById === runtime.nodesById &&
          current.setEdges === runtime.setEdges &&
          current.setHint === runtime.setHint &&
          current.setMenu === runtime.setMenu &&
          current.setNodes === runtime.setNodes &&
          current.validationText === runtime.validationText
        ) {
          return current;
        }
        return runtime;
      }),
  })
);

export type PortContextMenuHandler = (
  event: MouseEvent,
  nodeId: string,
  handleId: string,
  role: 'source' | 'target'
) => void;
