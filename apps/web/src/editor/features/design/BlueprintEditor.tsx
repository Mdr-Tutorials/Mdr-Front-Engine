import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router"
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core"
import { DEFAULT_ROUTES, VIEWPORT_ZOOM_RANGE } from "./BlueprintEditor.data"
import { BlueprintEditorAddressBar } from "./BlueprintEditorAddressBar"
import { BlueprintEditorCanvas } from "./BlueprintEditorCanvas"
import { BlueprintEditorComponentTree } from "./BlueprintEditorComponentTree"
import { BlueprintEditorInspector } from "./BlueprintEditorInspector"
import { BlueprintEditorSidebar } from "./BlueprintEditorSidebar"
import { BlueprintEditorViewportBar } from "./BlueprintEditorViewportBar"
import type { RouteItem } from "./BlueprintEditor.types"
import type { ComponentNode, MIRDocument } from "@/core/types/engine.types"
import { DEFAULT_BLUEPRINT_STATE, useEditorStore } from "@/editor/store/useEditorStore"
import { useSettingsStore } from "@/editor/store/useSettingsStore"
import "./BlueprintEditor.scss"

const createRouteId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `route-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const createNodeId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const createNodeFromPaletteItem = (itemId: string): ComponentNode => {
  const id = createNodeId(itemId)
  const labelText = (text: string, size: "Tiny" | "Small" | "Medium" | "Large" | "Big" = "Tiny"): ComponentNode => ({
    id: createNodeId("text"),
    type: "MdrText",
    text,
    props: { size, weight: size === "Tiny" ? "SemiBold" : "Bold" },
  })

  if (itemId === "text") {
    return { id, type: "MdrText", text: "Text", props: { size: "Medium" } }
  }
  if (itemId === "heading") {
    return { id, type: "MdrHeading", text: "Heading", props: { level: 2, weight: "Bold" } }
  }
  if (itemId === "paragraph") {
    return { id, type: "MdrParagraph", text: "Paragraph", props: { size: "Medium" } }
  }
  if (itemId === "button") {
    return { id, type: "MdrButton", text: "Button", props: { size: "Medium", category: "Primary" } }
  }
  if (itemId === "button-link") {
    return { id, type: "MdrButtonLink", text: "Link", props: { to: "/blueprint", size: "Medium", category: "Secondary" } }
  }
  if (itemId === "link") {
    return { id, type: "MdrLink", text: "Link", props: { to: "/blueprint" } }
  }
  if (itemId === "input") {
    return { id, type: "MdrInput", props: { placeholder: "Input", size: "Medium" } }
  }
  if (itemId === "textarea") {
    return { id, type: "MdrTextarea", props: { placeholder: "Textarea", rows: 3, size: "Medium" } }
  }
  if (itemId === "div") {
    return {
      id,
      type: "MdrDiv",
      props: {
        padding: "14px",
        border: "1px dashed rgba(0, 0, 0, 0.2)",
        borderRadius: "14px",
        backgroundColor: "rgba(255, 255, 255, 0.75)",
      },
      children: [labelText("Div")],
    }
  }
  if (itemId === "flex") {
    return {
      id,
      type: "MdrDiv",
      props: {
        display: "Flex",
        gap: "10px",
        padding: "14px",
        border: "1px dashed rgba(0, 0, 0, 0.2)",
        borderRadius: "14px",
        backgroundColor: "rgba(255, 255, 255, 0.75)",
      },
      children: [
        labelText("Flex", "Small"),
        { id: createNodeId("box"), type: "MdrDiv", props: { width: 36, height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.08)" } },
        { id: createNodeId("box"), type: "MdrDiv", props: { width: 24, height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.12)" } },
      ],
    }
  }
  if (itemId === "grid") {
    return {
      id,
      type: "MdrDiv",
      props: {
        display: "Grid",
        gap: "10px",
        padding: "14px",
        border: "1px dashed rgba(0, 0, 0, 0.2)",
        borderRadius: "14px",
        backgroundColor: "rgba(255, 255, 255, 0.75)",
      },
      style: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
      children: [
        labelText("Grid", "Small"),
        { id: createNodeId("box"), type: "MdrDiv", props: { height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.08)" } },
        { id: createNodeId("box"), type: "MdrDiv", props: { height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.12)" } },
        { id: createNodeId("box"), type: "MdrDiv", props: { height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.06)" } },
      ],
    }
  }
  if (itemId === "section") {
    return {
      id,
      type: "MdrSection",
      props: { size: "Medium", padding: "Medium", backgroundColor: "Light" },
      children: [labelText("Section", "Small")],
    }
  }
  if (itemId === "card") {
    return {
      id,
      type: "MdrCard",
      props: { size: "Medium", variant: "Bordered", padding: "Medium" },
      children: [labelText("Card", "Small")],
    }
  }
  if (itemId === "panel") {
    return {
      id,
      type: "MdrPanel",
      props: { size: "Medium", variant: "Default", padding: "Medium", title: "Panel" },
      children: [labelText("Panel content", "Small")],
    }
  }

  const inferredType = `Mdr${itemId
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join("")}`

  return {
    id,
    type: inferredType,
    props: {
      dataAttributes: { "data-palette-item": itemId },
    },
    style: {
      padding: "14px",
      border: "1px dashed rgba(0, 0, 0, 0.2)",
      borderRadius: "14px",
      backgroundColor: "rgba(255, 255, 255, 0.75)",
    },
    children: [labelText(inferredType, "Small")],
  }
}

const insertChildById = (
  node: ComponentNode,
  parentId: string,
  child: ComponentNode,
): { node: ComponentNode; inserted: boolean } => {
  if (node.id === parentId) {
    const nextChildren = [...(node.children ?? []), child]
    return { node: { ...node, children: nextChildren }, inserted: true }
  }
  if (!node.children?.length) return { node, inserted: false }
  let inserted = false
  const nextChildren = node.children.map((item) => {
    const result = insertChildById(item, parentId, child)
    if (result.inserted) inserted = true
    return result.node
  })
  return inserted ? { node: { ...node, children: nextChildren }, inserted: true } : { node, inserted: false }
}

const insertAfterById = (
  node: ComponentNode,
  siblingId: string,
  child: ComponentNode,
): { node: ComponentNode; inserted: boolean } => {
  if (!node.children?.length) return { node, inserted: false }
  const idx = node.children.findIndex((item) => item.id === siblingId)
  if (idx >= 0) {
    const nextChildren = [...node.children.slice(0, idx + 1), child, ...node.children.slice(idx + 1)]
    return { node: { ...node, children: nextChildren }, inserted: true }
  }
  let inserted = false
  const nextChildren = node.children.map((item) => {
    const result = insertAfterById(item, siblingId, child)
    if (result.inserted) inserted = true
    return result.node
  })
  return inserted ? { node: { ...node, children: nextChildren }, inserted: true } : { node, inserted: false }
}

const removeNodeById = (
  node: ComponentNode,
  targetId: string,
): { node: ComponentNode; removed: boolean } => {
  if (!node.children?.length) return { node, removed: false }
  const idx = node.children.findIndex((item) => item.id === targetId)
  if (idx >= 0) {
    const nextChildren = [...node.children.slice(0, idx), ...node.children.slice(idx + 1)]
    return {
      node: { ...node, children: nextChildren.length > 0 ? nextChildren : undefined },
      removed: true,
    }
  }
  let removed = false
  const nextChildren = node.children.map((item) => {
    const result = removeNodeById(item, targetId)
    if (result.removed) removed = true
    return result.node
  })
  if (!removed) return { node, removed: false }
  return {
    node: { ...node, children: nextChildren.length > 0 ? nextChildren : undefined },
    removed: true,
  }
}

const findParentId = (node: ComponentNode, targetId: string, parentId: string | null = null): string | null => {
  if (node.id === targetId) return parentId
  const children = node.children ?? []
  for (const child of children) {
    const result = findParentId(child, targetId, node.id)
    if (result !== null) return result
  }
  return null
}

const findNodeById = (node: ComponentNode, nodeId: string): ComponentNode | null => {
  if (node.id === nodeId) return node
  const children = node.children ?? []
  for (const child of children) {
    const found = findNodeById(child, nodeId)
    if (found) return found
  }
  return null
}

const supportsChildrenForNode = (node: ComponentNode) => {
  const type = node.type.toLowerCase()
  if (
    type === "input" ||
    type === "mdrinput" ||
    type === "textarea" ||
    type === "mdrtextarea" ||
    type === "button" ||
    type === "mdrbutton" ||
    type === "mdrbuttonlink"
  ) return false
  return true
}

const insertIntoMirDoc = (doc: MIRDocument, targetId: string, child: ComponentNode) => {
  const root = doc.ui.root
  const targetNode = findNodeById(root, targetId)
  if (!targetNode) {
    const insertedAtRoot = insertChildById(root, root.id, child)
    return insertedAtRoot.inserted ? { ...doc, ui: { ...doc.ui, root: insertedAtRoot.node } } : doc
  }

  if (supportsChildrenForNode(targetNode)) {
    const insertedChild = insertChildById(root, targetId, child)
    return insertedChild.inserted ? { ...doc, ui: { ...doc.ui, root: insertedChild.node } } : doc
  }

  const insertedSibling = insertAfterById(root, targetId, child)
  if (insertedSibling.inserted) {
    return { ...doc, ui: { ...doc.ui, root: insertedSibling.node } }
  }

  const insertedAtRoot = insertChildById(root, root.id, child)
  return insertedAtRoot.inserted ? { ...doc, ui: { ...doc.ui, root: insertedAtRoot.node } } : doc
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
  const [isTreeCollapsed, setTreeCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({})
  const [sizeSelections, setSizeSelections] = useState<Record<string, string>>({})
  const [statusSelections, setStatusSelections] = useState<Record<string, number>>({})
  const statusTimers = useRef<Record<string, number>>({})
  const [activePaletteItemId, setActivePaletteItemId] = useState<string | null>(null)
  const { projectId } = useParams()
  const blueprintKey = projectId ?? "global"
  const blueprintState = useEditorStore((state) => state.blueprintStateByProject[blueprintKey])
  const setBlueprintState = useEditorStore((state) => state.setBlueprintState)
  const updateMirDoc = useEditorStore((state) => state.updateMirDoc)
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

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

  const handleDeleteSelected = () => {
    if (!selectedId) return
    let nextSelectedId: string | undefined
    let removed = false
    updateMirDoc((doc) => {
      if (selectedId === doc.ui.root.id) return doc
      const parentId = findParentId(doc.ui.root, selectedId)
      const removal = removeNodeById(doc.ui.root, selectedId)
      removed = removal.removed
      if (!removal.removed) return doc
      nextSelectedId = parentId ?? undefined
      return {
        ...doc,
        ui: { ...doc.ui, root: removal.node },
      }
    })
    if (removed) {
      setBlueprintState(blueprintKey, { selectedId: nextSelectedId })
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return
      Object.values(statusTimers.current).forEach((timer) => window.clearInterval(timer))
      statusTimers.current = {}
    }
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as any
    if (data?.kind === "palette-item") {
      setActivePaletteItemId(String(data.itemId))
    }
  }

  const handleDragCancel = () => {
    setActivePaletteItemId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as any
    const over = event.over
    setActivePaletteItemId(null)
    if (!over) return
    if (data?.kind !== "palette-item") return

    const itemId = String(data.itemId)
    const newNode = createNodeFromPaletteItem(itemId)

    const overData = over.data.current as any
    const dropKind = overData?.kind
    const dropNodeId = dropKind === "tree-node" ? String(overData.nodeId) : null
    const targetId = dropNodeId ?? (dropKind === "canvas" ? (selectedId ?? "root") : "root")

    updateMirDoc((doc) => insertIntoMirDoc(doc, targetId, newNode))
    handleNodeSelect(newNode.id)
  }

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
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`BlueprintEditorBody ${isLibraryCollapsed ? "SidebarCollapsed" : ""} ${isInspectorCollapsed ? "InspectorCollapsed" : ""} ${isTreeCollapsed ? "TreeCollapsed" : ""}`}
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
          <BlueprintEditorComponentTree
            isCollapsed={isTreeCollapsed}
            selectedId={selectedId}
            onToggleCollapse={() => setTreeCollapsed((prev) => !prev)}
            onSelectNode={handleNodeSelect}
            onDeleteSelected={handleDeleteSelected}
          />
          <BlueprintEditorCanvas
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            zoom={zoom}
            pan={pan}
            selectedId={selectedId}
            onPanChange={handlePanChange}
            onZoomChange={handleZoomChange}
            onSelectNode={handleNodeSelect}
          />
          <BlueprintEditorInspector
            isCollapsed={isInspectorCollapsed}
            onToggleCollapse={() => setInspectorCollapsed((prev) => !prev)}
          />
        </div>
        <DragOverlay>
          {activePaletteItemId ? (
            <div className="BlueprintEditorDragOverlay">
              <div className="BlueprintEditorDragOverlayInner">{activePaletteItemId}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
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
