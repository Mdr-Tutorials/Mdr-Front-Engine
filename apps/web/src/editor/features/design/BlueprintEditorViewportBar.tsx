import { MdrInput, MdrPopover } from "@mdr/ui"
import { ChevronDown } from "lucide-react"
import { VIEWPORT_DEVICE_PRESETS, VIEWPORT_QUICK_PRESETS } from "./BlueprintEditor.data"

type BlueprintEditorViewportBarProps = {
  viewportWidth: string
  viewportHeight: string
  onViewportWidthChange: (value: string) => void
  onViewportHeightChange: (value: string) => void
}

export function BlueprintEditorViewportBar({
  viewportWidth,
  viewportHeight,
  onViewportWidthChange,
  onViewportHeightChange,
}: BlueprintEditorViewportBarProps) {
  return (
    <section className="BlueprintEditorViewportBar">
      <div className="ViewportControls">
        <div className="ViewportLabel">视口</div>
        <div className="ViewportInputs">
          <MdrInput size="Small" value={viewportWidth} onChange={onViewportWidthChange} />
          <span>×</span>
          <MdrInput size="Small" value={viewportHeight} onChange={onViewportHeightChange} />
        </div>
      </div>
      <div className="ViewportQuickPresets">
        {VIEWPORT_QUICK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className="ViewportQuickPreset"
            onClick={() => {
              onViewportWidthChange(preset.width)
              onViewportHeightChange(preset.height)
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <MdrPopover
        className="ViewportDevicePopover"
        content={
          <div className="ViewportDeviceList">
            {VIEWPORT_DEVICE_PRESETS.map((preset) => {
              const Icon = preset.icon
              return (
                <button
                  key={preset.id}
                  className="ViewportPreset"
                  onClick={() => {
                    onViewportWidthChange(preset.width)
                    onViewportHeightChange(preset.height)
                  }}
                  aria-label={`${preset.name} ${preset.width}×${preset.height}`}
                >
                  <span className={`ViewportPresetIcon ${preset.kind}`}>
                    <Icon size={18} />
                  </span>
                  <span className="ViewportPresetMeta">
                    <span className="ViewportPresetName">{preset.name}</span>
                    <span className="ViewportPresetType">{preset.kindLabel}</span>
                  </span>
                  <span className="ViewportPresetSize">
                    {preset.width}×{preset.height}
                  </span>
                </button>
              )
            })}
          </div>
        }
      >
        <button type="button" className="ViewportMoreButton">
          更多设备
          <ChevronDown size={12} />
        </button>
      </MdrPopover>
    </section>
  )
}
