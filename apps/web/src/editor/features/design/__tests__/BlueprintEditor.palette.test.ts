import { describe, expect, it } from "vitest"
import { createNodeFromPaletteItem, getTreeDropPlacement } from "../BlueprintEditor"

describe("createNodeFromPaletteItem", () => {
  it("applies heading variantProps.level when provided", () => {
    const createId = (type: string) => `${type}-1`
    const node = createNodeFromPaletteItem("heading", createId, { level: 5 })
    expect(node.type).toBe("MdrHeading")
    expect(node.props?.level).toBe(5)
  })

  it("coerces heading variantProps.level when it is a string", () => {
    const createId = (type: string) => `${type}-1`
    const node = createNodeFromPaletteItem("heading", createId, { level: "6" })
    expect(node.props?.level).toBe(6)
  })
})

describe("getTreeDropPlacement", () => {
  it("uses thirds when nesting is allowed", () => {
    expect(
      getTreeDropPlacement({ canNest: true, overTop: 0, overHeight: 90, activeCenterY: 10 }),
    ).toBe("before")
    expect(
      getTreeDropPlacement({ canNest: true, overTop: 0, overHeight: 90, activeCenterY: 45 }),
    ).toBe("child")
    expect(
      getTreeDropPlacement({ canNest: true, overTop: 0, overHeight: 90, activeCenterY: 80 }),
    ).toBe("after")
  })

  it("uses halves when nesting is not allowed", () => {
    expect(
      getTreeDropPlacement({ canNest: false, overTop: 0, overHeight: 100, activeCenterY: 10 }),
    ).toBe("before")
    expect(
      getTreeDropPlacement({ canNest: false, overTop: 0, overHeight: 100, activeCenterY: 60 }),
    ).toBe("after")
  })
})
