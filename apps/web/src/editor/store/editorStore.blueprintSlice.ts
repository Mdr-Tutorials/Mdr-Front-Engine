import type { StateCreator } from 'zustand';
import {
  DEFAULT_BLUEPRINT_STATE,
  type BlueprintState,
} from './editorStore.types';
import type { EditorStore } from './editorStore.shape';

export interface BlueprintSlice {
  blueprintStateByProject: Record<string, BlueprintState>;
  runtimeStateByProject: Record<string, Record<string, unknown>>;
  setBlueprintState: (
    projectId: string,
    partial: Partial<BlueprintState>
  ) => void;
  patchRuntimeState: (
    projectId: string,
    patch: Record<string, unknown>
  ) => void;
  resetRuntimeState: (projectId?: string) => void;
}

export const createBlueprintSlice: StateCreator<
  EditorStore,
  [],
  [],
  BlueprintSlice
> = (set) => ({
  blueprintStateByProject: {},
  runtimeStateByProject: {},
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
});
