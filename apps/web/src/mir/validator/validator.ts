import type {
  ComponentNodeData,
  MIRDocument,
  NodeDataScope,
  NodeId,
  NodeListRender,
  UiGraph,
} from '@/core/types/engine.types';
import {
  createDiagnostic,
  MIR_DIAGNOSTIC_REGISTRY,
  type MdrDiagnostic,
} from '@/diagnostics';
import { normalizeMirToV13 } from '@/mir/resolveMirDocument';
import {
  isDataReference,
  isItemReference,
  isParamReference,
  isStateReference,
} from '@/mir/shared/valueRef';

export type MirValidationIssue = MdrDiagnostic & {
  path: string;
};

export type MirValidationResult = {
  document: MIRDocument;
  issues: MirValidationIssue[];
  hasError: boolean;
};

const IDENTIFIER_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$-]*$/;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isScopeSourceReference = (value: unknown) =>
  isParamReference(value) ||
  isStateReference(value) ||
  isDataReference(value) ||
  isItemReference(value);

const escapeJsonPointerSegment = (value: string) =>
  value.replace(/~/g, '~0').replace(/\//g, '~1');

type MirIssueInput = {
  code: keyof typeof MIR_DIAGNOSTIC_REGISTRY;
  path: string;
  message: string;
  hint?: string;
  retryable?: boolean;
  meta?: Record<string, unknown>;
};

const createMirIssue = ({
  code,
  path,
  message,
  hint,
  retryable,
  meta,
}: MirIssueInput): MirValidationIssue => {
  const registryEntry = MIR_DIAGNOSTIC_REGISTRY[code];
  return {
    ...createDiagnostic({
      ...registryEntry,
      message,
      hint,
      retryable,
      meta,
    }),
    path,
  };
};

const pushMirIssue = (issues: MirValidationIssue[], issue: MirIssueInput) => {
  issues.push(createMirIssue(issue));
};

const validateDataScope = (
  dataScope: NodeDataScope | undefined,
  path: string,
  issues: MirValidationIssue[]
) => {
  if (!dataScope) return;
  if (
    dataScope.pick !== undefined &&
    (typeof dataScope.pick !== 'string' || !dataScope.pick.trim())
  ) {
    pushMirIssue(issues, {
      code: 'MIR_3002',
      path: `${path}/data/pick`,
      message: 'data.pick must be a non-empty string when provided.',
    });
  }
  if (
    dataScope.source !== undefined &&
    !isScopeSourceReference(dataScope.source)
  ) {
    pushMirIssue(issues, {
      code: 'MIR_3002',
      path: `${path}/data/source`,
      message:
        'data.source must be one of {$param}, {$state}, {$data}, {$item}.',
    });
  }
  if (dataScope.extend !== undefined && !isPlainObject(dataScope.extend)) {
    pushMirIssue(issues, {
      code: 'MIR_3002',
      path: `${path}/data/extend`,
      message: 'data.extend must be a JSON object.',
    });
  }
};

const validateListRender = (
  list: NodeListRender | undefined,
  path: string,
  allNodeIds: Set<string>,
  issues: MirValidationIssue[]
) => {
  if (!list) return;
  if (list.source !== undefined && !isScopeSourceReference(list.source)) {
    pushMirIssue(issues, {
      code: 'MIR_3010',
      path: `${path}/list/source`,
      message:
        'list.source must be one of {$param}, {$state}, {$data}, {$item}.',
    });
  }
  if (list.itemAs && !IDENTIFIER_PATTERN.test(list.itemAs)) {
    pushMirIssue(issues, {
      code: 'MIR_3010',
      path: `${path}/list/itemAs`,
      message: 'list.itemAs is not a valid identifier.',
    });
  }
  if (list.indexAs && !IDENTIFIER_PATTERN.test(list.indexAs)) {
    pushMirIssue(issues, {
      code: 'MIR_3010',
      path: `${path}/list/indexAs`,
      message: 'list.indexAs is not a valid identifier.',
    });
  }
  if (list.emptyNodeId && !allNodeIds.has(list.emptyNodeId)) {
    pushMirIssue(issues, {
      code: 'MIR_2007',
      path: `${path}/list/emptyNodeId`,
      message: 'list.emptyNodeId was not found in current document.',
    });
  }
  if (list.keyBy !== undefined && typeof list.keyBy !== 'string') {
    pushMirIssue(issues, {
      code: 'MIR_3010',
      path: `${path}/list/keyBy`,
      message: 'list.keyBy must be a string when provided.',
    });
  }
  if (list.arrayField !== undefined && typeof list.arrayField !== 'string') {
    pushMirIssue(issues, {
      code: 'MIR_3010',
      path: `${path}/list/arrayField`,
      message: 'list.arrayField must be a string when provided.',
    });
  }
};

const validateNodeData = (
  nodeId: NodeId,
  node: ComponentNodeData,
  allNodeIds: Set<NodeId>,
  issues: MirValidationIssue[]
) => {
  const nodePath = `/ui/graph/nodesById/${escapeJsonPointerSegment(nodeId)}`;
  if (node.id !== nodeId) {
    pushMirIssue(issues, {
      code: 'MIR_2002',
      path: `${nodePath}/id`,
      message: 'nodesById key must match node.id.',
    });
  }
  if (!node.id.trim()) {
    pushMirIssue(issues, {
      code: 'MIR_1003',
      path: `${nodePath}/id`,
      message: 'node.id is required.',
    });
  }
  if (!node.type.trim()) {
    pushMirIssue(issues, {
      code: 'MIR_1003',
      path: `${nodePath}/type`,
      message: 'node.type is required.',
    });
  }
  validateDataScope(node.data, nodePath, issues);
  validateListRender(node.list, nodePath, allNodeIds, issues);
};

const addParentRef = (
  parentRefs: Map<NodeId, string>,
  childId: NodeId,
  path: string,
  issues: MirValidationIssue[]
) => {
  const previous = parentRefs.get(childId);
  if (previous) {
    pushMirIssue(issues, {
      code: 'MIR_2005',
      path,
      message: `Node "${childId}" already has a parent at ${previous}.`,
    });
    return;
  }
  parentRefs.set(childId, path);
};

const validateGraphReferences = (
  graph: UiGraph,
  issues: MirValidationIssue[]
) => {
  const allNodeIds = new Set(Object.keys(graph.nodesById));
  if (!allNodeIds.has(graph.rootId)) {
    pushMirIssue(issues, {
      code: 'MIR_2001',
      path: '/ui/graph/rootId',
      message: 'ui.graph.rootId must exist in nodesById.',
    });
  }

  const parentRefs = new Map<NodeId, string>();
  Object.entries(graph.childIdsById).forEach(([parentId, childIds]) => {
    const parentPath = `/ui/graph/childIdsById/${escapeJsonPointerSegment(parentId)}`;
    if (!allNodeIds.has(parentId)) {
      pushMirIssue(issues, {
        code: 'MIR_2003',
        path: parentPath,
        message: 'childIdsById owner must exist in nodesById.',
      });
    }
    childIds.forEach((childId, index) => {
      const childPath = `${parentPath}/${index}`;
      if (!allNodeIds.has(childId)) {
        pushMirIssue(issues, {
          code: 'MIR_2003',
          path: childPath,
          message: 'Child node id does not exist in nodesById.',
        });
        return;
      }
      addParentRef(parentRefs, childId, childPath, issues);
    });
  });

  Object.entries(graph.regionsById ?? {}).forEach(([parentId, regions]) => {
    const parentPath = `/ui/graph/regionsById/${escapeJsonPointerSegment(parentId)}`;
    if (!allNodeIds.has(parentId)) {
      pushMirIssue(issues, {
        code: 'MIR_2003',
        path: parentPath,
        message: 'regionsById owner must exist in nodesById.',
      });
    }
    Object.entries(regions).forEach(([regionName, childIds]) => {
      childIds.forEach((childId, index) => {
        const childPath = `${parentPath}/${escapeJsonPointerSegment(regionName)}/${index}`;
        if (!allNodeIds.has(childId)) {
          pushMirIssue(issues, {
            code: 'MIR_2003',
            path: childPath,
            message: 'Region child node id does not exist in nodesById.',
          });
          return;
        }
        addParentRef(parentRefs, childId, childPath, issues);
      });
    });
  });

  allNodeIds.forEach((nodeId) => {
    if (nodeId === graph.rootId) return;
    if (parentRefs.has(nodeId)) return;
    pushMirIssue(issues, {
      code: 'MIR_2006',
      path: `/ui/graph/nodesById/${escapeJsonPointerSegment(nodeId)}`,
      message: 'Node is not reachable from root.',
    });
  });
};

const validateGraphAcyclic = (graph: UiGraph, issues: MirValidationIssue[]) => {
  const visiting = new Set<NodeId>();
  const visited = new Set<NodeId>();

  const visit = (nodeId: NodeId, path: string) => {
    if (visiting.has(nodeId)) {
      pushMirIssue(issues, {
        code: 'MIR_2004',
        path,
        message: `Cycle detected at node "${nodeId}".`,
      });
      return;
    }
    if (visited.has(nodeId)) return;
    if (!graph.nodesById[nodeId]) return;
    visiting.add(nodeId);
    (graph.childIdsById[nodeId] ?? []).forEach((childId, index) =>
      visit(
        childId,
        `/ui/graph/childIdsById/${escapeJsonPointerSegment(nodeId)}/${index}`
      )
    );
    Object.entries(graph.regionsById?.[nodeId] ?? {}).forEach(
      ([regionName, childIds]) => {
        childIds.forEach((childId, index) =>
          visit(
            childId,
            `/ui/graph/regionsById/${escapeJsonPointerSegment(nodeId)}/${escapeJsonPointerSegment(regionName)}/${index}`
          )
        );
      }
    );
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  visit(graph.rootId, '/ui/graph/rootId');
};

const validateAnimationReferences = (
  document: MIRDocument,
  allNodeIds: Set<NodeId>,
  issues: MirValidationIssue[]
) => {
  document.animation?.timelines?.forEach((timeline, timelineIndex) => {
    timeline.bindings.forEach((binding, bindingIndex) => {
      if (!allNodeIds.has(binding.targetNodeId)) {
        pushMirIssue(issues, {
          code: 'MIR_2007',
          path: `/animation/timelines/${timelineIndex}/bindings/${bindingIndex}/targetNodeId`,
          message: 'Animation binding targetNodeId was not found.',
        });
      }
    });
  });
};

export const validateMirDocument = (source: unknown): MirValidationResult => {
  const document = normalizeMirToV13(source);
  const issues: MirValidationIssue[] = [];
  const original = isPlainObject(source) ? source : {};
  const originalUi = isPlainObject(original.ui) ? original.ui : {};

  if (originalUi.root !== undefined) {
    pushMirIssue(issues, {
      code: 'MIR_1001',
      path: '/ui/root',
      message: 'MIR v1.3 documents must not contain ui.root.',
    });
  }
  if (document.version !== '1.3') {
    pushMirIssue(issues, {
      code: 'MIR_1002',
      path: '/version',
      message: 'MIR document version must be 1.3.',
    });
  }

  const graph = document.ui.graph;
  const allNodeIds = new Set(Object.keys(graph.nodesById));
  Object.entries(graph.nodesById).forEach(([nodeId, node]) =>
    validateNodeData(nodeId, node, allNodeIds, issues)
  );
  validateGraphReferences(graph, issues);
  validateGraphAcyclic(graph, issues);
  validateAnimationReferences(document, allNodeIds, issues);

  return {
    document,
    issues,
    hasError: issues.length > 0,
  };
};
