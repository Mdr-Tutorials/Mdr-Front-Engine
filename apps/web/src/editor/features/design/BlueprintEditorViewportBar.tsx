import { useTranslation } from 'react-i18next';
import { MdrInput, MdrPopover, MdrSlider } from '@mdr/ui';
import { ChevronDown, RotateCcw } from 'lucide-react';
import {
    VIEWPORT_DEVICE_PRESETS,
    VIEWPORT_QUICK_PRESETS,
    VIEWPORT_ZOOM_RANGE,
} from './BlueprintEditor.data';

type BlueprintEditorViewportBarProps = {
    viewportWidth: string;
    viewportHeight: string;
    onViewportWidthChange: (value: string) => void;
    onViewportHeightChange: (value: string) => void;
    zoom: number;
    zoomStep: number;
    onZoomChange: (value: number) => void;
    onResetView: () => void;
};

const DEVICE_KIND_ICON_STYLES: Record<string, string> = {
    Phone: 'bg-[rgba(67,114,255,0.14)] text-[rgba(38,78,200,1)]',
    Tablet: 'bg-[rgba(52,184,149,0.14)] text-[rgba(18,120,95,1)]',
    Laptop: 'bg-[rgba(255,182,82,0.2)] text-[rgba(176,96,10,1)]',
    Desktop: 'bg-[rgba(96,125,139,0.18)] text-[rgba(64,88,100,1)]',
    Watch: 'bg-[rgba(220,90,90,0.16)] text-[rgba(170,50,50,1)]',
};

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
    const { t } = useTranslation('blueprint');

    return (
        <section className="flex min-h-[30px] flex-nowrap items-center gap-2.5 bg-(--color-0) px-[14px] py-1 text-[11px] text-(--color-7)">
            <div className="flex flex-none items-center gap-2.5">
                <div className="font-semibold text-(--color-8)">
                    {t('viewport.label')}
                </div>
                <div className="inline-flex items-center gap-1.5 [&_.MdrInput]:max-w-[76px] [&_.MdrInput]:w-[76px] max-[980px]:[&_.MdrInput]:max-w-[62px] max-[980px]:[&_.MdrInput]:w-[62px]">
                    <MdrInput
                        size="Small"
                        value={viewportWidth}
                        onChange={onViewportWidthChange}
                    />
                    <span className="text-(--color-6)">×</span>
                    <MdrInput
                        size="Small"
                        value={viewportHeight}
                        onChange={onViewportHeightChange}
                    />
                </div>
            </div>
            <div className="inline-flex flex-none items-center gap-2 whitespace-nowrap">
                <span className="font-semibold text-(--color-8) max-[980px]:hidden">
                    {t('viewport.zoom')}
                </span>
                <MdrSlider
                    className="inline-flex w-auto items-center gap-1.5 [&.MdrField]:w-auto [&.MdrField]:flex-row [&.MdrField]:gap-1.5 [&_.MdrSliderInput]:w-[120px] max-[980px]:[&_.MdrSliderInput]:w-[92px]"
                    min={VIEWPORT_ZOOM_RANGE.min}
                    max={VIEWPORT_ZOOM_RANGE.max}
                    step={zoomStep}
                    value={zoom}
                    showValue={false}
                    size="Small"
                    onChange={onZoomChange}
                />
                <span className="min-w-9 text-right tabular-nums text-(--color-7)">
                    {zoom}%
                </span>
                <button
                    type="button"
                    className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full border border-black/8 bg-(--color-0) px-2 text-[11px] leading-none text-(--color-7) transition-[border-color,color] duration-150 hover:border-black/20 hover:text-(--color-9) dark:border-white/12 dark:hover:border-white/28"
                    onClick={onResetView}
                    aria-label={t('viewport.reset')}
                >
                    <RotateCcw size={12} />
                    <span className="max-[980px]:hidden">
                        {t('viewport.reset')}
                    </span>
                </button>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap max-[980px]:hidden">
                {VIEWPORT_QUICK_PRESETS.map((preset) => {
                    const presetLabel = t(preset.labelKey, {
                        defaultValue: `${preset.width}×${preset.height}`,
                    });
                    return (
                        <button
                            type="button"
                            key={preset.id}
                            className="h-6 whitespace-nowrap rounded-full border border-black/8 bg-(--color-0) px-2 text-[11px] leading-none text-(--color-7) transition-[border-color,color] duration-150 hover:border-black/20 hover:text-(--color-9) dark:border-white/12 dark:hover:border-white/28"
                            onClick={() => {
                                onViewportWidthChange(preset.width);
                                onViewportHeightChange(preset.height);
                            }}
                        >
                            {presetLabel}
                        </button>
                    );
                })}
            </div>
            <div className="hidden min-w-0 flex-1 items-center gap-2 max-[980px]:inline-flex">
                <label
                    className="whitespace-nowrap font-semibold text-(--color-8)"
                    htmlFor="ViewportQuickPresetsSelect"
                >
                    {t('viewport.quickPresetMenu')}
                </label>
                <select
                    id="ViewportQuickPresetsSelect"
                    className="h-6 min-w-0 rounded-full border border-black/8 bg-(--color-0) px-2.5 text-[11px] text-(--color-9) dark:border-white/12"
                    defaultValue=""
                    onChange={(event) => {
                        const preset = VIEWPORT_QUICK_PRESETS.find(
                            (item) => item.id === event.target.value
                        );
                        if (!preset) return;
                        onViewportWidthChange(preset.width);
                        onViewportHeightChange(preset.height);
                    }}
                >
                    <option value="">{t('viewport.quickPresetMenu')}</option>
                    {VIEWPORT_QUICK_PRESETS.map((preset) => {
                        const presetLabel = t(preset.labelKey, {
                            defaultValue: `${preset.width}×${preset.height}`,
                        });
                        return (
                            <option key={preset.id} value={preset.id}>
                                {presetLabel}
                            </option>
                        );
                    })}
                </select>
            </div>
            <MdrPopover
                className="ml-auto flex-none"
                panelClassName="max-h-[min(60vh,520px)] w-[min(760px,90vw)] overflow-auto p-2.5"
                panelStyle={{
                    top: 'auto',
                    right: 0,
                    bottom: '100%',
                    left: 'auto',
                    marginTop: 0,
                    marginBottom: '6px',
                }}
                content={
                    <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
                        {VIEWPORT_DEVICE_PRESETS.map((preset) => {
                            const Icon = preset.icon;
                            const deviceName = t(preset.nameKey, {
                                defaultValue: preset.id,
                            });
                            const deviceKind = t(preset.kindKey, {
                                defaultValue: preset.kind,
                            });
                            const sizeLabel = t('viewport.size', {
                                width: preset.width,
                                height: preset.height,
                            });
                            return (
                                <button
                                    key={preset.id}
                                    className="flex min-w-[190px] items-center gap-2.5 rounded-[14px] border border-black/8 bg-(--color-0) px-2.5 py-1.5 text-left text-xs text-(--color-7) transition-[border-color,color,background] duration-150 hover:border-black/20 hover:bg-(--color-1) hover:text-(--color-9) focus-visible:outline-2 focus-visible:outline-black/20 focus-visible:outline-offset-2 dark:border-white/12 dark:hover:border-white/28"
                                    onClick={() => {
                                        onViewportWidthChange(preset.width);
                                        onViewportHeightChange(preset.height);
                                    }}
                                    aria-label={`${deviceName} ${sizeLabel}`}
                                >
                                    <span
                                        className={`ViewportPresetIcon inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-(--color-2) text-(--color-8) dark:bg-white/8 ${DEVICE_KIND_ICON_STYLES[preset.kind] ?? ''}`}
                                    >
                                        <Icon size={18} />
                                    </span>
                                    <span className="flex min-w-0 flex-col gap-0.5">
                                        <span className="text-xs font-semibold text-(--color-9)">
                                            {deviceName}
                                        </span>
                                        <span className="text-[10px] text-(--color-6)">
                                            {deviceKind}
                                        </span>
                                    </span>
                                    <span className="ml-auto text-[11px] tabular-nums text-(--color-6)">
                                        {sizeLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                }
            >
                <button
                    type="button"
                    className="ViewportMoreButton inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full border border-black/8 bg-(--color-0) px-2 text-[11px] leading-none text-(--color-7) transition-[border-color,color] duration-150 hover:border-black/20 hover:text-(--color-9) dark:border-white/12 dark:hover:border-white/28"
                >
                    {t('viewport.moreDevices')}
                    <ChevronDown size={12} />
                </button>
            </MdrPopover>
        </section>
    );
}
