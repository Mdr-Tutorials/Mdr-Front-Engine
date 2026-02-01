import { useEffect, useMemo, useRef, useState } from "react"
import { InspectorTextInput } from "./InspectorTextInput"

type UnitGroup = {
  label: string
  units: Array<string | UnitOption>
}

type UnitOption = {
  unit: string
  title?: string
}

export type UnitInputValue = number | string | undefined

export type UnitInputQuantity =
  | "all"
  | "length"
  | "length-percentage"
  | "percentage"
  | "angle"
  | "time"
  | "frequency"
  | "resolution"

type UnitInputProps = {
  value: UnitInputValue
  onChange: (value: UnitInputValue) => void
  placeholder?: string
  disabled?: boolean
  units?: UnitGroup[]
  quantity?: UnitInputQuantity
}

const UNIT_TITLES: Record<string, string> = {
  // length
  px: "像素（CSS px，通常 1px = 1/96in）",
  cm: "厘米",
  mm: "毫米",
  Q: "四分之一毫米（1Q = 1/40cm）",
  in: "英寸",
  pt: "点（1pt = 1/72in）",
  pc: "派卡（1pc = 12pt）",

  // font-relative length
  em: "相对当前元素字体大小",
  rem: "相对根元素字体大小",
  ex: "相对 x-height（依字体而异）",
  rex: "相对根元素 x-height",
  cap: "相对大写字母高度（cap-height）",
  rcap: "相对根元素大写字母高度",
  ch: "相对“0”的宽度（依字体而异）",
  rch: "相对根元素“0”的宽度",
  ic: "相对全角字符宽度（依字体而异）",
  ric: "相对根元素全角字符宽度",
  lh: "相对当前元素行高",
  rlh: "相对根元素行高",

  // viewport length
  vw: "视口宽度的 1%",
  vh: "视口高度的 1%",
  vi: "视口 inline 方向的 1%",
  vb: "视口 block 方向的 1%",
  vmin: "视口较小边的 1%",
  vmax: "视口较大边的 1%",
  svw: "Small viewport 宽度的 1%",
  svh: "Small viewport 高度的 1%",
  svi: "Small viewport inline 的 1%",
  svb: "Small viewport block 的 1%",
  lvw: "Large viewport 宽度的 1%",
  lvh: "Large viewport 高度的 1%",
  lvi: "Large viewport inline 的 1%",
  lvb: "Large viewport block 的 1%",
  dvw: "Dynamic viewport 宽度的 1%",
  dvh: "Dynamic viewport 高度的 1%",
  dvi: "Dynamic viewport inline 的 1%",
  dvb: "Dynamic viewport block 的 1%",

  // container length
  cqw: "容器查询宽度的 1%",
  cqh: "容器查询高度的 1%",
  cqi: "容器查询 inline 的 1%",
  cqb: "容器查询 block 的 1%",
  cqmin: "容器较小边的 1%",
  cqmax: "容器较大边的 1%",

  // percentage
  "%": "百分比（相对父/上下文，具体取决于属性）",

  // angle
  deg: "角度（度）",
  grad: "角度（百分度）",
  rad: "角度（弧度）",
  turn: "角度（圈，1turn = 360deg）",

  // time
  s: "时间（秒）",
  ms: "时间（毫秒）",

  // frequency
  Hz: "频率（赫兹）",
  kHz: "频率（千赫兹）",

  // resolution
  dpi: "分辨率（每英寸点数）",
  dpcm: "分辨率（每厘米点数）",
  dppx: "分辨率（每像素点数）",
}

type NormalizedUnitGroup = {
  label: string
  units: Array<{ unit: string; title: string }>
}

const normalizeGroups = (groups: UnitGroup[]): NormalizedUnitGroup[] =>
  groups.map((group) => ({
    label: group.label,
    units: group.units.map((entry) => {
      if (typeof entry === "string") return { unit: entry, title: UNIT_TITLES[entry] ?? entry }
      return { unit: entry.unit, title: entry.title ?? UNIT_TITLES[entry.unit] ?? entry.unit }
    }),
  }))

const GROUPS_LENGTH: UnitGroup[] = [
  // https://developer.mozilla.org/docs/Web/CSS/length
  { label: "Absolute length", units: ["px", "cm", "mm", "Q", "in", "pt", "pc"] },
  { label: "Font-relative", units: ["em", "rem", "ex", "rex", "cap", "rcap", "ch", "rch", "ic", "ric", "lh", "rlh"] },
  { label: "Viewport", units: ["vw", "vh", "vi", "vb", "vmin", "vmax", "svw", "svh", "svi", "svb", "lvw", "lvh", "lvi", "lvb", "dvw", "dvh", "dvi", "dvb"] },
  { label: "Container", units: ["cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax"] },
]

const GROUPS_PERCENTAGE: UnitGroup[] = [
  // https://developer.mozilla.org/docs/Web/CSS/percentage
  { label: "Percentage", units: ["%"] },
]

const GROUPS_ANGLE: UnitGroup[] = [
  // https://developer.mozilla.org/docs/Web/CSS/angle
  { label: "Angle", units: ["deg", "grad", "rad", "turn"] },
]

const GROUPS_TIME: UnitGroup[] = [
  // https://developer.mozilla.org/docs/Web/CSS/time
  { label: "Time", units: ["s", "ms"] },
]

const GROUPS_FREQUENCY: UnitGroup[] = [
  // https://developer.mozilla.org/docs/Web/CSS/frequency
  { label: "Frequency", units: ["Hz", "kHz"] },
]

const GROUPS_RESOLUTION: UnitGroup[] = [
  // https://developer.mozilla.org/docs/Web/CSS/resolution
  { label: "Resolution", units: ["dpi", "dpcm", "dppx"] },
]

const groupsForQuantity = (quantity: UnitInputQuantity): UnitGroup[] => {
  switch (quantity) {
    case "length":
      return GROUPS_LENGTH
    case "length-percentage":
      return [...GROUPS_LENGTH, ...GROUPS_PERCENTAGE]
    case "percentage":
      return GROUPS_PERCENTAGE
    case "angle":
      return GROUPS_ANGLE
    case "time":
      return GROUPS_TIME
    case "frequency":
      return GROUPS_FREQUENCY
    case "resolution":
      return GROUPS_RESOLUTION
    case "all":
    default:
      return [...GROUPS_LENGTH, ...GROUPS_PERCENTAGE, ...GROUPS_ANGLE, ...GROUPS_TIME, ...GROUPS_FREQUENCY, ...GROUPS_RESOLUTION]
  }
}

const isCompleteNumber = (value: string) => /^-?\d+(?:\.\d+)?$/.test(value)

const sanitizeAmount = (raw: string) => {
  const stripped = raw.replace(/[^\d.\-]/g, "")
  if (!stripped) return ""
  const isNegative = stripped.startsWith("-")
  const withoutSigns = stripped.replace(/-/g, "")
  const firstDot = withoutSigns.indexOf(".")
  const normalized =
    firstDot === -1
      ? withoutSigns
      : `${withoutSigns.slice(0, firstDot + 1)}${withoutSigns.slice(firstDot + 1).replace(/\./g, "")}`
  return `${isNegative ? "-" : ""}${normalized}`
}

const parseValue = (value: UnitInputValue): { amount: string; unit: string } => {
  if (typeof value === "number") return { amount: String(value), unit: "px" }
  if (typeof value !== "string") return { amount: "", unit: "px" }

  const trimmed = value.trim()
  if (!trimmed) return { amount: "", unit: "px" }

  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)([a-z%]+)$/i)
  if (match) return { amount: match[1], unit: match[2] }

  const numeric = trimmed.match(/^-?\d+(?:\.\d+)?$/)
  if (numeric) return { amount: trimmed, unit: "px" }

  return { amount: trimmed, unit: "px" }
}

const toOutput = (amount: string, unit: string): UnitInputValue => {
  const trimmed = amount.trim()
  if (!trimmed) return undefined

  if (isCompleteNumber(trimmed)) {
    const asNumber = Number(trimmed)
    if (Number.isFinite(asNumber) && unit === "px") return asNumber
  }

  return `${trimmed}${unit}`
}

export function UnitInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  units,
  quantity = "all",
}: UnitInputProps) {
  const parsed = useMemo(() => parseValue(value), [value])
  const groups = useMemo(() => normalizeGroups(units ?? groupsForQuantity(quantity)), [quantity, units])
  const [draftAmount, setDraftAmount] = useState(parsed.amount)
  const [draftUnit, setDraftUnit] = useState(parsed.unit)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDraftAmount(parsed.amount)
    setDraftUnit(parsed.unit)
  }, [parsed.amount, parsed.unit])

  useEffect(() => {
    if (!isOpen) return
    const handler = (event: MouseEvent) => {
      const target = event.target instanceof Node ? event.target : null
      if (!target) return
      if (containerRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className={`InspectorUnitInput ${disabled ? "Disabled" : ""}`.trim()}
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsOpen(false)
      }}
    >
      <div className="InspectorUnitInputFrame">
        <div className="InspectorUnitInputAmount">
          <InspectorTextInput
            value={draftAmount}
            onChange={(nextAmount) => {
              const sanitized = sanitizeAmount(nextAmount)
              setDraftAmount(sanitized)
              if (!sanitized) {
                onChange(undefined)
                return
              }
              if (isCompleteNumber(sanitized)) {
                onChange(toOutput(sanitized, draftUnit))
                return
              }
              // Keep incomplete numeric drafts (e.g. "-", ".", "-.") without appending unit.
              onChange(sanitized)
            }}
            placeholder={placeholder}
            disabled={disabled}
            inputMode="decimal"
          />
        </div>
        <span className="InspectorUnitInputDivider" aria-hidden="true" />
        <div className="InspectorUnitInputUnit">
          <button
            type="button"
            className="InspectorUnitInputUnitButton"
            disabled={disabled}
            aria-label={draftUnit}
            aria-expanded={isOpen}
            title={UNIT_TITLES[draftUnit] ?? draftUnit}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span>{draftUnit}</span>
          </button>
        </div>
      </div>
      {isOpen && !disabled ? (
        <div className="InspectorUnitInputUnitMenu" role="listbox">
          {(() => {
            const knownUnits = groups.flatMap((group) => group.units.map((u) => u.unit))
            const hasCurrent = knownUnits.includes(draftUnit)
            const currentGroup: NormalizedUnitGroup[] = hasCurrent
              ? []
              : [{ label: "Current", units: [{ unit: draftUnit, title: UNIT_TITLES[draftUnit] ?? draftUnit }] }]
            return [...currentGroup, ...groups]
          })().map((group) => (
            <div key={group.label} className="InspectorUnitInputUnitGroup">
              <div className="InspectorUnitInputUnitGroupLabel">{group.label}</div>
              <div className="InspectorUnitInputUnitGroupItems">
                {group.units.map((unitOption) => (
                  <button
                    key={unitOption.unit}
                    type="button"
                    className={`InspectorUnitInputUnitOption ${unitOption.unit === draftUnit ? "Active" : ""}`.trim()}
                    title={unitOption.title}
                    onClick={() => {
                      setDraftUnit(unitOption.unit)
                      if (draftAmount && isCompleteNumber(draftAmount)) {
                        onChange(toOutput(draftAmount, unitOption.unit))
                      }
                      setIsOpen(false)
                    }}
                    role="option"
                    aria-selected={unitOption.unit === draftUnit}
                  >
                    {unitOption.unit}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
