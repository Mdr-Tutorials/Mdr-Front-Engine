import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { MdrInput } from '@mdr/ui';
import type { ComponentNode } from '@/core/types/engine.types';
import {
  BUILT_IN_ACTION_OPTIONS,
  DOM_EVENT_TRIGGERS,
  createDefaultActionParams,
  getNavigateLinkKind,
  normalizeBuiltInAction,
  type BuiltInActionName,
} from '@/mir/actions/registry';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { INSPECTOR_PANELS } from './inspector/panels/registry';
import { InspectorRow } from './inspector/components/InspectorRow';
import {
  getPrimaryTextField,
  updateNodeTextField,
  type TextFieldKey,
} from './blueprintText';

type BlueprintEditorInspectorProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

const findNodeById = (
  node: ComponentNode,
  nodeId: string
): ComponentNode | null => {
  if (node.id === nodeId) return node;
  const children = node.children ?? [];
  for (const child of children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
};

const collectIds = (
  node: ComponentNode,
  ids: Set<string> = new Set()
): Set<string> => {
  ids.add(node.id);
  node.children?.forEach((child) => collectIds(child, ids));
  return ids;
};

const renameNodeId = (
  node: ComponentNode,
  fromId: string,
  toId: string
): ComponentNode => {
  if (node.id === fromId) {
    return { ...node, id: toId };
  }
  if (!node.children?.length) return node;
  const nextChildren = node.children.map((child) =>
    renameNodeId(child, fromId, toId)
  );
  return { ...node, children: nextChildren };
};

const updateNodeById = (
  node: ComponentNode,
  targetId: string,
  updater: (node: ComponentNode) => ComponentNode
): { node: ComponentNode; updated: boolean } => {
  if (node.id === targetId) {
    return { node: updater(node), updated: true };
  }
  if (!node.children?.length) return { node, updated: false };
  let updated = false;
  const nextChildren = node.children.map((child) => {
    const result = updateNodeById(child, targetId, updater);
    if (result.updated) updated = true;
    return result.node;
  });
  return updated
    ? { node: { ...node, children: nextChildren }, updated: true }
    : { node, updated: false };
};

const getTextFieldLabel = (
  key: TextFieldKey,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  switch (key) {
    case 'title':
      return t('inspector.panels.text.fields.title', { defaultValue: 'Title' });
    case 'label':
      return t('inspector.panels.text.fields.label', { defaultValue: 'Label' });
    case 'description':
      return t('inspector.panels.text.fields.description', {
        defaultValue: 'Description',
      });
    case 'text':
    default:
      return t('inspector.panels.text.fields.text', { defaultValue: 'Text' });
  }
};

export function BlueprintEditorInspector({
  isCollapsed,
  onToggleCollapse,
}: BlueprintEditorInspectorProps) {
  const { t } = useTranslation('blueprint');
  const { projectId } = useParams();
  const blueprintKey = projectId ?? 'global';
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const updateMirDoc = useEditorStore((state) => state.updateMirDoc);
  const setBlueprintState = useEditorStore((state) => state.setBlueprintState);
  const selectedId = useEditorStore(
    (state) => state.blueprintStateByProject[blueprintKey]?.selectedId
  );
  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(mirDoc.ui.root, selectedId) : null),
    [mirDoc.ui.root, selectedId]
  );
  const matchedPanels = useMemo(
    () =>
      selectedNode
        ? INSPECTOR_PANELS.filter((panel) => panel.match(selectedNode))
        : [],
    [selectedNode]
  );
  const primaryTextField = useMemo(
    () => (selectedNode ? getPrimaryTextField(selectedNode) : null),
    [selectedNode]
  );
  const [draftId, setDraftId] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    style: true,
    triggers: true,
  });
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>(
    {}
  );
  const allIds = useMemo(() => collectIds(mirDoc.ui.root), [mirDoc.ui.root]);

  useEffect(() => {
    setDraftId(selectedNode?.id ?? '');
  }, [selectedNode?.id]);

  useEffect(() => {
    if (!matchedPanels.length) return;
    setExpandedPanels((current) => {
      let changed = false;
      const next = { ...current };
      matchedPanels.forEach((panel) => {
        if (next[panel.key] === undefined) {
          next[panel.key] = true;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [matchedPanels]);

  const trimmedDraftId = draftId.trim();
  const isDuplicate =
    Boolean(trimmedDraftId) &&
    Boolean(selectedNode?.id) &&
    trimmedDraftId !== selectedNode?.id &&
    allIds.has(trimmedDraftId);
  const isDirty =
    Boolean(selectedNode?.id) && trimmedDraftId !== selectedNode?.id;
  const canApply =
    Boolean(selectedNode?.id) &&
    Boolean(trimmedDraftId) &&
    isDirty &&
    !isDuplicate;

  const updateSelectedNode = (
    updater: (node: ComponentNode) => ComponentNode
  ) => {
    if (!selectedNode?.id) return;
    updateMirDoc((doc) => {
      const result = updateNodeById(doc.ui.root, selectedNode.id, updater);
      return result.updated
        ? { ...doc, ui: { ...doc.ui, root: result.node } }
        : doc;
    });
  };

  const applyRename = () => {
    if (!selectedNode?.id || !canApply) return;
    const nextId = trimmedDraftId;
    updateMirDoc((doc) => ({
      ...doc,
      ui: {
        ...doc.ui,
        root: renameNodeId(doc.ui.root, selectedNode.id, nextId),
      },
    }));
    setBlueprintState(blueprintKey, { selectedId: nextId });
  };

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const togglePanel = (key: string) => {
    setExpandedPanels((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }));
  };

  const triggerEntries = useMemo(
    () =>
      Object.entries(selectedNode?.events ?? {}).map(([key, config]) => ({
        key,
        trigger: config.trigger ?? 'onClick',
        action: config.action ?? 'navigate',
        params:
          typeof config.params === 'object' && config.params
            ? config.params
            : {},
      })),
    [selectedNode?.events]
  );

  const addTrigger = () => {
    updateSelectedNode((current) => {
      const events = { ...(current.events ?? {}) };
      let index = 1;
      let nextKey = `trigger-${index}`;
      while (events[nextKey]) {
        index += 1;
        nextKey = `trigger-${index}`;
      }
      events[nextKey] = {
        trigger: 'onClick',
        action: 'navigate',
        params: createDefaultActionParams('navigate'),
      };
      return { ...current, events };
    });
  };

  const graphOptions = useMemo(() => {
    const graphs = Array.isArray(mirDoc.logic?.graphs) ? mirDoc.logic?.graphs : [];
    return graphs
      .map((graph, index) => {
        if (typeof graph === 'string') {
          return { id: graph, label: graph };
        }
        if (typeof graph === 'object' && graph !== null) {
          const id = String((graph as Record<string, unknown>).id ?? `graph-${index + 1}`);
          const label = String((graph as Record<string, unknown>).name ?? id);
          return { id, label };
        }
        return null;
      })
      .filter((graph): graph is { id: string; label: string } => Boolean(graph));
  }, [mirDoc.logic?.graphs]);

  const updateTrigger = (
    triggerKey: string,
    updater: (event: { trigger: string; action?: string; params?: Record<string, unknown> }) => {
      trigger: string;
      action?: string;
      params?: Record<string, unknown>;
    }
  ) => {
    updateSelectedNode((current) => {
      const currentEvent = current.events?.[triggerKey];
      if (!currentEvent) return current;
      const nextEvent = updater(currentEvent);
      return {
        ...current,
        events: {
          ...(current.events ?? {}),
          [triggerKey]: nextEvent,
        },
      };
    });
  };

  const removeTrigger = (triggerKey: string) => {
    updateSelectedNode((current) => {
      if (!current.events?.[triggerKey]) return current;
      const nextEvents = { ...(current.events ?? {}) };
      delete nextEvents[triggerKey];
      return {
        ...current,
        events: Object.keys(nextEvents).length ? nextEvents : undefined,
      };
    });
  };

  return (
    <aside
      className={`BlueprintEditorInspector absolute bottom-0 right-0 top-0 z-3 flex w-(--inspector-width) min-h-0 flex-col rounded-[14px] border border-black/6 bg-(--color-0) shadow-[0_12px_26px_rgba(0,0,0,0.08)] dark:border-transparent ${isCollapsed ? 'Collapsed bottom-auto h-9 items-center justify-center border-none bg-transparent p-0 shadow-none' : ''}`}
    >
      <div
        className={`InspectorHeader flex items-center justify-between border-b border-black/6 px-3 py-2.5 text-[13px] font-semibold text-(--color-9) dark:border-white/8 ${isCollapsed ? 'w-full justify-center border-b-0 p-0' : ''}`}
      >
        <span className={isCollapsed ? 'hidden' : ''}>{t('inspector.title')}</span>
        <button
          type="button"
          className={`BlueprintEditorCollapse inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--color-6) hover:text-(--color-9) ${isCollapsed ? 'h-7 w-7 border border-black/8 bg-(--color-0) p-0 shadow-[0_10px_22px_rgba(0,0,0,0.14)] dark:border-white/16 dark:shadow-[0_12px_24px_rgba(0,0,0,0.45)]' : ''}`}
          onClick={onToggleCollapse}
          aria-label={t('inspector.toggle')}
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {!isCollapsed && (
        <>
          {selectedNode ? (
            <div className="InspectorSection flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
              <section className="pt-1">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 py-1 text-left"
                  onClick={() => toggleSection('basic')}
                >
                  <span className="text-[13px] font-semibold tracking-[0.01em] text-(--color-9)">
                    {t('inspector.groups.basic', {
                      defaultValue: 'Basic Info',
                    })}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`${expandedSections.basic ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
                  />
                </button>
                {expandedSections.basic && (
                  <div className="flex flex-col gap-2 pb-1 pt-1">
                    <div className="InspectorField flex flex-col gap-1.5">
                      <InspectorRow
                        label={t('inspector.fields.id.label', {
                          defaultValue: 'Component ID',
                        })}
                        control={
                          <div className="InspectorInputRow group flex w-full items-center gap-1">
                            <MdrInput
                              size="Small"
                              value={draftId}
                              dataAttributes={{ 'data-testid': 'inspector-id-input' }}
                              onChange={(value) => setDraftId(value)}
                              onBlur={applyRename}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  applyRename();
                                }
                                if (event.key === 'Escape') {
                                  event.preventDefault();
                                  setDraftId(selectedNode.id);
                                }
                              }}
                            />
                            {isDirty && (
                              <div className="InspectorFieldActions inline-flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                                <button
                                  type="button"
                                  className="InspectorFieldAction inline-flex items-center justify-center rounded-full border-0 bg-transparent px-1 py-0.5 text-(--color-6) hover:text-(--color-9) disabled:cursor-not-allowed disabled:opacity-45"
                                  onClick={applyRename}
                                  disabled={!canApply}
                                  aria-label={t('inspector.actions.apply', {
                                    defaultValue: 'Apply',
                                  })}
                                  title={t('inspector.actions.apply', {
                                    defaultValue: 'Apply',
                                  })}
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        }
                      />
                      {isDuplicate && (
                        <div
                          className="InspectorWarning inline-flex items-center gap-1 text-[10px] text-[rgba(220,74,74,0.9)]"
                          role="alert"
                        >
                          <AlertTriangle size={12} />
                          <span>
                            {t('inspector.fields.id.duplicate', {
                              defaultValue: 'ID already exists.',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    {primaryTextField ? (
                      <div className="InspectorField flex flex-col gap-1.5">
                        <InspectorRow
                          label={getTextFieldLabel(primaryTextField.key, t)}
                          control={
                            <MdrInput
                              size="Small"
                              value={primaryTextField.value}
                              onChange={(value) => {
                                updateSelectedNode((current) =>
                                  updateNodeTextField(
                                    current,
                                    primaryTextField,
                                    value
                                  )
                                );
                              }}
                            />
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </section>

              <section className="pt-1">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 py-1 text-left"
                  onClick={() => toggleSection('style')}
                >
                  <span className="text-[13px] font-semibold tracking-[0.01em] text-(--color-9)">
                    {t('inspector.groups.style.title', {
                      defaultValue: 'Style',
                    })}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`${expandedSections.style ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
                  />
                </button>
                {expandedSections.style && (
                  <div className="flex flex-col gap-2 pb-1 pt-1">
                    {matchedPanels.length ? (
                      matchedPanels.map((panel) => {
                        const isExpanded = expandedPanels[panel.key] ?? true;
                        const panelTitle = t(
                          `inspector.panels.${panel.key}.title`,
                          {
                            defaultValue: panel.title,
                          }
                        );
                        return (
                          <div key={panel.key} className="pt-1">
                            <button
                              type="button"
                              className="flex min-h-5.5 w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
                              onClick={() => togglePanel(panel.key)}
                            >
                              <span className="InspectorLabel text-[11px] font-semibold text-(--color-8)">
                                {panelTitle}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`${isExpanded ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
                              />
                            </button>
                            {isExpanded ? (
                              <div className="mt-1">
                                {panel.render({
                                  node: selectedNode,
                                  updateNode: updateSelectedNode,
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="InspectorDescription text-[10px] text-(--color-6)">
                        {t('inspector.groups.style.empty', {
                          defaultValue: 'No style settings for this component.',
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="pt-1">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 py-1 text-left"
                  onClick={() => toggleSection('triggers')}
                >
                  <span className="text-[13px] font-semibold tracking-[0.01em] text-(--color-9)">
                    {t('inspector.groups.triggers.title', {
                      defaultValue: 'Triggers',
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9)"
                      data-testid="inspector-add-trigger"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        addTrigger();
                        if (!expandedSections.triggers) {
                          toggleSection('triggers');
                        }
                      }}
                      aria-label={t('inspector.groups.triggers.add', {
                        defaultValue: 'Add trigger',
                      })}
                      title={t('inspector.groups.triggers.add', {
                        defaultValue: 'Add trigger',
                      })}
                    >
                      <Plus size={14} />
                    </button>
                    <ChevronDown
                      size={14}
                      className={`${expandedSections.triggers ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
                    />
                  </span>
                </button>
                {expandedSections.triggers && (
                  <div className="flex flex-col gap-2 pb-1 pt-1">
                    {triggerEntries.length ? (
                      triggerEntries.map((item) => {
                        const toValue =
                          typeof item.params.to === 'string' ? item.params.to : '';
                        const targetValue =
                          item.params.target === '_self' ? '_self' : '_blank';
                        const actionValue = normalizeBuiltInAction(
                          typeof item.action === 'string' ? item.action : undefined
                        );
                        const replaceValue = Boolean(item.params.replace);
                        const isValidLinkValue =
                          !toValue || Boolean(getNavigateLinkKind(toValue));
                        const graphMode =
                          item.params.graphMode === 'existing' ? 'existing' : 'new';
                        const graphName =
                          typeof item.params.graphName === 'string'
                            ? item.params.graphName
                            : '';
                        const selectedGraphId =
                          typeof item.params.graphId === 'string'
                            ? item.params.graphId
                            : graphOptions[0]?.id ?? '';
                        const stateValue =
                          typeof item.params.state === 'string'
                            ? item.params.state
                            : item.params.state === undefined
                              ? ''
                              : JSON.stringify(item.params.state);
                        return (
                          <div
                            key={item.key}
                            className="grid gap-1.5"
                            data-testid={`inspector-trigger-${item.key}`}
                          >
                            <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                              <div className="grid gap-1">
                                <span className="text-[10px] font-semibold text-(--color-7)">
                                  {t('inspector.groups.triggers.eventLabel', {
                                    defaultValue: 'Trigger Event',
                                  })}
                                </span>
                                <select
                                  className="h-7 min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
                                  value={item.trigger}
                                  title={t('inspector.groups.triggers.eventHelp', {
                                    defaultValue:
                                      'Choose which DOM event will trigger this action.',
                                  })}
                                  onChange={(event) => {
                                    updateTrigger(item.key, (currentEvent) => ({
                                      ...currentEvent,
                                      trigger: event.target.value,
                                    }));
                                  }}
                                >
                                  {DOM_EVENT_TRIGGERS.map((trigger) => (
                                    <option key={trigger} value={trigger}>
                                      {trigger}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid gap-1">
                                <span className="text-[10px] font-semibold text-(--color-7)">
                                  {t('inspector.groups.triggers.actionLabel', {
                                    defaultValue: 'Action',
                                  })}
                                </span>
                                <select
                                  className="h-7 min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
                                  value={actionValue}
                                  title={t('inspector.groups.triggers.actionHelp', {
                                    defaultValue:
                                      'Choose what should run when the event is fired.',
                                  })}
                                  onChange={(event) => {
                                    updateTrigger(item.key, (currentEvent) => ({
                                      ...currentEvent,
                                      action: event.target.value,
                                      params: createDefaultActionParams(
                                        normalizeBuiltInAction(
                                          event.target.value as BuiltInActionName
                                        )
                                      ),
                                    }));
                                  }}
                                >
                                  {BUILT_IN_ACTION_OPTIONS.map((actionOption) => (
                                    <option
                                      key={actionOption.value}
                                      value={actionOption.value}
                                    >
                                      {t(
                                        actionOption.labelKey,
                                        { defaultValue: actionOption.label }
                                      )}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                className="mt-[18px] inline-flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-[rgba(220,74,74,0.95)]"
                                data-testid={`inspector-delete-trigger-${item.key}`}
                                onClick={() => removeTrigger(item.key)}
                                aria-label={t('inspector.groups.triggers.delete', {
                                  defaultValue: 'Delete trigger',
                                })}
                                title={t('inspector.groups.triggers.delete', {
                                  defaultValue: 'Delete trigger',
                                })}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            {actionValue === 'navigate' ? (
                              <>
                                <div className="grid gap-1">
                                  <span className="text-[10px] font-semibold text-(--color-7)">
                                    {t('inspector.groups.triggers.toLabel', {
                                      defaultValue: 'Destination',
                                    })}
                                  </span>
                                  <input
                                    className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
                                    value={toValue}
                                    title={t(
                                      'inspector.groups.triggers.toHelp',
                                      {
                                        defaultValue:
                                          'Use https:// for external links, or /path for in-app preview routes.',
                                      }
                                    )}
                                    onChange={(event) => {
                                      const to = event.target.value;
                                      updateTrigger(item.key, (currentEvent) => ({
                                        ...currentEvent,
                                        action: 'navigate',
                                        params: {
                                          ...(currentEvent.params ?? {}),
                                          to,
                                        },
                                      }));
                                    }}
                                    placeholder={t('inspector.groups.triggers.toPlaceholder', {
                                      defaultValue: 'https://example.com',
                                    })}
                                  />
                                  {!isValidLinkValue && (
                                    <span className="text-[10px] text-[rgba(220,74,74,0.9)]">
                                      {t('inspector.groups.triggers.httpsOnly', {
                                        defaultValue:
                                          'Use https:// for external links or /path for internal links.',
                                      })}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <label
                                    className="inline-flex items-center gap-1 text-[11px] text-(--color-7)"
                                    title={t(
                                      'inspector.groups.triggers.replaceHelp',
                                      {
                                        defaultValue:
                                          'When enabled, this navigation replaces the current history entry.',
                                      }
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={replaceValue}
                                      onChange={(event) => {
                                        updateTrigger(item.key, (currentEvent) => ({
                                          ...currentEvent,
                                          action: 'navigate',
                                          params: {
                                            ...(currentEvent.params ?? {}),
                                            replace: event.target.checked,
                                          },
                                        }));
                                      }}
                                    />
                                    {t('inspector.groups.triggers.replace', {
                                      defaultValue: 'Replace',
                                    })}
                                  </label>
                                  <select
                                    className="h-7 min-w-0 w-24 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
                                    value={targetValue}
                                    title={t('inspector.groups.triggers.targetHelp', {
                                      defaultValue:
                                        'Browser tab target used by navigation actions.',
                                    })}
                                    onChange={(event) => {
                                      updateTrigger(item.key, (currentEvent) => ({
                                        ...currentEvent,
                                        action: 'navigate',
                                        params: {
                                          ...(currentEvent.params ?? {}),
                                          target: event.target.value,
                                        },
                                      }));
                                    }}
                                  >
                                    <option value="_self">
                                      {t('inspector.groups.triggers.targets.self', {
                                        defaultValue: '_self',
                                      })}
                                    </option>
                                    <option value="_blank">
                                      {t('inspector.groups.triggers.targets.blank', {
                                        defaultValue: '_blank',
                                      })}
                                    </option>
                                  </select>
                                  <input
                                    className="h-7 min-w-0 flex-1 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
                                    value={stateValue}
                                    title={t('inspector.groups.triggers.stateHelp', {
                                      defaultValue:
                                        'Optional navigation state. Plain text or JSON string.',
                                    })}
                                    onChange={(event) => {
                                      updateTrigger(item.key, (currentEvent) => ({
                                        ...currentEvent,
                                        action: 'navigate',
                                        params: {
                                          ...(currentEvent.params ?? {}),
                                          state: event.target.value,
                                        },
                                      }));
                                    }}
                                    placeholder={t(
                                      'inspector.groups.triggers.statePlaceholder',
                                      {
                                        defaultValue: 'state (optional JSON)',
                                      }
                                    )}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="grid gap-1 rounded-md border border-black/8 p-2 dark:border-white/14">
                                <div className="inline-flex gap-1">
                                  <button
                                    type="button"
                                    className={`h-6 rounded-md border px-2 text-[11px] ${graphMode === 'new' ? 'border-black/18 text-(--color-9)' : 'border-transparent text-(--color-6)'}`}
                                    title={t(
                                      'inspector.groups.triggers.graph.newHelp',
                                      {
                                        defaultValue:
                                          'Create and execute a new node graph.',
                                      }
                                    )}
                                    onClick={() => {
                                      updateTrigger(item.key, (currentEvent) => ({
                                        ...currentEvent,
                                        params: {
                                          ...(currentEvent.params ?? {}),
                                          graphMode: 'new',
                                        },
                                      }));
                                    }}
                                  >
                                    {t('inspector.groups.triggers.graph.new', {
                                      defaultValue: 'New Graph',
                                    })}
                                  </button>
                                  <button
                                    type="button"
                                    className={`h-6 rounded-md border px-2 text-[11px] ${graphMode === 'existing' ? 'border-black/18 text-(--color-9)' : 'border-transparent text-(--color-6)'}`}
                                    title={t(
                                      'inspector.groups.triggers.graph.selectHelp',
                                      {
                                        defaultValue:
                                          'Run one of the existing node graphs.',
                                      }
                                    )}
                                    onClick={() => {
                                      updateTrigger(item.key, (currentEvent) => ({
                                        ...currentEvent,
                                        params: {
                                          ...(currentEvent.params ?? {}),
                                          graphMode: 'existing',
                                        },
                                      }));
                                    }}
                                  >
                                    {t('inspector.groups.triggers.graph.select', {
                                      defaultValue: 'Select Graph',
                                    })}
                                  </button>
                                </div>
                                {graphMode === 'new' ? (
                                  <input
                                    className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none placeholder:text-(--color-5) dark:border-white/16"
                                    value={graphName}
                                    title={t(
                                      'inspector.groups.triggers.graph.nameHelp',
                                      {
                                        defaultValue:
                                          'Name for the new node graph to be created.',
                                      }
                                    )}
                                    onChange={(event) => {
                                      updateTrigger(item.key, (currentEvent) => ({
                                        ...currentEvent,
                                        params: {
                                          ...(currentEvent.params ?? {}),
                                          graphName: event.target.value,
                                        },
                                      }));
                                    }}
                                    placeholder={t(
                                      'inspector.groups.triggers.graph.namePlaceholder',
                                      { defaultValue: 'New graph name' }
                                    )}
                                  />
                                ) : (
                                  <select
                                    className="h-7 w-full min-w-0 rounded-md border border-black/10 bg-transparent px-2 text-xs text-(--color-9) outline-none dark:border-white/16"
                                    value={selectedGraphId}
                                    title={t(
                                      'inspector.groups.triggers.graph.selectHelp',
                                      {
                                        defaultValue:
                                          'Run one of the existing node graphs.',
                                      }
                                    )}
                                    onChange={(event) => {
                                      updateTrigger(item.key, (currentEvent) => ({
                                        ...currentEvent,
                                        params: {
                                          ...(currentEvent.params ?? {}),
                                          graphId: event.target.value,
                                        },
                                      }));
                                    }}
                                  >
                                    {graphOptions.length ? (
                                      graphOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.label}
                                        </option>
                                      ))
                                    ) : (
                                      <option value="">
                                        {t('inspector.groups.triggers.graph.empty', {
                                          defaultValue: 'No graph available',
                                        })}
                                      </option>
                                    )}
                                  </select>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="InspectorDescription text-[10px] text-(--color-6)">
                        {t('inspector.groups.triggers.empty', {
                          defaultValue:
                            'No triggers configured yet. Event bindings will appear here.',
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="InspectorPlaceholder px-3 pb-3 pt-2">
              <p className="m-0 text-xs text-(--color-6)">
                {t('inspector.placeholder')}
              </p>
              <div className="InspectorSkeleton mt-3 grid gap-2">
                <span className="h-2 rounded-full bg-(--color-2)" />
                <span className="h-2 w-[80%] rounded-full bg-(--color-2)" />
                <span className="h-2 w-[65%] rounded-full bg-(--color-2)" />
                <span className="h-2 w-[90%] rounded-full bg-(--color-2)" />
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
