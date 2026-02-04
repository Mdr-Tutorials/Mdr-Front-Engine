import {
  type ChangeEvent,
  type KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import {
  COMPACT_PREVIEW_SCALE,
  DEFAULT_PREVIEW_SCALE,
  getDefaultSizeId,
  getDefaultStatusIndex,
  getPreviewScale,
  isWideComponent,
} from './BlueprintEditor.data';
import { getComponentGroups } from './blueprint/registry';

type BlueprintEditorSidebarProps = {
  isCollapsed: boolean;
  collapsedGroups: Record<string, boolean>;
  expandedPreviews: Record<string, boolean>;
  sizeSelections: Record<string, string>;
  statusSelections: Record<string, number>;
  onToggleCollapse: () => void;
  onToggleGroup: (groupId: string) => void;
  onTogglePreview: (previewId: string) => void;
  onPreviewKeyDown: (
    event: KeyboardEvent<HTMLDivElement>,
    previewId: string,
    hasVariants: boolean
  ) => void;
  onSizeSelect: (itemId: string, sizeId: string) => void;
  onStatusSelect: (itemId: string, index: number) => void;
  onStatusCycleStart: (itemId: string, total: number) => void;
  onStatusCycleStop: (itemId: string) => void;
};

type PreviewWrapperProps = {
  scale?: number;
  className?: string;
  wide?: boolean;
  children: ReactNode;
};

const PreviewWrapper = ({
  scale = DEFAULT_PREVIEW_SCALE,
  className = '',
  wide = false,
  children,
}: PreviewWrapperProps) => (
  <div
    className={`ComponentPreviewSurface ${wide ? 'Wide' : ''} ${className}`.trim()}
  >
    <div
      className="ComponentPreviewInner"
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  </div>
);

type DraggablePreviewCardProps = {
  itemId: string;
  selectedSize?: string;
  className: string;
  role?: string;
  tabIndex?: number;
  ariaExpanded?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: ReactNode;
};

const DraggablePreviewCard = ({
  itemId,
  selectedSize,
  className,
  role,
  tabIndex,
  ariaExpanded,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  children,
}: DraggablePreviewCardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${itemId}`,
    data: { kind: 'palette-item', itemId, selectedSize },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isDragging ? 'IsDragging' : ''}`.trim()}
      role={role}
      tabIndex={tabIndex}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

type DraggableVariantCardProps = {
  itemId: string;
  variantId: string;
  variantProps?: Record<string, unknown>;
  selectedSize?: string;
  className: string;
  children: ReactNode;
};

const DraggableVariantCard = ({
  itemId,
  variantId,
  variantProps,
  selectedSize,
  className,
  children,
}: DraggableVariantCardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${itemId}:${variantId}`,
    data: {
      kind: 'palette-item',
      itemId,
      variantId,
      variantProps,
      selectedSize,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isDragging ? 'IsDragging' : ''}`.trim()}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

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
  const { t } = useTranslation('blueprint');
  const [query, setQuery] = useState('');
  const [isSearchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const effectiveSearchOpen = isSearchOpen || Boolean(normalizedQuery);
  const groups = useMemo(() => {
    const rawGroups = getComponentGroups();
    if (!normalizedQuery) return rawGroups;

    return rawGroups
      .map((group) => {
        const groupTitle = t(`componentLibrary.groups.${group.id}.title`, {
          defaultValue: group.title,
        });
        const groupMatches =
          group.id.toLowerCase().includes(normalizedQuery) ||
          groupTitle.toLowerCase().includes(normalizedQuery);

        const nextItems = groupMatches
          ? group.items
          : group.items.filter((item) => {
              const itemName = t(`componentLibrary.items.${item.id}.name`, {
                defaultValue: item.name,
              });
              return (
                item.id.toLowerCase().includes(normalizedQuery) ||
                itemName.toLowerCase().includes(normalizedQuery)
              );
            });

        if (nextItems.length === 0) return null;
        return { ...group, items: nextItems };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));
  }, [normalizedQuery, t]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const clearQuery = () => setQuery('');

  useEffect(() => {
    if (!effectiveSearchOpen) return;
    // Wait for the input to exist in the DOM before focusing.
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [effectiveSearchOpen]);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  return (
    <aside
      className={`BlueprintEditorSidebar ${isCollapsed ? 'Collapsed' : ''}`}
    >
      <div className="BlueprintEditorSidebarHeader">
        <span className="BlueprintEditorSidebarTitle">
          {t('sidebar.title')}
        </span>
        <div className="BlueprintEditorSidebarHeaderRight">
          {!isCollapsed && (
            <div
              className={`BlueprintEditorSidebarSearch ${effectiveSearchOpen ? 'IsOpen' : ''}`.trim()}
              role="search"
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                clearQuery();
                closeSearch();
              }}
            >
              <button
                type="button"
                className="BlueprintEditorSidebarSearchToggle"
                onClick={() => {
                  if (effectiveSearchOpen) return;
                  openSearch();
                }}
                aria-label={t('sidebar.openSearch')}
              >
                <Search size={14} />
              </button>
              <input
                ref={searchInputRef}
                className="BlueprintEditorSidebarSearchInput"
                value={query}
                placeholder={t('sidebar.searchPlaceholder')}
                onChange={handleQueryChange}
                onBlur={() => {
                  if (query.trim()) return;
                  closeSearch();
                }}
                aria-label={t('sidebar.searchPlaceholder')}
              />
              <button
                type="button"
                className="BlueprintEditorSidebarSearchClear"
                onClick={() => {
                  clearQuery();
                  searchInputRef.current?.focus();
                }}
                aria-label={t('sidebar.clearSearch')}
                disabled={!query}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <button
            className="BlueprintEditorCollapse"
            onClick={onToggleCollapse}
            aria-label={t('sidebar.toggleLibrary')}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="BlueprintEditorComponentList">
          {groups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.id];
            const groupTitle = t(`componentLibrary.groups.${group.id}.title`, {
              defaultValue: group.title,
            });
            return (
              <div key={group.id} className="ComponentGroup">
                <button
                  className="ComponentGroupHeader"
                  onClick={() => onToggleGroup(group.id)}
                >
                  <span className="ComponentGroupTitle">
                    {groupTitle} ({group.items.length})
                  </span>
                  <ChevronDown
                    size={14}
                    className={`ComponentGroupIcon ${isGroupCollapsed ? 'Collapsed' : ''}`}
                  />
                </button>
                {!isGroupCollapsed && (
                  <div className="ComponentGroupItems">
                    {group.items.map((item) => {
                      const variants = item.variants ?? [];
                      const hasVariants = variants.length > 0;
                      const isExpanded = expandedPreviews[item.id];
                      const isWide = isWideComponent(group, item);
                      const itemName = t(
                        `componentLibrary.items.${item.id}.name`,
                        { defaultValue: item.name }
                      );
                      const sizeOptions = item.sizeOptions;
                      const statusOptions = item.statusOptions;
                      const selectedSizeId = sizeOptions
                        ? (sizeSelections[item.id] ??
                          getDefaultSizeId(sizeOptions))
                        : undefined;
                      const selectedSizeValue = sizeOptions?.find(
                        (option) => option.id === selectedSizeId
                      )?.value;
                      const statusCount = statusOptions?.length ?? 0;
                      const statusIndex = statusCount
                        ? (statusSelections[item.id] ??
                            getDefaultStatusIndex(
                              statusOptions,
                              item.defaultStatus
                            )) % statusCount
                        : 0;
                      const statusValue = statusOptions?.[statusIndex]?.value;
                      const previewNode = item.renderPreview
                        ? item.renderPreview({
                            size: selectedSizeValue,
                            status: statusValue,
                          })
                        : item.preview;
                      const previewScale = getPreviewScale(item.scale, isWide);
                      const showControls = Boolean(
                        sizeOptions?.length || statusCount
                      );
                      return (
                        <div
                          key={item.id}
                          className={`ComponentPreview ${isExpanded ? 'Expanded' : ''} ${isWide ? 'Wide' : ''}`}
                        >
                          <DraggablePreviewCard
                            itemId={item.id}
                            selectedSize={selectedSizeValue}
                            className={`ComponentPreviewCard ${hasVariants ? 'HasVariants' : ''}`}
                            role={hasVariants ? 'button' : undefined}
                            tabIndex={hasVariants ? 0 : -1}
                            ariaExpanded={hasVariants ? isExpanded : undefined}
                            onClick={() =>
                              hasVariants && onTogglePreview(item.id)
                            }
                            onKeyDown={(event) =>
                              onPreviewKeyDown(event, item.id, hasVariants)
                            }
                            onMouseEnter={() => {
                              if (statusCount) {
                                onStatusCycleStart(item.id, statusCount);
                              }
                            }}
                            onMouseLeave={() => {
                              if (statusCount) {
                                onStatusCycleStop(item.id);
                              }
                            }}
                          >
                            <PreviewWrapper scale={previewScale} wide={isWide}>
                              {previewNode}
                            </PreviewWrapper>
                            {hasVariants && (
                              <button
                                type="button"
                                className={`ComponentPreviewExpand ${isExpanded ? 'Open' : ''}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onTogglePreview(item.id);
                                }}
                                onPointerDown={(event) =>
                                  event.stopPropagation()
                                }
                                aria-label={
                                  isExpanded
                                    ? t('sidebar.collapseVariants')
                                    : t('sidebar.expandVariants')
                                }
                              >
                                <span>{variants.length}</span>
                              </button>
                            )}
                            <span className="ComponentPreviewLabel">
                              {itemName}
                            </span>
                            {showControls && (
                              <div className="ComponentPreviewMeta">
                                {sizeOptions && (
                                  <div className="ComponentPreviewSizes">
                                    {sizeOptions.map((option) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        className={`ComponentPreviewSize ${selectedSizeId === option.id ? 'Active' : ''}`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          onSizeSelect(item.id, option.id);
                                        }}
                                        onPointerDown={(event) =>
                                          event.stopPropagation()
                                        }
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
                                        className={`ComponentPreviewStatusDot ${index === statusIndex ? 'Active' : ''}`}
                                        title={option.label}
                                        aria-label={option.label}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          onStatusCycleStop(item.id);
                                          onStatusSelect(item.id, index);
                                        }}
                                        onPointerDown={(event) =>
                                          event.stopPropagation()
                                        }
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </DraggablePreviewCard>
                          {hasVariants && isExpanded && (
                            <div
                              className={`ComponentPreviewVariants ${isWide ? 'Wide' : ''}`}
                            >
                              {variants.map((variant) => {
                                const variantScale = getPreviewScale(
                                  variant.scale ??
                                    item.scale ??
                                    COMPACT_PREVIEW_SCALE,
                                  isWide
                                );
                                const variantNode = variant.renderElement
                                  ? variant.renderElement({
                                      size: selectedSizeValue,
                                    })
                                  : variant.element;
                                return (
                                  <DraggableVariantCard
                                    key={`${item.id}-${variant.id}`}
                                    itemId={item.id}
                                    variantId={variant.id}
                                    variantProps={variant.props}
                                    selectedSize={selectedSizeValue}
                                    className={`ComponentVariantCard ${isWide ? 'Wide' : ''}`}
                                  >
                                    <PreviewWrapper
                                      scale={variantScale}
                                      wide={isWide}
                                      className="Small"
                                    >
                                      {variantNode}
                                    </PreviewWrapper>
                                    <span className="ComponentVariantLabel">
                                      {variant.label}
                                    </span>
                                  </DraggableVariantCard>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
