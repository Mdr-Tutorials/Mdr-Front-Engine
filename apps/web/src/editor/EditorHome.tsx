import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Box,
  Layers,
  Workflow,
  Clock,
  MoreHorizontal,
  Globe,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { EditorBarExitModal } from './EditorBar/EditorBarExitModal';
import { TIPS, type TipId } from './tips';
import { truncate } from '@/utils/truncate';
import NewResourceModal from './features/newfile/NewResourceModal';
import { editorApi, type ProjectSummary } from './editorApi';
import { useAuthStore } from '@/auth/useAuthStore';
import { useEditorStore } from './store/useEditorStore';

function EditorTipsRandom() {
  const { t } = useTranslation('editor');
  const tipsCount = TIPS.length;
  const [scores, setScores] = useState(() => Array(tipsCount).fill(1));
  const [active, setActive] = useState(0);

  const pickNextTip = useCallback(() => {
    const weights = scores.map((score) => 1 / score);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * total;
    let next = 0;
    for (let index = 0; index < tipsCount; index++) {
      if (random < weights[index]) {
        next = index;
        break;
      }
      random -= weights[index];
    }
    if (next === active && tipsCount > 1) next = (active + 1) % tipsCount;
    setScores((prev) => {
      const clone = [...prev];
      clone[next] += 1;
      return clone;
    });
    setActive(next);
  }, [scores, active, tipsCount]);

  useEffect(() => {
    const timer = setInterval(pickNextTip, 5000);
    return () => clearInterval(timer);
  }, [pickNextTip]);

  const clickNext = () => pickNextTip();
  const tipId = TIPS[active] as TipId;

  return (
    <div
      className="mt-auto cursor-pointer select-none p-[12px] text-center text-[14px] text-[#999] hover:text-[var(--color-9)]"
      onClick={clickNext}
    >
      <p>
        {t('tips.prefix')} {t(`tips.items.${tipId}.body`)}
      </p>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onRename,
  onPublish,
  onDelete,
  isRenaming,
  isPublishing,
  isDeleting,
}: {
  project: ProjectSummary;
  onOpen: (project: ProjectSummary) => void;
  onRename: (project: ProjectSummary, name: string) => Promise<boolean>;
  onPublish: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
  isRenaming: boolean;
  isPublishing: boolean;
  isDeleting: boolean;
}) {
  const { t } = useTranslation('editor');
  const [isActionsOpen, setActionsOpen] = useState(false);
  const [draftName, setDraftName] = useState(project.name || '');
  const [isEditingName, setEditingName] = useState(false);
  const isClonedProject = /\(copy\)\s*$/i.test(project.name || '');

  useEffect(() => {
    if (isEditingName) return;
    setDraftName(project.name || '');
  }, [project.name, isEditingName]);

  const getIcon = () => {
    switch (project.resourceType) {
      case 'project':
        return <Box size={24} />;
      case 'component':
        return <Layers size={24} />;
      case 'nodegraph':
        return <Workflow size={24} />;
      default:
        return <Box size={24} />;
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const startRename = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActionsOpen(false);
    setDraftName(project.name || '');
    setEditingName(true);
  };

  const cancelRename = () => {
    setDraftName(project.name || '');
    setEditingName(false);
  };

  const applyRename = async () => {
    if (isRenaming) return;
    const nextName = draftName.trim();
    if (!nextName || nextName === (project.name || '')) {
      cancelRename();
      return;
    }
    const renamed = await onRename(project, nextName);
    if (renamed) setEditingName(false);
  };

  return (
    <div className="group/card relative flex h-full min-h-[280px] w-full flex-col rounded-[16px] border border-[var(--color-2)] bg-[var(--color-1)] p-[24px] text-left transition-all duration-[300ms] ease-[ease] hover:-translate-y-1 hover:border-[var(--color-4)] hover:bg-[var(--color-0)] hover:shadow-[var(--shadow-lg)]">
      <button
        type="button"
        onClick={() => setActionsOpen((prev) => !prev)}
        aria-label={t('home.card.moreActions', 'More actions')}
        className="absolute right-[14px] top-[14px] z-10 inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-[var(--color-2)] bg-[var(--color-0)] text-[var(--color-7)] transition-colors hover:border-[var(--color-4)] hover:text-[var(--color-9)]"
      >
        <MoreHorizontal size={16} />
      </button>

      {isActionsOpen && (
        <div className="absolute right-[14px] top-[48px] z-20 flex min-w-[170px] flex-col gap-[6px] rounded-[12px] border border-[var(--color-2)] bg-[var(--color-0)] p-[8px] shadow-[var(--shadow-lg)]">
          {!project.isPublic ? (
            <button
              type="button"
              onClick={() => onPublish(project)}
              disabled={isPublishing || isDeleting || isClonedProject}
              title={
                isClonedProject
                  ? t(
                      'home.card.publishDisabledReason',
                      'Cloned projects cannot be published.'
                    )
                  : undefined
              }
              className="inline-flex items-center gap-[6px] rounded-[8px] border border-[var(--color-2)] bg-[var(--color-0)] px-[10px] py-[7px] text-[12px] text-[var(--color-8)] transition-colors hover:border-[var(--color-4)] disabled:cursor-not-allowed disabled:opacity-[0.45]"
            >
              <Globe size={14} />
              {isClonedProject
                ? t('home.card.publishDisabled', 'Publish disabled for copies')
                : isPublishing
                  ? t('home.card.publishing', 'Publishing...')
                  : t('home.card.publish', 'Publish to Community')}
            </button>
          ) : (
            <a
              href={`/community/${project.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-[6px] rounded-[8px] border border-[var(--color-2)] bg-[var(--color-0)] px-[10px] py-[7px] text-[12px] text-[var(--color-8)] no-underline transition-colors hover:border-[var(--color-4)]"
            >
              <Globe size={14} />
              {t('home.card.openCommunity', 'Open Community')}
            </a>
          )}
          <button
            type="button"
            onClick={() => onDelete(project)}
            disabled={isPublishing || isDeleting}
            className="inline-flex items-center gap-[6px] rounded-[8px] border border-[rgba(220,38,38,0.35)] bg-[var(--color-0)] px-[10px] py-[7px] text-[12px] text-[rgba(185,28,28,0.92)] transition-colors hover:border-[rgba(220,38,38,0.6)] disabled:cursor-not-allowed disabled:opacity-[0.45]"
          >
            <Trash2 size={14} />
            {isDeleting
              ? t('home.card.deleting', 'Deleting...')
              : t('home.card.delete', 'Delete Project')}
          </button>
        </div>
      )}

      {isEditingName ? (
        <button
          type="button"
          aria-label={t('home.card.renameConfirm', 'Confirm rename')}
          disabled={isRenaming}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            void applyRename();
          }}
          className="absolute right-[14px] top-[70px] z-10 inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border border-[var(--color-3)] text-[var(--color-8)] transition hover:border-[var(--color-5)] hover:text-[var(--color-10)] disabled:opacity-[0.5]"
        >
          <Check size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={startRename}
          aria-label={t('home.card.rename', 'Rename project')}
          className="absolute right-[14px] top-[70px] z-10 inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border border-transparent text-[var(--color-6)] opacity-0 transition hover:border-[var(--color-3)] hover:text-[var(--color-10)] group-hover/card:opacity-100 focus:opacity-100"
        >
          <Pencil size={14} />
        </button>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isActionsOpen) {
            setActionsOpen(false);
            return;
          }
          if (isEditingName) return;
          onOpen(project);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (isEditingName || isActionsOpen) return;
          onOpen(project);
        }}
        className="flex flex-1 cursor-pointer flex-col justify-between border-0 bg-transparent p-0 text-left"
      >
        <div className="flex flex-col gap-[12px]">
          <div className="mb-[8px] text-[var(--color-primary)]">
            {getIcon()}
          </div>
          <div className="pr-[36px]">
            {isEditingName ? (
              <input
                autoFocus
                value={draftName}
                disabled={isRenaming}
                aria-label={t('home.card.renameInput', 'Rename project')}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={() => {
                  void applyRename();
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelRename();
                    return;
                  }
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void applyRename();
                  }
                }}
                className="h-[30px] w-full rounded-[8px] border border-[var(--color-4)] bg-[var(--color-0)] px-[8px] text-[16px] font-semibold text-[var(--color-10)] outline-none"
              />
            ) : (
              <h3 className="m-0 min-w-0 flex-1 text-[18px] font-semibold text-[var(--color-10)]">
                <span className="block truncate">
                  {project.name || t('home.card.untitled', 'Untitled')}
                </span>
              </h3>
            )}
          </div>
          <p className="flex items-center justify-between border-t border-[var(--color-2)] pt-[16px] text-[12px] leading-[1.5] text-[var(--color-5)]">
            {truncate(project.description || '', 160) ||
              t('home.card.noDescription', 'No description')}
          </p>
        </div>
        <div className="flex items-center gap-[6px] text-[var(--color-6)]">
          <Clock size={14} />
          <span className="text-[12px]">{formatTime(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function EditorHome() {
  const { t } = useTranslation('editor');
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [isResourceModalOpen, setResourceModalOpen] = useState(false);
  const [isExitModalOpen, setExitModalOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyByProject, setBusyByProject] = useState<
    Record<string, 'publishing' | 'deleting' | 'renaming' | undefined>
  >({});
  const setProjectsInStore = useEditorStore((state) => state.setProjects);
  const setProjectInStore = useEditorStore((state) => state.setProject);
  const removeProjectInStore = useEditorStore((state) => state.removeProject);

  useEffect(() => {
    if (isResourceModalOpen || isExitModalOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== 'Escape') return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      setExitModalOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isResourceModalOpen, isExitModalOpen]);

  useEffect(() => {
    if (!token) {
      setProjects([]);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    editorApi
      .listProjects(token)
      .then(({ projects: remoteProjects }) => {
        if (cancelled) return;
        setProjects(remoteProjects);
        setProjectsInStore(
          remoteProjects.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            type: project.resourceType,
            isPublic: project.isPublic,
            starsCount: project.starsCount,
          }))
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load projects.'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, setProjectsInStore]);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [projects]
  );

  const openProject = (project: ProjectSummary) => {
    switch (project.resourceType) {
      case 'component':
        navigate(`/editor/project/${project.id}/component`);
        return;
      case 'nodegraph':
        navigate(`/editor/project/${project.id}/nodegraph`);
        return;
      default:
        navigate(`/editor/project/${project.id}/blueprint`);
    }
  };

  const publishProject = async (project: ProjectSummary) => {
    const isClonedProject = /\(copy\)\s*$/i.test(project.name || '');
    if (
      !token ||
      project.isPublic ||
      busyByProject[project.id] ||
      isClonedProject
    )
      return;
    setBusyByProject((prev) => ({ ...prev, [project.id]: 'publishing' }));
    try {
      const { project: published } = await editorApi.publishProject(
        token,
        project.id
      );
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? {
                ...item,
                isPublic: published.isPublic,
                starsCount: published.starsCount,
                updatedAt: published.updatedAt,
              }
            : item
        )
      );
      setProjectInStore({
        id: published.id,
        name: published.name,
        description: published.description,
        type: published.resourceType,
        isPublic: published.isPublic,
        starsCount: published.starsCount,
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.publishFailed', 'Failed to publish project.')
      );
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  const renameProject = async (project: ProjectSummary, name: string) => {
    if (!token || busyByProject[project.id]) return false;
    setBusyByProject((prev) => ({ ...prev, [project.id]: 'renaming' }));
    try {
      const { project: renamed } = await editorApi.updateProject(
        token,
        project.id,
        {
          name,
        }
      );
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? {
                ...item,
                name: renamed.name,
                description: renamed.description,
                updatedAt: renamed.updatedAt,
              }
            : item
        )
      );
      setProjectInStore({
        id: renamed.id,
        name: renamed.name,
        description: renamed.description,
        type: renamed.resourceType,
        isPublic: renamed.isPublic,
        starsCount: renamed.starsCount,
      });
      return true;
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.renameFailed', 'Failed to rename project.')
      );
      return false;
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  const deleteProject = async (project: ProjectSummary) => {
    if (!token || busyByProject[project.id]) return;
    const confirmed = window.confirm(
      t('home.card.deleteConfirm', 'Delete this project permanently?')
    );
    if (!confirmed) return;
    setBusyByProject((prev) => ({ ...prev, [project.id]: 'deleting' }));
    try {
      await editorApi.deleteProject(token, project.id);
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      removeProjectInStore(project.id);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.deleteFailed', 'Failed to delete project.')
      );
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  return (
    <div className="flex h-full w-full flex-1 bg-[var(--color-0)] text-[var(--color-10)]">
      <div className="flex flex-1 flex-col gap-[32px] overflow-y-auto p-[40px]">
        <header className="flex w-full flex-col gap-[8px]">
          <h1 className="m-0 text-[24px] font-semibold leading-[1.25] text-[var(--color-10)]">
            {t('home.welcomeTitle')}
          </h1>
        </header>

        {loadError && (
          <p className="m-0 rounded-[12px] border border-[var(--color-3)] bg-[var(--color-1)] p-[12px] text-[13px] text-[var(--color-7)]">
            {loadError}
          </p>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] auto-rows-[minmax(280px,auto)] gap-[20px] max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          <button
            className="flex h-full min-h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-[var(--color-3)] bg-[var(--color-1)] text-[18px] text-[var(--color-10)] transition-all duration-[300ms] ease-[ease] hover:border-[var(--color-6)] hover:bg-[var(--color-2)]"
            onClick={() => setResourceModalOpen(true)}
          >
            <Plus size={48} />
            <span className="text-[16px]">{t('home.actions.newProject')}</span>
          </button>

          {!token && (
            <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-[var(--color-2)] bg-[var(--color-1)] p-[24px] text-[13px] text-[var(--color-6)]">
              {t('auth.required', 'Please sign in to load your projects.')}
            </div>
          )}

          {isLoading && (
            <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-[var(--color-2)] bg-[var(--color-1)] p-[24px] text-[13px] text-[var(--color-6)]">
              {t('common.loading', 'Loading...')}
            </div>
          )}

          {!isLoading &&
            sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={openProject}
                onRename={renameProject}
                onPublish={publishProject}
                onDelete={deleteProject}
                isRenaming={busyByProject[project.id] === 'renaming'}
                isPublishing={busyByProject[project.id] === 'publishing'}
                isDeleting={busyByProject[project.id] === 'deleting'}
              />
            ))}
        </div>

        <div className="mt-[48px] flex items-center justify-center pb-[20px]">
          <EditorTipsRandom />
        </div>
      </div>

      <NewResourceModal
        open={isResourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
      />
      <EditorBarExitModal
        isOpen={isExitModalOpen}
        exitLabel={t('bar.exitToHome')}
        cancelLabel={t('bar.cancel')}
        exitText={t('bar.exit')}
        title={t('bar.exitTitle')}
        onClose={() => setExitModalOpen(false)}
        onConfirm={() => {
          setExitModalOpen(false);
          navigate('/');
        }}
      />
    </div>
  );
}

export default EditorHome;
