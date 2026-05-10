import { describe, expect, it } from 'vitest';
import { createDefaultMirDoc } from '@/mir/resolveMirDocument';
import {
  projectWorkspaceToMfeFiles,
  readWorkspaceFromMfeFiles,
  type StableWorkspaceSnapshot,
} from '..';

const createWorkspace = (): StableWorkspaceSnapshot => ({
  id: 'workspace-1',
  name: 'Projection Test',
  workspaceRev: 3,
  routeRev: 2,
  opSeq: 7,
  treeRootId: 'root',
  activeDocumentId: 'page-home',
  activeRouteNodeId: 'route-home',
  treeById: {
    root: {
      id: 'root',
      kind: 'dir',
      name: '/',
      parentId: null,
      children: ['pages', 'code'],
    },
    pages: {
      id: 'pages',
      kind: 'dir',
      name: 'pages',
      parentId: 'root',
      children: ['page-home-node'],
    },
    'page-home-node': {
      id: 'page-home-node',
      kind: 'doc',
      name: 'home.mir.json',
      parentId: 'pages',
      docId: 'page-home',
    },
    code: {
      id: 'code',
      kind: 'dir',
      name: 'code',
      parentId: 'root',
      children: ['code-index-node'],
    },
    'code-index-node': {
      id: 'code-index-node',
      kind: 'doc',
      name: 'index.ts',
      parentId: 'code',
      docId: 'code-index',
    },
  },
  docsById: {
    'page-home': {
      id: 'page-home',
      type: 'mir-page',
      name: 'Home',
      path: '/pages/home.mir.json',
      contentRev: 3,
      metaRev: 1,
      content: createDefaultMirDoc(),
      updatedAt: '2026-05-10T00:00:00.000Z',
    },
    'code-index': {
      id: 'code-index',
      type: 'code',
      name: 'index.ts',
      path: '/code/index.ts',
      contentRev: 1,
      metaRev: 1,
      content: 'export const value = 1;\n',
    },
  },
  routeManifest: {
    version: '1',
    root: {
      id: 'route-root',
      children: [
        {
          id: 'route-home',
          index: true,
          pageDocId: 'page-home',
        },
      ],
    },
  },
});

describe('workspace projection', () => {
  it('projects a workspace to .mfe source files with stable paths', () => {
    const result = projectWorkspaceToMfeFiles(createWorkspace());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.files.map((file) => file.path)).toEqual([
      '.mfe/documents/code/index.ts',
      '.mfe/documents/pages/home.mir.json',
      '.mfe/route-manifest.json',
      '.mfe/workspace.json',
    ]);
    expect(
      result.files.find((file) => file.documentId === 'page-home')
    ).toMatchObject({
      mime: 'application/json',
      role: 'document',
    });
    expect(
      result.files.find((file) => file.documentId === 'code-index')
    ).toMatchObject({
      content: 'export const value = 1;\n',
      mime: 'text/plain',
      role: 'document',
    });
  });

  it('round-trips .mfe source files back into a workspace snapshot', () => {
    const workspace = createWorkspace();
    const projected = projectWorkspaceToMfeFiles(workspace);
    expect(projected.ok).toBe(true);
    if (!projected.ok) return;

    const read = readWorkspaceFromMfeFiles(projected.files);

    expect(read.ok).toBe(true);
    if (!read.ok) return;

    expect(read.snapshot).toEqual(workspace);
  });

  it('rejects invalid workspaces before writing files', () => {
    const workspace = createWorkspace();
    workspace.docsById['page-home'].path = '/wrong/home.mir.json';

    const result = projectWorkspaceToMfeFiles(workspace);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.issues[0]).toMatchObject({
      code: 'WKS_PROJECTION_INVALID_WORKSPACE',
    });
    expect(
      result.issues[0].validationIssues?.map((issue) => issue.code)
    ).toContain('WKS_DOCUMENT_PATH_MISMATCH');
  });

  it('rejects missing declared document files while reading', () => {
    const projected = projectWorkspaceToMfeFiles(createWorkspace());
    expect(projected.ok).toBe(true);
    if (!projected.ok) return;

    const read = readWorkspaceFromMfeFiles(
      projected.files.filter((file) => file.documentId !== 'page-home')
    );

    expect(read.ok).toBe(false);
    if (read.ok) return;

    expect(read.issues.map((issue) => issue.code)).toContain(
      'WKS_PROJECTION_DOCUMENT_MISSING'
    );
  });
});
