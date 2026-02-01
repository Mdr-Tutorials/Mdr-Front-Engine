import { useMemo } from "react"
import { MdrInput } from "@mdr/ui"

type ColorInputProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
}

const normalizeHex = (raw: string) => {
  const value = raw.trim()
  if (!value) return null
  if (/^#([0-9a-f]{3})$/i.test(value)) return value
  if (/^#([0-9a-f]{6})$/i.test(value)) return value
  return null
}

export function ColorInput({ value, onChange, placeholder, disabled = false }: ColorInputProps) {
  const swatchValue = useMemo(() => normalizeHex(value ?? ""), [value])

  return (
    <div className="flex w-full max-w-[260px] items-center justify-end gap-[8px]">
      <div className="min-w-0 flex-1">
        <MdrInput
          size="Small"
          value={value ?? ""}
          onChange={(next) => onChange(next.trim() ? next : undefined)}
          placeholder={placeholder ?? "#RRGGBB / var(--color-x)"}
          disabled={disabled}
        />
      </div>
      <input
        type="color"
        value={swatchValue ?? "#000000"}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-[32px] w-[36px] cursor-pointer rounded-[10px] border border-[rgba(0,0,0,0.12)] bg-transparent p-0 [[data-theme='dark']_&]:border-[rgba(255,255,255,0.16)]"
        aria-label="color"
      />
    </div>
  )
}

