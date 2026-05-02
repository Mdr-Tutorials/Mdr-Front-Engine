import type { StateCreator } from 'zustand';
import type { EditorStore } from './editorStore.shape';

export type ProjectKind = 'project' | 'component' | 'nodegraph';

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
  type: ProjectKind;
  isPublic?: boolean;
  starsCount?: number;
}

export interface ProjectInput {
  id: string;
  name: string;
  description?: string;
  type?: ProjectKind;
  isPublic?: boolean;
  starsCount?: number;
}

export interface ProjectSlice {
  projectsById: Record<string, ProjectRecord>;
  setProject: (project: ProjectInput) => void;
  setProjects: (projects: ProjectInput[]) => void;
  removeProject: (projectId: string) => void;
}

const normalizeProject = (project: ProjectInput): ProjectRecord => ({
  ...project,
  type: project.type ?? 'project',
  isPublic: project.isPublic ?? false,
  starsCount: project.starsCount ?? 0,
});

export const createProjectSlice: StateCreator<
  EditorStore,
  [],
  [],
  ProjectSlice
> = (set) => ({
  projectsById: {},
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
});
