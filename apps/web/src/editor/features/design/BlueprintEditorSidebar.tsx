import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactNode,
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
    isTreeCollapsed?: boolean;
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
        className={`ComponentPreviewSurface relative flex h-[60px] min-w-20 items-center justify-center overflow-hidden rounded-md border border-black/6 bg-black/[0.02] dark:border-white/12 dark:bg-white/4 [&_.MdrModalOverlay]:absolute [&_.MdrModalOverlay]:inset-1 [&_.MdrModalOverlay]:z-0 [&_.MdrModalOverlay]:rounded-md [&_.MdrDrawerOverlay]:absolute [&_.MdrDrawerOverlay]:inset-1 [&_.MdrDrawerOverlay]:z-0 [&_.MdrDrawerOverlay]:rounded-md [&_.MdrModal]:max-w-full [&_.MdrModal]:w-[140px] [&_.MdrDrawer]:max-h-full [&_.MdrDrawer]:max-w-full ${wide ? 'Wide w-full' : ''} ${className}`.trim()}
    >
        <div
            className="ComponentPreviewInner pointer-events-none inline-flex origin-center items-center justify-center"
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
            className={`${className} ${isDragging ? 'IsDragging cursor-grabbing opacity-[0.55]' : ''}`.trim()}
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
            className={`${className} ${isDragging ? 'IsDragging cursor-grabbing opacity-[0.55]' : ''}`.trim()}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    );
};

export function BlueprintEditorSidebar({
    isCollapsed,
    isTreeCollapsed = false,
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
                const groupTitle = t(
                    `componentLibrary.groups.${group.id}.title`,
                    {
                        defaultValue: group.title,
                    }
                );
                const groupMatches =
                    group.id.toLowerCase().includes(normalizedQuery) ||
                    groupTitle.toLowerCase().includes(normalizedQuery);

                const nextItems = groupMatches
                    ? group.items
                    : group.items.filter((item) => {
                          const itemName = t(
                              `componentLibrary.items.${item.id}.name`,
                              {
                                  defaultValue: item.name,
                              }
                          );
                          return (
                              item.id.toLowerCase().includes(normalizedQuery) ||
                              itemName.toLowerCase().includes(normalizedQuery)
                          );
                      });

                if (nextItems.length === 0) return null;
                return { ...group, items: nextItems };
            })
            .filter((value): value is NonNullable<typeof value> =>
                Boolean(value)
            );
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
            className={`BlueprintEditorSidebar absolute left-0 top-0 z-[3] flex min-h-0 w-[var(--sidebar-width)] flex-col rounded-[14px] border border-black/6 bg-(--color-0) shadow-[0_12px_26px_rgba(0,0,0,0.08)] dark:border-transparent ${!isCollapsed && !isTreeCollapsed ? '[bottom:var(--component-tree-height)] rounded-b-none border-b-0' : 'bottom-0'} ${isCollapsed ? 'Collapsed bottom-auto h-9 items-center justify-center border-none bg-transparent p-0 shadow-none' : ''}`}
        >
            <div
                className={`BlueprintEditorSidebarHeader flex items-center justify-between gap-2.5 border-b border-black/6 px-3 py-2.5 text-[13px] font-semibold dark:border-white/8 ${isCollapsed ? 'w-full items-center justify-center border-b-0 p-0' : ''}`}
            >
                <span
                    className={`BlueprintEditorSidebarTitle min-w-0 ${isCollapsed ? 'hidden' : ''}`}
                >
                    {t('sidebar.title')}
                </span>
                <div className="BlueprintEditorSidebarHeaderRight inline-flex min-w-0 items-center justify-end gap-2">
                    {!isCollapsed && (
                        <div
                            className={`BlueprintEditorSidebarSearch inline-flex h-7 items-center gap-1.5 overflow-hidden rounded-full border border-transparent bg-transparent px-1 transition-[width,border-color,background] duration-150 ${effectiveSearchOpen ? 'IsOpen w-[220px] border-black/6 bg-white/78 backdrop-blur-[6px]' : 'w-[30px]'}`.trim()}
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
                                className="BlueprintEditorSidebarSearchToggle inline-flex h-6 w-6 items-center justify-center rounded-full border-0 bg-transparent p-0 text-(--color-6) hover:bg-black/4 hover:text-(--color-9)"
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
                                className={`BlueprintEditorSidebarSearchInput min-w-0 flex-1 border-0 bg-transparent text-xs text-(--color-9) outline-none placeholder:text-(--color-6) transition-opacity ${effectiveSearchOpen ? 'pointer-events-auto w-auto opacity-100' : 'pointer-events-none w-0 opacity-0'}`}
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
                                className={`BlueprintEditorSidebarSearchClear inline-flex h-6 w-6 items-center justify-center rounded-full border-0 bg-transparent p-0 text-(--color-6) transition-opacity hover:bg-black/4 hover:text-(--color-9) disabled:cursor-default disabled:bg-transparent disabled:opacity-30 ${effectiveSearchOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
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
                        className={`BlueprintEditorCollapse inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--color-6) hover:text-(--color-9) ${isCollapsed ? 'h-7 w-7 border border-black/8 bg-(--color-0) p-0 shadow-[0_10px_22px_rgba(0,0,0,0.14)] dark:border-white/16 dark:shadow-[0_12px_24px_rgba(0,0,0,0.45)]' : ''}`}
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
                <div className="BlueprintEditorComponentList grid gap-4 overflow-auto px-3 pb-3 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
                    {groups.map((group) => {
                        const isGroupCollapsed = collapsedGroups[group.id];
                        const groupTitle = t(
                            `componentLibrary.groups.${group.id}.title`,
                            {
                                defaultValue: group.title,
                            }
                        );
                        return (
                            <div
                                key={group.id}
                                className="ComponentGroup grid gap-2.5"
                            >
                                <button
                                    className="ComponentGroupHeader sticky top-0 z-[2] flex w-full cursor-pointer items-center justify-between border-0 bg-white/52 py-1 backdrop-blur-[6px] in-data-[theme='dark']:bg-[rgba(12,12,12,0.72)]"
                                    onClick={() => onToggleGroup(group.id)}
                                >
                                    <span className="ComponentGroupTitle text-[11px] uppercase tracking-[0.06em] text-(--color-6)">
                                        {groupTitle} ({group.items.length})
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className={`ComponentGroupIcon text-(--color-6) transition-transform ${isGroupCollapsed ? '-rotate-90' : ''}`}
                                    />
                                </button>
                                {!isGroupCollapsed && (
                                    <div className="ComponentGroupItems grid grid-cols-2 gap-3 [grid-auto-flow:dense]">
                                        {group.items.map((item) => {
                                            const variants =
                                                item.variants ?? [];
                                            const hasVariants =
                                                variants.length > 0;
                                            const isExpanded =
                                                expandedPreviews[item.id];
                                            const isWide = isWideComponent(
                                                group,
                                                item
                                            );
                                            const itemName = t(
                                                `componentLibrary.items.${item.id}.name`,
                                                { defaultValue: item.name }
                                            );
                                            const sizeOptions =
                                                item.sizeOptions;
                                            const statusOptions =
                                                item.statusOptions;
                                            const selectedSizeId = sizeOptions
                                                ? (sizeSelections[item.id] ??
                                                  getDefaultSizeId(sizeOptions))
                                                : undefined;
                                            const selectedSizeValue =
                                                sizeOptions?.find(
                                                    (option) =>
                                                        option.id ===
                                                        selectedSizeId
                                                )?.value;
                                            const statusCount =
                                                statusOptions?.length ?? 0;
                                            const statusIndex = statusCount
                                                ? (statusSelections[item.id] ??
                                                      getDefaultStatusIndex(
                                                          statusOptions,
                                                          item.defaultStatus
                                                      )) % statusCount
                                                : 0;
                                            const statusValue =
                                                statusOptions?.[statusIndex]
                                                    ?.value;
                                            const previewNode =
                                                item.renderPreview
                                                    ? item.renderPreview({
                                                          size: selectedSizeValue,
                                                          status: statusValue,
                                                      })
                                                    : item.preview;
                                            const previewScale =
                                                getPreviewScale(
                                                    item.scale,
                                                    isWide
                                                );
                                            const showControls = Boolean(
                                                sizeOptions?.length ||
                                                    statusCount
                                            );
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`ComponentPreview grid gap-1.5 ${isExpanded ? 'Expanded col-[1/-1]' : ''} ${isWide ? 'Wide col-[1/-1]' : ''}`}
                                                >
                                                    <DraggablePreviewCard
                                                        itemId={item.id}
                                                        selectedSize={
                                                            selectedSizeValue
                                                        }
                                                        className={`ComponentPreviewCard relative grid min-h-[94px] cursor-grab select-none gap-1.5 rounded-lg border border-transparent bg-transparent px-1.5 pb-[18px] pt-1.5 transition-[border-color,background,opacity] ${hasVariants ? 'HasVariants hover:border-black/8 hover:bg-(--color-1) dark:hover:border-white/12 dark:hover:bg-white/4' : ''}`}
                                                        role={
                                                            hasVariants
                                                                ? 'button'
                                                                : undefined
                                                        }
                                                        tabIndex={
                                                            hasVariants ? 0 : -1
                                                        }
                                                        ariaExpanded={
                                                            hasVariants
                                                                ? isExpanded
                                                                : undefined
                                                        }
                                                        onClick={() =>
                                                            hasVariants &&
                                                            onTogglePreview(
                                                                item.id
                                                            )
                                                        }
                                                        onKeyDown={(event) =>
                                                            onPreviewKeyDown(
                                                                event,
                                                                item.id,
                                                                hasVariants
                                                            )
                                                        }
                                                        onMouseEnter={() => {
                                                            if (statusCount) {
                                                                onStatusCycleStart(
                                                                    item.id,
                                                                    statusCount
                                                                );
                                                            }
                                                        }}
                                                        onMouseLeave={() => {
                                                            if (statusCount) {
                                                                onStatusCycleStop(
                                                                    item.id
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <PreviewWrapper
                                                            scale={previewScale}
                                                            wide={isWide}
                                                        >
                                                            {previewNode}
                                                        </PreviewWrapper>
                                                        {hasVariants && (
                                                            <button
                                                                type="button"
                                                                className={`ComponentPreviewExpand absolute bottom-0 right-2 z-[2] inline-flex items-center gap-1 rounded-full border border-black/8 bg-black/6 px-1.5 py-[1px] text-[9px] tracking-[0.02em] text-(--color-7) dark:border-white/16 dark:bg-white/8 ${isExpanded ? 'Open' : ''}`}
                                                                onClick={(
                                                                    event
                                                                ) => {
                                                                    event.stopPropagation();
                                                                    onTogglePreview(
                                                                        item.id
                                                                    );
                                                                }}
                                                                onPointerDown={(
                                                                    event
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                                aria-label={
                                                                    isExpanded
                                                                        ? t(
                                                                              'sidebar.collapseVariants'
                                                                          )
                                                                        : t(
                                                                              'sidebar.expandVariants'
                                                                          )
                                                                }
                                                            >
                                                                <span>
                                                                    {
                                                                        variants.length
                                                                    }
                                                                </span>
                                                                <ChevronDown
                                                                    size={10}
                                                                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                />
                                                            </button>
                                                        )}
                                                        <span className="ComponentPreviewLabel text-center text-[10px] text-(--color-7)">
                                                            {itemName}
                                                        </span>
                                                        {showControls && (
                                                            <div className="ComponentPreviewMeta flex items-center justify-between gap-1.5">
                                                                {sizeOptions && (
                                                                    <div className="ComponentPreviewSizes inline-flex gap-1">
                                                                        {sizeOptions.map(
                                                                            (
                                                                                option
                                                                            ) => (
                                                                                <button
                                                                                    key={
                                                                                        option.id
                                                                                    }
                                                                                    type="button"
                                                                                    className={`ComponentPreviewSize cursor-pointer rounded border border-black/8 bg-transparent px-1 text-[9px] leading-[14px] text-(--color-7) dark:border-white/18 ${selectedSizeId === option.id ? 'Active border-black/18 bg-(--color-1) text-(--color-9) dark:border-white/30 dark:bg-white/8' : ''}`}
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.stopPropagation();
                                                                                        onSizeSelect(
                                                                                            item.id,
                                                                                            option.id
                                                                                        );
                                                                                    }}
                                                                                    onPointerDown={(
                                                                                        event
                                                                                    ) =>
                                                                                        event.stopPropagation()
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        option.label
                                                                                    }
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {statusCount >
                                                                    0 && (
                                                                    <div className="ComponentPreviewStatus ml-auto inline-flex gap-1">
                                                                        {statusOptions?.map(
                                                                            (
                                                                                option,
                                                                                index
                                                                            ) => (
                                                                                <button
                                                                                    key={
                                                                                        option.id
                                                                                    }
                                                                                    type="button"
                                                                                    className={`ComponentPreviewStatusDot h-1.5 w-1.5 cursor-pointer rounded-full border border-black/20 bg-transparent p-0 dark:border-white/30 ${index === statusIndex ? 'Active border-black/60 bg-black/60 dark:border-white/65 dark:bg-white/65' : ''}`}
                                                                                    title={
                                                                                        option.label
                                                                                    }
                                                                                    aria-label={
                                                                                        option.label
                                                                                    }
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.stopPropagation();
                                                                                        onStatusCycleStop(
                                                                                            item.id
                                                                                        );
                                                                                        onStatusSelect(
                                                                                            item.id,
                                                                                            index
                                                                                        );
                                                                                    }}
                                                                                    onPointerDown={(
                                                                                        event
                                                                                    ) =>
                                                                                        event.stopPropagation()
                                                                                    }
                                                                                />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </DraggablePreviewCard>
                                                    {hasVariants &&
                                                        isExpanded && (
                                                            <div
                                                                className={`ComponentPreviewVariants grid gap-2 rounded-lg border border-black/6 bg-(--color-1) p-2 [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] dark:border-white/12 dark:bg-white/4 ${isWide ? 'Wide [grid-template-columns:1fr]' : ''}`}
                                                            >
                                                                {variants.map(
                                                                    (
                                                                        variant
                                                                    ) => {
                                                                        const variantScale =
                                                                            getPreviewScale(
                                                                                variant.scale ??
                                                                                    item.scale ??
                                                                                    COMPACT_PREVIEW_SCALE,
                                                                                isWide
                                                                            );
                                                                        const variantNode =
                                                                            variant.renderElement
                                                                                ? variant.renderElement(
                                                                                      {
                                                                                          size: selectedSizeValue,
                                                                                      }
                                                                                  )
                                                                                : variant.element;
                                                                        return (
                                                                            <DraggableVariantCard
                                                                                key={`${item.id}-${variant.id}`}
                                                                                itemId={
                                                                                    item.id
                                                                                }
                                                                                variantId={
                                                                                    variant.id
                                                                                }
                                                                                variantProps={
                                                                                    variant.props
                                                                                }
                                                                                selectedSize={
                                                                                    selectedSizeValue
                                                                                }
                                                                                className={`ComponentVariantCard grid gap-1 text-center ${isWide ? 'Wide col-[1/-1]' : ''}`}
                                                                            >
                                                                                <PreviewWrapper
                                                                                    scale={
                                                                                        variantScale
                                                                                    }
                                                                                    wide={
                                                                                        isWide
                                                                                    }
                                                                                    className="Small h-12"
                                                                                >
                                                                                    {
                                                                                        variantNode
                                                                                    }
                                                                                </PreviewWrapper>
                                                                                <span className="ComponentVariantLabel text-[9px] text-(--color-6)">
                                                                                    {
                                                                                        variant.label
                                                                                    }
                                                                                </span>
                                                                            </DraggableVariantCard>
                                                                        );
                                                                    }
                                                                )}
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
