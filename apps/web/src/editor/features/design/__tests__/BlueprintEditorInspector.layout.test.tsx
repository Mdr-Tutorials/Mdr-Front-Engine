import { fireEvent, render, screen } from "@testing-library/react"
import type { KeyboardEvent as ReactKeyboardEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BlueprintEditorInspector } from "../BlueprintEditorInspector"
import { DEFAULT_BLUEPRINT_STATE, useEditorStore } from "@/editor/store/useEditorStore"
import { createMirDoc, resetEditorStore } from "@/test-utils/editorStore"

const PROJECT_ID = "project-1"

vi.mock("react-router", () => ({
  useParams: () => ({ projectId: PROJECT_ID }),
}))

vi.mock("@mdr/ui", () => ({
  MdrInput: ({
    value,
    onChange,
    onBlur,
    onKeyDown,
  }: {
    value: string
    onChange: (value: string) => void
    onBlur?: () => void
    onKeyDown?: (event: ReactKeyboardEvent<HTMLInputElement>) => void
  }) => (
    <input
      data-testid="mdr-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  ),
  MdrSelect: ({
    value,
    options,
    onChange,
  }: {
    value?: string
    options: { label: string; value: string }[]
    onChange?: (value: string) => void
  }) => (
    <select
      data-testid="mdr-select"
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}))

beforeEach(() => {
  resetEditorStore()
})

describe("BlueprintEditorInspector layout panel", () => {
  it("updates gap for a Flex node", () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        { id: "flex-1", type: "MdrDiv", props: { display: "Flex", gap: 10 }, children: [] },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: "flex-1",
        },
      },
    })

    render(<BlueprintEditorInspector isCollapsed={false} onToggleCollapse={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText("8"), { target: { value: "24" } })

    const child = useEditorStore.getState().mirDoc.ui.root.children?.[0]
    expect(child?.props?.gap).toBe(24)
  })

  it("updates gridTemplateColumns for a Grid node", () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: "grid-1",
          type: "MdrDiv",
          props: { display: "Grid", gap: "10px" },
          style: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
          children: [],
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: "grid-1",
        },
      },
    })

    render(<BlueprintEditorInspector isCollapsed={false} onToggleCollapse={() => {}} />)

    const inputs = screen.getAllByTestId("mdr-input") as HTMLInputElement[]
    // [0] id, [1] columns (gap uses editor-only UnitInput)
    fireEvent.change(inputs[1], { target: { value: "3" } })

    const child = useEditorStore.getState().mirDoc.ui.root.children?.[0]
    expect(child?.style?.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))")
  })
})
