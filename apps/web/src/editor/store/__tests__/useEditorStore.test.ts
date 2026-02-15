import { beforeEach, describe, expect, it } from 'vitest';
import type { WorkspaceSnapshot } from '@/editor/editorApi';
import { createMirDoc, resetEditorStore } from '@/test-utils/editorStore';
import { useEditorStore } from '../useEditorStore';

const createWorkspaceSnapshot = (
  workspaceId: string,
  documents: WorkspaceSnapshot['documents']
): WorkspaceSnapshot => ({
  id: workspaceId,
  workspaceRev: 1,
  routeRev: 1,
  opSeq: 1,
  tree: {},
  routeManifest: {},
  documents,
});

const createDocumentContent = (nodeId: string) =>
  createMirDoc([{ id: nodeId, type: 'MdrText', text: nodeId }]);

describe('useEditorStore workspace state', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('prefers the root mir-page document as canonical active document', () => {
    useEditorStore.getState().setWorkspaceSnapshot(
      createWorkspaceSnapshot('ws-1', [
        {
          id: 'layout-1',
          type: 'mir-layout',
          path: '/layout',
          contentRev: 1,
          metaRev: 1,
          content: createDocumentContent('layout'),
        },
        {
          id: 'page-about',
          type: 'mir-page',
          path: '/about',
          contentRev: 1,
          metaRev: 1,
          content: createDocumentContent('about'),
        },
        {
          id: 'page-root',
          type: 'mir-page',
          path: '/',
          contentRev: 1,
          metaRev: 1,
          content: createDocumentContent('root'),
        },
      ])
    );

    const state = useEditorStore.getState();
    expect(state.activeDocumentId).toBe('page-root');
    expect(state.mirDoc.ui.root.children?.[0]?.id).toBe('root');
  });

  it('keeps active document when refreshing the same workspace snapshot', () => {
    const store = useEditorStore.getState();
    store.setWorkspaceSnapshot(
      createWorkspaceSnapshot('ws-1', [
        {
          id: 'page-root',
          type: 'mir-page',
          path: '/',
          contentRev: 1,
          metaRev: 1,
          content: createDocumentContent('root-v1'),
        },
        {
          id: 'page-about',
          type: 'mir-page',
          path: '/about',
          contentRev: 1,
          metaRev: 1,
          content: createDocumentContent('about-v1'),
        },
      ])
    );
    store.setActiveDocumentId('page-about');
    store.setWorkspaceSnapshot(
      createWorkspaceSnapshot('ws-1', [
        {
          id: 'page-root',
          type: 'mir-page',
          path: '/',
          contentRev: 2,
          metaRev: 1,
          content: createDocumentContent('root-v2'),
        },
        {
          id: 'page-about',
          type: 'mir-page',
          path: '/about',
          contentRev: 2,
          metaRev: 1,
          content: createDocumentContent('about-v2'),
        },
      ])
    );

    const state = useEditorStore.getState();
    expect(state.activeDocumentId).toBe('page-about');
    expect(state.mirDoc.ui.root.children?.[0]?.id).toBe('about-v2');
  });

  it('resets capabilities when switching to another workspace snapshot', () => {
    const store = useEditorStore.getState();
    store.setWorkspaceSnapshot(
      createWorkspaceSnapshot('ws-1', [
        {
          id: 'page-root',
          type: 'mir-page',
          path: '/',
          contentRev: 1,
          metaRev: 1,
          content: createDocumentContent('ws1-root'),
        },
      ])
    );
    store.setWorkspaceCapabilities('ws-1', {
      'core.mir.document.update@1.0': true,
    });
    store.setWorkspaceSnapshot(
      createWorkspaceSnapshot('ws-2', [
        {
          id: 'page-root-2',
          type: 'mir-page',
          path: '/',
          contentRev: 1,
          metaRev: 1,
          content: createDocumentContent('ws2-root'),
        },
      ])
    );

    const state = useEditorStore.getState();
    expect(state.workspaceId).toBe('ws-2');
    expect(state.workspaceCapabilitiesLoaded).toBe(false);
    expect(state.workspaceCapabilities).toEqual({});
  });
});
