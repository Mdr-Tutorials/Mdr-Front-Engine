import type React from "react"

type InspectorRowProps = {
  label: React.ReactNode
  description?: React.ReactNode
  control: React.ReactNode
}

export function InspectorRow({ label, description, control }: InspectorRowProps) {
  return (
    <div className="flex items-start justify-between gap-[10px]">
      <div className="min-w-[120px] pt-[2px]">
        <div className="InspectorLabel">{label}</div>
        {description ? <div className="InspectorDescription">{description}</div> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-end">{control}</div>
      </div>
    </div>
  )
}

