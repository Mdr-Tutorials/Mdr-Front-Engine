import type { MIRDocument } from '@/core/types/engine.types';
import type {
    WorkspaceDocumentRecord,
    WorkspaceMutationResponse,
    WorkspaceSnapshot,
} from '@/editor/editorApi';
import { create } from 'zustand';

export type BlueprintState = {
    viewportWidth: string;
    viewportHeight: string;
    zoom: number;
    pan: { x: number; y: number };
    selectedId?: string;
};

export const DEFAULT_BLUEPRINT_STATE: BlueprintState = {
    viewportWidth: '1440',
    viewportHeight: '900',
    zoom: 100,
    pan: { x: 80, y: 60 },
    selectedId: undefined,
};

export const createDefaultMirDoc = (): MIRDocument => ({
    version: '1.0',
    ui: {
        root: {
            id: 'root',
            type: 'container',
        },
    },
});

const normalizeMirContent = (
    content: WorkspaceDocumentRecord['content'] | undefined
): MIRDocument => {
    if (!content || typeof content !== 'object') {
        return createDefaultMirDoc();
    }
    const root = (content as { ui?: { root?: unknown } }).ui?.root;
    if (!root || typeof root !== 'object') {
        return createDefaultMirDoc();
    }
    return content as MIRDocument;
};

const normalizeWorkspaceDocument = (
    document: WorkspaceDocumentRecord
): WorkspaceDocumentRecord => ({
    ...document,
    content: normalizeMirContent(document.content),
});

interface EditorStore {
    mirDoc: MIRDocument;
    setMirDoc: (doc: MIRDocument) => void;
    updateMirDoc: (updater: (doc: MIRDocument) => MIRDocument) => void;
    workspaceId?: string;
    workspaceRev?: number;
    routeRev?: number;
    opSeq?: number;
    activeDocumentId?: string;
    workspaceDocumentsById: Record<string, WorkspaceDocumentRecord>;
    setWorkspaceSnapshot: (workspace: WorkspaceSnapshot) => void;
    clearWorkspaceState: () => void;
    setActiveDocumentId: (documentId: string | undefined) => void;
    applyWorkspaceMutation: (mutation: WorkspaceMutationResponse) => void;
    blueprintStateByProject: Record<string, BlueprintState>;
    projectsById: Record<
        string,
        {
            id: string;
            name: string;
            description?: string;
            type: 'project' | 'component' | 'nodegraph';
            isPublic?: boolean;
            starsCount?: number;
        }
    >;
    setBlueprintState: (
        projectId: string,
        partial: Partial<BlueprintState>
    ) => void;
    setProject: (project: {
        id: string;
        name: string;
        description?: string;
        type?: 'project' | 'component' | 'nodegraph';
        isPublic?: boolean;
        starsCount?: number;
    }) => void;
    setProjects: (
        projects: Array<{
            id: string;
            name: string;
            description?: string;
            type?: 'project' | 'component' | 'nodegraph';
            isPublic?: boolean;
            starsCount?: number;
        }>
    ) => void;
    removeProject: (projectId: string) => void;
}

export const useEditorStore = create<EditorStore>()((set) => ({
    mirDoc: createDefaultMirDoc(),
    setMirDoc: (doc) =>
        set((state) => {
            if (!state.activeDocumentId) {
                return { mirDoc: doc };
            }
            const activeDocument =
                state.workspaceDocumentsById[state.activeDocumentId];
            if (!activeDocument) {
                return { mirDoc: doc };
            }
            return {
                mirDoc: doc,
                workspaceDocumentsById: {
                    ...state.workspaceDocumentsById,
                    [state.activeDocumentId]: {
                        ...activeDocument,
                        content: doc,
                    },
                },
            };
        }),
    updateMirDoc: (updater) =>
        set((state) => {
            const nextMirDoc = updater(state.mirDoc);
            if (nextMirDoc === state.mirDoc) {
                return state;
            }
            if (!state.activeDocumentId) {
                return { mirDoc: nextMirDoc };
            }
            const activeDocument =
                state.workspaceDocumentsById[state.activeDocumentId];
            if (!activeDocument) {
                return { mirDoc: nextMirDoc };
            }
            return {
                mirDoc: nextMirDoc,
                workspaceDocumentsById: {
                    ...state.workspaceDocumentsById,
                    [state.activeDocumentId]: {
                        ...activeDocument,
                        content: nextMirDoc,
                    },
                },
            };
        }),
    workspaceId: undefined,
    workspaceRev: undefined,
    routeRev: undefined,
    opSeq: undefined,
    activeDocumentId: undefined,
    workspaceDocumentsById: {},
    setWorkspaceSnapshot: (workspace) =>
        set((state) => {
            const nextDocumentsById: Record<string, WorkspaceDocumentRecord> =
                {};
            workspace.documents.forEach((document) => {
                nextDocumentsById[document.id] =
                    normalizeWorkspaceDocument(document);
            });

            const nextActiveDocumentId =
                state.activeDocumentId &&
                nextDocumentsById[state.activeDocumentId]
                    ? state.activeDocumentId
                    : workspace.documents[0]?.id;
            const activeDocument = nextActiveDocumentId
                ? nextDocumentsById[nextActiveDocumentId]
                : undefined;

            return {
                workspaceId: workspace.id,
                workspaceRev: workspace.workspaceRev,
                routeRev: workspace.routeRev,
                opSeq: workspace.opSeq,
                workspaceDocumentsById: nextDocumentsById,
                activeDocumentId: nextActiveDocumentId,
                mirDoc: activeDocument?.content ?? state.mirDoc,
            };
        }),
    clearWorkspaceState: () =>
        set({
            workspaceId: undefined,
            workspaceRev: undefined,
            routeRev: undefined,
            opSeq: undefined,
            activeDocumentId: undefined,
            workspaceDocumentsById: {},
        }),
    setActiveDocumentId: (documentId) =>
        set((state) => {
            const normalizedDocumentId = documentId?.trim();
            if (!normalizedDocumentId) {
                return { activeDocumentId: undefined };
            }
            const nextDocument =
                state.workspaceDocumentsById[normalizedDocumentId];
            if (!nextDocument) {
                return state;
            }
            return {
                activeDocumentId: normalizedDocumentId,
                mirDoc: nextDocument.content,
            };
        }),
    applyWorkspaceMutation: (mutation) =>
        set((state) => {
            if (
                !state.workspaceId ||
                state.workspaceId !== mutation.workspaceId
            ) {
                return state;
            }

            let nextDocumentsById = state.workspaceDocumentsById;
            if (mutation.updatedDocuments?.length) {
                nextDocumentsById = { ...state.workspaceDocumentsById };
                mutation.updatedDocuments.forEach((documentRevision) => {
                    const previousDocument =
                        nextDocumentsById[documentRevision.id];
                    if (!previousDocument) {
                        return;
                    }
                    nextDocumentsById[documentRevision.id] = {
                        ...previousDocument,
                        contentRev: documentRevision.contentRev,
                        metaRev: documentRevision.metaRev,
                        ...(documentRevision.id === state.activeDocumentId
                            ? { content: state.mirDoc }
                            : null),
                    };
                });
            }

            return {
                workspaceRev: mutation.workspaceRev,
                routeRev: mutation.routeRev,
                opSeq: mutation.opSeq,
                workspaceDocumentsById: nextDocumentsById,
            };
        }),
    blueprintStateByProject: {},
    projectsById: {},
    setBlueprintState: (projectId, partial) =>
        set((state) => {
            const previous =
                state.blueprintStateByProject[projectId] ??
                DEFAULT_BLUEPRINT_STATE;
            const nextPan = partial.pan
                ? { ...previous.pan, ...partial.pan }
                : previous.pan;
            return {
                blueprintStateByProject: {
                    ...state.blueprintStateByProject,
                    [projectId]: { ...previous, ...partial, pan: nextPan },
                },
            };
        }),
    setProject: (project) =>
        set((state) => ({
            projectsById: {
                ...state.projectsById,
                [project.id]: {
                    ...project,
                    type: project.type ?? 'project',
                    isPublic: project.isPublic ?? false,
                    starsCount: project.starsCount ?? 0,
                },
            },
        })),
    setProjects: (projects) =>
        set((state) => {
            const nextProjectsById = { ...state.projectsById };
            projects.forEach((project) => {
                nextProjectsById[project.id] = {
                    ...project,
                    type: project.type ?? 'project',
                    isPublic: project.isPublic ?? false,
                    starsCount: project.starsCount ?? 0,
                };
            });
            return { projectsById: nextProjectsById };
        }),
    removeProject: (projectId) =>
        set((state) => {
            if (!state.projectsById[projectId]) return state;
            const nextProjectsById = { ...state.projectsById };
            delete nextProjectsById[projectId];
            return { projectsById: nextProjectsById };
        }),
}));
