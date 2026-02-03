import { useTranslation } from "react-i18next"
import { MdrInput, MdrPopover, MdrSlider } from "@mdr/ui"
import { ChevronDown, RotateCcw } from "lucide-react"
import { VIEWPORT_DEVICE_PRESETS, VIEWPORT_QUICK_PRESETS, VIEWPORT_ZOOM_RANGE } from "./BlueprintEditor.data"

type BlueprintEditorViewportBarProps = {
  viewportWidth: string
  viewportHeight: string
  onViewportWidthChange: (value: string) => void
  onViewportHeightChange: (value: string) => void
  zoom: number
  zoomStep: number
  onZoomChange: (value: number) => void
  onResetView: () => void
}

export function BlueprintEditorViewportBar({
  viewportWidth,
  viewportHeight,
  onViewportWidthChange,
  onViewportHeightChange,
  zoom,
  zoomStep,
  onZoomChange,
  onResetView,
}: BlueprintEditorViewportBarProps) {
  const { t } = useTranslation('blueprint')

  return (
    <section className="BlueprintEditorViewportBar">
      <div className="ViewportControls">
        <div className="ViewportLabel">{t('viewport.label')}</div>
        <div className="ViewportInputs">
          <MdrInput size="Small" value={viewportWidth} onChange={onViewportWidthChange} />
          <span>×</span>
          <MdrInput size="Small" value={viewportHeight} onChange={onViewportHeightChange} />
        </div>
      </div>
      <div className="ViewportZoom">
        <span className="ViewportZoomLabel">{t('viewport.zoom')}</span>
        <MdrSlider
          className="ViewportZoomControl"
          min={VIEWPORT_ZOOM_RANGE.min}
          max={VIEWPORT_ZOOM_RANGE.max}
          step={zoomStep}
          value={zoom}
          showValue={false}
          size="Small"
          onChange={onZoomChange}
        />
        <span className="ViewportZoomValue">{zoom}%</span>
        <button
          type="button"
          className="ViewportResetButton"
          onClick={onResetView}
          aria-label={t('viewport.reset')}
        >
          <RotateCcw size={12} />
          <span className="ViewportResetText">{t('viewport.reset')}</span>
        </button>
      </div>
      <div className="ViewportQuickPresets">
        {VIEWPORT_QUICK_PRESETS.map((preset) => {
          const presetLabel = t(preset.labelKey, { defaultValue: `${preset.width}×${preset.height}` })
          return (
          <button
            key={preset.id}
            className="ViewportQuickPreset"
            onClick={() => {
              onViewportWidthChange(preset.width)
              onViewportHeightChange(preset.height)
            }}
          >
            {presetLabel}
          </button>
          )
        })}
      </div>
      <div className="ViewportQuickPresetsMenu">
        <label className="ViewportQuickPresetsMenuLabel" htmlFor="ViewportQuickPresetsSelect">
          {t('viewport.quickPresetMenu')}
        </label>
        <select
          id="ViewportQuickPresetsSelect"
          className="ViewportQuickPresetsSelect"
          defaultValue=""
          onChange={(event) => {
            const preset = VIEWPORT_QUICK_PRESETS.find((item) => item.id === event.target.value)
            if (!preset) return
            onViewportWidthChange(preset.width)
            onViewportHeightChange(preset.height)
          }}
        >
          <option value="">{t('viewport.quickPresetMenu')}</option>
          {VIEWPORT_QUICK_PRESETS.map((preset) => {
            const presetLabel = t(preset.labelKey, { defaultValue: `${preset.width}×${preset.height}` })
            return (
              <option key={preset.id} value={preset.id}>
                {presetLabel}
              </option>
            )
          })}
        </select>
      </div>
      <MdrPopover
        className="ViewportDevicePopover"
        content={
          <div className="ViewportDeviceList">
            {VIEWPORT_DEVICE_PRESETS.map((preset) => {
              const Icon = preset.icon
              const deviceName = t(preset.nameKey, { defaultValue: preset.id })
              const deviceKind = t(preset.kindKey, { defaultValue: preset.kind })
              const sizeLabel = t('viewport.size', { width: preset.width, height: preset.height })
              return (
                <button
                  key={preset.id}
                  className="ViewportPreset"
                  onClick={() => {
                    onViewportWidthChange(preset.width)
                    onViewportHeightChange(preset.height)
                  }}
                  aria-label={`${deviceName} ${sizeLabel}`}
                >
                  <span className={`ViewportPresetIcon ${preset.kind}`}>
                    <Icon size={18} />
                  </span>
                  <span className="ViewportPresetMeta">
                    <span className="ViewportPresetName">{deviceName}</span>
                    <span className="ViewportPresetType">{deviceKind}</span>
                  </span>
                  <span className="ViewportPresetSize">
                    {sizeLabel}
                  </span>
                </button>
              )
            })}
          </div>
        }
      >
        <button type="button" className="ViewportMoreButton">
          {t('viewport.moreDevices')}
          <ChevronDown size={12} />
        </button>
      </MdrPopover>
    </section>
  )
}
