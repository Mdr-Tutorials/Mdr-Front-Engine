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
import { antdReactAdapter } from '@/mir/generator/react/antdAdapter';
import { CodeViewer } from './CodeViewer';
import './ExportMirPage.scss';

type ExportTab = 'mir' | 'react';
type ReactAdapterMode = 'mdr' | 'antd';
type ReactImportStrategy = 'workspace' | 'esm-sh';
type FileTreeNode = {
  key: string;
  name: string;
  path: string;
  file?: { path: string; language: 'typescript' | 'json' | 'html' };
  children: FileTreeNode[];
};

const buildFileTree = (
  files: Array<{ path: string; language: 'typescript' | 'json' | 'html' }>
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

export function ExportMirPage() {
  const { t } = useTranslation('export');
  const { projectId } = useParams();
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const projectType = useEditorStore(
    (state) =>
      (projectId ? state.projectsById[projectId]?.type : undefined) ?? 'project'
  );
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ExportTab>('mir');
  const [reactAdapterMode, setReactAdapterMode] =
    useState<ReactAdapterMode>('mdr');
  const [reactImportStrategy, setReactImportStrategy] =
    useState<ReactImportStrategy>('workspace');
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
      const adapter =
        reactAdapterMode === 'antd' ? antdReactAdapter : undefined;
      const packageResolver = {
        strategy: reactImportStrategy,
        packageVersions:
          reactAdapterMode === 'antd' ? { antd: '5.28.0' } : undefined,
      } as const;

      return generateReactBundle(mirDoc, {
        resourceType: projectType,
        adapter,
        packageResolver,
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
  }, [mirDoc, projectType, reactAdapterMode, reactImportStrategy, t]);

  useEffect(() => {
    if (!reactBundle) {
      setActiveReactFile('');
      return;
    }
    setActiveReactFile(reactBundle.entryFilePath);
  }, [reactBundle]);

  const activeReactFileContent = useMemo(() => {
    if (!reactBundle) return '';
    const active =
      reactBundle.files.find((file) => file.path === activeReactFile) ??
      reactBundle.files[0];
    return active?.content ?? '';
  }, [activeReactFile, reactBundle]);
  const reactFileTree = useMemo(
    () => (reactBundle ? buildFileTree(reactBundle.files) : []),
    [reactBundle]
  );

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
          defaultValue: '基于当前 MIR 生成的 React 组件代码',
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
    if (!reactBundle) {
      setExpandedFolders({});
      return;
    }
    const next: Record<string, boolean> = {};
    reactBundle.files.forEach((file) => {
      const segments = file.path.split('/').filter(Boolean);
      for (let index = 0; index < segments.length - 1; index += 1) {
        next[segments.slice(0, index + 1).join('/')] = true;
      }
    });
    setExpandedFolders(next);
  }, [reactBundle]);

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
        Boolean(node.file) &&
        (activeReactFile || reactBundle?.entryFilePath) === node.file?.path;
      const fileIcon =
        node.file?.language === 'json' ? (
          <FileJson2 size={13} />
        ) : node.file?.language === 'html' ? (
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
          {activeTab === 'react' && (
            <div className="inline-flex items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-1">
                <span>Adapter</span>
                <select
                  className="h-7 rounded border border-black/10 bg-transparent px-2 text-xs dark:border-white/15"
                  value={reactAdapterMode}
                  onChange={(event) =>
                    setReactAdapterMode(event.target.value as ReactAdapterMode)
                  }
                >
                  <option value="mdr">@mdr/ui</option>
                  <option value="antd">antd</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-1">
                <span>Imports</span>
                <select
                  className="h-7 rounded border border-black/10 bg-transparent px-2 text-xs dark:border-white/15"
                  value={reactImportStrategy}
                  onChange={(event) =>
                    setReactImportStrategy(
                      event.target.value as ReactImportStrategy
                    )
                  }
                >
                  <option value="workspace">workspace</option>
                  <option value="esm-sh">esm.sh</option>
                </select>
              </label>
            </div>
          )}
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
        ) : activeTab === 'react' && reactBundle ? (
          <div className="flex h-full min-h-0 gap-2">
            <aside className="w-52 shrink-0 overflow-auto rounded-md border border-black/10 p-1 dark:border-white/15">
              {renderTreeNodes(reactFileTree)}
            </aside>
            <CodeViewer
              code={activeReactFileContent}
              lang={
                reactBundle.files.find(
                  (file) =>
                    file.path === (activeReactFile || reactBundle.entryFilePath)
                )?.language === 'json'
                  ? 'json'
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
