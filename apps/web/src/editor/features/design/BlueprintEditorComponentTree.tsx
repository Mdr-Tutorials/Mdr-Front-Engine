import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Box, ChevronDown, ChevronRight, ChevronUp, LayoutGrid, Layers, MousePointerClick, Trash2, Type, TextCursorInput } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import type { ComponentNode } from "@/core/types/engine.types"
import { useEditorStore } from "@/editor/store/useEditorStore"

type BlueprintEditorComponentTreeProps = {
  isCollapsed: boolean
  selectedId?: string
  onToggleCollapse: () => void
  onSelectNode: (nodeId: string) => void
  onDeleteSelected: () => void
}

const collectExpandedKeys = (node: ComponentNode, keys: string[] = []) => {
  if (node.children && node.children.length > 0) {
    keys.push(node.id)
    node.children.forEach((child) => collectExpandedKeys(child, keys))
  }
  return keys
}

const findAncestorIds = (node: ComponentNode, targetId: string, ancestors: string[] = []): string[] | null => {
  if (node.id === targetId) return ancestors
  const children = node.children ?? []
  for (const child of children) {
    const result = findAncestorIds(child, targetId, [...ancestors, node.id])
    if (result) return result
  }
  return null
}

const getNodeIcon = (type: string) => {
  const normalized = type.toLowerCase()
  if (normalized.includes("text")) return Type
  if (normalized.includes("button")) return MousePointerClick
  if (normalized.includes("input")) return TextCursorInput
  if (normalized.includes("div") || normalized.includes("container") || normalized.includes("section")) return LayoutGrid
  return Box
}

const countNodes = (node: ComponentNode): number => {
  const children = node.children ?? []
  return 1 + children.reduce((acc, child) => acc + countNodes(child), 0)
}

type TreeNodeProps = {
  node: ComponentNode
  depth: number
  expandedKeys: string[]
  selectedId?: string
  onToggle: (nodeId: string) => void
  onSelect: (nodeId: string) => void
}

const INDENT_PX = 14

function BlueprintTreeNode({
  node,
  depth,
  expandedKeys,
  selectedId,
  onToggle,
  onSelect,
}: TreeNodeProps) {
  const children = node.children ?? []
  const hasChildren = children.length > 0
  const isExpanded = expandedKeys.includes(node.id)
  const Icon = getNodeIcon(node.type)
  const { setNodeRef, isOver } = useDroppable({
    id: `tree-node:${node.id}`,
    data: { kind: "tree-node", nodeId: node.id },
  })

  return (
    <div className="BlueprintEditorTreeNode">
      <div className="BlueprintEditorTreeRow" style={{ paddingLeft: depth * INDENT_PX }}>
        {hasChildren ? (
          <button
            type="button"
            className={`BlueprintEditorTreeToggle ${isExpanded ? "Expanded" : ""}`}
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="BlueprintEditorTreeSpacer" aria-hidden="true" />
        )}
        <button
          type="button"
          ref={setNodeRef}
          className={`BlueprintEditorTreeItem ${selectedId === node.id ? "Selected" : ""} ${isOver ? "IsOver" : ""}`}
          onClick={() => onSelect(node.id)}
          title={`${node.type}#${node.id}`}
        >
          <span className="BlueprintEditorTreeIcon" aria-hidden="true">
            <Icon size={14} />
          </span>
          <span className="BlueprintEditorTreeMeta">
            <span className="BlueprintEditorTreeType">{node.type}</span>
            <span className="BlueprintEditorTreeId">#{node.id}</span>
          </span>
          {hasChildren && (
            <span className="BlueprintEditorTreeCount" aria-label={`${children.length} children`}>
              {children.length}
            </span>
          )}
        </button>
      </div>
      {hasChildren && isExpanded && (
        <div className="BlueprintEditorTreeChildren">
          {children.map((child) => (
            <BlueprintTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedKeys={expandedKeys}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function BlueprintEditorComponentTree({
  isCollapsed,
  selectedId,
  onToggleCollapse,
  onSelectNode,
  onDeleteSelected,
}: BlueprintEditorComponentTreeProps) {
  const { t } = useTranslation('blueprint')
  const mirDoc = useEditorStore((state) => state.mirDoc)
  const rootNode = mirDoc?.ui?.root
  const isDeleteDisabled = !selectedId || !rootNode || selectedId === rootNode.id
  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: "tree-root",
    data: { kind: "tree-root" },
  })
  const totalNodes = useMemo(() => (rootNode ? countNodes(rootNode) : 0), [rootNode])
  const initialExpandedKeys = useMemo(
    () => (rootNode ? collectExpandedKeys(rootNode) : []),
    [rootNode],
  )
  const [expandedKeys, setExpandedKeys] = useState<string[]>(initialExpandedKeys)

  useEffect(() => {
    if (!rootNode || !selectedId) return
    const ancestors = findAncestorIds(rootNode, selectedId) ?? []
    if (ancestors.length === 0) return
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      let changed = false
      ancestors.forEach((id) => {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      })
      return changed ? Array.from(next) : prev
    })
  }, [rootNode, selectedId])

  const handleToggle = (nodeId: string) => {
    setExpandedKeys((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]))
  }

  if (isCollapsed) {
    return (
      <aside className="BlueprintEditorComponentTree Collapsed">
        <button
          type="button"
          className="BlueprintEditorTreeExpand"
          onClick={onToggleCollapse}
          aria-label={t('tree.expand', { defaultValue: 'Expand component tree' })}
        >
          <ChevronUp size={16} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="BlueprintEditorComponentTree">
      <div className="BlueprintEditorTreeHeader">
        <div className="BlueprintEditorTreeHeaderLeft">
          <span className="BlueprintEditorTreeHeaderIcon" aria-hidden="true">
            <Layers size={14} />
          </span>
          <span>{t('tree.title', { defaultValue: 'Component Tree' })}</span>
          {totalNodes > 0 && (
            <span className="BlueprintEditorTreeHeaderCount" aria-label={`${totalNodes} nodes`}>
              {totalNodes}
            </span>
          )}
        </div>
        <div className="BlueprintEditorTreeHeaderActions">
          <button
            type="button"
            className="BlueprintEditorTreeAction Danger"
            onClick={onDeleteSelected}
            disabled={isDeleteDisabled}
            aria-label={t('tree.deleteSelected', { defaultValue: 'Delete selected component' })}
            title={t('tree.deleteSelected', { defaultValue: 'Delete selected component' })}
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            className="BlueprintEditorCollapse"
            onClick={onToggleCollapse}
            aria-label={t('tree.collapse', { defaultValue: 'Collapse component tree' })}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
      <div
        className={`BlueprintEditorTreeBody ${isOverRoot ? "IsOver" : ""}`}
        ref={setRootDropRef}
      >
        {rootNode ? (
          <div className="BlueprintEditorTreeList">
            <BlueprintTreeNode
              node={rootNode}
              depth={0}
              expandedKeys={expandedKeys}
              selectedId={selectedId}
              onToggle={handleToggle}
              onSelect={onSelectNode}
            />
          </div>
        ) : (
          <div className="BlueprintEditorTreePlaceholder">
            <p>{t('tree.empty', { defaultValue: 'No components yet.' })}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
