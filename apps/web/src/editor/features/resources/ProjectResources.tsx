import { type ComponentType, useEffect, useState } from 'react';
import {
  FileArchive,
  FileCode2,
  Globe2,
  LayoutDashboard,
  Library,
} from 'lucide-react';
import { useParams } from 'react-router';
import { ExternalLibraryManager } from './ExternalLibraryManager';
import { PublicResourcePage } from './PublicResourcePage';

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

const MetricCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) => (
  <article className="rounded-xl border border-black/8 bg-black/[0.015] p-4">
    <p className="text-[11px] uppercase tracking-[0.08em] text-(--color-6)">
      {label}
    </p>
    <p className="mt-2 text-xl font-semibold text-(--color-10)">{value}</p>
    <p className="mt-1 text-xs text-(--color-7)">{hint}</p>
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
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard
              label="Public files"
              value="Editable"
              hint="Tree + preview + tips"
            />
            <MetricCard
              label="Code assets"
              value="Planned"
              hint="GLSL / WGSL / scripts"
            />
            <MetricCard
              label="i18n namespaces"
              value="Planned"
              hint="Locale quality pipeline"
            />
            <MetricCard
              label="External libs"
              value="Available"
              hint="Runtime profile settings"
            />
          </div>
          <article className="rounded-2xl border border-black/8 bg-(--color-0) p-5">
            <h2 className="text-base font-semibold text-(--color-9)">Notes</h2>
            <ul className="mt-3 grid gap-2 text-sm text-(--color-7)">
              <li className="rounded-lg border border-black/8 bg-black/[0.01] px-3 py-2">
                Public and export share the same public tree source.
              </li>
              <li className="rounded-lg border border-black/8 bg-black/[0.01] px-3 py-2">
                Public operations use inline inputs, no modal prompt flow.
              </li>
            </ul>
          </article>
        </div>
      ) : null}

      {activeSection === 'public' ? <PublicResourcePage embedded /> : null}

      {activeSection === 'code' ? (
        <article className="rounded-2xl border border-black/8 bg-(--color-0) p-5 text-sm text-(--color-7)">
          Code assets tab is reserved.
        </article>
      ) : null}

      {activeSection === 'i18n' ? (
        <article className="rounded-2xl border border-black/8 bg-(--color-0) p-5 text-sm text-(--color-7)">
          i18n assets tab is reserved.
        </article>
      ) : null}

      {activeSection === 'external' ? (
        <ExternalLibraryManager projectId={projectId} />
      ) : null}
    </section>
  );
}
