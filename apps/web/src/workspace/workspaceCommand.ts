import type {
  StableWorkspaceSnapshot,
  WorkspaceDocumentId,
  WorkspaceId,
  WorkspaceValidationIssue,
} from './types';
import { validateStableWorkspaceSnapshot } from './validateWorkspaceVfs';
import { isMirDocumentContent } from './workspaceSelectors';

export type WorkspacePatchOperation = {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  from?: string;
  value?: unknown;
};

export type WorkspaceCommandEnvelope = {
  id: string;
  namespace: string;
  type: string;
  version: string;
  issuedAt: string;
  forwardOps: WorkspacePatchOperation[];
  reverseOps: WorkspacePatchOperation[];
  target: {
    workspaceId: WorkspaceId;
    documentId?: WorkspaceDocumentId;
    routeNodeId?: string;
  };
  mergeKey?: string;
  label?: string;
  domainHint?:
    | 'mir'
    | 'workspace'
    | 'route'
    | 'nodegraph'
    | 'animation'
    | 'code';
};

export type WorkspaceCommandDomain = NonNullable<
  WorkspaceCommandEnvelope['domainHint']
>;

export type WorkspaceCommandIssueCode =
  | 'WKS_COMMAND_INVALID_ENVELOPE'
  | 'WKS_COMMAND_WORKSPACE_MISMATCH'
  | 'WKS_COMMAND_DOCUMENT_MISSING'
  | 'WKS_COMMAND_PATCH_PATH_FORBIDDEN'
  | 'WKS_COMMAND_PATCH_FAILED'
  | 'WKS_COMMAND_VALIDATION_FAILED';

export type WorkspaceCommandIssue = {
  code: WorkspaceCommandIssueCode;
  path: string;
  message: string;
  documentId?: WorkspaceDocumentId;
  validationIssues?: WorkspaceValidationIssue[];
};

export type WorkspaceCommandApplyResult =
  | {
      ok: true;
      snapshot: StableWorkspaceSnapshot;
      command: WorkspaceCommandEnvelope;
    }
  | {
      ok: false;
      issues: WorkspaceCommandIssue[];
    };

type PatchTarget = 'document' | 'workspace';
type DocumentPatchDomain = Exclude<
  WorkspaceCommandDomain,
  'workspace' | 'route'
>;
type PatchApplyResult =
  | { ok: true; value: unknown }
  | { ok: false; path: string };

const isPatchFailure = (
  result: PatchApplyResult
): result is { ok: false; path: string } => result.ok === false;

const cloneJson = <T>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const decodePointerSegment = (segment: string): string =>
  segment.replaceAll('~1', '/').replaceAll('~0', '~');

const parsePointer = (path: string): string[] | undefined => {
  if (path === '') return [];
  if (!path.startsWith('/')) return undefined;
  return path.slice(1).split('/').map(decodePointerSegment);
};

const getValueAtPath = (
  source: unknown,
  path: string
): { ok: true; value: unknown } | { ok: false } => {
  const segments = parsePointer(path);
  if (!segments) return { ok: false };

  let current = source;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return { ok: false };
      }
      current = current[index];
      continue;
    }

    if (!isObjectLike(current) || !(segment in current)) return { ok: false };
    current = current[segment];
  }

  return { ok: true, value: cloneJson(current) };
};

const resolveParent = (
  source: unknown,
  path: string
):
  | { ok: true; parent: Record<string, unknown> | unknown[]; key: string }
  | { ok: false } => {
  const segments = parsePointer(path);
  if (!segments?.length) return { ok: false };

  let parent = source;
  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(parent)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= parent.length) {
        return { ok: false };
      }
      parent = parent[index];
      continue;
    }

    if (!isObjectLike(parent) || !(segment in parent)) return { ok: false };
    parent = parent[segment];
  }

  if (!isObjectLike(parent)) return { ok: false };
  return {
    ok: true,
    parent: parent as Record<string, unknown>,
    key: segments.at(-1) ?? '',
  };
};

const setValue = (
  source: unknown,
  path: string,
  value: unknown,
  mode: 'add' | 'replace'
): boolean => {
  const resolved = resolveParent(source, path);
  if (!resolved.ok) return false;

  const { parent, key } = resolved;
  if (Array.isArray(parent)) {
    const index = key === '-' ? parent.length : Number(key);
    if (!Number.isInteger(index) || index < 0 || index > parent.length) {
      return false;
    }
    if (mode === 'replace') {
      if (index >= parent.length) return false;
      parent[index] = cloneJson(value);
      return true;
    }
    parent.splice(index, 0, cloneJson(value));
    return true;
  }

  if (mode === 'replace' && !(key in parent)) return false;
  parent[key] = cloneJson(value);
  return true;
};

const removeValue = (source: unknown, path: string): boolean => {
  const resolved = resolveParent(source, path);
  if (!resolved.ok) return false;

  const { parent, key } = resolved;
  if (Array.isArray(parent)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= parent.length) {
      return false;
    }
    parent.splice(index, 1);
    return true;
  }

  if (!(key in parent)) return false;
  delete parent[key];
  return true;
};

const valuesEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const isMirWorkspaceDocumentType = (type: string): boolean =>
  type === 'mir-page' || type === 'mir-layout' || type === 'mir-component';

const inferCommandDomain = (
  command: WorkspaceCommandEnvelope
): WorkspaceCommandDomain => {
  if (command.domainHint) return command.domainHint;
  if (command.namespace.startsWith('core.nodegraph')) return 'nodegraph';
  if (command.namespace.startsWith('core.animation')) return 'animation';
  if (command.namespace.startsWith('core.code')) return 'code';
  if (
    command.namespace.startsWith('core.route') ||
    command.target.routeNodeId
  ) {
    return 'route';
  }
  if (command.namespace.startsWith('core.workspace')) return 'workspace';
  return 'mir';
};

const isAllowedMirDocumentPath = (path: string): boolean =>
  path === '/ui/graph' ||
  path.startsWith('/ui/graph/') ||
  path === '/logic' ||
  path.startsWith('/logic/') ||
  path === '/animation' ||
  path.startsWith('/animation/') ||
  path === '/metadata' ||
  path.startsWith('/metadata/') ||
  path.startsWith('/x-');

const isAllowedNodeGraphDocumentPath = (path: string): boolean =>
  path === '/nodesById' ||
  path.startsWith('/nodesById/') ||
  path === '/edgesById' ||
  path.startsWith('/edgesById/') ||
  path === '/groupsById' ||
  path.startsWith('/groupsById/') ||
  path === '/metadata' ||
  path.startsWith('/metadata/') ||
  path.startsWith('/x-');

const isAllowedAnimationDocumentPath = (path: string): boolean =>
  path === '/timelinesById' ||
  path.startsWith('/timelinesById/') ||
  path === '/tracksById' ||
  path.startsWith('/tracksById/') ||
  path === '/keyframesById' ||
  path.startsWith('/keyframesById/') ||
  path === '/bindingsById' ||
  path.startsWith('/bindingsById/') ||
  path === '/metadata' ||
  path.startsWith('/metadata/') ||
  path.startsWith('/x-');

const isAllowedCodeDocumentPath = (path: string): boolean =>
  path === '/content' ||
  path === '/metadata' ||
  path.startsWith('/metadata/') ||
  path.startsWith('/x-');

const isAllowedDocumentPath = (
  path: string,
  domain: DocumentPatchDomain
): boolean => {
  if (path === '/' || path === '/ui/root' || path.startsWith('/ui/root/')) {
    return false;
  }

  if (domain === 'nodegraph') return isAllowedNodeGraphDocumentPath(path);
  if (domain === 'animation') return isAllowedAnimationDocumentPath(path);
  if (domain === 'code') return isAllowedCodeDocumentPath(path);
  return isAllowedMirDocumentPath(path);
};

const isAllowedWorkspacePath = (path: string): boolean =>
  path === '/treeRootId' ||
  path === '/activeDocumentId' ||
  path === '/activeRouteNodeId' ||
  path === '/treeById' ||
  path.startsWith('/treeById/') ||
  path === '/docsById' ||
  path.startsWith('/docsById/') ||
  path === '/routeManifest' ||
  path.startsWith('/routeManifest/');

const isAllowedPatchPath = (
  path: string,
  target: PatchTarget,
  domain: WorkspaceCommandDomain
): boolean =>
  target === 'document'
    ? isAllowedDocumentPath(
        path,
        domain === 'workspace' || domain === 'route' ? 'mir' : domain
      )
    : isAllowedWorkspacePath(path);

const validatePatchPaths = (
  ops: WorkspacePatchOperation[],
  target: PatchTarget,
  domain: WorkspaceCommandDomain
): WorkspaceCommandIssue[] => {
  const issues: WorkspaceCommandIssue[] = [];

  ops.forEach((op) => {
    if (!isAllowedPatchPath(op.path, target, domain)) {
      issues.push({
        code: 'WKS_COMMAND_PATCH_PATH_FORBIDDEN',
        path: op.path,
        message: 'Patch path is not allowed for this command target.',
      });
    }
    if (
      (op.op === 'move' || op.op === 'copy') &&
      (!op.from || !isAllowedPatchPath(op.from, target, domain))
    ) {
      issues.push({
        code: 'WKS_COMMAND_PATCH_PATH_FORBIDDEN',
        path: op.from ?? '',
        message: 'Patch from path is not allowed for this command target.',
      });
    }
  });

  return issues;
};

const applyPatchOperations = (
  source: unknown,
  ops: WorkspacePatchOperation[]
): PatchApplyResult => {
  const value = cloneJson(source);

  for (const op of ops) {
    if (op.op === 'add') {
      if (!setValue(value, op.path, op.value, 'add')) {
        return { ok: false, path: op.path };
      }
      continue;
    }

    if (op.op === 'replace') {
      if (!setValue(value, op.path, op.value, 'replace')) {
        return { ok: false, path: op.path };
      }
      continue;
    }

    if (op.op === 'remove') {
      if (!removeValue(value, op.path)) return { ok: false, path: op.path };
      continue;
    }

    if (op.op === 'test') {
      const current = getValueAtPath(value, op.path);
      if (!current.ok || !valuesEqual(current.value, op.value)) {
        return { ok: false, path: op.path };
      }
      continue;
    }

    if (op.op === 'copy' || op.op === 'move') {
      if (!op.from) return { ok: false, path: op.path };
      const current = getValueAtPath(value, op.from);
      if (!current.ok) return { ok: false, path: op.from };
      if (op.op === 'move' && !removeValue(value, op.from)) {
        return { ok: false, path: op.from };
      }
      if (!setValue(value, op.path, current.value, 'add')) {
        return { ok: false, path: op.path };
      }
      continue;
    }

    return { ok: false, path: op.path };
  }

  return { ok: true, value };
};

const validateEnvelope = (
  command: WorkspaceCommandEnvelope
): WorkspaceCommandIssue[] => {
  const issues: WorkspaceCommandIssue[] = [];
  const requiredStringFields = [
    ['id', command.id],
    ['namespace', command.namespace],
    ['type', command.type],
    ['version', command.version],
    ['issuedAt', command.issuedAt],
    ['target/workspaceId', command.target?.workspaceId],
  ] as const;

  requiredStringFields.forEach(([field, value]) => {
    if (typeof value !== 'string' || !value.trim()) {
      issues.push({
        code: 'WKS_COMMAND_INVALID_ENVELOPE',
        path: `/${field}`,
        message: 'Command envelope field is required.',
      });
    }
  });

  if (!command.forwardOps.length || !command.reverseOps.length) {
    issues.push({
      code: 'WKS_COMMAND_INVALID_ENVELOPE',
      path: '/forwardOps',
      message: 'Mutating commands must provide forwardOps and reverseOps.',
    });
  }

  return issues;
};

export const applyWorkspaceCommand = (
  snapshot: StableWorkspaceSnapshot,
  command: WorkspaceCommandEnvelope
): WorkspaceCommandApplyResult => {
  const envelopeIssues = validateEnvelope(command);
  if (envelopeIssues.length) return { ok: false, issues: envelopeIssues };

  if (command.target.workspaceId !== snapshot.id) {
    return {
      ok: false,
      issues: [
        {
          code: 'WKS_COMMAND_WORKSPACE_MISMATCH',
          path: '/target/workspaceId',
          message: 'Command target workspaceId must match the snapshot.',
        },
      ],
    };
  }

  const patchTarget: PatchTarget = command.target.documentId
    ? 'document'
    : 'workspace';
  const commandDomain = inferCommandDomain(command);
  const pathIssues = [
    ...validatePatchPaths(command.forwardOps, patchTarget, commandDomain),
    ...validatePatchPaths(command.reverseOps, patchTarget, commandDomain),
  ];
  if (pathIssues.length) return { ok: false, issues: pathIssues };

  if (patchTarget === 'document') {
    const documentId = command.target.documentId;
    const document = documentId ? snapshot.docsById[documentId] : undefined;
    if (!documentId || !document) {
      return {
        ok: false,
        issues: [
          {
            code: 'WKS_COMMAND_DOCUMENT_MISSING',
            path: '/target/documentId',
            message: 'Command target documentId must reference a document.',
            documentId,
          },
        ],
      };
    }

    const patchedContent = applyPatchOperations(
      document.content,
      command.forwardOps
    );
    if (isPatchFailure(patchedContent)) {
      return {
        ok: false,
        issues: [
          {
            code: 'WKS_COMMAND_PATCH_FAILED',
            path: patchedContent.path,
            message: 'Command forwardOps could not be applied.',
            documentId,
          },
        ],
      };
    }

    const restoredContent = applyPatchOperations(
      patchedContent.value,
      command.reverseOps
    );
    if (isPatchFailure(restoredContent)) {
      return {
        ok: false,
        issues: [
          {
            code: 'WKS_COMMAND_PATCH_FAILED',
            path: restoredContent.path,
            message: 'Command reverseOps must restore the original document.',
            documentId,
          },
        ],
      };
    }

    if (!valuesEqual(restoredContent.value, document.content)) {
      return {
        ok: false,
        issues: [
          {
            code: 'WKS_COMMAND_PATCH_FAILED',
            path: '/',
            message: 'Command reverseOps must restore the original document.',
            documentId,
          },
        ],
      };
    }

    if (
      isMirWorkspaceDocumentType(document.type) &&
      !isMirDocumentContent(patchedContent.value)
    ) {
      return {
        ok: false,
        issues: [
          {
            code: 'WKS_COMMAND_VALIDATION_FAILED',
            path: '/target/documentId',
            message: 'MIR workspace documents must remain v1.3 graph-only.',
            documentId,
          },
        ],
      };
    }

    const nextSnapshot: StableWorkspaceSnapshot = {
      ...snapshot,
      docsById: {
        ...snapshot.docsById,
        [documentId]: {
          ...document,
          content: patchedContent.value,
          contentRev: document.contentRev + 1,
        },
      },
    };

    return { ok: true, snapshot: nextSnapshot, command };
  }

  const patchedSnapshot = applyPatchOperations(snapshot, command.forwardOps);
  if (isPatchFailure(patchedSnapshot)) {
    return {
      ok: false,
      issues: [
        {
          code: 'WKS_COMMAND_PATCH_FAILED',
          path: patchedSnapshot.path,
          message: 'Command forwardOps could not be applied.',
        },
      ],
    };
  }

  const nextSnapshot = patchedSnapshot.value as StableWorkspaceSnapshot;
  const restoredSnapshot = applyPatchOperations(
    nextSnapshot,
    command.reverseOps
  );
  if (isPatchFailure(restoredSnapshot)) {
    return {
      ok: false,
      issues: [
        {
          code: 'WKS_COMMAND_PATCH_FAILED',
          path: restoredSnapshot.path,
          message: 'Command reverseOps must restore the original workspace.',
        },
      ],
    };
  }

  if (!valuesEqual(restoredSnapshot.value, snapshot)) {
    return {
      ok: false,
      issues: [
        {
          code: 'WKS_COMMAND_PATCH_FAILED',
          path: '/',
          message: 'Command reverseOps must restore the original workspace.',
        },
      ],
    };
  }

  const validation = validateStableWorkspaceSnapshot(nextSnapshot);
  if (!validation.valid) {
    return {
      ok: false,
      issues: [
        {
          code: 'WKS_COMMAND_VALIDATION_FAILED',
          path: '/',
          message: 'Command result failed workspace validation.',
          validationIssues: validation.issues,
        },
      ],
    };
  }

  return { ok: true, snapshot: nextSnapshot, command };
};
