import type { MIRDocument } from '@/core/types/engine.types';
import type {
  WorkspaceDocumentRecord,
  WorkspaceMutationResponse,
  WorkspaceSnapshot,
} from '@/editor/editorApi';
import {
  createDefaultMirDoc,
  resolveCanonicalWorkspaceDocumentId,
} from '@/mir/resolveMirDocument';
import { create } from 'zustand';
import {
  hasRouteNodeId,
  normalizeRouteManifest,
  normalizeWorkspaceDocument,
  normalizeWorkspaceTree,
  resolveActiveRouteNodeId,
  resolveDefaultActiveRouteNodeId,
} from './editorStore.normalizers';
import { applyRouteIntentToState } from './editorStore.routeIntent';
import {
  DEFAULT_BLUEPRINT_STATE,
  DEFAULT_ROUTE_MANIFEST,
  type BlueprintState,
  type RouteIntent,
  type WorkspaceRouteManifest,
  type WorkspaceVfsNode,
} from './editorStore.types';
import { findRouteNodeById, updateRouteNodeById } from './routeManifest';

export { createDefaultMirDoc } from '@/mir/resolveMirDocument';
export {
  DEFAULT_BLUEPRINT_STATE,
  type BlueprintState,
  type RouteIntent,
  type WorkspaceRouteManifest,
  type WorkspaceRouteNode,
  type WorkspaceVfsNode,
} from './editorStore.types';

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
  treeRootId?: string;
  treeById: Record<string, WorkspaceVfsNode>;
  workspaceCapabilities: Record<string, boolean>;
  workspaceCapabilitiesLoaded: boolean;
  routeManifest: WorkspaceRouteManifest;
  activeRouteNodeId?: string;
  setWorkspaceSnapshot: (workspace: WorkspaceSnapshot) => void;
  setWorkspaceCapabilities: (
    workspaceId: string,
    capabilities: Record<string, boolean>
  ) => void;
  clearWorkspaceState: () => void;
  setActiveDocumentId: (documentId: string | undefined) => void;
  setActiveRouteNodeId: (routeNodeId: string | undefined) => void;
  updateRouteManifest: (
    updater: (manifest: WorkspaceRouteManifest) => WorkspaceRouteManifest
  ) => void;
  applyRouteIntent: (intent: RouteIntent) => void;
  bindOutletToRoute: (
    routeNodeId: string,
    outletNodeId: string | undefined
  ) => void;
  applyWorkspaceMutation: (mutation: WorkspaceMutationResponse) => void;
  blueprintStateByProject: Record<string, BlueprintState>;
  runtimeStateByProject: Record<string, Record<string, unknown>>;
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
  patchRuntimeState: (
    projectId: string,
    patch: Record<string, unknown>
  ) => void;
  resetRuntimeState: (projectId?: string) => void;
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

const normalizeProject = (project: {
  id: string;
  name: string;
  description?: string;
  type?: 'project' | 'component' | 'nodegraph';
  isPublic?: boolean;
  starsCount?: number;
}) => ({
  ...project,
  type: project.type ?? 'project',
  isPublic: project.isPublic ?? false,
  starsCount: project.starsCount ?? 0,
});

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
  treeRootId: undefined,
  treeById: {},
  workspaceCapabilities: {},
  workspaceCapabilitiesLoaded: false,
  routeManifest: DEFAULT_ROUTE_MANIFEST,
  activeRouteNodeId: undefined,
  setWorkspaceSnapshot: (workspace) =>
    set((state) => {
      const isSameWorkspace = state.workspaceId === workspace.id;
      const nextDocumentsById: Record<string, WorkspaceDocumentRecord> = {};
      workspace.documents.forEach((document) => {
        nextDocumentsById[document.id] = normalizeWorkspaceDocument(document);
      });

      const nextActiveDocumentId =
        state.activeDocumentId && nextDocumentsById[state.activeDocumentId]
          ? state.activeDocumentId
          : resolveCanonicalWorkspaceDocumentId(workspace.documents);
      const { treeRootId, treeById } = normalizeWorkspaceTree(
        workspace.tree,
        nextDocumentsById
      );
      const activeDocument = nextActiveDocumentId
        ? nextDocumentsById[nextActiveDocumentId]
        : undefined;
      const nextRouteManifest = normalizeRouteManifest(workspace.routeManifest);
      const nextActiveRouteNodeId = resolveActiveRouteNodeId(
        nextRouteManifest,
        [workspace.activeRouteNodeId, state.activeRouteNodeId]
      );

      return {
        workspaceId: workspace.id,
        workspaceRev: workspace.workspaceRev,
        routeRev: workspace.routeRev,
        opSeq: workspace.opSeq,
        workspaceDocumentsById: nextDocumentsById,
        treeRootId,
        treeById,
        workspaceCapabilities: isSameWorkspace
          ? state.workspaceCapabilities
          : {},
        workspaceCapabilitiesLoaded: isSameWorkspace
          ? state.workspaceCapabilitiesLoaded
          : false,
        routeManifest: nextRouteManifest,
        activeRouteNodeId: nextActiveRouteNodeId,
        activeDocumentId: nextActiveDocumentId,
        mirDoc: activeDocument?.content ?? state.mirDoc,
      };
    }),
  setWorkspaceCapabilities: (workspaceId, capabilities) =>
    set((state) => {
      const normalizedWorkspaceId = workspaceId.trim();
      if (
        !normalizedWorkspaceId ||
        normalizedWorkspaceId !== state.workspaceId
      ) {
        return state;
      }
      return {
        workspaceCapabilities: { ...capabilities },
        workspaceCapabilitiesLoaded: true,
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
      treeRootId: undefined,
      treeById: {},
      workspaceCapabilities: {},
      workspaceCapabilitiesLoaded: false,
      routeManifest: DEFAULT_ROUTE_MANIFEST,
      activeRouteNodeId: undefined,
      runtimeStateByProject: {},
    }),
  setActiveDocumentId: (documentId) =>
    set((state) => {
      const normalizedDocumentId = documentId?.trim();
      if (!normalizedDocumentId) {
        return { activeDocumentId: undefined };
      }
      const nextDocument = state.workspaceDocumentsById[normalizedDocumentId];
      if (!nextDocument) {
        return state;
      }
      return {
        activeDocumentId: normalizedDocumentId,
        mirDoc: nextDocument.content,
      };
    }),
  setActiveRouteNodeId: (routeNodeId) =>
    set((state) => {
      const normalizedRouteNodeId = routeNodeId?.trim();
      if (!normalizedRouteNodeId) {
        return {
          activeRouteNodeId: resolveDefaultActiveRouteNodeId(
            state.routeManifest
          ),
        };
      }
      if (!hasRouteNodeId(state.routeManifest.root, normalizedRouteNodeId)) {
        return state;
      }
      return { activeRouteNodeId: normalizedRouteNodeId };
    }),
  updateRouteManifest: (updater) =>
    set((state) => {
      const nextRouteManifest = normalizeRouteManifest(
        updater(state.routeManifest)
      );
      const nextActiveRouteNodeId = resolveActiveRouteNodeId(
        nextRouteManifest,
        [state.activeRouteNodeId]
      );
      return {
        routeManifest: nextRouteManifest,
        activeRouteNodeId: nextActiveRouteNodeId,
      };
    }),
  applyRouteIntent: (intent) =>
    set((state) => {
      const next = applyRouteIntentToState(state, intent);
      if (!next) return state;
      return next;
    }),
  bindOutletToRoute: (routeNodeId, outletNodeId) =>
    set((state) => {
      const normalizedRouteNodeId = routeNodeId.trim();
      if (!normalizedRouteNodeId) return state;
      const normalizedOutletNodeId = outletNodeId?.trim();
      const currentNode = findRouteNodeById(
        state.routeManifest.root,
        normalizedRouteNodeId
      );
      if (!currentNode) return state;
      if ((currentNode.outletNodeId ?? '') === (normalizedOutletNodeId ?? '')) {
        return state;
      }
      const nextManifest: WorkspaceRouteManifest = {
        ...state.routeManifest,
        root: updateRouteNodeById(
          state.routeManifest.root,
          normalizedRouteNodeId,
          (target) => ({
            ...target,
            outletNodeId: normalizedOutletNodeId || undefined,
          })
        ),
      };
      return {
        routeManifest: normalizeRouteManifest(nextManifest),
      };
    }),
  applyWorkspaceMutation: (mutation) =>
    set((state) => {
      if (!state.workspaceId || state.workspaceId !== mutation.workspaceId) {
        return state;
      }

      let nextDocumentsById = state.workspaceDocumentsById;
      if (mutation.updatedDocuments?.length) {
        nextDocumentsById = { ...state.workspaceDocumentsById };
        mutation.updatedDocuments.forEach((documentRevision) => {
          const previousDocument = nextDocumentsById[documentRevision.id];
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
  runtimeStateByProject: {},
  projectsById: {},
  setBlueprintState: (projectId, partial) =>
    set((state) => {
      const previous =
        state.blueprintStateByProject[projectId] ?? DEFAULT_BLUEPRINT_STATE;
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
  patchRuntimeState: (projectId, patch) =>
    set((state) => {
      const normalizedProjectId = projectId.trim();
      if (!normalizedProjectId) return state;
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return state;
      }
      const previous = state.runtimeStateByProject[normalizedProjectId] ?? {};
      return {
        runtimeStateByProject: {
          ...state.runtimeStateByProject,
          [normalizedProjectId]: {
            ...previous,
            ...patch,
          },
        },
      };
    }),
  resetRuntimeState: (projectId) =>
    set((state) => {
      const normalizedProjectId = projectId?.trim();
      if (!normalizedProjectId) {
        if (!Object.keys(state.runtimeStateByProject).length) return state;
        return { runtimeStateByProject: {} };
      }
      if (!state.runtimeStateByProject[normalizedProjectId]) return state;
      const nextRuntimeStateByProject = { ...state.runtimeStateByProject };
      delete nextRuntimeStateByProject[normalizedProjectId];
      return { runtimeStateByProject: nextRuntimeStateByProject };
    }),
  setProject: (project) =>
    set((state) => ({
      projectsById: {
        ...state.projectsById,
        [project.id]: normalizeProject(project),
      },
    })),
  setProjects: (projects) =>
    set((state) => {
      const nextProjectsById = { ...state.projectsById };
      projects.forEach((project) => {
        nextProjectsById[project.id] = normalizeProject(project);
      });
      return { projectsById: nextProjectsById };
    }),
  removeProject: (projectId) =>
    set((state) => {
      if (!state.projectsById[projectId]) return state;
      const nextProjectsById = { ...state.projectsById };
      delete nextProjectsById[projectId];
      const nextRuntimeStateByProject = { ...state.runtimeStateByProject };
      delete nextRuntimeStateByProject[projectId];
      return {
        projectsById: nextProjectsById,
        runtimeStateByProject: nextRuntimeStateByProject,
      };
    }),
}));
