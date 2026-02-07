import type { MIRDocument } from '@/core/types/engine.types';
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

interface EditorStore {
  mirDoc: MIRDocument;
  setMirDoc: (doc: MIRDocument) => void;
  updateMirDoc: (updater: (doc: MIRDocument) => MIRDocument) => void;
  generatedCode: string;
  isExportModalOpen: boolean;
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

  setGeneratedCode: (code: string) => void;
  setExportModalOpen: (open: boolean) => void;
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
  setMirDoc: (doc) => set({ mirDoc: doc }),
  updateMirDoc: (updater) =>
    set((state) => ({ mirDoc: updater(state.mirDoc) })),
  generatedCode: '',
  isExportModalOpen: false,
  blueprintStateByProject: {},
  projectsById: {},

  setGeneratedCode: (code) => set({ generatedCode: code }),
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
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
