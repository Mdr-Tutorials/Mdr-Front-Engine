import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson2,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { generateReactBundle } from '@/mir/generator/mirToReact';
import { flattenPublicFiles, readPublicTree } from '../resources/publicTree';
import { CodeViewer } from './CodeViewer';
import { resolveZipFilePayload } from './exportZip';
import './ExportMirPage.scss';

type ExportTab = 'mir' | 'react';
type ExportCodeFile = {
  path: string;
  language: 'typescript' | 'json' | 'html' | 'css';
  content: string;
  binaryDataUrl?: string;
};
type FileTreeNode = {
  key: string;
  name: string;
  path: string;
  file?: { path: string; language: 'typescript' | 'json' | 'html' | 'css' };
  children: FileTreeNode[];
};

const buildFileTree = (
  files: Array<{
    path: string;
    language: 'typescript' | 'json' | 'html' | 'css';
  }>
): FileTreeNode[] => {
  const root: FileTreeNode = {
    key: 'root',
    name: 'root',
    path: '',
    children: [],
  };

  files.forEach((file) => {
    const segments = file.path.split('/').filter(Boolean);
    let cursor = root;
    segments.forEach((segment, index) => {
      const nodePath = segments.slice(0, index + 1).join('/');
      let next = cursor.children.find((item) => item.path === nodePath);
      if (!next) {
        next = {
          key: nodePath,
          name: segment,
          path: nodePath,
          children: [],
        };
        cursor.children.push(next);
      }
      if (index === segments.length - 1) {
        next.file = file;
      }
      cursor = next;
    });
  });

  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] =>
    nodes
      .map((node) => ({ ...node, children: sortNodes(node.children) }))
      .sort((a, b) => {
        const aIsDir = a.children.length > 0 && !a.file;
        const bIsDir = b.children.length > 0 && !b.file;
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

  return sortNodes(root.children);
};

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'mdr-react-export';

export function ExportMirPage() {
  const { t } = useTranslation('export');
  const { projectId } = useParams();
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const projectType = useEditorStore(
    (state) =>
      (projectId ? state.projectsById[projectId]?.type : undefined) ?? 'project'
  );
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [activeTab, setActiveTab] = useState<ExportTab>('mir');
  const [activeReactFile, setActiveReactFile] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const mirJson = useMemo(() => {
    if (!mirDoc) return '';
    return JSON.stringify(mirDoc, null, 2);
  }, [mirDoc]);

  const reactBundle = useMemo(() => {
    if (!mirDoc?.ui?.root) return null;
    try {
      return generateReactBundle(mirDoc, {
        resourceType: projectType,
        packageResolver: {
          strategy: 'npm',
        },
      });
    } catch (error) {
      const message = t('react.error', {
        defaultValue: 'React 代码生成失败',
      });
      return {
        entryFilePath: 'error.ts',
        type: projectType,
        files: [
          {
            path: 'error.ts',
            language: 'typescript' as const,
            content: `// ${message}\n${String(error)}`,
          },
        ],
      };
    }
  }, [mirDoc, projectType, t]);

  const publicTree = useMemo(() => readPublicTree(projectId), [projectId]);
  const publicExportFiles = useMemo<ExportCodeFile[]>(
    () =>
      flattenPublicFiles(publicTree).map((file) => {
        const lowerName = file.name.toLowerCase();
        const isJson = Boolean(
          file.mime?.includes('json') || lowerName.endsWith('.json')
        );
        const isHtml = Boolean(
          file.mime?.includes('html') || /\.(html?)$/i.test(lowerName)
        );
        const isCss = Boolean(
          file.mime?.includes('css') || lowerName.endsWith('.css')
        );
        const content =
          file.textContent ??
          `// Binary file\n// path: ${file.path}\n// mime: ${
            file.mime || 'unknown'
          }\n// size: ${file.size || 0} bytes`;
        return {
          path: file.path,
          language: isJson
            ? 'json'
            : isHtml
              ? 'html'
              : isCss
                ? 'css'
                : 'typescript',
          content,
          binaryDataUrl:
            file.textContent == null && file.contentRef?.startsWith('data:')
              ? file.contentRef
              : undefined,
        };
      }),
    [publicTree]
  );
  const reactProjectFiles = useMemo<ExportCodeFile[]>(
    () => [...(reactBundle?.files ?? []), ...publicExportFiles],
    [publicExportFiles, reactBundle?.files]
  );
  const reactFileTree = useMemo(
    () => buildFileTree(reactProjectFiles),
    [reactProjectFiles]
  );
  const activeReactFileRecord = useMemo(
    () =>
      reactProjectFiles.find((file) => file.path === activeReactFile) ??
      reactProjectFiles[0],
    [activeReactFile, reactProjectFiles]
  );
  const activeReactFileContent = activeReactFileRecord?.content ?? '';
  const reactZipBaseName = useMemo(
    () =>
      sanitizeFileName(
        mirDoc?.metadata?.name || projectId || 'mdr-react-export'
      ),
    [mirDoc?.metadata?.name, projectId]
  );

  useEffect(() => {
    if (!reactProjectFiles.length) {
      setActiveReactFile('');
      return;
    }
    const hasActiveFile = reactProjectFiles.some(
      (file) => file.path === activeReactFile
    );
    if (hasActiveFile) return;
    if (
      reactBundle?.entryFilePath &&
      reactProjectFiles.some((file) => file.path === reactBundle.entryFilePath)
    ) {
      setActiveReactFile(reactBundle.entryFilePath);
      return;
    }
    setActiveReactFile(reactProjectFiles[0].path);
  }, [activeReactFile, reactBundle?.entryFilePath, reactProjectFiles]);

  const activeCode = activeTab === 'mir' ? mirJson : activeReactFileContent;
  const activeTitle =
    activeTab === 'mir'
      ? t('mir.title', { defaultValue: 'MIR' })
      : t('react.title', { defaultValue: 'React' });
  const activeDescription =
    activeTab === 'mir'
      ? t('mir.description', {
          defaultValue: '当前项目的 MIR JSON（临时页）',
        })
      : t('react.description', {
          defaultValue: '基于当前 MIR 生成的 React 项目代码（含 public/*）',
        });
  const activeEmpty =
    activeTab === 'mir'
      ? t('mir.empty', {
          defaultValue: '暂无 MIR（先进入蓝图编辑器创建组件）',
        })
      : t('react.empty', {
          defaultValue: '暂无 React 代码（先生成 MIR）',
        });

  useEffect(() => {
    setCopied(false);
  }, [activeTab]);

  useEffect(() => {
    if (!reactProjectFiles.length) {
      setExpandedFolders({});
      return;
    }
    const next: Record<string, boolean> = {};
    reactProjectFiles.forEach((file) => {
      const segments = file.path.split('/').filter(Boolean);
      for (let index = 0; index < segments.length - 1; index += 1) {
        next[segments.slice(0, index + 1).join('/')] = true;
      }
    });
    setExpandedFolders(next);
  }, [reactProjectFiles]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((current) => ({
      ...current,
      [path]: !current[path],
    }));
  };

  const renderTreeNodes = (nodes: FileTreeNode[], depth = 0): JSX.Element[] =>
    nodes.map((node) => {
      const isFolder = node.children.length > 0 && !node.file;
      const isExpanded = expandedFolders[node.path] ?? true;
      const isActive =
        Boolean(node.file) && activeReactFile === node.file?.path;
      const fileIcon =
        node.file?.language === 'json' ? (
          <FileJson2 size={13} />
        ) : node.file?.language === 'html' || node.file?.language === 'css' ? (
          <FileText size={13} />
        ) : (
          <FileCode2 size={13} />
        );

      return (
        <div key={node.key}>
          <button
            type="button"
            className={`flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs ${
              isActive
                ? 'bg-black/10 dark:bg-white/15'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
            onClick={() => {
              if (isFolder) {
                toggleFolder(node.path);
                return;
              }
              if (node.file) setActiveReactFile(node.file.path);
            }}
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
              <span className="shrink-0 text-(--color-7)">{fileIcon}</span>
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {isFolder && isExpanded
            ? renderTreeNodes(node.children, depth + 1)
            : null}
        </div>
      );
    });

  return (
    <div className="ExportMirPage">
      <div className="ExportMirPageHeader">
        <div className="ExportMirPageTitle">
          <h1>{activeTitle}</h1>
          <p>{activeDescription}</p>
        </div>
        <div className="ExportMirPageActions">
          <div
            className="ExportMirPageTabs"
            role="tablist"
            aria-label={t('title', { defaultValue: '导出代码' })}
          >
            <button
              type="button"
              className={`ExportMirPageTab ${activeTab === 'mir' ? 'Active' : ''}`}
              onClick={() => setActiveTab('mir')}
              role="tab"
              aria-selected={activeTab === 'mir'}
            >
              {t('tabs.mir', { defaultValue: 'MIR' })}
            </button>
            <button
              type="button"
              className={`ExportMirPageTab ${activeTab === 'react' ? 'Active' : ''}`}
              onClick={() => setActiveTab('react')}
              role="tab"
              aria-selected={activeTab === 'react'}
            >
              {t('tabs.react', { defaultValue: 'React' })}
            </button>
          </div>
          <button
            type="button"
            className="ExportMirPageCopy"
            disabled={!activeCode}
            onClick={async () => {
              if (!activeCode) return;
              await navigator.clipboard.writeText(activeCode);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 900);
            }}
          >
            {copied
              ? t('copySuccess', { defaultValue: '已复制' })
              : t('copy', { defaultValue: '复制' })}
          </button>
          {activeTab === 'react' ? (
            <button
              type="button"
              className="ExportMirPageCopy"
              disabled={!reactProjectFiles.length || downloadingZip}
              onClick={async () => {
                if (!reactProjectFiles.length) return;
                setDownloadingZip(true);
                try {
                  const { default: JSZip } = await import('jszip');
                  const zip = new JSZip();
                  const rootFolder = zip.folder(reactZipBaseName) ?? zip;
                  reactProjectFiles.forEach((file) => {
                    const payload = resolveZipFilePayload(file);
                    if (payload instanceof Uint8Array) {
                      rootFolder.file(file.path, payload, { binary: true });
                    } else {
                      rootFolder.file(file.path, payload);
                    }
                  });
                  const blob = await zip.generateAsync({ type: 'blob' });
                  const downloadUrl = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = downloadUrl;
                  anchor.download = `${reactZipBaseName}.zip`;
                  document.body.append(anchor);
                  anchor.click();
                  anchor.remove();
                  URL.revokeObjectURL(downloadUrl);
                } finally {
                  setDownloadingZip(false);
                }
              }}
            >
              {downloadingZip
                ? t('downloading', { defaultValue: 'Downloading...' })
                : t('downloadZip', { defaultValue: 'Download ZIP' })}
            </button>
          ) : null}
        </div>
      </div>

      <div className="ExportMirPageBody">
        {activeTab === 'react' && reactBundle?.diagnostics?.length ? (
          <div className="mb-2 rounded-md border border-amber-300/60 bg-amber-100/40 px-2 py-1 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100">
            {reactBundle.diagnostics.map((item) => (
              <p key={`${item.code}:${item.path}`} className="m-0">
                [{item.severity}] {item.code}: {item.message}
              </p>
            ))}
          </div>
        ) : null}
        {!activeCode ? (
          <div className="ExportMirPageEmpty">{activeEmpty}</div>
        ) : activeTab === 'react' && reactProjectFiles.length ? (
          <div className="flex h-full min-h-0 gap-2">
            <aside className="w-52 shrink-0 overflow-auto rounded-md border border-black/10 p-1 dark:border-white/15">
              {renderTreeNodes(reactFileTree)}
            </aside>
            <CodeViewer
              code={activeReactFileContent}
              lang={
                activeReactFileRecord?.language === 'json'
                  ? 'json'
                  : activeReactFileRecord?.language === 'html'
                    ? 'html'
                    : activeReactFileRecord?.language === 'css'
                      ? 'css'
                      : 'typescript'
              }
            />
          </div>
        ) : (
          <CodeViewer
            code={activeCode}
            lang={activeTab === 'mir' ? 'json' : 'typescript'}
          />
        )}
      </div>
    </div>
  );
}
