import type { ComponentNode } from '@/core/types/engine.types';

export type MountedCssEntry = {
    id: string;
    path: string;
    content?: string;
    classes: string[];
    classIndex: Record<string, { line?: number; column?: number }>;
};

type UnsafeRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnsafeRecord | undefined =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as UnsafeRecord)
        : undefined;

const readClassIndex = (
    value: unknown
): Record<string, { line?: number; column?: number }> => {
    if (!asRecord(value)) return {};
    const result: Record<string, { line?: number; column?: number }> = {};
    Object.entries(value).forEach(([className, meta]) => {
        if (!className) return;
        const detail = asRecord(meta);
        if (!detail) {
            result[className] = {};
            return;
        }
        const line =
            typeof detail.line === 'number' && Number.isFinite(detail.line)
                ? detail.line
                : undefined;
        const column =
            typeof detail.column === 'number' && Number.isFinite(detail.column)
                ? detail.column
                : undefined;
        result[className] = { line, column };
    });
    return result;
};

const parseMountedCssEntry = (raw: unknown, fallbackId: string) => {
    const record = asRecord(raw);
    if (!record) return null;
    const path = typeof record.path === 'string' ? record.path.trim() : '';
    if (!path) return null;
    const classes = Array.isArray(record.classes)
        ? record.classes
              .filter((item): item is string => typeof item === 'string')
              .map((item) => item.trim())
              .filter(Boolean)
        : [];
    const content =
        typeof record.content === 'string' ? record.content : undefined;
    const classIndex = readClassIndex(record.classIndex);
    const mergedClasses = new Set<string>([
        ...classes,
        ...Object.keys(classIndex),
    ]);
    return {
        id:
            typeof record.id === 'string' && record.id.trim()
                ? record.id.trim()
                : fallbackId,
        path,
        content,
        classes: [...mergedClasses],
        classIndex,
    } satisfies MountedCssEntry;
};

const readMountCandidates = (node: ComponentNode): unknown[] => {
    const anyNode = node as ComponentNode & { metadata?: unknown };
    const props = asRecord(anyNode.props);
    const metadata = asRecord(anyNode.metadata);

    const candidates: unknown[] = [];
    [
        props?.mountedCss,
        props?.styleMount,
        props?.styleMountCss,
        metadata?.mountedCss,
        metadata?.styleMount,
    ].forEach((candidate) => {
        if (candidate !== undefined) candidates.push(candidate);
    });
    return candidates;
};

export const resolveMountedCssEntries = (
    node: ComponentNode
): MountedCssEntry[] => {
    const entries: MountedCssEntry[] = [];
    readMountCandidates(node).forEach((candidate, index) => {
        if (Array.isArray(candidate)) {
            candidate.forEach((item, itemIndex) => {
                const parsed = parseMountedCssEntry(
                    item,
                    `mounted-${index + 1}-${itemIndex + 1}`
                );
                if (parsed) entries.push(parsed);
            });
            return;
        }
        const parsed = parseMountedCssEntry(candidate, `mounted-${index + 1}`);
        if (parsed) entries.push(parsed);
    });
    return entries;
};

export const resolveMountedCssTokenTarget = (
    entries: MountedCssEntry[],
    token: string
): (MountedCssEntry & { line?: number; column?: number }) | null => {
    for (const entry of entries) {
        if (!entry.classes.includes(token)) continue;
        const position = entry.classIndex[token];
        return { ...entry, line: position?.line, column: position?.column };
    }
    return null;
};

export const extractCssClassIndexFromContent = (content: string) => {
    const index: Record<string, { line?: number; column?: number }> = {};
    const matcher = /\.([_a-zA-Z][_a-zA-Z0-9-]*)/g;
    let match: RegExpExecArray | null = matcher.exec(content);
    while (match) {
        const className = match[1];
        const rawIndex = match.index;
        const before = content.slice(0, rawIndex);
        const lines = before.split('\n');
        index[className] = {
            line: lines.length,
            column: (lines.at(-1)?.length ?? 0) + 1,
        };
        match = matcher.exec(content);
    }
    return index;
};

export const mergeMountedCssEntryWithContent = (
    entry: MountedCssEntry,
    content: string
): MountedCssEntry => {
    const classIndex = extractCssClassIndexFromContent(content);
    return {
        ...entry,
        content,
        classIndex,
        classes: [...new Set(Object.keys(classIndex))],
    };
};
