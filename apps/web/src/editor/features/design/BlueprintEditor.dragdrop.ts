import { useState } from 'react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import {
    createNodeFromPaletteItem,
    createNodeIdFactory,
} from './BlueprintEditor.palette';
import {
    findNodeById,
    findParentId,
    getTreeDropPlacement,
    insertChildAtIndex,
    insertIntoMirDoc,
    isAncestorOf,
    removeNodeByIdWithNode,
    supportsChildrenForNode,
    type TreeDropPlacement,
} from './BlueprintEditor.tree';
import type { MIRDocument } from '@/core/types/engine.types';

export type TreeDropHint = { overNodeId: string; placement: TreeDropPlacement } | null;

type UseBlueprintDragDropOptions = {
    mirDoc: MIRDocument;
    selectedId?: string;
    updateMirDoc: (updater: (doc: MIRDocument) => MIRDocument) => void;
    onNodeSelect: (nodeId: string) => void;
};

const getOverNodeId = (overData: any, overId: string | null) => {
    if (overData?.kind === 'tree-sort') return overData.nodeId;
    if (overData?.kind === 'tree-node') return overData.nodeId;
    if (overId?.startsWith('tree-node:')) return overId.slice('tree-node:'.length);
    return null;
};

const resolveTreePlacement = (options: {
    canNest: boolean;
    overData: any;
    overRect: { top: number; height: number } | null | undefined;
    activeCenterY: number;
}) => {
    const { canNest, overData, overRect, activeCenterY } = options;
    const hasGeometry = Boolean(
        overRect &&
            Number.isFinite(overRect.top) &&
            Number.isFinite(overRect.height) &&
            overRect.height > 0 &&
            Number.isFinite(activeCenterY)
    );
    if (hasGeometry && overRect) {
        return getTreeDropPlacement({
            canNest,
            overTop: overRect.top,
            overHeight: overRect.height,
            activeCenterY,
        });
    }
    if (overData?.kind === 'tree-node') {
        return canNest ? 'child' : 'after';
    }
    return 'after';
};

export const useBlueprintDragDrop = ({
    mirDoc,
    selectedId,
    updateMirDoc,
    onNodeSelect,
}: UseBlueprintDragDropOptions) => {
    const [activePaletteItemId, setActivePaletteItemId] = useState<string | null>(
        null
    );
    const [treeDropHint, setTreeDropHint] = useState<TreeDropHint>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as any;
        if (data?.kind === 'palette-item') {
            setActivePaletteItemId(String(data.itemId));
        }
    };

    const handleDragMove = (event: DragMoveEvent) => {
        const data = event.active.data.current as any;
        const over = event.over;
        if (!over || data?.kind !== 'tree-sort') {
            setTreeDropHint(null);
            return;
        }

        const root = mirDoc?.ui?.root;
        if (!root) {
            setTreeDropHint(null);
            return;
        }

        const overData = over.data.current as any;
        const overId = typeof over.id === 'string' ? over.id : null;
        const overNodeIdRaw = getOverNodeId(overData, overId);
        const overNodeId = typeof overNodeIdRaw === 'string' ? overNodeIdRaw : null;
        if (!overNodeId) {
            setTreeDropHint(null);
            return;
        }

        const activeId = data.nodeId;
        if (!activeId || activeId === overNodeId) {
            setTreeDropHint(null);
            return;
        }

        const overNode = findNodeById(root, overNodeId);
        if (!overNode) {
            setTreeDropHint(null);
            return;
        }

        const canNest =
            supportsChildrenForNode(overNode) && !isAncestorOf(root, activeId, overNodeId);
        const translated =
            event.active.rect?.current?.translated ?? event.active.rect?.current?.initial;
        const activeCenterY = translated
            ? translated.top + translated.height / 2
            : Number.NaN;
        const placement = resolveTreePlacement({
            canNest,
            overData,
            overRect: over.rect,
            activeCenterY,
        });

        setTreeDropHint({ overNodeId, placement });
    };

    const handleDragCancel = () => {
        setActivePaletteItemId(null);
        setTreeDropHint(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const data = event.active.data.current as any;
        const over = event.over;
        setActivePaletteItemId(null);
        setTreeDropHint(null);
        if (!over) return;

        if (data?.kind === 'tree-sort') {
            const overData = over.data.current as any;
            const overId = typeof over.id === 'string' ? over.id : null;
            const activeId = data.nodeId;
            const activeParentId = data.parentId;
            if (!activeId || !activeParentId) return;

            updateMirDoc((doc) => {
                const root = doc.ui.root;
                if (activeId === root.id) return doc;

                const overNodeIdRaw = getOverNodeId(overData, overId);
                const isOverRoot =
                    overId === 'tree-root' || overData?.kind === 'tree-root';
                const overNodeId = typeof overNodeIdRaw === 'string' ? overNodeIdRaw : null;
                if (overNodeId === activeId) return doc;

                const overNode = overNodeId ? findNodeById(root, overNodeId) : null;
                const canNest = Boolean(overNode && supportsChildrenForNode(overNode));
                const translated =
                    event.active.rect?.current?.translated ??
                    event.active.rect?.current?.initial;
                const activeCenterY = translated
                    ? translated.top + translated.height / 2
                    : Number.NaN;
                const placement = resolveTreePlacement({
                    canNest,
                    overData,
                    overRect: over.rect,
                    activeCenterY,
                });

                let targetParentId: string | null = null;
                let targetIndex: number | null = null;

                if (isOverRoot) {
                    targetParentId = root.id;
                    targetIndex = root.children?.length ?? 0;
                } else if (overNode) {
                    if (overNode.id === root.id) {
                        targetParentId = root.id;
                        targetIndex = root.children?.length ?? 0;
                    } else if (placement === 'child' && canNest) {
                        targetParentId = overNode.id;
                        targetIndex = overNode.children?.length ?? 0;
                    } else {
                        const parentId = findParentId(root, overNode.id);
                        if (!parentId) return doc;
                        const parentNode = findNodeById(root, parentId);
                        const siblings = parentNode?.children ?? [];
                        const overIndex = siblings.findIndex(
                            (item) => item.id === overNode.id
                        );
                        if (overIndex === -1) return doc;
                        targetParentId = parentId;
                        targetIndex = placement === 'before' ? overIndex : overIndex + 1;
                    }
                }

                if (!targetParentId || targetIndex === null) return doc;
                if (isAncestorOf(root, activeId, targetParentId)) return doc;

                let adjustedIndex = targetIndex;
                if (targetParentId === activeParentId) {
                    const parentNode = findNodeById(root, targetParentId);
                    const siblings = parentNode?.children ?? [];
                    const fromIndex = siblings.findIndex((item) => item.id === activeId);
                    if (fromIndex === -1) return doc;
                    if (fromIndex < targetIndex) adjustedIndex = targetIndex - 1;
                    if (fromIndex === adjustedIndex) return doc;
                }

                const removal = removeNodeByIdWithNode(root, activeId);
                if (!removal.removed || !removal.removedNode) return doc;
                const insertion = insertChildAtIndex(
                    removal.node,
                    targetParentId,
                    removal.removedNode,
                    adjustedIndex
                );
                return insertion.inserted
                    ? { ...doc, ui: { ...doc.ui, root: insertion.node } }
                    : doc;
            });
            return;
        }

        if (data?.kind !== 'palette-item') return;

        const itemId = String(data.itemId);
        const variantProps = data.variantProps as Record<string, unknown> | undefined;
        const selectedSize = data.selectedSize as string | undefined;
        const overData = over.data.current as any;
        const dropKind = overData?.kind;
        const dropNodeId = dropKind === 'tree-node' ? String(overData.nodeId) : null;
        const targetId =
            dropNodeId ?? (dropKind === 'canvas' ? (selectedId ?? 'root') : 'root');

        let nextNodeId = '';
        updateMirDoc((doc) => {
            const createId = createNodeIdFactory(doc);
            const newNode = createNodeFromPaletteItem(
                itemId,
                createId,
                variantProps,
                selectedSize
            );
            nextNodeId = newNode.id;
            return insertIntoMirDoc(doc, targetId, newNode);
        });
        if (nextNodeId) {
            onNodeSelect(nextNodeId);
        }
    };

    return {
        activePaletteItemId,
        treeDropHint,
        handleDragStart,
        handleDragMove,
        handleDragCancel,
        handleDragEnd,
    };
};
