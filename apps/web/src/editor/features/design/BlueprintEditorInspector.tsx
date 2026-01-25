import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"

type BlueprintEditorInspectorProps = {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function BlueprintEditorInspector({ isCollapsed, onToggleCollapse }: BlueprintEditorInspectorProps) {
  const { t } = useTranslation('blueprint')

  return (
    <aside className={`BlueprintEditorInspector ${isCollapsed ? "Collapsed" : ""}`}>
      <div className="InspectorHeader">
        <span>{t('inspector.title')}</span>
        <button
          className="BlueprintEditorCollapse"
          onClick={onToggleCollapse}
          aria-label={t('inspector.toggle')}
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="InspectorPlaceholder">
          <p>{t('inspector.placeholder')}</p>
          <div className="InspectorSkeleton">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </aside>
  )
}
