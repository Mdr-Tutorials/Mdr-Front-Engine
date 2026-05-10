import { describe, expect, it } from 'vitest';
import { createDefaultMirDoc } from '@/mir/resolveMirDocument';
import {
  applyWorkspaceCommand,
  canRedoWorkspaceHistory,
  canUndoWorkspaceHistory,
  createWorkspaceHistoryState,
  pushWorkspaceHistoryEntry,
  redoWorkspaceHistory,
  type StableWorkspaceSnapshot,
  type WorkspaceCommandEnvelope,
  type WorkspaceHistoryScope,
  undoWorkspaceHistory,
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
      children: ['pages', 'graphs'],
    },
    pages: {
      id: 'pages',
      kind: 'dir',
      name: 'pages',
      parentId: 'root',
      children: ['home-node'],
    },
    graphs: {
      id: 'graphs',
      kind: 'dir',
      name: 'graphs',
      parentId: 'root',
      children: ['checkout-node'],
    },
    'home-node': {
      id: 'home-node',
      kind: 'doc',
      name: 'home.mir.json',
      parentId: 'pages',
      docId: 'page-home',
    },
    'checkout-node': {
      id: 'checkout-node',
      kind: 'doc',
      name: 'checkout.graph.json',
      parentId: 'graphs',
      docId: 'graph-checkout',
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
    'graph-checkout': {
      id: 'graph-checkout',
      type: 'mir-graph',
      path: '/graphs/checkout.graph.json',
      contentRev: 1,
      metaRev: 1,
      content: {
        nodesById: {
          validateCart: {
            id: 'validateCart',
            position: { x: 0, y: 0 },
          },
        },
        edgesById: {},
        groupsById: {},
      },
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

describe('workspace history', () => {
  it('undoes the latest matching editor scope without undoing other editor history', () => {
    const mirCommand = createCommand({
      id: 'mir-command',
      forwardOps: [
        {
          op: 'add',
          path: '/ui/graph/nodesById/root/props',
          value: { title: 'Home' },
        },
      ],
      reverseOps: [{ op: 'remove', path: '/ui/graph/nodesById/root/props' }],
      domainHint: 'mir',
    });
    const nodeGraphCommand = createCommand({
      id: 'nodegraph-command',
      namespace: 'core.nodegraph',
      type: 'node.move',
      target: { workspaceId: 'workspace-1', documentId: 'graph-checkout' },
      forwardOps: [
        {
          op: 'replace',
          path: '/nodesById/validateCart/position/x',
          value: 120,
        },
      ],
      reverseOps: [
        { op: 'replace', path: '/nodesById/validateCart/position/x', value: 0 },
      ],
      domainHint: 'nodegraph',
    });

    let snapshot = createWorkspace();
    let history = createWorkspaceHistoryState();

    const mirApply = applyWorkspaceCommand(snapshot, mirCommand);
    expect(mirApply.ok).toBe(true);
    if (!mirApply.ok) return;
    snapshot = mirApply.snapshot;
    history = pushWorkspaceHistoryEntry(history, { command: mirCommand });

    const nodeGraphApply = applyWorkspaceCommand(snapshot, nodeGraphCommand);
    expect(nodeGraphApply.ok).toBe(true);
    if (!nodeGraphApply.ok) return;
    snapshot = nodeGraphApply.snapshot;
    history = pushWorkspaceHistoryEntry(history, {
      command: nodeGraphCommand,
    });

    const nodeGraphScope: WorkspaceHistoryScope = {
      kind: 'document',
      workspaceId: 'workspace-1',
      documentId: 'graph-checkout',
      domain: 'nodegraph',
    };
    const mirScope: WorkspaceHistoryScope = {
      kind: 'document',
      workspaceId: 'workspace-1',
      documentId: 'page-home',
      domain: 'mir',
    };

    const undo = undoWorkspaceHistory(snapshot, history, nodeGraphScope);
    expect(undo.ok).toBe(true);
    if (!undo.ok) return;

    expect(undo.snapshot.docsById['graph-checkout'].content).toHaveProperty(
      'nodesById.validateCart.position.x',
      0
    );
    expect(undo.snapshot.docsById['page-home'].content).toHaveProperty(
      'ui.graph.nodesById.root.props.title',
      'Home'
    );
    expect(canUndoWorkspaceHistory(undo.history, mirScope)).toBe(true);
    expect(canRedoWorkspaceHistory(undo.history, nodeGraphScope)).toBe(true);

    const redo = redoWorkspaceHistory(
      undo.snapshot,
      undo.history,
      nodeGraphScope
    );
    expect(redo.ok).toBe(true);
    if (!redo.ok) return;

    expect(redo.snapshot.docsById['graph-checkout'].content).toHaveProperty(
      'nodesById.validateCart.position.x',
      120
    );
    expect(canUndoWorkspaceHistory(redo.history, mirScope)).toBe(true);
  });
});
