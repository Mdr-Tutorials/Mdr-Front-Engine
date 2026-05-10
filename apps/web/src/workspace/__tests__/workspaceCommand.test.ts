import { describe, expect, it } from 'vitest';
import { createDefaultMirDoc } from '@/mir/resolveMirDocument';
import {
  applyWorkspaceCommand,
  type StableWorkspaceSnapshot,
  type WorkspaceCommandEnvelope,
} from '..';

const createWorkspace = (): StableWorkspaceSnapshot => ({
  id: 'workspace-1',
  workspaceRev: 1,
  routeRev: 1,
  opSeq: 1,
  treeRootId: 'root',
  activeDocumentId: 'page-home',
  treeById: {
    root: {
      id: 'root',
      kind: 'dir',
      name: '/',
      parentId: null,
      children: ['pages'],
    },
    pages: {
      id: 'pages',
      kind: 'dir',
      name: 'pages',
      parentId: 'root',
      children: ['home-node'],
    },
    'home-node': {
      id: 'home-node',
      kind: 'doc',
      name: 'home.mir.json',
      parentId: 'pages',
      docId: 'page-home',
    },
  },
  docsById: {
    'page-home': {
      id: 'page-home',
      type: 'mir-page',
      path: '/pages/home.mir.json',
      contentRev: 1,
      metaRev: 1,
      content: createDefaultMirDoc(),
    },
  },
  routeManifest: {
    version: '1',
    root: { id: 'route-root' },
  },
});

const createCommand = (
  overrides: Partial<WorkspaceCommandEnvelope>
): WorkspaceCommandEnvelope => ({
  id: 'command-1',
  namespace: 'core.mir',
  type: 'node.update',
  version: '1.0',
  issuedAt: '2026-05-10T00:00:00.000Z',
  forwardOps: [],
  reverseOps: [],
  target: { workspaceId: 'workspace-1', documentId: 'page-home' },
  ...overrides,
});

describe('applyWorkspaceCommand', () => {
  it('applies document-scoped MIR graph commands and increments contentRev', () => {
    const result = applyWorkspaceCommand(
      createWorkspace(),
      createCommand({
        forwardOps: [
          {
            op: 'add',
            path: '/ui/graph/nodesById/root/props',
            value: { title: 'Home' },
          },
        ],
        reverseOps: [{ op: 'remove', path: '/ui/graph/nodesById/root/props' }],
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.docsById['page-home'].contentRev).toBe(2);
    expect(result.snapshot.docsById['page-home'].content).toHaveProperty(
      'ui.graph.nodesById.root.props.title',
      'Home'
    );
  });

  it('rejects document commands that patch legacy ui.root', () => {
    const result = applyWorkspaceCommand(
      createWorkspace(),
      createCommand({
        forwardOps: [{ op: 'add', path: '/ui/root', value: {} }],
        reverseOps: [{ op: 'remove', path: '/ui/root' }],
      })
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.code)).toContain(
      'WKS_COMMAND_PATCH_PATH_FORBIDDEN'
    );
  });

  it('rejects workspace commands that break VFS invariants', () => {
    const result = applyWorkspaceCommand(
      createWorkspace(),
      createCommand({
        target: { workspaceId: 'workspace-1' },
        namespace: 'core.workspace',
        type: 'document.move',
        forwardOps: [
          { op: 'replace', path: '/treeById/root/children', value: [] },
        ],
        reverseOps: [
          {
            op: 'replace',
            path: '/treeById/root/children',
            value: ['pages'],
          },
        ],
      })
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.code)).toContain(
      'WKS_COMMAND_VALIDATION_FAILED'
    );
  });
});
