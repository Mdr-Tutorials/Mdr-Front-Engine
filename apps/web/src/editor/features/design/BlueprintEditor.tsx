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

const collectTypeCounts = (node: ComponentNode, counts: Record<string, number>) => {
  counts[node.type] = (counts[node.type] ?? 0) + 1
  node.children?.forEach((child) => collectTypeCounts(child, counts))
}

const createNodeIdFactory = (doc: MIRDocument) => {
  const counts: Record<string, number> = {}
  collectTypeCounts(doc.ui.root, counts)
  return (type: string) => {
    const next = (counts[type] ?? 0) + 1
    counts[type] = next
    return `${type}-${next}`
  }
}

const createNodeFromPaletteItem = (itemId: string, createId: (type: string) => string): ComponentNode => {
  const typeFromPalette = (value: string) =>
    `Mdr${value
      .split(/[-_]/)
      .filter(Boolean)
      .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
      .join("")}`
  const labelText = (text: string, size: "Tiny" | "Small" | "Medium" | "Large" | "Big" = "Tiny"): ComponentNode => ({
    id: createId("MdrText"),
    type: "MdrText",
    text,
    props: { size, weight: size === "Tiny" ? "SemiBold" : "Bold" },
  })

  if (itemId === "text") {
    return { id: createId("MdrText"), type: "MdrText", text: "Text", props: { size: "Medium" } }
  }
  if (itemId === "heading") {
    return { id: createId("MdrHeading"), type: "MdrHeading", text: "Heading", props: { level: 2, weight: "Bold" } }
  }
  if (itemId === "paragraph") {
    return { id: createId("MdrParagraph"), type: "MdrParagraph", text: "Paragraph", props: { size: "Medium" } }
  }
  if (itemId === "button") {
    return { id: createId("MdrButton"), type: "MdrButton", text: "Button", props: { size: "Medium", category: "Primary" } }
  }
  if (itemId === "button-link") {
    return {
      id: createId("MdrButtonLink"),
      type: "MdrButtonLink",
      text: "Link",
      props: { to: "/blueprint", size: "Medium", category: "Secondary" },
    }
  }
  if (itemId === "link") {
    return { id: createId("MdrLink"), type: "MdrLink", text: "Link", props: { to: "/blueprint" } }
  }
  if (itemId === "input") {
    return { id: createId("MdrInput"), type: "MdrInput", props: { placeholder: "Input", size: "Medium" } }
  }
  if (itemId === "textarea") {
    return { id: createId("MdrTextarea"), type: "MdrTextarea", props: { placeholder: "Textarea", rows: 3, size: "Medium" } }
  }
  if (itemId === "div") {
    return {
      id: createId("MdrDiv"),
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
      id: createId("MdrDiv"),
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
        { id: createId("MdrDiv"), type: "MdrDiv", props: { width: 36, height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.08)" } },
        { id: createId("MdrDiv"), type: "MdrDiv", props: { width: 24, height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.12)" } },
      ],
    }
  }
  if (itemId === "grid") {
    return {
      id: createId("MdrDiv"),
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
        { id: createId("MdrDiv"), type: "MdrDiv", props: { height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.08)" } },
        { id: createId("MdrDiv"), type: "MdrDiv", props: { height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.12)" } },
        { id: createId("MdrDiv"), type: "MdrDiv", props: { height: 18, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.06)" } },
      ],
    }
  }
  if (itemId === "section") {
    return {
      id: createId("MdrSection"),
      type: "MdrSection",
      props: { size: "Medium", padding: "Medium", backgroundColor: "Light" },
      children: [labelText("Section", "Small")],
    }
  }
  if (itemId === "card") {
    return {
      id: createId("MdrCard"),
      type: "MdrCard",
      props: { size: "Medium", variant: "Bordered", padding: "Medium" },
      children: [labelText("Card", "Small")],
    }
  }
  if (itemId === "panel") {
    return {
      id: createId("MdrPanel"),
      type: "MdrPanel",
      props: { size: "Medium", variant: "Default", padding: "Medium", title: "Panel" },
      children: [labelText("Panel content", "Small")],
    }
  }

  const inferredType = typeFromPalette(itemId)

  return {
    id: createId(inferredType),
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

const removeNodeByIdWithNode = (
  node: ComponentNode,
  targetId: string,
): { node: ComponentNode; removed: boolean; removedNode?: ComponentNode } => {
  if (!node.children?.length) return { node, removed: false }
  const idx = node.children.findIndex((item) => item.id === targetId)
  if (idx >= 0) {
    const removedNode = node.children[idx]
    const nextChildren = [...node.children.slice(0, idx), ...node.children.slice(idx + 1)]
    return {
      node: { ...node, children: nextChildren.length > 0 ? nextChildren : undefined },
      removed: true,
      removedNode,
    }
  }
  let removed = false
  let removedNode: ComponentNode | undefined
  const nextChildren = node.children.map((item) => {
    const result = removeNodeByIdWithNode(item, targetId)
    if (result.removed) {
      removed = true
      removedNode = result.removedNode
    }
    return result.node
  })
  if (!removed) return { node, removed: false }
  return {
    node: { ...node, children: nextChildren.length > 0 ? nextChildren : undefined },
    removed: true,
    removedNode,
  }
}

const moveChildById = (
  node: ComponentNode,
  parentId: string,
  childId: string,
  direction: "up" | "down",
): { node: ComponentNode; moved: boolean } => {
  if (node.id === parentId) {
    const children = node.children ?? []
    const index = children.findIndex((item) => item.id === childId)
    if (index === -1) return { node, moved: false }
    const nextIndex = direction === "up" ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= children.length) return { node, moved: false }
    const nextChildren = [...children]
    const [movedNode] = nextChildren.splice(index, 1)
    nextChildren.splice(nextIndex, 0, movedNode)
    return { node: { ...node, children: nextChildren }, moved: true }
  }
  if (!node.children?.length) return { node, moved: false }
  let moved = false
  const nextChildren = node.children.map((item) => {
    const result = moveChildById(item, parentId, childId, direction)
    if (result.moved) moved = true
    return result.node
  })
  return moved ? { node: { ...node, children: nextChildren }, moved: true } : { node, moved: false }
}

const insertChildAtIndex = (
  node: ComponentNode,
  parentId: string,
  child: ComponentNode,
  index: number,
): { node: ComponentNode; inserted: boolean } => {
  if (node.id === parentId) {
    const nextChildren = [...(node.children ?? [])]
    const clampedIndex = Math.max(0, Math.min(index, nextChildren.length))
    nextChildren.splice(clampedIndex, 0, child)
    return { node: { ...node, children: nextChildren }, inserted: true }
  }
  if (!node.children?.length) return { node, inserted: false }
  let inserted = false
  const nextChildren = node.children.map((item) => {
    const result = insertChildAtIndex(item, parentId, child, index)
    if (result.inserted) inserted = true
    return result.node
  })
  return inserted ? { node: { ...node, children: nextChildren }, inserted: true } : { node, inserted: false }
}

const arrayMove = <T,>(list: T[], fromIndex: number, toIndex: number) => {
  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

const reorderChildById = (
  node: ComponentNode,
  parentId: string,
  activeId: string,
  overId: string,
): { node: ComponentNode; moved: boolean } => {
  if (node.id === parentId) {
    const children = node.children ?? []
    const fromIndex = children.findIndex((item) => item.id === activeId)
    const toIndex = children.findIndex((item) => item.id === overId)
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return { node, moved: false }
    const nextChildren = arrayMove(children, fromIndex, toIndex)
    return { node: { ...node, children: nextChildren }, moved: true }
  }
  if (!node.children?.length) return { node, moved: false }
  let moved = false
  const nextChildren = node.children.map((item) => {
    const result = reorderChildById(item, parentId, activeId, overId)
    if (result.moved) moved = true
    return result.node
  })
  return moved ? { node: { ...node, children: nextChildren }, moved: true } : { node, moved: false }
}

const isAncestorOf = (root: ComponentNode, ancestorId: string, targetId: string) => {
  if (ancestorId === targetId) return true
  const ancestorNode = findNodeById(root, ancestorId)
  if (!ancestorNode) return false
  return Boolean(findNodeById(ancestorNode, targetId))
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

const cloneNodeWithNewIds = (
  node: ComponentNode,
  createId: (type: string) => string,
): ComponentNode => {
  const { children, ...rest } = node
  const clonedRest =
    typeof structuredClone === "function" ? structuredClone(rest) : JSON.parse(JSON.stringify(rest))
  return {
    ...clonedRest,
    id: createId(node.type),
    children: children?.map((child) => cloneNodeWithNewIds(child, createId)),
  }
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

  const handleDeleteNode = (nodeId: string) => {
    if (!nodeId) return
    let nextSelectedId: string | undefined
    let removed = false
    updateMirDoc((doc) => {
      if (nodeId === doc.ui.root.id) return doc
      const parentId = findParentId(doc.ui.root, nodeId)
      const removal = removeNodeById(doc.ui.root, nodeId)
      removed = removal.removed
      if (!removal.removed) return doc
      if (selectedId === nodeId) {
        nextSelectedId = parentId ?? undefined
      }
      return {
        ...doc,
        ui: { ...doc.ui, root: removal.node },
      }
    })
    if (removed && selectedId === nodeId) {
      setBlueprintState(blueprintKey, { selectedId: nextSelectedId })
    }
  }

  const handleCopyNode = (nodeId: string) => {
    if (!nodeId) return
    let nextNodeId = ""
    updateMirDoc((doc) => {
      if (nodeId === doc.ui.root.id) return doc
      const source = findNodeById(doc.ui.root, nodeId)
      if (!source) return doc
      const createId = createNodeIdFactory(doc)
      const cloned = cloneNodeWithNewIds(source, createId)
      nextNodeId = cloned.id
      const insertedSibling = insertAfterById(doc.ui.root, nodeId, cloned)
      if (insertedSibling.inserted) {
        return { ...doc, ui: { ...doc.ui, root: insertedSibling.node } }
      }
      const insertedAtRoot = insertChildById(doc.ui.root, doc.ui.root.id, cloned)
      return insertedAtRoot.inserted ? { ...doc, ui: { ...doc.ui, root: insertedAtRoot.node } } : doc
    })
    if (nextNodeId) {
      handleNodeSelect(nextNodeId)
    }
  }

  const handleMoveNode = (nodeId: string, direction: "up" | "down") => {
    if (!nodeId) return
    let moved = false
    updateMirDoc((doc) => {
      if (nodeId === doc.ui.root.id) return doc
      const parentId = findParentId(doc.ui.root, nodeId)
      if (!parentId) return doc
      const result = moveChildById(doc.ui.root, parentId, nodeId, direction)
      moved = result.moved
      return result.moved ? { ...doc, ui: { ...doc.ui, root: result.node } } : doc
    })
    if (moved) {
      handleNodeSelect(nodeId)
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
    if (data?.kind === "tree-sort") {
      const overData = over.data.current as any
      const overId = typeof over.id === "string" ? over.id : null
      const activeId = data.nodeId
      const activeParentId = data.parentId
      if (!activeId || !activeParentId) return
      updateMirDoc((doc) => {
        const root = doc.ui.root
        if (activeId === root.id) return doc

        let targetParentId: string | null = null
        let targetIndex: number | null = null
        const overTreeNodeId =
          overData?.kind === "tree-node"
            ? overData.nodeId
            : overId?.startsWith("tree-node:")
              ? overId.slice("tree-node:".length)
              : null
        const isOverRoot = overId === "tree-root" || overData?.kind === "tree-root"

        if (overData?.kind === "tree-sort") {
          const overNodeId = overData.nodeId
          const overParentId = overData.parentId
          if (!overNodeId || !overParentId) return doc
          if (overNodeId === activeId) return doc
          if (isAncestorOf(root, activeId, overParentId)) return doc
          if (overParentId === activeParentId) {
            const result = reorderChildById(root, activeParentId, activeId, overNodeId)
            return result.moved ? { ...doc, ui: { ...doc.ui, root: result.node } } : doc
          }
          const targetParent = findNodeById(root, overParentId)
          const siblings = targetParent?.children ?? []
          const overIndex = siblings.findIndex((item) => item.id === overNodeId)
          if (overIndex === -1) return doc
          targetParentId = overParentId
          targetIndex = overIndex
        } else if (overTreeNodeId) {
          if (overTreeNodeId === activeId) return doc
          if (isAncestorOf(root, activeId, overTreeNodeId)) return doc
          const overNode = findNodeById(root, overTreeNodeId)
          if (!overNode) return doc
          if (supportsChildrenForNode(overNode)) {
            targetParentId = overTreeNodeId
            targetIndex = overNode.children?.length ?? 0
          } else {
            const parentId = findParentId(root, overTreeNodeId)
            if (!parentId) return doc
            const parentNode = findNodeById(root, parentId)
            const siblings = parentNode?.children ?? []
            const overIndex = siblings.findIndex((item) => item.id === overTreeNodeId)
            targetParentId = parentId
            targetIndex = overIndex >= 0 ? overIndex + 1 : siblings.length
          }
        } else if (isOverRoot) {
          targetParentId = root.id
          targetIndex = root.children?.length ?? 0
        }

        if (!targetParentId || targetIndex === null) return doc
        if (isAncestorOf(root, activeId, targetParentId)) return doc

        let adjustedIndex = targetIndex
        if (targetParentId === activeParentId) {
          const parentNode = findNodeById(root, targetParentId)
          const siblings = parentNode?.children ?? []
          const fromIndex = siblings.findIndex((item) => item.id === activeId)
          if (fromIndex === -1) return doc
          if (fromIndex < targetIndex) adjustedIndex = targetIndex - 1
          if (fromIndex === adjustedIndex) return doc
        }

        const removal = removeNodeByIdWithNode(root, activeId)
        if (!removal.removed || !removal.removedNode) return doc
        const insertion = insertChildAtIndex(removal.node, targetParentId, removal.removedNode, adjustedIndex)
        return insertion.inserted ? { ...doc, ui: { ...doc.ui, root: insertion.node } } : doc
      })
      return
    }
    if (data?.kind !== "palette-item") return

    const itemId = String(data.itemId)
    const overData = over.data.current as any
    const dropKind = overData?.kind
    const dropNodeId = dropKind === "tree-node" ? String(overData.nodeId) : null
    const targetId = dropNodeId ?? (dropKind === "canvas" ? (selectedId ?? "root") : "root")

    let nextNodeId = ""
    updateMirDoc((doc) => {
      const createId = createNodeIdFactory(doc)
      const newNode = createNodeFromPaletteItem(itemId, createId)
      nextNodeId = newNode.id
      return insertIntoMirDoc(doc, targetId, newNode)
    })
    if (nextNodeId) {
      handleNodeSelect(nextNodeId)
    }
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
            onDeleteNode={handleDeleteNode}
            onCopyNode={handleCopyNode}
            onMoveNode={handleMoveNode}
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
