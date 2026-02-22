import { type ComponentType, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  FileArchive,
  FileCode2,
  Globe2,
  LayoutDashboard,
  Library,
  Plus,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useParams } from 'react-router';
import { CodeResourcePage } from './CodeResourcePage';
import { ExternalLibraryManager } from './ExternalLibraryManager';
import { I18nResourcePage } from './I18nResourcePage';
import { PublicResourcePage } from './PublicResourcePage';
import {
  collectBestPracticeHints,
  flattenPublicFiles,
  readPublicTree,
} from './publicTree';
import {
  createCodeFile,
  flattenCodeFiles,
  findCodeNodeById,
  readCodeTree,
  writeCodeTree,
  type CodeResourceNode,
} from './codeTree';
import { collectLocaleMissingStats, readI18nStore } from './i18nStore';

type SectionId = 'overview' | 'public' | 'code' | 'i18n' | 'external';

type SectionMeta = {
  id: SectionId;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

const sectionMetas: SectionMeta[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'public', label: 'Public', icon: FileArchive },
  { id: 'code', label: 'Code', icon: FileCode2 },
  { id: 'i18n', label: 'i18n', icon: Globe2 },
  { id: 'external', label: 'External libs', icon: Library },
];

const getResourceManagerViewStorageKey = (projectId?: string) =>
  `mdr.resourceManager.view.${projectId?.trim() || 'default'}`;

const getResourceManagerCodeSelectionStorageKey = (projectId?: string) =>
  `mdr.resourceManager.code.selection.${projectId?.trim() || 'default'}`;

const getResourceManagerExternalSelectionStorageKey = (projectId?: string) =>
  `mdr.resourceManager.external.selection.${projectId?.trim() || 'default'}`;

const getResourceManagerIconSelectionStorageKey = (projectId?: string) =>
  `mdr.resourceManager.icon.selection.${projectId?.trim() || 'default'}`;

const parseStoredStringArray = (raw: string | null) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
};

const resolveLatestUpdatedAt = (values: Array<string | undefined>) => {
  let latest: string | null = null;
  let latestTime = 0;
  values.forEach((value) => {
    if (!value) return;
    const time = Date.parse(value);
    if (!Number.isFinite(time)) return;
    if (time > latestTime) {
      latestTime = time;
      latest = value;
    }
  });
  return latest;
};

const formatUpdatedAt = (value: string | null) => {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
};

type OverviewSnapshot = {
  public: {
    files: number;
    warnings: number;
    infos: number;
    updatedAt: string | null;
  };
  code: {
    files: number;
    scripts: number;
    styles: number;
    shaders: number;
    updatedAt: string | null;
  };
  i18n: {
    locales: number;
    namespaces: number;
    keys: number;
    missingValues: number;
    baseLocale: string;
    worstLocale: { locale: string; missing: number } | null;
  };
  external: {
    componentLibraries: number;
    iconLibraries: number;
  };
};

const buildOverviewSnapshot = (projectId?: string): OverviewSnapshot => {
  const publicTree = readPublicTree(projectId);
  const publicFiles = flattenPublicFiles(publicTree);
  const publicHints = publicFiles.reduce(
    (acc, file) => {
      const hints = collectBestPracticeHints(file);
      acc.warnings += hints.filter((hint) => hint.level === 'warning').length;
      acc.infos += hints.filter((hint) => hint.level === 'info').length;
      return acc;
    },
    { warnings: 0, infos: 0 }
  );

  const codeTree = readCodeTree(projectId);
  const codeFiles = flattenCodeFiles(codeTree);
  const codeCounts = codeFiles.reduce(
    (acc, file) => {
      const segment = file.path.split('/')[1] ?? '';
      if (segment === 'scripts') acc.scripts += 1;
      if (segment === 'styles') acc.styles += 1;
      if (segment === 'shaders') acc.shaders += 1;
      return acc;
    },
    { scripts: 0, styles: 0, shaders: 0 }
  );

  const i18nStore = readI18nStore(projectId);
  const i18nLocales = Object.keys(i18nStore);
  const baseLocale = i18nStore.en ? 'en' : (i18nLocales[0] ?? 'en');
  const namespaceSet = new Set<string>();
  const keySet = new Set<string>();
  const namespacesByLocale: Array<
    [string, Record<string, Record<string, string>>]
  > = Object.entries(i18nStore);

  namespacesByLocale.forEach(([, namespaces]) => {
    Object.entries(namespaces).forEach(([namespace, translations]) => {
      namespaceSet.add(namespace);
      Object.keys(translations).forEach((key) =>
        keySet.add(`${namespace}::${key}`)
      );
    });
  });

  let missingValues = 0;
  keySet.forEach((serializedKey) => {
    const [namespace, key] = serializedKey.split('::');
    i18nLocales.forEach((locale) => {
      const value = i18nStore[locale]?.[namespace]?.[key];
      if (!String(value ?? '').trim()) missingValues += 1;
    });
  });

  const missingKeyStats = collectLocaleMissingStats(i18nStore, baseLocale);
  const worstLocale = Object.entries(missingKeyStats)
    .filter(([locale]) => locale !== baseLocale)
    .reduce<{ locale: string; missing: number } | null>(
      (acc, [locale, count]) => {
        if (!acc || count > acc.missing) return { locale, missing: count };
        return acc;
      },
      null
    );

  const externalComponentIds = parseStoredStringArray(
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(
          getResourceManagerExternalSelectionStorageKey(projectId)
        )
  );
  const externalIconIds = parseStoredStringArray(
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(
          getResourceManagerIconSelectionStorageKey(projectId)
        )
  );

  return {
    public: {
      files: publicFiles.length,
      warnings: publicHints.warnings,
      infos: publicHints.infos,
      updatedAt: resolveLatestUpdatedAt([
        publicTree.updatedAt,
        ...publicFiles.map((file) => file.updatedAt),
      ]),
    },
    code: {
      files: codeFiles.length,
      scripts: codeCounts.scripts,
      styles: codeCounts.styles,
      shaders: codeCounts.shaders,
      updatedAt: resolveLatestUpdatedAt([
        codeTree.updatedAt,
        ...codeFiles.map((file) => file.updatedAt),
      ]),
    },
    i18n: {
      locales: i18nLocales.length,
      namespaces: namespaceSet.size,
      keys: keySet.size,
      missingValues,
      baseLocale,
      worstLocale,
    },
    external: {
      componentLibraries: externalComponentIds.length,
      iconLibraries: externalIconIds.length,
    },
  };
};

const collectNodeIds = (node: CodeResourceNode) => {
  const ids = new Set<string>();
  const walk = (current: CodeResourceNode) => {
    ids.add(current.id);
    (current.children ?? []).forEach(walk);
  };
  walk(node);
  return ids;
};

const resolveCreatedNodeId = (
  before: CodeResourceNode,
  after: CodeResourceNode
) => {
  const beforeIds = collectNodeIds(before);
  let createdId: string | null = null;
  const walk = (current: CodeResourceNode) => {
    if (createdId) return;
    if (!beforeIds.has(current.id)) {
      createdId = current.id;
      return;
    }
    (current.children ?? []).forEach(walk);
  };
  walk(after);
  return createdId;
};

const createTemplateForCodeFolder = (
  folder: 'scripts' | 'styles' | 'shaders'
) => {
  if (folder === 'styles') {
    return {
      name: 'untitled.css',
      mime: 'text/css',
      content: '.className {\n  display: block;\n}\n',
    };
  }
  if (folder === 'shaders') {
    return {
      name: 'untitled.glsl',
      mime: 'text/glsl',
      content: 'void main() {\n  gl_Position = vec4(0.0);\n}\n',
    };
  }
  return {
    name: 'untitled.ts',
    mime: 'text/typescript',
    content: 'export const hello = "mdr";\n',
  };
};

const ResourceTile = ({
  icon: Icon,
  title,
  description,
  metrics,
  status,
  actionLabel,
  onAction,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  status: 'default' | 'warning';
  actionLabel: string;
  onAction: () => void;
}) => (
  <article className="relative overflow-hidden rounded-2xl border border-black/8 bg-(--color-0) p-5 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-6)">
          <Icon size={14} />
          {title}
        </p>
        <p className="mt-2 text-sm text-(--color-7)">{description}</p>
      </div>
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-(--color-8) hover:border-black/20 hover:bg-black/[0.02]"
        onClick={onAction}
      >
        {actionLabel}
        <ArrowRight size={12} />
      </button>
    </div>

    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={`${title}-${metric.label}`}
          className="rounded-xl border border-black/8 bg-black/[0.015] px-3 py-2"
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-(--color-6)">
            {metric.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-(--color-9)">
            {metric.value}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-(--color-7)">
      <span className="inline-flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />
        {status === 'warning' ? 'Needs attention' : 'Looking good'}
      </span>
      <span className="text-(--color-6)">Overview</span>
    </div>
  </article>
);

export function ProjectResources() {
  const { projectId } = useParams();
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    if (typeof window === 'undefined') return 'overview';
    const raw = window.localStorage.getItem(
      getResourceManagerViewStorageKey(projectId)
    );
    if (
      raw === 'overview' ||
      raw === 'public' ||
      raw === 'code' ||
      raw === 'i18n' ||
      raw === 'external'
    ) {
      return raw;
    }
    return 'overview';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      getResourceManagerViewStorageKey(projectId),
      activeSection
    );
  }, [activeSection, projectId]);

  const overviewSnapshot = useMemo(() => {
    if (activeSection !== 'overview') return null;
    return buildOverviewSnapshot(projectId);
  }, [activeSection, projectId]);

  const createCodeAssetAndOpen = (folder: 'scripts' | 'styles' | 'shaders') => {
    if (typeof window === 'undefined') return;
    const currentTree = readCodeTree(projectId);
    const template = createTemplateForCodeFolder(folder);
    const parentId =
      folder === 'scripts'
        ? 'code-scripts'
        : folder === 'styles'
          ? 'code-styles'
          : 'code-shaders';
    const resolvedParentId =
      findCodeNodeById(currentTree, parentId)?.type === 'folder'
        ? parentId
        : currentTree.id;
    const contentRef = `data:${template.mime};charset=utf-8,${encodeURIComponent(template.content)}`;
    const size = new TextEncoder().encode(template.content).length;
    const nextTree = createCodeFile(currentTree, resolvedParentId, {
      name: template.name,
      mime: template.mime,
      size,
      textContent: template.content,
      contentRef,
      category: 'document',
    });
    writeCodeTree(projectId, nextTree);
    const createdNodeId = resolveCreatedNodeId(currentTree, nextTree);
    if (createdNodeId) {
      window.localStorage.setItem(
        getResourceManagerCodeSelectionStorageKey(projectId),
        createdNodeId
      );
    }
    setActiveSection('code');
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-6">
      <header className="rounded-2xl border border-black/8 bg-white/92 p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-6)">
          Resource manager
        </p>
        <h1 className="text-2xl font-semibold text-(--color-10)">
          Project resources
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-(--color-7)">
          All resource pages stay under the same route and switch through tabs.
        </p>
      </header>

      <nav className="rounded-2xl border border-black/8 bg-(--color-0) p-2">
        <div className="flex flex-wrap gap-2">
          {sectionMetas.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border border-black/16 bg-black text-white'
                    : 'border border-transparent bg-transparent text-(--color-7) hover:border-black/10 hover:text-(--color-9)'
                }`}
              >
                <Icon size={14} />
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>

      {activeSection === 'overview' ? (
        <div className="grid gap-4">
          {overviewSnapshot ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <ResourceTile
                icon={FileArchive}
                title="Public"
                description="Static assets for export, deploy, and runtime previews."
                metrics={[
                  {
                    label: 'files',
                    value: String(overviewSnapshot.public.files),
                  },
                  {
                    label: 'warnings',
                    value: String(overviewSnapshot.public.warnings),
                  },
                  {
                    label: 'updated',
                    value: formatUpdatedAt(overviewSnapshot.public.updatedAt),
                  },
                ]}
                status={
                  overviewSnapshot.public.warnings > 0 ? 'warning' : 'default'
                }
                actionLabel="Open"
                onAction={() => setActiveSection('public')}
              />
              <ResourceTile
                icon={FileCode2}
                title="Code"
                description="Scripts, styles, shaders. Versioned as project resources."
                metrics={[
                  {
                    label: 'files',
                    value: String(overviewSnapshot.code.files),
                  },
                  {
                    label: 'scripts/styles',
                    value: `${overviewSnapshot.code.scripts}/${overviewSnapshot.code.styles}`,
                  },
                  {
                    label: 'updated',
                    value: formatUpdatedAt(overviewSnapshot.code.updatedAt),
                  },
                ]}
                status={
                  overviewSnapshot.code.files === 0 ? 'warning' : 'default'
                }
                actionLabel="Open"
                onAction={() => setActiveSection('code')}
              />
              <ResourceTile
                icon={Globe2}
                title="i18n"
                description="Matrix editor for locales and translation keys."
                metrics={[
                  {
                    label: 'locales',
                    value: String(overviewSnapshot.i18n.locales),
                  },
                  {
                    label: 'namespaces',
                    value: String(overviewSnapshot.i18n.namespaces),
                  },
                  {
                    label: 'missing values',
                    value: String(overviewSnapshot.i18n.missingValues),
                  },
                ]}
                status={
                  overviewSnapshot.i18n.missingValues > 0
                    ? 'warning'
                    : 'default'
                }
                actionLabel="Open"
                onAction={() => setActiveSection('i18n')}
              />
              <ResourceTile
                icon={Library}
                title="External libs"
                description="Runtime component + icon libraries (local presets + custom ids)."
                metrics={[
                  {
                    label: 'components',
                    value: String(overviewSnapshot.external.componentLibraries),
                  },
                  {
                    label: 'icons',
                    value: String(overviewSnapshot.external.iconLibraries),
                  },
                  {
                    label: 'status',
                    value:
                      overviewSnapshot.external.componentLibraries +
                        overviewSnapshot.external.iconLibraries >
                      0
                        ? 'configured'
                        : 'none',
                  },
                ]}
                status={
                  overviewSnapshot.external.componentLibraries +
                    overviewSnapshot.external.iconLibraries ===
                  0
                    ? 'warning'
                    : 'default'
                }
                actionLabel="Open"
                onAction={() => setActiveSection('external')}
              />
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-2xl border border-black/8 bg-(--color-0) p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-6)">
                    Quick actions
                  </p>
                  <h2 className="mt-2 text-base font-semibold text-(--color-9)">
                    Build faster without leaving resources
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-(--color-7)">
                    Create common assets, then jump straight into the dedicated
                    editor tab.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-black/[0.015] px-3 py-2 text-xs text-(--color-7)">
                  <Sparkles size={14} className="text-(--color-7)" />
                  Overview stays local (no network required).
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  className="group grid gap-1 rounded-2xl border border-black/8 bg-white p-4 text-left hover:border-black/16 hover:bg-black/[0.01]"
                  onClick={() => createCodeAssetAndOpen('scripts')}
                >
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-6)">
                    <Plus size={14} />
                    New script
                  </p>
                  <p className="text-sm font-semibold text-(--color-9)">
                    `untitled.ts` in scripts
                  </p>
                  <p className="text-xs text-(--color-7)">
                    TypeScript is the default workflow for logic.
                  </p>
                </button>

                <button
                  type="button"
                  className="group grid gap-1 rounded-2xl border border-black/8 bg-white p-4 text-left hover:border-black/16 hover:bg-black/[0.01]"
                  onClick={() => createCodeAssetAndOpen('styles')}
                >
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-6)">
                    <Plus size={14} />
                    New style
                  </p>
                  <p className="text-sm font-semibold text-(--color-9)">
                    `untitled.css` in styles
                  </p>
                  <p className="text-xs text-(--color-7)">
                    Drop in utility or custom component styles.
                  </p>
                </button>

                <button
                  type="button"
                  className="group grid gap-1 rounded-2xl border border-black/8 bg-white p-4 text-left hover:border-black/16 hover:bg-black/[0.01]"
                  onClick={() => createCodeAssetAndOpen('shaders')}
                >
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-6)">
                    <Plus size={14} />
                    New shader
                  </p>
                  <p className="text-sm font-semibold text-(--color-9)">
                    `untitled.glsl` in shaders
                  </p>
                  <p className="text-xs text-(--color-7)">
                    Quick-start GLSL for effects and previews.
                  </p>
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-black/8 bg-(--color-0) p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-6)">
                Health check
              </p>
              <h2 className="mt-2 text-base font-semibold text-(--color-9)">
                What needs attention
              </h2>
              <div className="mt-4 grid gap-2 text-sm text-(--color-7)">
                {overviewSnapshot?.public.warnings ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <TriangleAlert
                      size={16}
                      className="mt-0.5 text-amber-700"
                    />
                    <div>
                      Public has{' '}
                      <strong>{overviewSnapshot.public.warnings}</strong>{' '}
                      warning hints.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-black/8 bg-black/[0.015] px-3 py-2 text-xs">
                    Public assets look clean.
                  </div>
                )}

                {overviewSnapshot?.i18n.missingValues ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <TriangleAlert
                      size={16}
                      className="mt-0.5 text-amber-700"
                    />
                    <div>
                      i18n has{' '}
                      <strong>{overviewSnapshot.i18n.missingValues}</strong>{' '}
                      empty cells. Base:{' '}
                      <strong>{overviewSnapshot.i18n.baseLocale}</strong>.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-black/8 bg-black/[0.015] px-3 py-2 text-xs">
                    i18n coverage looks good.
                  </div>
                )}

                {overviewSnapshot?.external.componentLibraries === 0 ? (
                  <div className="rounded-2xl border border-black/8 bg-black/[0.015] px-3 py-2 text-xs">
                    No component library configured yet.
                  </div>
                ) : null}

                {overviewSnapshot?.i18n.worstLocale ? (
                  <div className="rounded-2xl border border-black/8 bg-black/[0.015] px-3 py-2 text-xs">
                    Worst locale:{' '}
                    <strong>{overviewSnapshot.i18n.worstLocale.locale}</strong>{' '}
                    missing{' '}
                    <strong>{overviewSnapshot.i18n.worstLocale.missing}</strong>{' '}
                    keys vs base.
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        </div>
      ) : null}

      {activeSection === 'public' ? <PublicResourcePage embedded /> : null}

      {activeSection === 'code' ? <CodeResourcePage embedded /> : null}

      {activeSection === 'i18n' ? <I18nResourcePage embedded /> : null}

      {activeSection === 'external' ? (
        <ExternalLibraryManager projectId={projectId} />
      ) : null}
    </section>
  );
}
