import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ApiError } from '@/auth/authApi';
import { useAuthStore } from '@/auth/useAuthStore';
import { editorApi } from '@/editor/editorApi';
import { useEditorStore } from '@/editor/store/useEditorStore';
import {
  createMirDoc,
  resetEditorStore,
  resetSettingsStore,
} from '@/test-utils/editorStore';
import BlueprintEditor from '@/editor/features/design/BlueprintEditor';

const PROJECT_ID = 'project-1';

vi.mock('react-router', () => ({
  useParams: () => ({ projectId: PROJECT_ID }),
}));

vi.mock('@dnd-kit/core', () => {
  const DndContext = ({ children }: { children: ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  );
  const DragOverlay = ({ children }: { children?: ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  );
  class PointerSensor {}
  const useSensor = () => ({});
  const useSensors = (...sensors: unknown[]) => sensors;
  return { DndContext, DragOverlay, PointerSensor, useSensor, useSensors };
});

vi.mock('../BlueprintEditorAddressBar', () => ({
  BlueprintEditorAddressBar: ({
    statusIndicator,
  }: {
    statusIndicator?: ReactNode;
  }) => <div data-testid="address-bar">{statusIndicator}</div>,
}));

vi.mock('../BlueprintEditorViewportBar', () => ({
  BlueprintEditorViewportBar: () => <div data-testid="viewport-bar" />,
}));

vi.mock('../BlueprintEditorSidebar', () => ({
  BlueprintEditorSidebar: () => <aside data-testid="sidebar" />,
}));

vi.mock('../BlueprintEditorComponentTree', () => ({
  BlueprintEditorComponentTree: () => <aside data-testid="component-tree" />,
}));

vi.mock('../BlueprintEditorCanvas', () => ({
  BlueprintEditorCanvas: () => <section data-testid="canvas" />,
}));

vi.mock('../BlueprintEditorInspector', () => ({
  BlueprintEditorInspector: () => <aside data-testid="inspector" />,
}));

const withWorkspaceDocumentState = (capable: boolean, loaded = true) => ({
  workspaceId: 'ws-1',
  workspaceRev: 6,
  routeRev: 3,
  opSeq: 11,
  workspaceCapabilitiesLoaded: loaded,
  workspaceCapabilities: capable
    ? { 'core.mir.document.update@1.0': true }
    : loaded
      ? { 'core.mir.document.update@1.0': false }
      : {},
  activeDocumentId: 'doc-home',
  workspaceDocumentsById: {
    'doc-home': {
      id: 'doc-home',
      type: 'mir-page' as const,
      path: '/home',
      contentRev: 3,
      metaRev: 2,
      content: createMirDoc(),
      updatedAt: '2026-02-08T10:00:00.000Z',
    },
  },
  mirDoc: createMirDoc(),
});

beforeEach(() => {
  vi.restoreAllMocks();
  resetEditorStore();
  resetSettingsStore();
  useAuthStore.setState({
    token: null,
    expiresAt: null,
    user: null,
  });
});

describe('BlueprintEditor autosave', () => {
  it('saves the active workspace document through workspace api when metadata is available', async () => {
    vi.useFakeTimers();

    const saveWorkspaceDocument = vi
      .spyOn(editorApi, 'saveWorkspaceDocument')
      .mockResolvedValue({
        workspaceId: 'ws-1',
        workspaceRev: 7,
        routeRev: 3,
        opSeq: 12,
        updatedDocuments: [{ id: 'doc-home', contentRev: 4, metaRev: 2 }],
      });
    const saveProjectMir = vi
      .spyOn(editorApi, 'saveProjectMir')
      .mockRejectedValue(new ApiError('should not call project save', 500));

    useAuthStore.setState({
      token: 'token-1',
      expiresAt: null,
      user: null,
    });
    resetEditorStore(withWorkspaceDocumentState(true));

    try {
      render(<BlueprintEditor />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(701);
      });

      expect(saveWorkspaceDocument).toHaveBeenCalledTimes(1);
      expect(saveProjectMir).not.toHaveBeenCalled();

      const [token, workspaceId, documentId, payload] =
        saveWorkspaceDocument.mock.calls[0];
      expect(token).toBe('token-1');
      expect(workspaceId).toBe('ws-1');
      expect(documentId).toBe('doc-home');
      expect(payload.expectedContentRev).toBe(3);
      expect(payload.command?.target.workspaceId).toBe('ws-1');
      expect(payload.command?.target.documentId).toBe('doc-home');

      const state = useEditorStore.getState();
      expect(state.workspaceRev).toBe(7);
      expect(state.opSeq).toBe(12);
      expect(state.workspaceDocumentsById['doc-home']?.contentRev).toBe(4);
      expect(
        screen
          .getByTestId('blueprint-save-indicator')
          .getAttribute('data-transport')
      ).toBe('workspace');
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to project mir save when workspace document capability is disabled', async () => {
    vi.useFakeTimers();

    const saveWorkspaceDocument = vi
      .spyOn(editorApi, 'saveWorkspaceDocument')
      .mockRejectedValue(new ApiError('should not call workspace save', 500));
    const saveProjectMir = vi
      .spyOn(editorApi, 'saveProjectMir')
      .mockResolvedValue({
        project: {
          id: PROJECT_ID,
          ownerId: 'owner-1',
          name: 'Project',
          description: 'Fallback',
          resourceType: 'project',
          isPublic: false,
          starsCount: 0,
          createdAt: '2026-02-08T10:00:00.000Z',
          updatedAt: '2026-02-08T10:00:00.000Z',
          mir: createMirDoc(),
        },
      });

    useAuthStore.setState({
      token: 'token-1',
      expiresAt: null,
      user: null,
    });
    resetEditorStore(withWorkspaceDocumentState(false));

    try {
      render(<BlueprintEditor />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(701);
      });

      expect(saveWorkspaceDocument).not.toHaveBeenCalled();
      expect(saveProjectMir).toHaveBeenCalledTimes(1);
      const [token, projectId] = saveProjectMir.mock.calls[0];
      expect(token).toBe('token-1');
      expect(projectId).toBe(PROJECT_ID);
      const saveIndicator = screen.getByTestId('blueprint-save-indicator');
      expect(saveIndicator.getAttribute('data-transport')).toBe('project');
      expect(saveIndicator.textContent).toContain(
        'Workspace document save unavailable'
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits for workspace capabilities before saving and then resumes workspace save', async () => {
    vi.useFakeTimers();

    const saveWorkspaceDocument = vi
      .spyOn(editorApi, 'saveWorkspaceDocument')
      .mockResolvedValue({
        workspaceId: 'ws-1',
        workspaceRev: 7,
        routeRev: 3,
        opSeq: 12,
        updatedDocuments: [{ id: 'doc-home', contentRev: 4, metaRev: 2 }],
      });
    const saveProjectMir = vi
      .spyOn(editorApi, 'saveProjectMir')
      .mockRejectedValue(new ApiError('should not call project save', 500));

    useAuthStore.setState({
      token: 'token-1',
      expiresAt: null,
      user: null,
    });
    resetEditorStore(withWorkspaceDocumentState(false, false));

    try {
      render(<BlueprintEditor />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(701);
      });

      expect(saveWorkspaceDocument).not.toHaveBeenCalled();
      expect(saveProjectMir).not.toHaveBeenCalled();
      expect(
        screen.getByTestId('blueprint-save-indicator').textContent
      ).toContain('Checking workspace capabilities');

      act(() => {
        useEditorStore.getState().setWorkspaceCapabilities('ws-1', {
          'core.mir.document.update@1.0': true,
        });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(701);
      });

      expect(saveWorkspaceDocument).toHaveBeenCalledTimes(1);
      expect(saveProjectMir).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns save indicator to idle after showing saved state', async () => {
    vi.useFakeTimers();

    const saveWorkspaceDocument = vi
      .spyOn(editorApi, 'saveWorkspaceDocument')
      .mockResolvedValue({
        workspaceId: 'ws-1',
        workspaceRev: 7,
        routeRev: 3,
        opSeq: 12,
        updatedDocuments: [{ id: 'doc-home', contentRev: 4, metaRev: 2 }],
      });

    useAuthStore.setState({
      token: 'token-1',
      expiresAt: null,
      user: null,
    });
    resetEditorStore(withWorkspaceDocumentState(true));

    try {
      render(<BlueprintEditor />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(701);
      });

      expect(saveWorkspaceDocument).toHaveBeenCalledTimes(1);
      expect(
        screen
          .getByTestId('blueprint-save-indicator')
          .getAttribute('data-status')
      ).toBe('saved');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1501);
      });

      const saveIndicator = screen.getByTestId('blueprint-save-indicator');
      expect(saveIndicator.getAttribute('data-status')).toBe('idle');
      expect(saveIndicator.getAttribute('data-transport')).toBe('none');
    } finally {
      vi.useRealTimers();
    }
  });
});
