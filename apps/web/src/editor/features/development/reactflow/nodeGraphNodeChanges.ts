import { applyNodeChanges, type Node, type NodeChange } from '@xyflow/react';
import type { GraphNodeData } from './GraphNode';
import { resolveDropTargetGroup } from './nodeGraphEditorModel';

export type ConfirmAttachToGroup = (groupLabel: string) => boolean;

export const applyNodeChangesWithGrouping = (
  changes: NodeChange<Node<GraphNodeData>>[],
  currentNodes: Node<GraphNodeData>[],
  confirmAttachToGroup: ConfirmAttachToGroup
) => {
  const previousById = new Map(
    currentNodes.map((node) => [node.id, node] as const)
  );
  let nextNodes = applyNodeChanges(changes, currentNodes);
  const pendingGroupAttach = new Map<string, string>();

  for (const change of changes) {
    if (change.type !== 'position') continue;
    const previousNode = previousById.get(change.id);
    const movedNode = nextNodes.find((node) => node.id === change.id);
    if (!previousNode || !movedNode) continue;

    if (previousNode.data.kind !== 'groupBox') {
      if (movedNode.data.kind === 'groupBox') continue;
      if ('dragging' in change && change.dragging) continue;
      const targetGroup = resolveDropTargetGroup(movedNode, nextNodes);
      if (!targetGroup) continue;
      if (movedNode.data.groupBoxId === targetGroup.id) continue;
      pendingGroupAttach.set(movedNode.id, targetGroup.id);
      continue;
    }

    const previousGroup = previousById.get(change.id);
    if (!previousGroup || previousGroup.data.kind !== 'groupBox') continue;
    const movedGroup = movedNode;
    const deltaX = movedGroup.position.x - previousGroup.position.x;
    const deltaY = movedGroup.position.y - previousGroup.position.y;
    if (!deltaX && !deltaY) continue;
    nextNodes = nextNodes.map((node) => {
      if (node.id === movedGroup.id || node.data.kind === 'groupBox')
        return node;
      if (node.data.groupBoxId !== movedGroup.id) return node;
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
    const node = nextNodes.find((item) => item.id === nodeId);
    const targetGroup = nextNodes.find((item) => item.id === targetGroupId);
    if (!node || !targetGroup || node.data.kind === 'groupBox') continue;
    const groupLabel = targetGroup.data.value?.trim() || targetGroup.data.label;
    if (!confirmAttachToGroup(groupLabel)) continue;
    nextNodes = nextNodes.map((item) =>
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

  return nextNodes;
};
