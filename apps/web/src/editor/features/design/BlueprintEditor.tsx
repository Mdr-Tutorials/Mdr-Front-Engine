import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router"
import { DEFAULT_ROUTES, VIEWPORT_ZOOM_RANGE } from "./BlueprintEditor.data"
import { BlueprintEditorAddressBar } from "./BlueprintEditorAddressBar"
import { BlueprintEditorCanvas } from "./BlueprintEditorCanvas"
import { BlueprintEditorInspector } from "./BlueprintEditorInspector"
import { BlueprintEditorSidebar } from "./BlueprintEditorSidebar"
import { BlueprintEditorViewportBar } from "./BlueprintEditorViewportBar"
import type { RouteItem } from "./BlueprintEditor.types"
import { DEFAULT_BLUEPRINT_STATE, useEditorStore } from "@/editor/store/useEditorStore"
import { useSettingsStore } from "@/editor/store/useSettingsStore"
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
  const panelLayout = useSettingsStore((state) => state.global.panelLayout)
  const [isLibraryCollapsed, setLibraryCollapsed] = useState(() => panelLayout === "focus")
  const [isInspectorCollapsed, setInspectorCollapsed] = useState(
    () => panelLayout === "focus" || panelLayout === "wide"
  )
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({})
  const [sizeSelections, setSizeSelections] = useState<Record<string, string>>({})
  const [statusSelections, setStatusSelections] = useState<Record<string, number>>({})
  const statusTimers = useRef<Record<string, number>>({})
  const { projectId } = useParams()
  const blueprintKey = projectId ?? "global"
  const blueprintState = useEditorStore((state) => state.blueprintStateByProject[blueprintKey])
  const setBlueprintState = useEditorStore((state) => state.setBlueprintState)
  const zoomStep = useSettingsStore((state) => state.global.zoomStep)
  const defaultViewportWidth = useSettingsStore((state) => state.global.viewportWidth)
  const defaultViewportHeight = useSettingsStore((state) => state.global.viewportHeight)
  const initialBlueprintState = useMemo(
    () => ({
      ...DEFAULT_BLUEPRINT_STATE,
      viewportWidth: defaultViewportWidth,
      viewportHeight: defaultViewportHeight,
    }),
    [defaultViewportWidth, defaultViewportHeight]
  )
  const resolvedBlueprintState = blueprintState ?? DEFAULT_BLUEPRINT_STATE
  const { viewportWidth, viewportHeight, zoom, pan, selectedId } = resolvedBlueprintState

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
    if (blueprintState) return
    setBlueprintState(blueprintKey, initialBlueprintState)
  }, [blueprintKey, blueprintState, initialBlueprintState, setBlueprintState])

  useEffect(() => {
    if (panelLayout === "focus") {
      setLibraryCollapsed(true)
      setInspectorCollapsed(true)
      return
    }
    if (panelLayout === "wide") {
      setLibraryCollapsed(false)
      setInspectorCollapsed(true)
      return
    }
    setLibraryCollapsed(false)
    setInspectorCollapsed(false)
  }, [panelLayout])

  const handleZoomChange = (value: number) => {
    const next = Math.min(VIEWPORT_ZOOM_RANGE.max, Math.max(VIEWPORT_ZOOM_RANGE.min, value))
    setBlueprintState(blueprintKey, { zoom: next })
  }

  const handleViewportWidthChange = (value: string) => {
    setBlueprintState(blueprintKey, { viewportWidth: value })
  }

  const handleViewportHeightChange = (value: string) => {
    setBlueprintState(blueprintKey, { viewportHeight: value })
  }

  const handlePanChange = (nextPan: { x: number; y: number }) => {
    setBlueprintState(blueprintKey, { pan: nextPan })
  }

  const handleNodeSelect = (nodeId: string) => {
    setBlueprintState(blueprintKey, { selectedId: nodeId })
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
        <BlueprintEditorCanvas
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          zoom={zoom}
          pan={pan}
          selectedId={selectedId}
          onPanChange={handlePanChange}
          onSelectNode={handleNodeSelect}
        />
        <BlueprintEditorInspector
          isCollapsed={isInspectorCollapsed}
          onToggleCollapse={() => setInspectorCollapsed((prev) => !prev)}
        />
      </div>
      <BlueprintEditorViewportBar
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        onViewportWidthChange={handleViewportWidthChange}
        onViewportHeightChange={handleViewportHeightChange}
        zoom={zoom}
        zoomStep={zoomStep}
        onZoomChange={handleZoomChange}
      />
    </div>
  )
}

export default BlueprintEditor
