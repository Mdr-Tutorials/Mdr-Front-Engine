import type {
  ComponentNode,
  MIRDocument,
  NodeDataScope,
  NodeListRender,
} from '@/core/types/engine.types';
import { normalizeMirToV12 } from '@/mir/resolveMirDocument';
import {
  isDataReference,
  isItemReference,
  isParamReference,
  isStateReference,
} from '@/mir/shared/valueRef';

export type MirValidationIssue = {
  code: string;
  path: string;
  message: string;
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
    issues.push({
      code: 'MIR_DATA_PICK_INVALID',
      path: `${path}/data/pick`,
      message: 'data.pick must be a non-empty string when provided.',
    });
  }
  if (
    dataScope.source !== undefined &&
    !isScopeSourceReference(dataScope.source)
  ) {
    issues.push({
      code: 'MIR_DATA_SOURCE_INVALID',
      path: `${path}/data/source`,
      message:
        'data.source must be one of {$param}, {$state}, {$data}, {$item}.',
    });
  }
  if (dataScope.extend !== undefined && !isPlainObject(dataScope.extend)) {
    issues.push({
      code: 'MIR_DATA_EXTEND_INVALID',
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
    issues.push({
      code: 'MIR_LIST_SOURCE_INVALID',
      path: `${path}/list/source`,
      message:
        'list.source must be one of {$param}, {$state}, {$data}, {$item}.',
    });
  }
  if (list.itemAs && !IDENTIFIER_PATTERN.test(list.itemAs)) {
    issues.push({
      code: 'MIR_LIST_ALIAS_INVALID',
      path: `${path}/list/itemAs`,
      message: 'list.itemAs is not a valid identifier.',
    });
  }
  if (list.indexAs && !IDENTIFIER_PATTERN.test(list.indexAs)) {
    issues.push({
      code: 'MIR_LIST_ALIAS_INVALID',
      path: `${path}/list/indexAs`,
      message: 'list.indexAs is not a valid identifier.',
    });
  }
  if (list.emptyNodeId && !allNodeIds.has(list.emptyNodeId)) {
    issues.push({
      code: 'MIR_LIST_EMPTY_NODE_NOT_FOUND',
      path: `${path}/list/emptyNodeId`,
      message: 'list.emptyNodeId was not found in current document.',
    });
  }
  if (list.keyBy !== undefined && typeof list.keyBy !== 'string') {
    issues.push({
      code: 'MIR_LIST_KEYBY_INVALID',
      path: `${path}/list/keyBy`,
      message: 'list.keyBy must be a string when provided.',
    });
  }
  if (list.arrayField !== undefined && typeof list.arrayField !== 'string') {
    issues.push({
      code: 'MIR_LIST_ARRAY_FIELD_INVALID',
      path: `${path}/list/arrayField`,
      message: 'list.arrayField must be a string when provided.',
    });
  }
};

const collectNodeIds = (node: ComponentNode, bucket: Set<string>) => {
  bucket.add(node.id);
  (node.children ?? []).forEach((child) => collectNodeIds(child, bucket));
};

const walkNode = (
  node: ComponentNode,
  path: string,
  allNodeIds: Set<string>,
  issues: MirValidationIssue[]
) => {
  if (!node.id.trim()) {
    issues.push({
      code: 'MIR_NODE_ID_REQUIRED',
      path: `${path}/id`,
      message: 'node.id is required.',
    });
  }
  if (!node.type.trim()) {
    issues.push({
      code: 'MIR_NODE_TYPE_REQUIRED',
      path: `${path}/type`,
      message: 'node.type is required.',
    });
  }
  validateDataScope(node.data, path, issues);
  validateListRender(node.list, path, allNodeIds, issues);
  (node.children ?? []).forEach((child, index) =>
    walkNode(child, `${path}/children/${index}`, allNodeIds, issues)
  );
};

export const validateMirDocument = (source: unknown): MirValidationResult => {
  const document = normalizeMirToV12(source);
  const issues: MirValidationIssue[] = [];
  const allNodeIds = new Set<string>();
  collectNodeIds(document.ui.root, allNodeIds);
  walkNode(document.ui.root, '/ui/root', allNodeIds, issues);
  return {
    document,
    issues,
    hasError: issues.length > 0,
  };
};
