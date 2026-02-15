import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import type { ComponentNode } from '@/core/types/engine.types';
import type { IconRef } from '@/mir/renderer/iconRegistry';
import { createDefaultActionParams } from '@/mir/actions/registry';
import { isIconRef, resolveIconRef } from '@/mir/renderer/iconRegistry';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { resolveLinkCapability } from '@/mir/renderer/capabilities';
import { INSPECTOR_PANELS } from './inspector/panels/registry';
import { resolveMountedCssEntries } from './inspector/classProtocol/mountedCss';
import { useMountedCssEditorState } from './inspector/classProtocol/useMountedCssEditorState';
import { getPrimaryTextField } from './blueprintText';
import {
  collectIds,
  findNodeById,
  renameNodeId,
  updateNodeById,
} from './BlueprintEditorInspector.utils';

export const useBlueprintEditorInspectorController = () => {
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
  const [isIconPickerOpen, setIconPickerOpen] = useState(false);
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

  useEffect(() => {
    setIconPickerOpen(false);
  }, [selectedNode?.id]);

  const selectedIconRef = useMemo<IconRef | null>(() => {
    if (!selectedNode) return null;
    const props = selectedNode.props as Record<string, unknown> | undefined;
    const directRef = props?.iconRef;
    if (isIconRef(directRef)) return directRef;
    if (typeof props?.iconName === 'string') {
      return {
        provider:
          typeof props?.iconProvider === 'string'
            ? props.iconProvider
            : 'lucide',
        name: props.iconName,
      };
    }
    return null;
  }, [selectedNode]);
  const selectedIconComponent = useMemo(
    () => (selectedIconRef ? resolveIconRef(selectedIconRef) : null),
    [selectedIconRef]
  );
  const isIconNode =
    selectedNode?.type === 'MdrIcon' || selectedNode?.type === 'MdrIconLink';
  const supportsClassProtocol = selectedNode?.type !== 'container';
  const classNameValue =
    typeof selectedNode?.props?.className === 'string'
      ? selectedNode.props.className
      : '';
  const mountedCssEntries = useMemo(
    () => (selectedNode ? resolveMountedCssEntries(selectedNode) : []),
    [selectedNode]
  );
  const SelectedIconComponent = selectedIconComponent;
  const linkCapability = useMemo(
    () => resolveLinkCapability(selectedNode),
    [selectedNode]
  );
  const linkPropKey = linkCapability?.destinationProp ?? null;
  const linkProps = (selectedNode?.props ?? {}) as Record<string, unknown>;
  const linkDestination =
    linkPropKey && typeof linkProps[linkPropKey] === 'string'
      ? linkProps[linkPropKey]
      : '';
  const targetPropKey = linkCapability?.targetProp ?? 'target';
  const relPropKey = linkCapability?.relProp ?? 'rel';
  const titlePropKey = linkCapability?.titleProp ?? 'title';
  const linkTarget =
    typeof linkProps[targetPropKey] === 'string' &&
    (linkProps[targetPropKey] === '_self' ||
      linkProps[targetPropKey] === '_blank')
      ? (linkProps[targetPropKey] as '_self' | '_blank')
      : '_self';
  const linkRel =
    typeof linkProps[relPropKey] === 'string'
      ? (linkProps[relPropKey] as string)
      : '';
  const linkTitle =
    typeof linkProps[titlePropKey] === 'string'
      ? (linkProps[titlePropKey] as string)
      : '';

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
    setExpandedSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
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
  const hasOnClickTrigger = useMemo(
    () =>
      triggerEntries.some((entry) => {
        const normalized = entry.trigger.trim().toLowerCase();
        return normalized === 'onclick' || normalized === 'click';
      }),
    [triggerEntries]
  );
  const hasLinkTriggerConflict =
    Boolean(linkCapability) &&
    Boolean(linkDestination.trim()) &&
    hasOnClickTrigger &&
    linkCapability.triggerPolicy?.onClickWithDestination === 'warn';

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
    const graphs = Array.isArray(mirDoc.logic?.graphs)
      ? mirDoc.logic?.graphs
      : [];
    return graphs
      .map((graph, index) => {
        if (typeof graph === 'string') return { id: graph, label: graph };
        if (typeof graph === 'object' && graph !== null) {
          const id = String(
            (graph as Record<string, unknown>).id ?? `graph-${index + 1}`
          );
          const label = String((graph as Record<string, unknown>).name ?? id);
          return { id, label };
        }
        return null;
      })
      .filter((graph): graph is { id: string; label: string } =>
        Boolean(graph)
      );
  }, [mirDoc.logic?.graphs]);

  const updateTrigger = (
    triggerKey: string,
    updater: (event: {
      trigger: string;
      action?: string;
      params?: Record<string, unknown>;
    }) => {
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

  const applyIconRef = (iconRef: IconRef) => {
    updateSelectedNode((current) => {
      const nextProps: Record<string, unknown> = {
        ...(current.props ?? {}),
        iconRef,
      };
      delete nextProps.icon;
      delete nextProps.iconName;
      delete nextProps.iconProvider;
      return { ...current, props: nextProps };
    });
  };

  const mountedCssEditor = useMountedCssEditorState({
    selectedNode,
    mountedCssEntries,
    updateSelectedNode,
  });

  const sectionContextValue = useMemo(
    () => ({
      t,
      projectId,
      expandedSections,
      toggleSection,
      draftId,
      setDraftId,
      applyRename,
      selectedNode,
      isDirty,
      canApply,
      isDuplicate,
      primaryTextField,
      updateSelectedNode,
      openMountedCssEditor: mountedCssEditor.openMountedCssEditor,
      mountedCssEntries,
      matchedPanels,
      expandedPanels,
      togglePanel,
      supportsClassProtocol,
      classNameValue,
      isIconNode,
      SelectedIconComponent,
      selectedIconRef,
      setIconPickerOpen,
      linkPropKey,
      linkDestination,
      linkTarget,
      linkRel,
      linkTitle,
      targetPropKey,
      relPropKey,
      titlePropKey,
      addTrigger,
      hasLinkTriggerConflict,
      triggerEntries,
      graphOptions,
      updateTrigger,
      removeTrigger,
    }),
    [
      t,
      projectId,
      expandedSections,
      draftId,
      selectedNode,
      isDirty,
      canApply,
      isDuplicate,
      primaryTextField,
      mountedCssEditor.openMountedCssEditor,
      mountedCssEntries,
      matchedPanels,
      expandedPanels,
      supportsClassProtocol,
      classNameValue,
      isIconNode,
      SelectedIconComponent,
      selectedIconRef,
      linkPropKey,
      linkDestination,
      linkTarget,
      linkRel,
      linkTitle,
      targetPropKey,
      relPropKey,
      titlePropKey,
      hasLinkTriggerConflict,
      triggerEntries,
      graphOptions,
    ]
  );

  return {
    t,
    selectedNode,
    isIconPickerOpen,
    setIconPickerOpen,
    selectedIconRef,
    applyIconRef,
    sectionContextValue,
    mountedCssEditor,
  };
};
