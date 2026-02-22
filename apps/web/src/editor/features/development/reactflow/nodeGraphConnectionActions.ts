import { addEdge, type Connection, type Edge, type Node } from '@xyflow/react';
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { GraphNodeData } from './GraphNode';
import {
  type ConnectionValidationReason,
  validateConnectionWithState,
} from './graphConnectionValidation';
import { normalizeHandleId } from './graphPortUtils';

type UseNodeGraphConnectionActionsParams = {
  connectionHintTextByReason: Record<ConnectionValidationReason, string>;
  edges: Edge[];
  nodes: Node<GraphNodeData>[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setHint: Dispatch<SetStateAction<string | null>>;
};

export const useNodeGraphConnectionActions = ({
  connectionHintTextByReason,
  edges,
  nodes,
  setEdges,
  setHint,
}: UseNodeGraphConnectionActionsParams) => {
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
        setHint(connectionHintTextByReason[reason]);
        return;
      }
      setEdges((current) =>
        addEdge({ ...normalizedConnection, type: 'smoothstep' }, current)
      );
    },
    [connectionHintTextByReason, edges, nodes, setEdges, setHint]
  );

  return {
    isValidConnection,
    onConnect,
  };
};
