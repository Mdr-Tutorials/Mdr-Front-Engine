import type { StateCreator } from 'zustand';
import type { MIRDocument } from '@/core/types/engine.types';
import { createDefaultMirDoc } from '@/mir/resolveMirDocument';
import type { EditorStore } from './editorStore.shape';

export interface MirSlice {
  mirDoc: MIRDocument;
  mirDocRevision: number;
  setMirDoc: (doc: MIRDocument) => void;
  updateMirDoc: (updater: (doc: MIRDocument) => MIRDocument) => void;
}

export const createMirSlice: StateCreator<EditorStore, [], [], MirSlice> = (
  set
) => ({
  mirDoc: createDefaultMirDoc(),
  mirDocRevision: 0,
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
        return {
          mirDoc: nextMirDoc,
          mirDocRevision: state.mirDocRevision + 1,
        };
      }
      const activeDocument =
        state.workspaceDocumentsById[state.activeDocumentId];
      if (!activeDocument) {
        return {
          mirDoc: nextMirDoc,
          mirDocRevision: state.mirDocRevision + 1,
        };
      }
      return {
        mirDoc: nextMirDoc,
        mirDocRevision: state.mirDocRevision + 1,
        workspaceDocumentsById: {
          ...state.workspaceDocumentsById,
          [state.activeDocumentId]: {
            ...activeDocument,
            content: nextMirDoc,
          },
        },
      };
    }),
});
