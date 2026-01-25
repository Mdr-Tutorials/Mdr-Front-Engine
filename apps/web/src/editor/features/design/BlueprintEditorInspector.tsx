import { ChevronLeft, ChevronRight } from "lucide-react"

type BlueprintEditorInspectorProps = {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function BlueprintEditorInspector({ isCollapsed, onToggleCollapse }: BlueprintEditorInspectorProps) {
  return (
    <aside className={`BlueprintEditorInspector ${isCollapsed ? "Collapsed" : ""}`}>
      <div className="InspectorHeader">
        <span>对象设置</span>
        <button
          className="BlueprintEditorCollapse"
          onClick={onToggleCollapse}
          aria-label="Toggle inspector"
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="InspectorPlaceholder">
          <p>选择蓝图中的对象以查看详细配置。</p>
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
