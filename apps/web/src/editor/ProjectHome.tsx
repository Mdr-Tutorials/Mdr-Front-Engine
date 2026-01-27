import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { Boxes, FileCog, FlaskConical, GitBranch, LayoutGrid, Package, ServerCog, Settings, Sparkles } from "lucide-react"
import "./ProjectHome.scss"
import { useEditorStore } from "@/editor/store/useEditorStore"

type ProjectAction = {
  key: string
  path: string
  icon: JSX.Element
}

function ProjectHome() {
  const { t } = useTranslation('editor')
  const { projectId } = useParams()
  const navigate = useNavigate()
  const resolvedProjectId = projectId ?? "-"
  const isValidProject = Boolean(projectId)
  const project = useEditorStore((state) => (projectId ? state.projectsById[projectId] : undefined))
  const projectName = project?.name?.trim() || t('projectHome.untitled', { id: resolvedProjectId })

  const actions = useMemo<ProjectAction[]>(
    () => [
      {
        key: "blueprint",
        path: `/editor/project/${resolvedProjectId}/blueprint`,
        icon: <LayoutGrid size={18} />,
      },
      {
        key: "component",
        path: `/editor/project/${resolvedProjectId}/component`,
        icon: <Boxes size={18} />,
      },
      {
        key: "nodegraph",
        path: `/editor/project/${resolvedProjectId}/nodegraph`,
        icon: <GitBranch size={18} />,
      },
      {
        key: "animation",
        path: `/editor/project/${resolvedProjectId}/animation`,
        icon: <Sparkles size={18} />,
      },
      {
        key: "testing",
        path: `/editor/project/${resolvedProjectId}/test`,
        icon: <FlaskConical size={18} />,
      },
      {
        key: "export",
        path: `/editor/project/${resolvedProjectId}/export`,
        icon: <Package size={18} />,
      },
      {
        key: "deployment",
        path: `/editor/project/${resolvedProjectId}/deployment`,
        icon: <ServerCog size={18} />,
      },
      {
        key: "settings",
        path: `/editor/project/${resolvedProjectId}/settings`,
        icon: <Settings size={18} />,
      },
    ],
    [resolvedProjectId]
  )

  return (
    <div className="ProjectHome">
      <header className="ProjectHomeHeader">
        <div className="ProjectHomeHeaderText">
          <h1 className="ProjectHomeTitle">
            {t('projectHome.title', { name: projectName })}
          </h1>
          <p className="ProjectHomeSubtitle">{t('projectHome.subtitle')}</p>
        </div>
        <div className="ProjectHomeHeaderActions">
          <button
            type="button"
            className="ProjectHomeIconButton"
            aria-label={t('projectHome.actions.settings.label')}
            title={t('projectHome.actions.settings.label')}
            onClick={() => navigate(`/editor/project/${resolvedProjectId}/settings`)}
            disabled={!isValidProject}
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            className="ProjectHomeIconButton"
            aria-label={t('projectHome.actions.projectInfo')}
            title={t('projectHome.actions.projectInfo')}
            onClick={() => navigate(`/editor/project/${resolvedProjectId}/settings`)}
            disabled={!isValidProject}
          >
            <FileCog size={16} />
          </button>
        </div>
      </header>

      <section className="ProjectHomeInfo">
        <div className="ProjectHomeInfoRow">
          <span className="ProjectHomeInfoLabel">{t('projectHome.fields.id')}</span>
          <span className="ProjectHomeInfoValue">{resolvedProjectId}</span>
        </div>
        <div className="ProjectHomeInfoRow">
          <span className="ProjectHomeInfoLabel">{t('projectHome.fields.name')}</span>
          <span className="ProjectHomeInfoValue">{projectName}</span>
        </div>
      </section>

      <section className="ProjectHomeActionsGrid">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            className="ProjectHomeActionCard"
            onClick={() => navigate(action.path)}
            disabled={!isValidProject}
          >
            <span className="ProjectHomeActionIcon">{action.icon}</span>
            <span className="ProjectHomeActionContent">
              <span className="ProjectHomeActionLabel">
                {t(`projectHome.actions.${action.key}.label`)}
              </span>
              <span className="ProjectHomeActionDescription">
                {t(`projectHome.actions.${action.key}.description`)}
              </span>
            </span>
          </button>
        ))}
      </section>
    </div>
  )
}

export default ProjectHome
