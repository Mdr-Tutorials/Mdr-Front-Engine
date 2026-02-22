import type { Edge, Node, XYPosition } from '@xyflow/react';
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

const DEFAULT_NODE_POSITION: XYPosition = { x: 0, y: 0 };
const DEFAULT_NODE_SPACING_X = 220;
const DEFAULT_NODE_SPACING_Y = 140;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const createFallbackNodePosition = (index: number): XYPosition => ({
  x: DEFAULT_NODE_POSITION.x + (index % 4) * DEFAULT_NODE_SPACING_X,
  y: DEFAULT_NODE_POSITION.y + Math.floor(index / 4) * DEFAULT_NODE_SPACING_Y,
});

const normalizeNodePosition = (
  value: unknown,
  fallbackIndex: number
): XYPosition => {
  if (
    value &&
    typeof value === 'object' &&
    isFiniteNumber((value as { x?: unknown }).x) &&
    isFiniteNumber((value as { y?: unknown }).y)
  ) {
    return {
      x: (value as { x: number }).x,
      y: (value as { y: number }).y,
    };
  }
  return createFallbackNodePosition(fallbackIndex);
};

export const normalizePersistedNode = (
  node: Node<GraphNodeData>,
  fallbackIndex = 0
): Node<GraphNodeData> => {
  const rawData =
    node.data && typeof node.data === 'object' && !Array.isArray(node.data)
      ? (node.data as GraphNodeData)
      : ({ label: 'Node', kind: 'process' } as GraphNodeData);
  const resolvedKind =
    typeof rawData.kind === 'string' && rawData.kind.trim()
      ? rawData.kind
      : 'process';
  const defaults =
    getNodeCatalogItem(resolvedKind as GraphNodeData['kind']).defaults ?? {};
  const nextData: GraphNodeData = {
    ...defaults,
    ...rawData,
    kind: resolvedKind as GraphNodeData['kind'],
    label:
      typeof rawData.label === 'string' && rawData.label.trim()
        ? rawData.label
        : 'Node',
    collapsed: Boolean(rawData.collapsed),
  };

  if (resolvedKind === 'switch') {
    const cases = normalizeCases(rawData.cases);
    nextData.cases = cases.length ? cases : [{ id: 'case-1', label: 'case-1' }];
  }
  if (resolvedKind === 'fetch') {
    const statusCodes = normalizeStatusCodes(rawData.statusCodes);
    nextData.statusCodes = statusCodes.length
      ? statusCodes
      : [{ id: 'status-200', code: '200' }];
    nextData.method = rawData.method || 'GET';
  }
  if (resolvedKind === 'parallel' || resolvedKind === 'race') {
    const branches = normalizeBranches(rawData.branches);
    nextData.branches = branches.length
      ? branches
      : [{ id: 'branch-1', label: 'branch-1' }];
  } else if (Array.isArray(rawData.branches)) {
    nextData.branches = normalizeBranches(rawData.branches);
  }
  if (Array.isArray(rawData.keyValueEntries)) {
    const normalizedEntries = normalizeKeyValueEntries(rawData.keyValueEntries);
    const requireMinOne =
      resolvedKind === 'setState' ||
      resolvedKind === 'computed' ||
      resolvedKind === 'renderComponent' ||
      resolvedKind === 'conditionalRender' ||
      resolvedKind === 'listRender';
    nextData.keyValueEntries =
      requireMinOne && normalizedEntries.length === 0
        ? [{ id: 'entry-1', key: 'key', value: 'value' }]
        : normalizedEntries;
  }
  if (resolvedKind === 'subFlowCall') {
    const normalizedInputBindings = normalizeBindingEntries(
      rawData.inputBindings
    );
    const normalizedOutputBindings = normalizeBindingEntries(
      rawData.outputBindings
    );
    nextData.inputBindings = normalizedInputBindings.length
      ? normalizedInputBindings
      : [{ id: 'input-1', key: 'payload', value: '' }];
    nextData.outputBindings = normalizedOutputBindings.length
      ? normalizedOutputBindings
      : [{ id: 'output-1', key: 'result', value: '' }];
  } else {
    if (Array.isArray(rawData.inputBindings)) {
      nextData.inputBindings = normalizeBindingEntries(rawData.inputBindings);
    }
    if (Array.isArray(rawData.outputBindings)) {
      nextData.outputBindings = normalizeBindingEntries(rawData.outputBindings);
    }
  }

  return {
    ...node,
    position: normalizeNodePosition(node.position, fallbackIndex),
    data: nextData,
  };
};
