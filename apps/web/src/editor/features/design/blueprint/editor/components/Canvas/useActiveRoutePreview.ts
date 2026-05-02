import { useMemo } from 'react';
import type { WorkspaceRouteNode } from '@/editor/store/useEditorStore';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { materializeMirRoot } from '@/mir/graph';

export function useActiveRoutePreview() {
  const routeManifest = useEditorStore((state) => state.routeManifest);
  const activeRouteNodeId = useEditorStore((state) => state.activeRouteNodeId);
  const workspaceDocumentsById = useEditorStore(
    (state) => state.workspaceDocumentsById
  );
  const activeRouteNode = useMemo(() => {
    const walk = (node: WorkspaceRouteNode): WorkspaceRouteNode | null => {
      if (!node) return null;
      if (node.id === activeRouteNodeId) return node;
      const children = node.children ?? [];
      for (const child of children) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(routeManifest.root);
  }, [activeRouteNodeId, routeManifest.root]);
  const outletContentNode = useMemo(() => {
    const pageDocId = activeRouteNode?.pageDocId;
    if (!pageDocId) return null;
    const pageDoc = workspaceDocumentsById[pageDocId];
    return pageDoc?.content ? materializeMirRoot(pageDoc.content) : null;
  }, [activeRouteNode, workspaceDocumentsById]);

  return { activeRouteNode, outletContentNode };
}
