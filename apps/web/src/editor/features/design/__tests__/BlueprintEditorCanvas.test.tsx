import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BlueprintEditorCanvas } from "../BlueprintEditorCanvas"
import { createMirDoc, resetEditorStore, resetSettingsStore } from "@/test-utils/editorStore"

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: false,
  }),
}))

vi.mock("@/mir/renderer/MIRRenderer", () => ({
  MIRRenderer: ({ node, onNodeSelect }: { node: any; onNodeSelect: (id: string) => void }) => (
    <button type="button" data-testid="mir-node" onClick={() => onNodeSelect(node.children?.[0]?.id ?? node.id)}>
      Select
    </button>
  ),
}))

vi.mock("@/mir/renderer/registry", () => ({
  createOrderedComponentRegistry: () => ({}),
  parseResolverOrder: () => [],
}))

beforeEach(() => {
  resetEditorStore()
  resetSettingsStore({ panInertia: 0 })
})

describe("BlueprintEditorCanvas", () => {
  it("renders placeholder when there are no children", () => {
    render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={() => {}}
        onZoomChange={() => {}}
        onSelectNode={() => {}}
      />
    )

    expect(screen.getByText("canvas.placeholderTitle")).toBeTruthy()
  })

  it("renders the grid when assist includes grid", () => {
    resetSettingsStore({ assist: ["grid"] })

    const { container } = render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={() => {}}
        onZoomChange={() => {}}
        onSelectNode={() => {}}
      />
    )

    expect(container.querySelector(".BlueprintEditorCanvasGrid")).toBeTruthy()
  })

  it("calls onNodeSelect when a rendered node is clicked", () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: "child-1", type: "MdrText", text: "Hello" }]),
    })

    const onSelectNode = vi.fn()

    render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={() => {}}
        onZoomChange={() => {}}
        onSelectNode={onSelectNode}
      />
    )

    fireEvent.click(screen.getByTestId("mir-node"))
    expect(onSelectNode).toHaveBeenCalledWith("child-1")
  })

  it("handles wheel zoom and pan", () => {
    const onPanChange = vi.fn()
    const onZoomChange = vi.fn()

    const { container } = render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={onPanChange}
        onZoomChange={onZoomChange}
        onSelectNode={() => {}}
      />
    )

    const surface = container.querySelector(".BlueprintEditorCanvasSurface")
    if (!surface) throw new Error("Surface not found")

    fireEvent.wheel(surface, { deltaX: 10, deltaY: 20 })
    expect(onPanChange).toHaveBeenCalledWith({ x: -10, y: -20 })

    fireEvent.wheel(surface, { deltaX: 0, deltaY: -120, ctrlKey: true })
    expect(onZoomChange).toHaveBeenCalled()
  })

  it("supports pointer panning and keyboard zoom", () => {
    const onPanChange = vi.fn()
    const onZoomChange = vi.fn()

    const { container } = render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={onPanChange}
        onZoomChange={onZoomChange}
        onSelectNode={() => {}}
      />
    )

    const surface = container.querySelector(".BlueprintEditorCanvasSurface") as HTMLElement
    surface.setPointerCapture = () => {}

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0, button: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 12, clientY: 0 })
    fireEvent.pointerUp(surface, { pointerId: 1 })

    expect(onPanChange).toHaveBeenCalledWith({ x: 12, y: 0 })

    fireEvent.keyDown(surface, { key: "+", ctrlKey: true })
    expect(onZoomChange).toHaveBeenCalled()
  })
})
