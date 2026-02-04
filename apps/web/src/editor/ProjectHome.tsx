import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import {
  Boxes,
  FileCog,
  FlaskConical,
  Folder,
  GitBranch,
  LayoutGrid,
  Package,
  ServerCog,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useEditorStore } from '@/editor/store/useEditorStore';

type ProjectAction = {
  key: string;
  path: string;
  icon: JSX.Element;
};

function ProjectHome() {
  const { t } = useTranslation('editor');
  const { projectId } = useParams();
  const navigate = useNavigate();
  const resolvedProjectId = projectId ?? '-';
  const isValidProject = Boolean(projectId);
  const project = useEditorStore((state) =>
    projectId ? state.projectsById[projectId] : undefined
  );
  const projectName =
    project?.name?.trim() ||
    t('projectHome.untitled', { id: resolvedProjectId });

  const actions = useMemo<ProjectAction[]>(
    () => [
      {
        key: 'blueprint',
        path: `/editor/project/${resolvedProjectId}/blueprint`,
        icon: <LayoutGrid size={18} />,
      },
      {
        key: 'component',
        path: `/editor/project/${resolvedProjectId}/component`,
        icon: <Boxes size={18} />,
      },
      {
        key: 'resources',
        path: `/editor/project/${resolvedProjectId}/resources`,
        icon: <Folder size={18} />,
      },
      {
        key: 'nodegraph',
        path: `/editor/project/${resolvedProjectId}/nodegraph`,
        icon: <GitBranch size={18} />,
      },
      {
        key: 'animation',
        path: `/editor/project/${resolvedProjectId}/animation`,
        icon: <Sparkles size={18} />,
      },
      {
        key: 'testing',
        path: `/editor/project/${resolvedProjectId}/test`,
        icon: <FlaskConical size={18} />,
      },
      {
        key: 'export',
        path: `/editor/project/${resolvedProjectId}/export`,
        icon: <Package size={18} />,
      },
      {
        key: 'deployment',
        path: `/editor/project/${resolvedProjectId}/deployment`,
        icon: <ServerCog size={18} />,
      },
      {
        key: 'settings',
        path: `/editor/project/${resolvedProjectId}/settings`,
        icon: <Settings size={18} />,
      },
    ],
    [resolvedProjectId]
  );

  return (
    <div className="flex flex-col gap-[16px] p-[18px_20px] text-[var(--color-10)]">
      <header className="flex items-center justify-between gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <h1 className="m-0 text-[18px] font-bold">
            {t('projectHome.title', { name: projectName })}
          </h1>
          <p className="m-0 text-[12px] text-[var(--color-6)]">
            {t('projectHome.subtitle')}
          </p>
        </div>
        <div className="inline-flex items-center gap-[6px]">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[10px] border-0 bg-transparent p-[4px] text-[var(--color-6)] disabled:cursor-not-allowed disabled:opacity-[0.45] hover:text-[var(--color-9)]"
            aria-label={t('projectHome.actions.settings.label')}
            title={t('projectHome.actions.settings.label')}
            onClick={() =>
              navigate(`/editor/project/${resolvedProjectId}/settings`)
            }
            disabled={!isValidProject}
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[10px] border-0 bg-transparent p-[4px] text-[var(--color-6)] disabled:cursor-not-allowed disabled:opacity-[0.45] hover:text-[var(--color-9)]"
            aria-label={t('projectHome.actions.projectInfo')}
            title={t('projectHome.actions.projectInfo')}
            onClick={() =>
              navigate(`/editor/project/${resolvedProjectId}/settings`)
            }
            disabled={!isValidProject}
          >
            <FileCog size={16} />
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-[8px]">
        <div className="inline-flex items-center gap-[8px] text-[12px]">
          <span className="text-[var(--color-6)]">
            {t('projectHome.fields.id')}
          </span>
          <span className="font-semibold font-mono text-[var(--color-9)]">
            {resolvedProjectId}
          </span>
        </div>
        <div className="inline-flex items-center gap-[8px] text-[12px]">
          <span className="text-[var(--color-6)]">
            {t('projectHome.fields.name')}
          </span>
          <span className="font-semibold font-mono text-[var(--color-9)]">
            {projectName}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[10px]">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            className="group flex cursor-pointer items-center gap-[10px] rounded-[12px] border-0 bg-transparent p-[10px] text-left text-[var(--color-9)] transition-colors duration-[150ms] ease-[ease] disabled:cursor-not-allowed disabled:opacity-[0.45] hover:text-[var(--color-10)]"
            onClick={() => navigate(action.path)}
            disabled={!isValidProject}
          >
            <span className="inline-flex h-[28px] w-[28px] flex-none items-center justify-center rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[var(--color-7)] transition-colors duration-[150ms] ease-[ease] group-hover:bg-[rgba(0,0,0,0.08)] group-hover:text-[var(--color-9)] dark:bg-[rgba(255,255,255,0.06)] dark:group-hover:bg-[rgba(255,255,255,0.1)]">
              {action.icon}
            </span>
            <span className="flex min-w-0 flex-col gap-[2px]">
              <span className="text-[13px] font-semibold">
                {t(`projectHome.actions.${action.key}.label`)}
              </span>
              <span className="text-[11px] text-[var(--color-6)]">
                {t(`projectHome.actions.${action.key}.description`)}
              </span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}

export default ProjectHome;
