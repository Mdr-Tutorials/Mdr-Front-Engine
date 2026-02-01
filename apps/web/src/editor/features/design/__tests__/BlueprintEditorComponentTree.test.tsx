import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BlueprintEditorComponentTree } from "../BlueprintEditorComponentTree"
import { createMirDoc, resetEditorStore } from "@/test-utils/editorStore"

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: false,
  }),
}))

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: () => {},
}))

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => "",
    },
  },
}))

vi.mock("lucide-react", () => ({
  ArrowDown: () => null,
  ArrowUp: () => null,
  Box: () => null,
  ChevronDown: () => null,
  ChevronRight: () => null,
  ChevronUp: () => null,
  Copy: () => null,
  GripVertical: () => null,
  LayoutGrid: () => null,
  Layers: () => null,
  MoreHorizontal: () => null,
  MousePointerClick: () => null,
  Trash2: () => null,
  Type: () => null,
  TextCursorInput: () => null,
}))

beforeEach(() => {
  resetEditorStore()
})

describe("BlueprintEditorComponentTree", () => {
  it("renders collapsed state with expand button", () => {
    render(
      <BlueprintEditorComponentTree
        isCollapsed
        selectedId={undefined}
        onToggleCollapse={() => {}}
        onSelectNode={() => {}}
        onDeleteSelected={() => {}}
        onDeleteNode={() => {}}
        onCopyNode={() => {}}
        onMoveNode={() => {}}
      />
    )

    expect(screen.getByRole("button", { name: "Expand component tree" })).toBeTruthy()
  })

  it("shows node counts and selection, and fires actions", () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        { id: "child-1", type: "MdrText", text: "Text" },
        { id: "child-2", type: "MdrDiv", children: [{ id: "child-2a", type: "MdrText", text: "Nested" }] },
      ]),
    })

    const onToggleCollapse = vi.fn()
    const onSelectNode = vi.fn()
    const onDeleteSelected = vi.fn()
    const onDeleteNode = vi.fn()
    const onCopyNode = vi.fn()
    const onMoveNode = vi.fn()

    render(
      <BlueprintEditorComponentTree
        isCollapsed={false}
        selectedId="child-1"
        onToggleCollapse={onToggleCollapse}
        onSelectNode={onSelectNode}
        onDeleteSelected={onDeleteSelected}
        onDeleteNode={onDeleteNode}
        onCopyNode={onCopyNode}
        onMoveNode={onMoveNode}
      />
    )

    expect(screen.getByText("4")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Collapse component tree" }))
    expect(onToggleCollapse).toHaveBeenCalled()

    fireEvent.click(screen.getByTitle("MdrText (child-1)"))
    expect(onSelectNode).toHaveBeenCalledWith("child-1")

    const deleteButtons = screen.getAllByLabelText("Delete")
    fireEvent.click(deleteButtons[1])
    expect(onDeleteNode).toHaveBeenCalledWith("child-1")

    fireEvent.click(screen.getByLabelText("Delete selected component"))
    expect(onDeleteSelected).toHaveBeenCalled()

    const moveUpButtons = screen.getAllByLabelText("Move up")
    fireEvent.click(moveUpButtons[1])
    expect(onMoveNode).toHaveBeenCalledWith("child-1", "up")
  })
})
