import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import EditorBar from './EditorBar/EditorBar';
import { SettingsEffects } from './features/settings/SettingsEffects';
import { useAuthStore } from '@/auth/useAuthStore';
import { mountGraphExecutionBridge } from '@/core/executor/executor';
import { mountDefaultNodeGraphExecutor } from '@/core/executor/nodeGraph/mountDefaultNodeGraphExecutor';
import { editorApi } from './editorApi';
import { EditorShortcutProvider, useEditorShortcut } from './shortcuts';
import { isAbortError } from '@/infra/api';
import { useEditorStore } from './store/useEditorStore';
import { useSettingsStore } from './store/useSettingsStore';

function EditorGlobalShortcuts({
  projectId,
  pathname,
}: {
  projectId?: string;
  pathname: string;
}) {
  const navigate = useNavigate();

  useEditorShortcut(
    'Alt+1',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+2',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/blueprint`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+3',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/nodegraph`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+4',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/animation`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+5',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/component`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+6',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/resources`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+7',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/test`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+8',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/export`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );
  useEditorShortcut(
    'Alt+9',
    () => {
      if (!projectId) return;
      const nextPath = `/editor/project/${projectId}/deployment`;
      if (pathname === nextPath) return;
      navigate(nextPath);
    },
    { enabled: Boolean(projectId) }
  );

  return null;
}

function Editor() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const setProject = useEditorStore((state) => state.setProject);
  const setMirDoc = useEditorStore((state) => state.setMirDoc);
  const setWorkspaceSnapshot = useEditorStore(
    (state) => state.setWorkspaceSnapshot
  );
  const setWorkspaceCapabilities = useEditorStore(
    (state) => state.setWorkspaceCapabilities
  );
  const hydrateWorkspaceSettings = useSettingsStore(
    (state) => state.hydrateWorkspaceSettings
  );
  const clearWorkspaceState = useEditorStore(
    (state) => state.clearWorkspaceState
  );

  useEffect(() => {
    if (!projectId || !token) return;
    let cancelled = false;
    const controller =
      typeof AbortController === 'function' ? new AbortController() : null;
    const requestOptions: RequestInit = controller
      ? { signal: controller.signal }
      : {};

    editorApi
      .getProject(token, projectId, requestOptions)
      .then(({ project }) => {
        if (cancelled) return;
        setProject({
          id: project.id,
          name: project.name,
          description: project.description,
          type: project.resourceType,
          isPublic: project.isPublic,
          starsCount: project.starsCount,
        });
        editorApi
          .getWorkspace(token, projectId, requestOptions)
          .then(({ workspace }) => {
            if (cancelled) return;
            hydrateWorkspaceSettings(workspace.settings);
            if (!workspace.documents.length) {
              clearWorkspaceState();
              setMirDoc(project.mir);
              return;
            }
            setWorkspaceSnapshot(workspace);
            editorApi
              .getWorkspaceCapabilities(token, workspace.id, requestOptions)
              .then((response) => {
                if (cancelled) return;
                setWorkspaceCapabilities(
                  response.workspaceId,
                  response.capabilities
                );
              })
              .catch((error: unknown) => {
                if (cancelled || isAbortError(error)) return;
                setWorkspaceCapabilities(workspace.id, {});
              });
          })
          .catch((error: unknown) => {
            if (cancelled || isAbortError(error)) return;
            clearWorkspaceState();
            setMirDoc(project.mir);
          });
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        clearWorkspaceState();
      });

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [
    projectId,
    token,
    clearWorkspaceState,
    hydrateWorkspaceSettings,
    setMirDoc,
    setProject,
    setWorkspaceCapabilities,
    setWorkspaceSnapshot,
  ]);

  useEffect(() => {
    const unmountBridge = mountGraphExecutionBridge();
    const unmountNodeGraphExecutor = mountDefaultNodeGraphExecutor({
      getMirDoc: () => useEditorStore.getState().mirDoc,
    });
    return () => {
      unmountNodeGraphExecutor();
      unmountBridge();
    };
  }, []);

  return (
    <EditorShortcutProvider>
      <EditorGlobalShortcuts
        projectId={projectId}
        pathname={location.pathname}
      />
      <div className="flex max-h-screen min-h-screen flex-row bg-[linear-gradient(120deg,var(--bg-canvas)_20%,var(--bg-panel)_100%)]">
        <SettingsEffects />
        <EditorBar />
        <div className="min-h-screen flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </EditorShortcutProvider>
  );
}

export default Editor;
