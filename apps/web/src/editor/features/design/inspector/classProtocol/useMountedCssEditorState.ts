import { useEffect, useState } from 'react';
import type { ComponentNode } from '@/core/types/engine.types';
import type { MountedCssEntry } from './mountedCss';
import {
    mergeMountedCssEntryWithContent,
    resolveMountedCssEntries,
} from './mountedCss';

const DEFAULT_MOUNTED_CSS_CONTENT = '/* Mounted CSS */\n';

type UseMountedCssEditorStateParams = {
    selectedNode: ComponentNode | null;
    mountedCssEntries: MountedCssEntry[];
    updateSelectedNode: (
        updater: (node: ComponentNode) => ComponentNode
    ) => void;
};

export const useMountedCssEditorState = ({
    selectedNode,
    mountedCssEntries,
    updateSelectedNode,
}: UseMountedCssEditorStateParams) => {
    const [isMountedCssEditorOpen, setMountedCssEditorOpen] = useState(false);
    const [mountedCssEditorEntryId, setMountedCssEditorEntryId] = useState<
        string | null
    >(null);
    const [mountedCssEditorPath, setMountedCssEditorPath] = useState('');
    const [mountedCssEditorValue, setMountedCssEditorValue] = useState(
        DEFAULT_MOUNTED_CSS_CONTENT
    );
    const [mountedCssEditorFocusClass, setMountedCssEditorFocusClass] =
        useState<string>();
    const [mountedCssEditorFocusLine, setMountedCssEditorFocusLine] = useState<
        number | undefined
    >();
    const [mountedCssEditorFocusColumn, setMountedCssEditorFocusColumn] =
        useState<number | undefined>();

    useEffect(() => {
        setMountedCssEditorOpen(false);
        setMountedCssEditorEntryId(null);
        setMountedCssEditorPath('');
        setMountedCssEditorValue(DEFAULT_MOUNTED_CSS_CONTENT);
        setMountedCssEditorFocusClass(undefined);
        setMountedCssEditorFocusLine(undefined);
        setMountedCssEditorFocusColumn(undefined);
    }, [selectedNode?.id]);

    const openMountedCssEditor = (target?: {
        path?: string;
        className?: string;
        line?: number;
        column?: number;
    }) => {
        if (!selectedNode?.id) return;
        const matchedEntry = target?.path
            ? mountedCssEntries.find((entry) => entry.path === target.path)
            : mountedCssEntries[0];
        const fallbackPath = `src/styles/mounted/${selectedNode.id}.css`;
        setMountedCssEditorEntryId(matchedEntry?.id ?? null);
        setMountedCssEditorPath(matchedEntry?.path ?? fallbackPath);
        setMountedCssEditorValue(
            matchedEntry?.content ?? DEFAULT_MOUNTED_CSS_CONTENT
        );
        setMountedCssEditorFocusClass(target?.className);
        setMountedCssEditorFocusLine(target?.line);
        setMountedCssEditorFocusColumn(target?.column);
        setMountedCssEditorOpen(true);
    };

    const closeMountedCssEditor = () => {
        setMountedCssEditorOpen(false);
        setMountedCssEditorFocusClass(undefined);
        setMountedCssEditorFocusLine(undefined);
        setMountedCssEditorFocusColumn(undefined);
    };

    const saveMountedCss = () => {
        if (!selectedNode?.id) return;
        const entryId = mountedCssEditorEntryId ?? `mounted-${Date.now()}`;
        const entryPath =
            mountedCssEditorPath || `src/styles/mounted/${selectedNode.id}.css`;
        updateSelectedNode((current) => {
            const currentEntries = resolveMountedCssEntries(current);
            const existingIndex = currentEntries.findIndex(
                (entry) =>
                    entry.id === mountedCssEditorEntryId ||
                    entry.path === mountedCssEditorPath
            );
            const baseEntry =
                existingIndex >= 0
                    ? currentEntries[existingIndex]
                    : {
                          id: entryId,
                          path: entryPath,
                          content: DEFAULT_MOUNTED_CSS_CONTENT,
                          classes: [],
                          classIndex: {},
                      };
            const mergedEntry = mergeMountedCssEntryWithContent(
                baseEntry,
                mountedCssEditorValue || DEFAULT_MOUNTED_CSS_CONTENT
            );
            const nextEntries =
                existingIndex >= 0
                    ? currentEntries.map((entry, index) =>
                          index === existingIndex ? mergedEntry : entry
                      )
                    : [...currentEntries, mergedEntry];
            return {
                ...current,
                props: {
                    ...(current.props ?? {}),
                    mountedCss: nextEntries.map((entry) => ({
                        id: entry.id,
                        path: entry.path,
                        content: entry.content,
                        classes: entry.classes,
                        classIndex: entry.classIndex,
                    })),
                },
            };
        });
        setMountedCssEditorOpen(false);
        setMountedCssEditorEntryId(null);
        setMountedCssEditorFocusClass(undefined);
        setMountedCssEditorFocusLine(undefined);
        setMountedCssEditorFocusColumn(undefined);
    };

    return {
        isMountedCssEditorOpen,
        mountedCssEditorPath,
        mountedCssEditorValue,
        mountedCssEditorFocusClass,
        mountedCssEditorFocusLine,
        mountedCssEditorFocusColumn,
        setMountedCssEditorValue,
        openMountedCssEditor,
        closeMountedCssEditor,
        saveMountedCss,
    };
};
