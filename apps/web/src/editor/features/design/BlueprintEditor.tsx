import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { DEFAULT_ROUTES } from "./BlueprintEditor.data"
import { BlueprintEditorAddressBar } from "./BlueprintEditorAddressBar"
import { BlueprintEditorCanvas } from "./BlueprintEditorCanvas"
import { BlueprintEditorInspector } from "./BlueprintEditorInspector"
import { BlueprintEditorSidebar } from "./BlueprintEditorSidebar"
import { BlueprintEditorViewportBar } from "./BlueprintEditorViewportBar"
import type { RouteItem } from "./BlueprintEditor.types"
import "./BlueprintEditor.scss"

const createRouteId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `route-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function BlueprintEditor() {
  const [routes, setRoutes] = useState<RouteItem[]>(DEFAULT_ROUTES)
  const [currentPath, setCurrentPath] = useState(DEFAULT_ROUTES[0].path)
  const [newPath, setNewPath] = useState("")
  const [isLibraryCollapsed, setLibraryCollapsed] = useState(false)
  const [isInspectorCollapsed, setInspectorCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({})
  const [sizeSelections, setSizeSelections] = useState<Record<string, string>>({})
  const [statusSelections, setStatusSelections] = useState<Record<string, number>>({})
  const statusTimers = useRef<Record<string, number>>({})
  const [viewportWidth, setViewportWidth] = useState("1440")
  const [viewportHeight, setViewportHeight] = useState("900")

  const handleAddRoute = () => {
    const value = newPath.trim()
    if (!value) return
    const next = { id: createRouteId(), path: value }
    setRoutes((prev) => [...prev, next])
    setCurrentPath(value)
    setNewPath("")
  }

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const togglePreview = (previewId: string) => {
    setExpandedPreviews((prev) => ({ ...prev, [previewId]: !prev[previewId] }))
  }

  const handlePreviewKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    previewId: string,
    hasVariants: boolean,
  ) => {
    if (!hasVariants) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      togglePreview(previewId)
    }
  }

  const handleSizeSelect = (itemId: string, sizeId: string) => {
    setSizeSelections((prev) => ({ ...prev, [itemId]: sizeId }))
  }

  const handleStatusSelect = (itemId: string, index: number) => {
    setStatusSelections((prev) => ({ ...prev, [itemId]: index }))
  }

  const startStatusCycle = (itemId: string, total: number) => {
    if (typeof window === "undefined" || total < 2) return
    window.clearInterval(statusTimers.current[itemId])
    statusTimers.current[itemId] = window.setInterval(() => {
      setStatusSelections((prev) => ({
        ...prev,
        [itemId]: ((prev[itemId] ?? 0) + 1) % total,
      }))
    }, 1200)
  }

  const stopStatusCycle = (itemId: string) => {
    if (typeof window === "undefined") return
    window.clearInterval(statusTimers.current[itemId])
    delete statusTimers.current[itemId]
  }

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return
      Object.values(statusTimers.current).forEach((timer) => window.clearInterval(timer))
      statusTimers.current = {}
    }
  }, [])

  return (
    <div className="BlueprintEditor">
      <BlueprintEditorAddressBar
        currentPath={currentPath}
        newPath={newPath}
        routes={routes}
        onCurrentPathChange={setCurrentPath}
        onNewPathChange={setNewPath}
        onAddRoute={handleAddRoute}
      />
      <div
        className={`BlueprintEditorBody ${isLibraryCollapsed ? "SidebarCollapsed" : ""} ${isInspectorCollapsed ? "InspectorCollapsed" : ""}`}
      >
        <BlueprintEditorSidebar
          isCollapsed={isLibraryCollapsed}
          collapsedGroups={collapsedGroups}
          expandedPreviews={expandedPreviews}
          sizeSelections={sizeSelections}
          statusSelections={statusSelections}
          onToggleCollapse={() => setLibraryCollapsed((prev) => !prev)}
          onToggleGroup={toggleGroup}
          onTogglePreview={togglePreview}
          onPreviewKeyDown={handlePreviewKeyDown}
          onSizeSelect={handleSizeSelect}
          onStatusSelect={handleStatusSelect}
          onStatusCycleStart={startStatusCycle}
          onStatusCycleStop={stopStatusCycle}
        />
        <BlueprintEditorCanvas />
        <BlueprintEditorInspector
          isCollapsed={isInspectorCollapsed}
          onToggleCollapse={() => setInspectorCollapsed((prev) => !prev)}
        />
      </div>
      <BlueprintEditorViewportBar
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        onViewportWidthChange={setViewportWidth}
        onViewportHeightChange={setViewportHeight}
      />
    </div>
  )
}

export default BlueprintEditor
