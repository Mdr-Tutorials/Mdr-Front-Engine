import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import EditorBar from './EditorBar/EditorBar';
import { SettingsEffects } from './features/settings/SettingsEffects';
import { useAuthStore } from '@/auth/useAuthStore';
import { mountGraphExecutionBridge } from '@/core/executor/executor';
import { editorApi } from './editorApi';
import { useEditorStore } from './store/useEditorStore';
import { useSettingsStore } from './store/useSettingsStore';

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

    editorApi
      .getProject(token, projectId)
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
          .getWorkspace(token, projectId)
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
              .getWorkspaceCapabilities(token, workspace.id)
              .then((response) => {
                if (cancelled) return;
                setWorkspaceCapabilities(
                  response.workspaceId,
                  response.capabilities
                );
              })
              .catch(() => {
                if (cancelled) return;
                setWorkspaceCapabilities(workspace.id, {});
              });
          })
          .catch(() => {
            if (cancelled) return;
            clearWorkspaceState();
            setMirDoc(project.mir);
          });
      })
      .catch(() => {
        if (cancelled) return;
        clearWorkspaceState();
      });

    return () => {
      cancelled = true;
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

  useEffect(() => mountGraphExecutionBridge(), []);

  useEffect(() => {
    if (!projectId) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === 'input' || tagName === 'textarea' || tagName === 'select'
      );
    };

    const routeByDigit: Record<string, string> = {
      '1': `/editor/project/${projectId}`,
      '2': `/editor/project/${projectId}/blueprint`,
      '3': `/editor/project/${projectId}/nodegraph`,
      '4': `/editor/project/${projectId}/animation`,
      '5': `/editor/project/${projectId}/component`,
      '6': `/editor/project/${projectId}/resources`,
      '7': `/editor/project/${projectId}/test`,
      '8': `/editor/project/${projectId}/export`,
      '9': `/editor/project/${projectId}/deployment`,
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isEditableTarget(event.target)) return;
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const nextPath = routeByDigit[event.key];
      if (!nextPath) return;
      if (location.pathname === nextPath) return;
      event.preventDefault();
      navigate(nextPath);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [location.pathname, navigate, projectId]);

  return (
    <div className="flex min-h-screen max-h-screen flex-row bg-[linear-gradient(120deg,var(--color-0)_20%,var(--color-1)_100%)]">
      <SettingsEffects />
      <EditorBar />
      <div className="min-h-screen flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default Editor;
