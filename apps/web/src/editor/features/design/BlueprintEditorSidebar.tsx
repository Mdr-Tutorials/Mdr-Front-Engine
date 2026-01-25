import type { KeyboardEvent, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  COMPACT_PREVIEW_SCALE,
  DEFAULT_PREVIEW_SCALE,
  COMPONENT_GROUPS,
  getDefaultSizeId,
  getDefaultStatusIndex,
  getPreviewScale,
  isWideComponent,
} from "./BlueprintEditor.data"

type BlueprintEditorSidebarProps = {
  isCollapsed: boolean
  collapsedGroups: Record<string, boolean>
  expandedPreviews: Record<string, boolean>
  sizeSelections: Record<string, string>
  statusSelections: Record<string, number>
  onToggleCollapse: () => void
  onToggleGroup: (groupId: string) => void
  onTogglePreview: (previewId: string) => void
  onPreviewKeyDown: (event: KeyboardEvent<HTMLDivElement>, previewId: string, hasVariants: boolean) => void
  onSizeSelect: (itemId: string, sizeId: string) => void
  onStatusSelect: (itemId: string, index: number) => void
  onStatusCycleStart: (itemId: string, total: number) => void
  onStatusCycleStop: (itemId: string) => void
}

type PreviewWrapperProps = {
  scale?: number
  className?: string
  wide?: boolean
  children: ReactNode
}

const PreviewWrapper = ({ scale = DEFAULT_PREVIEW_SCALE, className = "", wide = false, children }: PreviewWrapperProps) => (
  <div className={`ComponentPreviewSurface ${wide ? "Wide" : ""} ${className}`.trim()}>
    <div className="ComponentPreviewInner" style={{ transform: `scale(${scale})` }}>
      {children}
    </div>
  </div>
)

export function BlueprintEditorSidebar({
  isCollapsed,
  collapsedGroups,
  expandedPreviews,
  sizeSelections,
  statusSelections,
  onToggleCollapse,
  onToggleGroup,
  onTogglePreview,
  onPreviewKeyDown,
  onSizeSelect,
  onStatusSelect,
  onStatusCycleStart,
  onStatusCycleStop,
}: BlueprintEditorSidebarProps) {
  const { t } = useTranslation('blueprint')
  return (
    <aside className={`BlueprintEditorSidebar ${isCollapsed ? "Collapsed" : ""}`}>
      <div className="BlueprintEditorSidebarHeader">
        <span>{t('sidebar.title')}</span>
        <button
          className="BlueprintEditorCollapse"
          onClick={onToggleCollapse}
          aria-label={t('sidebar.toggleLibrary')}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="BlueprintEditorComponentList">
          {COMPONENT_GROUPS.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.id]
            const groupTitle = t(`componentLibrary.groups.${group.id}.title`, { defaultValue: group.title })
            return (
              <div key={group.id} className="ComponentGroup">
                <button className="ComponentGroupHeader" onClick={() => onToggleGroup(group.id)}>
                  <span className="ComponentGroupTitle">
                    {groupTitle} ({group.items.length})
                  </span>
                  <ChevronDown
                    size={14}
                    className={`ComponentGroupIcon ${isGroupCollapsed ? "Collapsed" : ""}`}
                  />
                </button>
                {!isGroupCollapsed && (
                  <div className="ComponentGroupItems">
                    {group.items.map((item) => {
                      const variants = item.variants ?? []
                      const hasVariants = variants.length > 0
                      const isExpanded = expandedPreviews[item.id]
                      const isWide = isWideComponent(group, item)
                      const itemName = t(`componentLibrary.items.${item.id}.name`, { defaultValue: item.name })
                      const sizeOptions = item.sizeOptions
                      const statusOptions = item.statusOptions
                      const selectedSizeId = sizeOptions
                        ? sizeSelections[item.id] ?? getDefaultSizeId(sizeOptions)
                        : undefined
                      const selectedSizeValue = sizeOptions?.find((option) => option.id === selectedSizeId)?.value
                      const statusCount = statusOptions?.length ?? 0
                      const statusIndex = statusCount
                        ? (statusSelections[item.id] ??
                          getDefaultStatusIndex(statusOptions, item.defaultStatus)) % statusCount
                        : 0
                      const statusValue = statusOptions?.[statusIndex]?.value
                      const previewNode = item.renderPreview
                        ? item.renderPreview({ size: selectedSizeValue, status: statusValue })
                        : item.preview
                      const previewScale = getPreviewScale(item.scale, isWide)
                      const showControls = Boolean(sizeOptions?.length || statusCount)
                      return (
                        <div
                          key={item.id}
                          className={`ComponentPreview ${isExpanded ? "Expanded" : ""} ${isWide ? "Wide" : ""}`}
                        >
                          <div
                            className={`ComponentPreviewCard ${hasVariants ? "HasVariants" : ""}`}
                            role={hasVariants ? "button" : undefined}
                            tabIndex={hasVariants ? 0 : -1}
                            aria-expanded={hasVariants ? isExpanded : undefined}
                            onClick={() => hasVariants && onTogglePreview(item.id)}
                            onKeyDown={(event) => onPreviewKeyDown(event, item.id, hasVariants)}
                            onMouseEnter={() => {
                              if (statusCount) {
                                onStatusCycleStart(item.id, statusCount)
                              }
                            }}
                            onMouseLeave={() => {
                              if (statusCount) {
                                onStatusCycleStop(item.id)
                              }
                            }}
                          >
                            <PreviewWrapper scale={previewScale} wide={isWide}>
                              {previewNode}
                            </PreviewWrapper>
                            {hasVariants && (
                              <button
                                type="button"
                                className={`ComponentPreviewExpand ${isExpanded ? "Open" : ""}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onTogglePreview(item.id)
                                }}
                                aria-label={isExpanded ? t('sidebar.collapseVariants') : t('sidebar.expandVariants')}
                              >
                                <span>{variants.length}</span>
                              </button>
                            )}
                            <span className="ComponentPreviewLabel">{itemName}</span>
                            {showControls && (
                              <div className="ComponentPreviewMeta">
                                {sizeOptions && (
                                  <div className="ComponentPreviewSizes">
                                    {sizeOptions.map((option) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        className={`ComponentPreviewSize ${selectedSizeId === option.id ? "Active" : ""}`}
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          onSizeSelect(item.id, option.id)
                                        }}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {statusCount > 0 && (
                                  <div className="ComponentPreviewStatus">
                                    {statusOptions?.map((option, index) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        className={`ComponentPreviewStatusDot ${index === statusIndex ? "Active" : ""}`}
                                        title={option.label}
                                        aria-label={option.label}
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          onStatusCycleStop(item.id)
                                          onStatusSelect(item.id, index)
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {hasVariants && isExpanded && (
                            <div className={`ComponentPreviewVariants ${isWide ? "Wide" : ""}`}>
                              {variants.map((variant) => {
                                const variantScale = getPreviewScale(
                                  variant.scale ?? item.scale ?? COMPACT_PREVIEW_SCALE,
                                  isWide,
                                )
                                return (
                                  <div
                                    key={`${item.id}-${variant.id}`}
                                    className={`ComponentVariantCard ${isWide ? "Wide" : ""}`}
                                  >
                                    <PreviewWrapper scale={variantScale} wide={isWide} className="Small">
                                      {variant.element}
                                    </PreviewWrapper>
                                    <span className="ComponentVariantLabel">{variant.label}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
