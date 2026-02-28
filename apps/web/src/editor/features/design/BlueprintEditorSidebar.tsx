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
  RotateCw,
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
import type {
  ExternalLibraryDiagnostic,
  ExternalLibraryRuntimeState,
} from './blueprint/external';

type BlueprintEditorSidebarProps = {
  isCollapsed: boolean;
  isTreeCollapsed?: boolean;
  collapsedGroups: Record<string, boolean>;
  expandedPreviews: Record<string, boolean>;
  sizeSelections: Record<string, string>;
  statusSelections: Record<string, number>;
  externalDiagnostics: ExternalLibraryDiagnostic[];
  externalLibraryStates?: ExternalLibraryRuntimeState[];
  externalLibraryOptions?: Array<{ id: string; label: string }>;
  isExternalLibraryLoading: boolean;
  onReloadExternalLibraries?: () => Promise<void> | void;
  onRetryExternalLibrary?: (libraryId: string) => Promise<void> | void;
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

type LibraryTab =
  | {
      id: string;
      label: string;
      source: 'builtIn' | 'headless';
      libraryId?: undefined;
    }
  | {
      id: string;
      label: string;
      source: 'external';
      libraryId: string;
    };

const PreviewWrapper = ({
  scale = DEFAULT_PREVIEW_SCALE,
  className = '',
  wide = false,
  children,
}: PreviewWrapperProps) => (
  <div
    className={`ComponentPreviewSurface relative flex h-[60px] min-w-20 items-center justify-center overflow-hidden rounded-md border border-black/6 bg-black/[0.02] dark:border-white/12 dark:bg-white/4 [&_.MdrModalOverlay]:absolute [&_.MdrModalOverlay]:inset-1 [&_.MdrModalOverlay]:z-0 [&_.MdrModalOverlay]:rounded-md [&_.MdrDrawerOverlay]:absolute [&_.MdrDrawerOverlay]:inset-1 [&_.MdrDrawerOverlay]:z-0 [&_.MdrDrawerOverlay]:rounded-md [&_.MdrModal]:max-w-full [&_.MdrModal]:w-[140px] [&_.MdrDrawer]:max-h-full [&_.MdrDrawer]:max-w-full [&_.ant-modal-root]:relative [&_.ant-modal-root]:inset-auto [&_.ant-modal-root]:z-[1] [&_.ant-modal-wrap]:relative [&_.ant-modal-wrap]:inset-auto [&_.ant-modal-wrap]:overflow-hidden [&_.ant-modal]:my-1 [&_.ant-modal]:max-w-[150px] [&_.MuiDialog-root]:absolute [&_.MuiDialog-root]:inset-0 [&_.MuiPaper-root]:m-0 [&_.MuiPaper-root]:max-h-full [&_.MuiPaper-root]:max-w-[150px] ${wide ? 'Wide w-full' : ''} ${className}`.trim()}
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
  externalDiagnostics = [],
  externalLibraryStates = [],
  externalLibraryOptions = [],
  isExternalLibraryLoading,
  onReloadExternalLibraries,
  onRetryExternalLibrary,
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
  const [activeLibraryId, setActiveLibraryId] = useState('builtIn');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const libraryTabs = useMemo<LibraryTab[]>(
    () => [
      {
        id: 'builtIn',
        label: t('sidebar.libraries.builtIn'),
        source: 'builtIn' as const,
      },
      {
        id: 'headless',
        label: t('sidebar.libraries.headless'),
        source: 'headless' as const,
      },
      ...externalLibraryOptions.map((item) => ({
        id: `external:${item.id}`,
        label: item.label,
        source: 'external' as const,
        libraryId: item.id,
      })),
    ],
    [externalLibraryOptions, t]
  );
  const activeLibraryTab =
    libraryTabs.find((tab) => tab.id === activeLibraryId) ?? libraryTabs[0];

  useEffect(() => {
    if (libraryTabs.some((tab) => tab.id === activeLibraryId)) return;
    setActiveLibraryId(libraryTabs[0]?.id ?? 'builtIn');
  }, [activeLibraryId, libraryTabs]);

  const normalizedQuery = query.trim().toLowerCase();
  const effectiveSearchOpen = isSearchOpen || Boolean(normalizedQuery);
  const groups = useMemo(() => {
    const rawGroups = getComponentGroups();
    const scopedGroups = rawGroups.filter((group) => {
      const groupSource = group.source ?? 'builtIn';
      if (activeLibraryTab?.source === 'external') {
        if (groupSource !== 'external') return false;
        if (!activeLibraryTab.libraryId) return true;
        return group.items.some(
          (item) => item.libraryId === activeLibraryTab.libraryId
        );
      }
      return groupSource === activeLibraryTab?.source;
    });

    if (!normalizedQuery) return scopedGroups;

    return scopedGroups
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
              if (
                activeLibraryTab?.source === 'external' &&
                activeLibraryTab.libraryId &&
                item.libraryId !== activeLibraryTab.libraryId
              ) {
                return false;
              }
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
  }, [activeLibraryTab, normalizedQuery, t]);
  const hasExternalItems = useMemo(
    () =>
      groups.some(
        (group) =>
          (group.source ?? 'builtIn') === 'external' && group.items.length > 0
      ),
    [groups]
  );
  const failedExternalLibraries = useMemo(
    () =>
      externalLibraryStates.filter((state) => {
        if (
          activeLibraryTab?.source === 'external' &&
          activeLibraryTab.libraryId &&
          state.libraryId !== activeLibraryTab.libraryId
        ) {
          return false;
        }
        return state.status === 'error';
      }),
    [activeLibraryTab, externalLibraryStates]
  );
  const scopedExternalDiagnostics = useMemo(() => {
    if (activeLibraryTab?.source !== 'external') return [];
    if (!activeLibraryTab.libraryId) return externalDiagnostics;
    return externalDiagnostics.filter(
      (item) => !item.libraryId || item.libraryId === activeLibraryTab.libraryId
    );
  }, [activeLibraryTab, externalDiagnostics]);
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
      className={`BlueprintEditorSidebar absolute flex min-h-0 w-[var(--sidebar-width)] flex-col rounded-[14px] border border-black/6 bg-(--color-0) shadow-[0_12px_26px_rgba(0,0,0,0.08)] dark:border-transparent ${isCollapsed ? 'Collapsed left-0 top-3 z-[7] h-0 w-0 overflow-visible border-none bg-transparent p-0 shadow-none' : `left-0 top-0 z-[4] ${!isTreeCollapsed ? '[bottom:var(--component-tree-height)] rounded-b-none border-b-0' : 'bottom-0'}`}`}
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
            className={`BlueprintEditorCollapse inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--color-6) hover:text-(--color-9) ${isCollapsed ? 'absolute left-0 top-0 h-8 w-6 rounded-l-none rounded-r-full border border-l-0 border-black/8 bg-(--color-0) p-0 pr-0.5 shadow-[0_10px_22px_rgba(0,0,0,0.14)] dark:border-white/16 dark:shadow-[0_12px_24px_rgba(0,0,0,0.45)]' : ''}`}
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
        <div className="BlueprintEditorSidebarLibraryBar px-3 py-2">
          <div className="flex w-full flex-wrap items-center gap-1 text-[11px] text-(--color-7)">
            {libraryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`h-6 cursor-pointer rounded-full px-2 transition-colors ${
                  activeLibraryId === tab.id
                    ? 'border border-black/16 text-(--color-9) dark:border-white/20'
                    : 'border border-transparent bg-transparent hover:text-(--color-9)'
                }`}
                onClick={() => setActiveLibraryId(tab.id)}
                aria-label={tab.label}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {!isCollapsed &&
        activeLibraryTab?.source === 'external' &&
        scopedExternalDiagnostics.length > 0 && (
          <div className="px-3 pb-2">
            <div className="grid max-h-24 gap-1 overflow-auto rounded-md border border-black/8 bg-black/[0.02] p-1.5 text-[10px] dark:border-white/14 dark:bg-white/4">
              {scopedExternalDiagnostics.map((item, index) => (
                <div
                  key={`${item.code}-${item.libraryId ?? 'global'}-${index}`}
                  className="rounded px-1.5 py-1 text-(--color-7)"
                  title={item.hint}
                >
                  <span className="mr-1 font-semibold text-(--color-8)">
                    [{item.code}]
                  </span>
                  <span>{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      {!isCollapsed &&
        activeLibraryTab?.source === 'external' &&
        failedExternalLibraries.length > 0 && (
          <div className="px-3 pb-2">
            <div className="rounded-md border border-black/8 bg-black/[0.02] px-2 py-1.5 text-[10px] text-(--color-7) dark:border-white/14 dark:bg-white/4">
              <div className="mt-1.5 grid gap-1">
                {failedExternalLibraries.map((state) => (
                  <div
                    key={state.libraryId}
                    className="flex items-center justify-between gap-2 rounded border border-black/6 bg-white/50 px-1.5 py-1 dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="truncate text-(--color-8)">
                      {state.libraryId}
                    </span>
                    <button
                      type="button"
                      className="cursor-pointer rounded border border-black/10 px-1.5 py-0.5 text-[10px] text-(--color-8) dark:border-white/16"
                      onClick={() => onRetryExternalLibrary?.(state.libraryId)}
                    >
                      Retry
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      {!isCollapsed &&
        activeLibraryTab?.source === 'external' &&
        isExternalLibraryLoading && (
          <div className="px-3 pb-2">
            <div className="rounded-md border border-black/8 bg-black/[0.02] px-2 py-1.5 text-[10px] text-(--color-7) dark:border-white/14 dark:bg-white/4">
              Loading external components...
            </div>
          </div>
        )}
      {!isCollapsed &&
        activeLibraryTab?.source === 'external' &&
        !isExternalLibraryLoading &&
        !hasExternalItems && (
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-black/8 bg-black/[0.02] px-2 py-1.5 text-[10px] text-(--color-7) dark:border-white/14 dark:bg-white/4">
              <span>No external components available.</span>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded border border-black/10 text-(--color-7) transition-colors hover:border-black/20 hover:text-(--color-9) disabled:cursor-default disabled:opacity-40 dark:border-white/16 dark:hover:border-white/24"
                onClick={() => {
                  void onReloadExternalLibraries?.();
                }}
                aria-label="Reload external components"
                title="Reload external components"
                disabled={!onReloadExternalLibraries}
              >
                <RotateCw size={10} />
              </button>
            </div>
          </div>
        )}
      {!isCollapsed && (
        <div className="BlueprintEditorComponentList grid gap-4 overflow-auto px-3 pb-3 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
          {groups.map((group, groupIndex) => {
            const isGroupCollapsed =
              collapsedGroups[group.id] ?? groupIndex > 0;
            const groupTitle = t(`componentLibrary.groups.${group.id}.title`, {
              defaultValue: group.title,
            });
            return (
              <div key={group.id} className="ComponentGroup grid gap-2.5">
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
                          className={`ComponentPreview grid gap-1.5 ${isExpanded ? 'Expanded col-[1/-1]' : ''} ${isWide ? 'Wide col-[1/-1]' : ''}`}
                        >
                          <DraggablePreviewCard
                            itemId={item.id}
                            selectedSize={selectedSizeValue}
                            className={`ComponentPreviewCard relative grid min-h-[94px] cursor-grab select-none gap-1.5 rounded-lg border border-transparent bg-transparent px-1.5 pb-[18px] pt-1.5 transition-[border-color,background,opacity] ${hasVariants ? 'HasVariants hover:border-black/8 hover:bg-(--color-1) dark:hover:border-white/12 dark:hover:bg-white/4' : ''}`}
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
                                className={`ComponentPreviewExpand absolute bottom-0 right-2 z-[2] inline-flex items-center gap-1 rounded-full border border-black/8 bg-black/6 px-1.5 py-[1px] text-[9px] tracking-[0.02em] text-(--color-7) dark:border-white/16 dark:bg-white/8 ${isExpanded ? 'Open' : ''}`}
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
                                    {sizeOptions.map((option) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        className={`ComponentPreviewSize cursor-pointer rounded border border-black/8 bg-transparent px-1 text-[9px] leading-[14px] text-(--color-7) dark:border-white/18 ${selectedSizeId === option.id ? 'Active border-black/18 bg-(--color-1) text-(--color-9) dark:border-white/30 dark:bg-white/8' : ''}`}
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
                                  <div className="ComponentPreviewStatus ml-auto inline-flex gap-1">
                                    {statusOptions?.map((option, index) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        className={`ComponentPreviewStatusDot h-1.5 w-1.5 cursor-pointer rounded-full border border-black/20 bg-transparent p-0 dark:border-white/30 ${index === statusIndex ? 'Active border-black/60 bg-black/60 dark:border-white/65 dark:bg-white/65' : ''}`}
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
                              className={`ComponentPreviewVariants grid gap-2 rounded-lg border border-black/6 bg-(--color-1) p-2 [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] dark:border-white/12 dark:bg-white/4 ${isWide ? 'Wide [grid-template-columns:1fr]' : ''}`}
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
                                    className={`ComponentVariantCard grid gap-1 text-center ${isWide ? 'Wide col-[1/-1]' : ''}`}
                                  >
                                    <PreviewWrapper
                                      scale={variantScale}
                                      wide={isWide}
                                      className="Small h-12"
                                    >
                                      {variantNode}
                                    </PreviewWrapper>
                                    <span className="ComponentVariantLabel text-[9px] text-(--color-6)">
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
