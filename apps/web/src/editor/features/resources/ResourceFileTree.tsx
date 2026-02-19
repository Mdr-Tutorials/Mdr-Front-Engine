import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import type { PublicFileCategory, PublicResourceNode } from './publicTree';

type ResourceFileTreeMode = 'readonly' | 'editable';

type ResourceFileTreeProps = {
  tree: PublicResourceNode;
  mode: ResourceFileTreeMode;
  selectedId?: string;
  requestRenameNodeId?: string;
  onSelect?: (nodeId: string) => void;
  onCreateFolder?: (parentId: string) => void;
  onCreateFile?: (parentId: string) => void;
  onCreateFileByKind?: (
    parentId: string,
    kind: 'text' | 'json' | 'svg'
  ) => void;
  onImport?: (parentId: string, files: FileList | null) => void;
  onImportByCategory?: (
    parentId: string,
    category: PublicFileCategory,
    files: FileList | null
  ) => void;
  onRename?: (nodeId: string, nextName: string) => void;
  onDelete?: (nodeId: string) => void;
};

const buildInitialExpandedState = (node: PublicResourceNode) => {
  const expanded: Record<string, boolean> = {};
  const walk = (current: PublicResourceNode) => {
    if (current.type !== 'folder') return;
    expanded[current.id] = true;
    (current.children ?? []).forEach(walk);
  };
  walk(node);
  return expanded;
};

const findNodeById = (
  node: PublicResourceNode,
  nodeId: string
): PublicResourceNode | undefined => {
  if (node.id === nodeId) return node;
  for (const child of node.children ?? []) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return undefined;
};

const RENAME_RECLICK_MIN_MS = 250;
const RENAME_RECLICK_MAX_MS = 1200;
const IMPORT_ACCEPTS: Record<PublicFileCategory, string> = {
  image: '.png,.jpg,.jpeg,.webp,.svg',
  font: '.woff,.woff2,.ttf,.otf',
  document: '.txt,.md,.json,.svg',
  other: '*',
};

export function ResourceFileTree({
  tree,
  mode,
  selectedId,
  requestRenameNodeId,
  onSelect,
  onCreateFolder,
  onCreateFile,
  onCreateFileByKind,
  onImport,
  onImportByCategory,
  onRename,
  onDelete,
}: ResourceFileTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    buildInitialExpandedState(tree)
  );
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [importTargetId, setImportTargetId] = useState<string>(tree.id);
  const [importCategory, setImportCategory] =
    useState<PublicFileCategory | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<{ nodeId: string; at: number } | null>(null);
  const editable = mode === 'editable';

  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(tree, selectedId) : undefined),
    [selectedId, tree]
  );
  const toolbarParentId =
    selectedNode?.type === 'folder'
      ? selectedNode.id
      : (selectedNode?.parentId ?? tree.id);

  const toggleExpanded = (nodeId: string) => {
    setExpanded((current) => ({ ...current, [nodeId]: !current[nodeId] }));
  };

  const startRenaming = (node: PublicResourceNode) => {
    if (!editable || node.id === tree.id) return;
    onSelect?.(node.id);
    setRenamingNodeId(node.id);
    setRenamingValue(node.name);
  };

  useEffect(() => {
    if (!editable || !requestRenameNodeId) return;
    const targetNode = findNodeById(tree, requestRenameNodeId);
    if (!targetNode || targetNode.id === tree.id) return;
    onSelect?.(targetNode.id);
    setRenamingNodeId(targetNode.id);
    setRenamingValue(targetNode.name);
  }, [editable, onSelect, requestRenameNodeId, tree, tree.id]);

  const cancelRenaming = () => {
    setRenamingNodeId(null);
    setRenamingValue('');
  };

  const commitRenaming = () => {
    const targetId = renamingNodeId;
    const value = renamingValue.trim();
    if (!targetId || !value) {
      cancelRenaming();
      return;
    }
    onRename?.(targetId, value);
    cancelRenaming();
  };

  const triggerImport = (parentId: string) => {
    setImportTargetId(parentId);
    setImportCategory(null);
    fileInputRef.current?.click();
  };

  const triggerImportByCategory = (
    parentId: string,
    category: PublicFileCategory
  ) => {
    setImportTargetId(parentId);
    setImportCategory(category);
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) return;
      setContextMenu(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  const renderNode = (node: PublicResourceNode, depth = 0): ReactElement => {
    const isFolder = node.type === 'folder';
    const isExpanded = expanded[node.id] ?? true;
    const isActive = selectedId === node.id;
    const isRenaming = renamingNodeId === node.id;
    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1 rounded-md pr-1 ${
            isActive ? 'bg-black/8' : 'hover:bg-black/4'
          }`}
          onContextMenu={(event) => {
            if (!editable) return;
            event.preventDefault();
            setContextMenu({
              nodeId: node.id,
              x: event.clientX,
              y: event.clientY,
            });
          }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1 py-1 text-left text-xs"
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
            onClick={() => {
              const now = Date.now();
              const lastClick = lastClickRef.current;
              lastClickRef.current = { nodeId: node.id, at: now };

              const isSecondClickOnSameNode =
                lastClick?.nodeId === node.id &&
                now - lastClick.at >= RENAME_RECLICK_MIN_MS &&
                now - lastClick.at <= RENAME_RECLICK_MAX_MS;
              const shouldRename =
                editable &&
                node.id !== tree.id &&
                selectedId === node.id &&
                isSecondClickOnSameNode;

              if (shouldRename) {
                startRenaming(node);
                return;
              }

              if (isFolder) {
                toggleExpanded(node.id);
              }
              onSelect?.(node.id);
            }}
            onKeyDown={(event) => {
              if (!editable || node.id === tree.id) return;
              if (event.key === 'F2') {
                event.preventDefault();
                startRenaming(node);
              }
            }}
            title={node.path}
          >
            {isFolder ? (
              isExpanded ? (
                <ChevronDown size={12} className="shrink-0 text-(--color-6)" />
              ) : (
                <ChevronRight size={12} className="shrink-0 text-(--color-6)" />
              )
            ) : (
              <span className="inline-block w-3 shrink-0" />
            )}
            {isFolder ? (
              isExpanded ? (
                <FolderOpen size={13} className="shrink-0 text-(--color-7)" />
              ) : (
                <Folder size={13} className="shrink-0 text-(--color-7)" />
              )
            ) : (
              <FileText size={13} className="shrink-0 text-(--color-7)" />
            )}
            {isRenaming ? (
              <input
                autoFocus
                value={renamingValue}
                onChange={(event) => setRenamingValue(event.target.value)}
                onBlur={commitRenaming}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitRenaming();
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelRenaming();
                  }
                }}
                className="h-6 min-w-0 flex-1 rounded border border-black/20 bg-white px-1.5 text-xs outline-none"
              />
            ) : (
              <span className="truncate text-(--color-9)">{node.name}</span>
            )}
          </button>
          {editable ? (
            <div className="hidden items-center gap-1 group-hover:inline-flex">
              {isFolder ? (
                <>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
                    aria-label={`create-folder-${node.id}`}
                    title="New folder"
                    onClick={() => onCreateFolder?.(node.id)}
                  >
                    <FolderPlus size={12} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
                    aria-label={`create-file-${node.id}`}
                    title="New file"
                    onClick={() => onCreateFile?.(node.id)}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
                    aria-label={`import-${node.id}`}
                    title="Import files"
                    onClick={() => triggerImport(node.id)}
                  >
                    <Upload size={12} />
                  </button>
                </>
              ) : null}
              {node.id !== tree.id ? (
                <>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
                    aria-label={`rename-${node.id}`}
                    title="Rename (F2)"
                    onClick={() => startRenaming(node)}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
                    aria-label={`delete-${node.id}`}
                    title="Delete"
                    onClick={() => onDelete?.(node.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        {isFolder && isExpanded
          ? (node.children ?? []).map((child) => renderNode(child, depth + 1))
          : null}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white/90 p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-6)">
          {mode === 'editable'
            ? 'Public Tree (Editable)'
            : 'File Tree (Readonly)'}
        </p>
        {editable ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
              aria-label="toolbar-create-folder"
              title="New folder"
              onClick={() => onCreateFolder?.(toolbarParentId)}
            >
              <FolderPlus size={12} />
            </button>
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
              aria-label="toolbar-create-file"
              title="New file"
              onClick={() => onCreateFile?.(toolbarParentId)}
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-(--color-7) hover:border-black/12 hover:text-(--color-9)"
              aria-label="toolbar-import"
              title="Import files"
              onClick={() => triggerImport(toolbarParentId)}
            >
              <Upload size={12} />
            </button>
          </div>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={importCategory ? IMPORT_ACCEPTS[importCategory] : undefined}
        className="hidden"
        onChange={(event) => {
          if (importCategory) {
            onImportByCategory?.(
              importTargetId,
              importCategory,
              event.target.files
            );
          } else {
            onImport?.(importTargetId, event.target.files);
          }
          setImportCategory(null);
          event.currentTarget.value = '';
        }}
      />
      <div className="max-h-[65vh] overflow-auto">{renderNode(tree)}</div>
      {contextMenu ? (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[220px] rounded-md border border-black/12 bg-white p-1 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
          style={{ left: contextMenu.x + 4, top: contextMenu.y + 4 }}
        >
          {(() => {
            const node = findNodeById(tree, contextMenu.nodeId);
            if (!node) return null;
            const targetParentId =
              node.type === 'folder' ? node.id : (node.parentId ?? tree.id);
            return (
              <>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    onCreateFolder?.(targetParentId);
                    setContextMenu(null);
                  }}
                >
                  <span>New folder</span>
                  <span>Folder</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    onCreateFile?.(targetParentId);
                    setContextMenu(null);
                  }}
                >
                  <span>New file</span>
                  <span>Text</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    onCreateFileByKind?.(targetParentId, 'json');
                    setContextMenu(null);
                  }}
                >
                  <span>New file (JSON)</span>
                  <span>.json</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    onCreateFileByKind?.(targetParentId, 'svg');
                    setContextMenu(null);
                  }}
                >
                  <span>New file (SVG)</span>
                  <span>.svg</span>
                </button>
                <div className="my-1 h-px bg-black/10" />
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    triggerImport(targetParentId);
                    setContextMenu(null);
                  }}
                >
                  <span>Import files</span>
                  <span>Any</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    triggerImportByCategory(targetParentId, 'image');
                    setContextMenu(null);
                  }}
                >
                  <span>Import image</span>
                  <span>png/jpg/webp/svg</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    triggerImportByCategory(targetParentId, 'font');
                    setContextMenu(null);
                  }}
                >
                  <span>Import font</span>
                  <span>woff/woff2/ttf/otf</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() => {
                    triggerImportByCategory(targetParentId, 'document');
                    setContextMenu(null);
                  }}
                >
                  <span>Import document</span>
                  <span>txt/md/json/svg</span>
                </button>
                {node.id !== tree.id ? (
                  <>
                    <div className="my-1 h-px bg-black/10" />
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
                      onClick={() => {
                        startRenaming(node);
                        setContextMenu(null);
                      }}
                    >
                      <span>Rename</span>
                      <span>F2</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-red-700 hover:bg-red-50"
                      onClick={() => {
                        onDelete?.(node.id);
                        setContextMenu(null);
                      }}
                    >
                      <span>Delete</span>
                      <span>Del</span>
                    </button>
                  </>
                ) : null}
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}
