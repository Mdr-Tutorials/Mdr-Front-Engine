import type { NodeCanvasPoint } from '../canvas/renderer';

export type NodeGraphInteractionMode =
  | 'idle'
  | 'pan'
  | 'select'
  | 'connect'
  | 'reconnect';

export type NodeGraphHitTarget =
  | { type: 'canvas' }
  | { type: 'node'; nodeId: string; area?: 'header' | 'body' }
  | {
      type: 'port';
      nodeId: string;
      portId: string;
      role: 'in' | 'out';
    }
  | {
      type: 'edge';
      edgeId: string;
      handle: 'source' | 'target';
      nodeId: string;
      portId: string;
      role: 'in' | 'out';
    };

export type NodeGraphConnectionDraft = {
  edgeId?: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId?: string;
  targetPortId?: string;
  cursor: NodeCanvasPoint;
  pointerId: number;
};

export type NodeGraphInteractionState = {
  mode: NodeGraphInteractionMode;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  panPointerId: number | null;
  panLastPoint: NodeCanvasPoint | null;
  connectionDraft: NodeGraphConnectionDraft | null;
};

export type NodeGraphInteractionAction =
  | { type: 'select.node'; nodeId: string }
  | { type: 'select.edge'; edgeId: string }
  | {
      type: 'edge.create';
      sourceNodeId: string;
      sourcePortId: string;
      targetNodeId: string;
      targetPortId: string;
    }
  | {
      type: 'edge.reconnect';
      edgeId: string;
      sourceNodeId: string;
      sourcePortId: string;
      targetNodeId: string;
      targetPortId: string;
    }
  | {
      type: 'pan.delta';
      deltaX: number;
      deltaY: number;
    }
  | { type: 'clear.selection' };

export type NodeGraphInteractionEvent =
  | {
      type: 'pointer.down';
      pointerId: number;
      point: NodeCanvasPoint;
      target: NodeGraphHitTarget;
    }
  | {
      type: 'pointer.move';
      pointerId: number;
      point: NodeCanvasPoint;
    }
  | {
      type: 'pointer.up';
      pointerId: number;
      point: NodeCanvasPoint;
      target: NodeGraphHitTarget;
    }
  | { type: 'pointer.cancel'; pointerId: number }
  | { type: 'escape' };

export type NodeGraphInteractionResult = {
  state: NodeGraphInteractionState;
  actions: NodeGraphInteractionAction[];
};

export const createNodeGraphInteractionState =
  (): NodeGraphInteractionState => ({
    mode: 'idle',
    selectedNodeId: null,
    selectedEdgeId: null,
    panPointerId: null,
    panLastPoint: null,
    connectionDraft: null,
  });

const resetEphemeralState = (
  state: NodeGraphInteractionState
): NodeGraphInteractionState => ({
  ...state,
  mode: 'idle',
  panPointerId: null,
  panLastPoint: null,
  connectionDraft: null,
});

export const reduceNodeGraphInteraction = (
  state: NodeGraphInteractionState,
  event: NodeGraphInteractionEvent
): NodeGraphInteractionResult => {
  if (event.type === 'escape') {
    return {
      state: resetEphemeralState(state),
      actions: [{ type: 'clear.selection' }],
    };
  }

  if (event.type === 'pointer.cancel') {
    if (
      state.panPointerId === event.pointerId ||
      state.connectionDraft?.pointerId === event.pointerId
    ) {
      return { state: resetEphemeralState(state), actions: [] };
    }
    return { state, actions: [] };
  }

  if (event.type === 'pointer.down') {
    if (event.target.type === 'canvas') {
      return {
        state: {
          ...state,
          mode: 'pan',
          panPointerId: event.pointerId,
          panLastPoint: event.point,
          selectedEdgeId: null,
          selectedNodeId: null,
        },
        actions: [{ type: 'clear.selection' }],
      };
    }

    if (event.target.type === 'node') {
      return {
        state: {
          ...state,
          mode: 'select',
          selectedNodeId: event.target.nodeId,
          selectedEdgeId: null,
        },
        actions: [{ type: 'select.node', nodeId: event.target.nodeId }],
      };
    }

    if (event.target.type === 'port' && event.target.role === 'out') {
      return {
        state: {
          ...state,
          mode: 'connect',
          selectedNodeId: event.target.nodeId,
          selectedEdgeId: null,
          connectionDraft: {
            sourceNodeId: event.target.nodeId,
            sourcePortId: event.target.portId,
            cursor: event.point,
            pointerId: event.pointerId,
          },
        },
        actions: [{ type: 'select.node', nodeId: event.target.nodeId }],
      };
    }

    if (event.target.type === 'edge') {
      if (event.target.handle === 'target') {
        return {
          state: {
            ...state,
            mode: 'reconnect',
            selectedNodeId: null,
            selectedEdgeId: event.target.edgeId,
            connectionDraft: {
              edgeId: event.target.edgeId,
              sourceNodeId: event.target.nodeId,
              sourcePortId: event.target.portId,
              cursor: event.point,
              pointerId: event.pointerId,
            },
          },
          actions: [{ type: 'select.edge', edgeId: event.target.edgeId }],
        };
      }

      return {
        state: {
          ...state,
          mode: 'select',
          selectedNodeId: null,
          selectedEdgeId: event.target.edgeId,
        },
        actions: [{ type: 'select.edge', edgeId: event.target.edgeId }],
      };
    }

    return { state, actions: [] };
  }

  if (event.type === 'pointer.move') {
    if (state.mode === 'pan' && state.panPointerId === event.pointerId) {
      const previous = state.panLastPoint;
      if (!previous) {
        return {
          state: { ...state, panLastPoint: event.point },
          actions: [],
        };
      }
      return {
        state: { ...state, panLastPoint: event.point },
        actions: [
          {
            type: 'pan.delta',
            deltaX: event.point.x - previous.x,
            deltaY: event.point.y - previous.y,
          },
        ],
      };
    }

    if (
      (state.mode === 'connect' || state.mode === 'reconnect') &&
      state.connectionDraft?.pointerId === event.pointerId
    ) {
      return {
        state: {
          ...state,
          connectionDraft: { ...state.connectionDraft, cursor: event.point },
        },
        actions: [],
      };
    }

    return { state, actions: [] };
  }

  if (event.type === 'pointer.up') {
    if (state.mode === 'pan' && state.panPointerId === event.pointerId) {
      return { state: resetEphemeralState(state), actions: [] };
    }

    if (
      (state.mode === 'connect' || state.mode === 'reconnect') &&
      state.connectionDraft?.pointerId === event.pointerId
    ) {
      if (event.target.type === 'port' && event.target.role === 'in') {
        const draft = state.connectionDraft;
        if (state.mode === 'reconnect' && draft.edgeId) {
          return {
            state: resetEphemeralState(state),
            actions: [
              {
                type: 'edge.reconnect',
                edgeId: draft.edgeId,
                sourceNodeId: draft.sourceNodeId,
                sourcePortId: draft.sourcePortId,
                targetNodeId: event.target.nodeId,
                targetPortId: event.target.portId,
              },
            ],
          };
        }

        return {
          state: resetEphemeralState(state),
          actions: [
            {
              type: 'edge.create',
              sourceNodeId: draft.sourceNodeId,
              sourcePortId: draft.sourcePortId,
              targetNodeId: event.target.nodeId,
              targetPortId: event.target.portId,
            },
          ],
        };
      }

      return { state: resetEphemeralState(state), actions: [] };
    }

    return { state, actions: [] };
  }

  return { state, actions: [] };
};
