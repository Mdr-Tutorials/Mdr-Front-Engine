import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import type { Node } from '@xyflow/react';
import type { GraphNodeData } from './GraphNode';
import {
  GROUP_BOX_HEADER_HEIGHT,
  GROUP_BOX_PADDING,
  clampNumber,
  resolveAttachedGroupBoxId,
  resolveGroupBoxSize,
  resolveNodeBounds,
} from './nodeGraphEditorModel';

type GroupAutoLayoutById = Map<
  string,
  { x: number; y: number; width: number; height: number }
>;

type UseNodeGraphGroupLayoutParams = {
  nodes: Node<GraphNodeData>[];
  setNodes: Dispatch<SetStateAction<Node<GraphNodeData>[]>>;
};

export const useNodeGraphGroupLayout = ({
  nodes,
  setNodes,
}: UseNodeGraphGroupLayoutParams): GroupAutoLayoutById => {
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

  return groupAutoLayoutById;
};
