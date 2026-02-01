import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import NewResourceModal from "../NewResourceModal"
import { resetEditorStore } from "@/test-utils/editorStore"
import { useEditorStore } from "@/editor/store/useEditorStore"

const navigateMock = vi.fn()

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}))

vi.mock("@mdr/ui", () => ({
  MdrButton: ({ text, onClick }: { text: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
  MdrInput: ({
    value,
    onChange,
    ...rest
  }: {
    value?: string
    onChange?: (value: string) => void
  }) => (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...rest}
    />
  ),
  MdrTextarea: ({
    value,
    onChange,
    ...rest
  }: {
    value?: string
    onChange?: (value: string) => void
  }) => (
    <textarea
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...rest}
    />
  ),
}))

describe("NewResourceModal", () => {
  beforeEach(() => {
    navigateMock.mockClear()
    resetEditorStore()
  })

  it("does not render when closed", () => {
    const { container } = render(<NewResourceModal open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it("creates a project and navigates to blueprint", () => {
    const onClose = vi.fn()
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" })

    render(<NewResourceModal open onClose={onClose} />)

    fireEvent.change(screen.getByLabelText("modals.newResource.nameLabel"), {
      target: { value: "My Project" },
    })

    fireEvent.click(screen.getByRole("button", { name: "modals.actions.create" }))

    const project = useEditorStore.getState().projectsById["uuid-1"]
    expect(project?.name).toBe("My Project")
    expect(navigateMock).toHaveBeenCalledWith("/editor/project/uuid-1/blueprint")
    expect(onClose).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it("creates a component resource and navigates to component editor", () => {
    const onClose = vi.fn()
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-2" })

    render(<NewResourceModal open onClose={onClose} />)

    fireEvent.click(screen.getByRole("button", { name: "modals.newComponent.title" }))

    fireEvent.click(screen.getByRole("button", { name: "modals.actions.create" }))

    expect(navigateMock).toHaveBeenCalledWith("/editor/project/uuid-2/component")
    expect(onClose).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
