import { create } from 'zustand';
import { createBlueprintSlice } from './editorStore.blueprintSlice';
import { createMirSlice } from './editorStore.mirSlice';
import { createProjectSlice } from './editorStore.projectSlice';
import { createRouteSlice } from './editorStore.routeSlice';
import { createWorkspaceSlice } from './editorStore.workspaceSlice';
import type { EditorStore } from './editorStore.shape';

export { createDefaultMirDoc } from '@/mir/resolveMirDocument';
export {
  DEFAULT_BLUEPRINT_STATE,
  type BlueprintState,
  type RouteIntent,
  type WorkspaceRouteManifest,
  type WorkspaceRouteNode,
  type WorkspaceVfsNode,
} from './editorStore.types';

export const useEditorStore = create<EditorStore>()((...args) => ({
  ...createMirSlice(...args),
  ...createWorkspaceSlice(...args),
  ...createRouteSlice(...args),
  ...createBlueprintSlice(...args),
  ...createProjectSlice(...args),
}));
