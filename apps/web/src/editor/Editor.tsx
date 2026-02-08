import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router';
import EditorBar from './EditorBar/EditorBar';
import { SettingsEffects } from './features/settings/SettingsEffects';
import { useAuthStore } from '@/auth/useAuthStore';
import { editorApi } from './editorApi';
import { useEditorStore } from './store/useEditorStore';

function Editor() {
    const { projectId } = useParams();
    const token = useAuthStore((state) => state.token);
    const setProject = useEditorStore((state) => state.setProject);
    const setMirDoc = useEditorStore((state) => state.setMirDoc);
    const setWorkspaceSnapshot = useEditorStore(
        (state) => state.setWorkspaceSnapshot
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
                        if (!workspace.documents.length) {
                            clearWorkspaceState();
                            setMirDoc(project.mir);
                            return;
                        }
                        setWorkspaceSnapshot(workspace);
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
        setMirDoc,
        setProject,
        setWorkspaceSnapshot,
    ]);

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
