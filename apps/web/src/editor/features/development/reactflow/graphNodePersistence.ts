import type { Edge, Node } from '@xyflow/react';
import {
  normalizeBindingEntries,
  normalizeBranches,
  normalizeCases,
  normalizeKeyValueEntries,
  normalizeStatusCodes,
  type GraphNodeData,
} from './graphNodeShared';
import { normalizeHandleId } from './graphPortUtils';
import { getNodeCatalogItem } from './nodeCatalog';

export const normalizePersistedEdge = (edge: Edge): Edge => ({
  ...edge,
  sourceHandle: normalizeHandleId(edge.sourceHandle) ?? undefined,
  targetHandle: normalizeHandleId(edge.targetHandle) ?? undefined,
});

export const normalizePersistedNode = (
  node: Node<GraphNodeData>
): Node<GraphNodeData> => {
  const defaults = getNodeCatalogItem(node.data.kind).defaults ?? {};
  const nextData: GraphNodeData = {
    ...defaults,
    ...node.data,
    collapsed: Boolean(node.data.collapsed),
  };

  if (node.data.kind === 'switch') {
    const cases = normalizeCases(node.data.cases);
    nextData.cases = cases.length ? cases : [{ id: 'case-1', label: 'case-1' }];
  }
  if (node.data.kind === 'fetch') {
    const statusCodes = normalizeStatusCodes(node.data.statusCodes);
    nextData.statusCodes = statusCodes.length
      ? statusCodes
      : [{ id: 'status-200', code: '200' }];
    nextData.method = node.data.method || 'GET';
  }
  if (node.data.kind === 'parallel' || node.data.kind === 'race') {
    const branches = normalizeBranches(node.data.branches);
    nextData.branches = branches.length
      ? branches
      : [{ id: 'branch-1', label: 'branch-1' }];
  } else if (Array.isArray(node.data.branches)) {
    nextData.branches = normalizeBranches(node.data.branches);
  }
  if (Array.isArray(node.data.keyValueEntries)) {
    const normalizedEntries = normalizeKeyValueEntries(
      node.data.keyValueEntries
    );
    const requireMinOne =
      node.data.kind === 'setState' ||
      node.data.kind === 'computed' ||
      node.data.kind === 'renderComponent' ||
      node.data.kind === 'conditionalRender' ||
      node.data.kind === 'listRender';
    nextData.keyValueEntries =
      requireMinOne && normalizedEntries.length === 0
        ? [{ id: 'entry-1', key: 'key', value: 'value' }]
        : normalizedEntries;
  }
  if (node.data.kind === 'subFlowCall') {
    const normalizedInputBindings = normalizeBindingEntries(
      node.data.inputBindings
    );
    const normalizedOutputBindings = normalizeBindingEntries(
      node.data.outputBindings
    );
    nextData.inputBindings = normalizedInputBindings.length
      ? normalizedInputBindings
      : [{ id: 'input-1', key: 'payload', value: '' }];
    nextData.outputBindings = normalizedOutputBindings.length
      ? normalizedOutputBindings
      : [{ id: 'output-1', key: 'result', value: '' }];
  } else {
    if (Array.isArray(node.data.inputBindings)) {
      nextData.inputBindings = normalizeBindingEntries(node.data.inputBindings);
    }
    if (Array.isArray(node.data.outputBindings)) {
      nextData.outputBindings = normalizeBindingEntries(
        node.data.outputBindings
      );
    }
  }

  return {
    ...node,
    data: nextData,
  };
};
