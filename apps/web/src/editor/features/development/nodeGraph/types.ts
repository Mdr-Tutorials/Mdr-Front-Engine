import type {
  NodeCanvasPortAnchor,
  NodeCanvasRect,
  NodeGraphModel,
} from '../node';

export type GraphMeta = {
  id: string;
  name: string;
};

export type GraphWorkspaceSnapshot = {
  activeGraphId: string;
  graphs: GraphMeta[];
  documents: Record<string, NodeGraphModel>;
};

export type NodeRenderCache = {
  rectByNodeId: Record<string, NodeCanvasRect>;
  anchorByNodePort: Record<string, NodeCanvasPortAnchor>;
};

export type GraphContextMenuState =
  | {
      kind: 'canvas';
      x: number;
      y: number;
      worldX: number;
      worldY: number;
    }
  | {
      kind: 'node';
      nodeId: string;
      x: number;
      y: number;
    }
  | {
      kind: 'edge';
      edgeId: string;
      x: number;
      y: number;
    }
  | {
      kind: 'port';
      nodeId: string;
      portId: string;
      role: 'in' | 'out';
      x: number;
      y: number;
    }
  | null;
