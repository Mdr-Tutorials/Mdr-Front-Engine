import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ComponentNode,
  type MIRDocument,
} from '@/core/types/engine.types';
import {
  createDefaultComponentRegistry,
  type AdapterContext,
  type ComponentRegistry,
} from './registry';
import {
  executeBuiltInAction,
  isBuiltInActionName,
  type BuiltInActionContext,
} from '../actions/registry';
import { deepResolveValueOrRef, readValueByPath } from '@/mir/shared/valueRef';
import { resolveLinkCapability } from './capabilities';
import { renderRichTextValue } from './richText';
import { decodeHtmlEntities } from './textEntities';

const VOID_ELEMENTS = new Set(['input', 'img', 'br', 'hr', 'meta', 'link']);

type RenderState = Record<string, any>;
type RenderParams = Record<string, any>;

type ActionContext = {
  state: RenderState;
  setState: React.Dispatch<React.SetStateAction<RenderState>>;
  params: RenderParams;
  event?: React.SyntheticEvent;
  payload?: unknown;
};

type ActionHandlers = Record<string, (context: ActionContext) => void>;
type UnsafeRecord = Record<string, unknown>;

type RenderContext = {
  state: RenderState;
  params: RenderParams;
  data?: unknown;
  item?: unknown;
  index?: number;
  nodesById: Record<string, ComponentNode>;
  dispatchAction: (actionName?: string, payload?: unknown) => void;
  dispatchBuiltInAction: (
    actionName: string,
    options: {
      params?: Record<string, unknown>;
      nodeId: string;
      trigger: string;
      eventKey: string;
      payload?: unknown;
    }
  ) => boolean;
  onNodeSelect?: (nodeId: string, event: React.SyntheticEvent) => void;
  selectedId?: string;
  requireSelectionForEvents: boolean;
  renderMode: 'strict' | 'tolerant';
  outletContentNode?: ComponentNode | null;
  outletTargetNodeId?: string;
};

const resolvePathLikeString = (value: string, data: unknown): unknown => {
  const candidate = value.trim();
  if (!candidate || data === null || data === undefined) return value;
  const resolved = readValueByPath(data, candidate);
  return resolved === undefined ? value : resolved;
};

const resolveValue = (value: unknown, context: RenderContext): unknown => {
  if (typeof value === 'string') {
    return resolvePathLikeString(value, context.data);
  }
  return deepResolveValueOrRef(value as any, {
    state: context.state,
    params: context.params,
    data: context.data,
    item: context.item,
    index: context.index,
  });
};

const resolveNodeDataScope = (
  context: RenderContext,
  node: ComponentNode
): unknown => {
  const scope = node.data;
  if (!scope) return context.data;
  let nextValue = context.data;
  const hasMock = scope.mock !== undefined;
  if (hasMock) {
    nextValue = deepResolveValueOrRef(scope.mock, {
      state: context.state,
      params: context.params,
      data: context.data,
      item: context.item,
      index: context.index,
    });
  }
  if (scope.source) {
    nextValue = deepResolveValueOrRef(scope.source, {
      state: context.state,
      params: context.params,
      data: context.data,
      item: context.item,
      index: context.index,
    });
  }
  if (typeof scope.pick === 'string' && scope.pick.trim()) {
    nextValue = readValueByPath(nextValue, scope.pick);
  }
  if (!hasMock && scope.value !== undefined) {
    nextValue = deepResolveValueOrRef(scope.value, {
      state: context.state,
      params: context.params,
      data: context.data,
      item: context.item,
      index: context.index,
    });
  }
  if (
    scope.extend &&
    typeof scope.extend === 'object' &&
    !Array.isArray(scope.extend)
  ) {
    const resolvedExtend = deepResolveValueOrRef(scope.extend as any, {
      state: context.state,
      params: context.params,
      data: context.data,
      item: context.item,
      index: context.index,
    });
    if (
      resolvedExtend &&
      typeof resolvedExtend === 'object' &&
      !Array.isArray(resolvedExtend)
    ) {
      const base =
        nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)
          ? (nextValue as Record<string, unknown>)
          : {};
      return {
        ...base,
        ...(resolvedExtend as Record<string, unknown>),
      };
    }
  }
  return nextValue;
};

const resolveListKey = (
  item: unknown,
  index: number,
  keyBy?: string
): string => {
  if (!keyBy?.trim()) return String(index);
  const resolved = readValueByPath(item, keyBy);
  if (resolved === undefined || resolved === null || resolved === '') {
    return String(index);
  }
  return String(resolved);
};

const buildInitialState = (logicState?: Record<string, { initial: any }>) => {
  const result: RenderState = {};
  if (!logicState) return result;
  Object.entries(logicState).forEach(([key, value]) => {
    result[key] = value.initial;
  });
  return result;
};

const pickIncrementTarget = (state: RenderState) => {
  if (typeof state.count === 'number') return 'count';
  const numericKey = Object.keys(state).find(
    (key) => typeof state[key] === 'number'
  );
  return numericKey || null;
};

const toReactEventName = (trigger: string) => {
  const normalized = trigger?.trim();
  if (!normalized) return undefined;
  if (/^on[A-Z]/.test(normalized)) return normalized;
  const lower = normalized.toLowerCase();
  if (lower === 'click') return 'onClick';
  if (lower === 'change') return 'onChange';
  if (lower === 'input') return 'onInput';
  if (lower === 'submit') return 'onSubmit';
  if (lower === 'focus') return 'onFocus';
  if (lower === 'blur') return 'onBlur';
  return `on${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

const mergeHandlers = (first: any, second: any) => {
  if (typeof first === 'function' && typeof second === 'function') {
    return (event: any) => {
      first(event);
      second(event);
    };
  }
  return typeof second === 'function' ? second : first;
};

const isSyntheticEvent = (value: unknown): value is React.SyntheticEvent => {
  return typeof value === 'object' && value !== null && 'nativeEvent' in value;
};

const isClickTrigger = (trigger: string) =>
  toReactEventName(trigger) === 'onClick';

const collectNodeEvents = (
  node: ComponentNode,
  map: Record<string, ComponentNode['events']> = {}
) => {
  if (node.events && Object.keys(node.events).length > 0) {
    map[node.id] = node.events;
  }
  node.children?.forEach((child) => collectNodeEvents(child, map));
  return map;
};

const collectNodesById = (
  node: ComponentNode,
  map: Record<string, ComponentNode> = {}
) => {
  map[node.id] = node;
  node.children?.forEach((child) => collectNodesById(child, map));
  return map;
};

const asRecord = (value: unknown): UnsafeRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnsafeRecord)
    : null;

const readMountedCssContent = (value: unknown): string | null => {
  const record = asRecord(value);
  if (!record) return null;
  return typeof record.content === 'string' && record.content.trim()
    ? record.content
    : null;
};

const collectMountedCssFromNode = (
  node: ComponentNode,
  result: Array<{ key: string; content: string }> = []
) => {
  const anyNode = node as ComponentNode & { metadata?: unknown };
  const props = asRecord(anyNode.props);
  const metadata = asRecord(anyNode.metadata);
  const mountedCandidates = [
    props?.mountedCss,
    props?.styleMount,
    props?.styleMountCss,
    metadata?.mountedCss,
    metadata?.styleMount,
  ];
  mountedCandidates.forEach((candidate, candidateIndex) => {
    if (Array.isArray(candidate)) {
      candidate.forEach((entry, entryIndex) => {
        const content = readMountedCssContent(entry);
        if (!content) return;
        result.push({
          key: `${node.id}-${candidateIndex}-${entryIndex}`,
          content,
        });
      });
      return;
    }
    const content = readMountedCssContent(candidate);
    if (!content) return;
    result.push({
      key: `${node.id}-${candidateIndex}`,
      content,
    });
  });
  node.children?.forEach((child) => collectMountedCssFromNode(child, result));
  return result;
};

const stripInternalProps = (props: Record<string, any>) => {
  const next = { ...props };
  delete next.mountedCss;
  delete next.styleMount;
  delete next.styleMountCss;
  delete next.textMode;
  return next;
};

const isSelectionDebugEnabled = () =>
  typeof window !== 'undefined' &&
  Boolean(
    (window as unknown as { __MDR_DEBUG_SELECTION__?: boolean })
      .__MDR_DEBUG_SELECTION__
  );

const emitSelectionDebug = (detail: Record<string, unknown>) => {
  if (!isSelectionDebugEnabled() || typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('mdr:selection-debug', {
      detail,
    })
  );
  console.debug('[mdr-selection]', detail);
};

interface MIRRendererProps {
  node: ComponentNode;
  mirDoc: MIRDocument;
  overrides?: Record<string, any>;
  runtimeState?: Record<string, unknown>;
  actions?: ActionHandlers;
  selectedId?: string;
  onNodeSelect?: (nodeId: string, event: React.SyntheticEvent) => void;
  registry?: ComponentRegistry;
  renderMode?: 'strict' | 'tolerant';
  allowExternalProps?: boolean;
  builtInActions?: Record<
    string,
    (options: {
      params?: Record<string, unknown>;
      nodeId: string;
      trigger: string;
      eventKey: string;
      payload?: unknown;
    }) => void
  >;
  requireSelectionForEvents?: boolean;
  outletContentNode?: ComponentNode | null;
  outletTargetNodeId?: string;
}

const MIRNode: React.FC<{
  node: ComponentNode;
  context: RenderContext;
  registry: ComponentRegistry;
}> = ({ node, context, registry }) => {
  const resolvedNodeData = useMemo(
    () => resolveNodeDataScope(context, node),
    [
      context.data,
      context.index,
      context.item,
      context.params,
      context.state,
      node,
    ]
  );
  const scopedContext = useMemo(
    () => ({
      ...context,
      data: resolvedNodeData,
    }),
    [context, resolvedNodeData]
  );
  const resolvedProps = useMemo(() => {
    const p: Record<string, any> = {};
    if (node.props) {
      Object.entries(node.props).forEach(([key, val]) => {
        p[key] = resolveValue(val, scopedContext);
      });
    }
    if (
      node.type === 'MdrRoute' &&
      p.currentPath === undefined &&
      typeof scopedContext.params.currentPath === 'string'
    ) {
      p.currentPath = scopedContext.params.currentPath;
    }
    return p;
  }, [node.props, node.type, scopedContext]);

  const resolvedStyle = useMemo(() => {
    const s: Record<string, any> = {};
    if (node.style) {
      Object.entries(node.style).forEach(([key, val]) => {
        s[key] = resolveValue(val, scopedContext);
      });
    }
    return s;
  }, [node.style, scopedContext]);

  const resolvedText = useMemo(
    () => decodeHtmlEntities(resolveValue(node.text, scopedContext)),
    [node.text, scopedContext]
  );
  const resolvedTextMode = useMemo(() => {
    const raw = resolvedProps?.textMode;
    if (typeof raw !== 'object' || raw === null) return 'plain';
    const mode = (raw as Record<string, unknown>).text;
    return mode === 'rich' ? 'rich' : 'plain';
  }, [resolvedProps]);
  const renderedText = useMemo(() => {
    if (resolvedTextMode !== 'rich' || typeof resolvedText !== 'string') {
      return resolvedText;
    }
    return renderRichTextValue(resolvedText);
  }, [resolvedText, resolvedTextMode]);

  const resolvedComponent = useMemo(
    () => registry.resolve(node.type),
    [registry, node.type]
  );

  const adapterResult = useMemo(() => {
    const adapterContext: AdapterContext = {
      node,
      resolvedProps,
      resolvedStyle,
      resolvedText: renderedText,
    };
    return (
      resolvedComponent.adapter.mapProps?.(adapterContext) ?? {
        props: resolvedProps,
      }
    );
  }, [node, resolvedComponent, resolvedProps, resolvedStyle, renderedText]);

  const eventProps = useMemo(() => {
    const handlers: Record<string, any> = {};
    if (!node.events) return handlers;
    Object.entries(node.events).forEach(([eventKey, eventDef]) => {
      const trigger = eventDef.trigger || eventKey;
      const reactEventName = toReactEventName(trigger);
      if (!reactEventName) return;
      if (isClickTrigger(trigger)) return;
      const handler = (payload: unknown) => {
        if (
          scopedContext.requireSelectionForEvents &&
          scopedContext.selectedId !== node.id
        ) {
          return;
        }
        const resolvedParams = eventDef.params
          ? (deepResolveValueOrRef(eventDef.params as any, {
              state: scopedContext.state,
              params: scopedContext.params,
              data: scopedContext.data,
              item: scopedContext.item,
              index: scopedContext.index,
            }) as Record<string, unknown>)
          : undefined;
        if (
          eventDef.action &&
          scopedContext.dispatchBuiltInAction(eventDef.action, {
            params: resolvedParams,
            nodeId: node.id,
            trigger,
            eventKey,
            payload,
          })
        ) {
          return;
        }
        scopedContext.dispatchAction(eventDef.action, payload);
      };
      handlers[reactEventName] = mergeHandlers(
        handlers[reactEventName],
        handler
      );
    });
    return handlers;
  }, [node.events, scopedContext, node.id]);

  const mergedProps = useMemo(() => {
    const combined = {
      ...(adapterResult.props ?? resolvedProps),
    } as Record<string, any>;
    Object.entries(eventProps).forEach(([key, handler]) => {
      combined[key] = mergeHandlers(combined[key], handler);
    });
    return stripInternalProps(combined);
  }, [adapterResult.props, resolvedProps, eventProps]);

  const selectionData = scopedContext.onNodeSelect
    ? {
        'data-mir-id': node.id,
        ...(scopedContext.selectedId === node.id
          ? { 'data-mir-selected': 'true' }
          : {}),
      }
    : {};
  let finalProps: Record<string, any> = { ...mergedProps };

  if (resolvedComponent.missing && context.renderMode === 'strict') {
    finalProps = {
      ...finalProps,
      'data-mir-missing': 'true',
      'data-mir-type': node.type,
    };
  }

  if (resolvedComponent.adapter.applySelection) {
    finalProps = resolvedComponent.adapter.applySelection(
      finalProps,
      selectionData
    );
  } else if (Object.keys(selectionData).length > 0) {
    finalProps = { ...finalProps, ...selectionData };
  }

  const Component = resolvedComponent.component as React.ElementType;
  const isVoid =
    adapterResult.isVoid ??
    resolvedComponent.adapter.isVoid ??
    (resolvedComponent.adapter.kind === 'html' &&
      typeof Component === 'string' &&
      VOID_ELEMENTS.has(Component.toLowerCase()));

  const supportsChildren =
    (adapterResult.supportsChildren ??
      resolvedComponent.adapter.supportsChildren ??
      true) &&
    !isVoid;

  const outletChildren =
    node.type === 'MdrOutlet' &&
    scopedContext.outletContentNode &&
    (!scopedContext.outletTargetNodeId ||
      scopedContext.outletTargetNodeId === node.id) ? (
      <MIRNode
        key={scopedContext.outletContentNode.id}
        node={scopedContext.outletContentNode}
        context={scopedContext}
        registry={registry}
      />
    ) : null;

  const listRender = useMemo(() => {
    if (!node.list) return null;
    const source =
      node.list.source !== undefined
        ? deepResolveValueOrRef(node.list.source as any, {
            state: scopedContext.state,
            params: scopedContext.params,
            data: scopedContext.data,
            item: scopedContext.item,
            index: scopedContext.index,
          })
        : typeof node.list.arrayField === 'string' &&
            node.list.arrayField.trim().length > 0
          ? readValueByPath(scopedContext.data, node.list.arrayField)
          : scopedContext.data;
    const items = Array.isArray(source) ? source : [];
    if (!items.length) {
      const emptyNodeId =
        typeof node.list.emptyNodeId === 'string' ? node.list.emptyNodeId : '';
      if (!emptyNodeId || emptyNodeId === node.id) return null;
      const emptyNode = scopedContext.nodesById[emptyNodeId];
      if (!emptyNode) return null;
      return (
        <MIRNode
          key={`${node.id}-empty`}
          node={emptyNode}
          context={scopedContext}
          registry={registry}
        />
      );
    }
    const nodeWithoutList = { ...node, list: undefined };
    const itemAlias =
      typeof node.list.itemAs === 'string' && node.list.itemAs.trim()
        ? node.list.itemAs.trim()
        : 'item';
    const indexAlias =
      typeof node.list.indexAs === 'string' && node.list.indexAs.trim()
        ? node.list.indexAs.trim()
        : 'index';
    return items.map((item, index) => {
      const iterationData =
        item && typeof item === 'object' && !Array.isArray(item)
          ? ({
              ...(scopedContext.data &&
              typeof scopedContext.data === 'object' &&
              !Array.isArray(scopedContext.data)
                ? (scopedContext.data as Record<string, unknown>)
                : {}),
              ...(item as Record<string, unknown>),
            } as Record<string, unknown>)
          : item;
      return (
        <MIRNode
          key={`${node.id}-${resolveListKey(item, index, node.list?.keyBy)}`}
          node={nodeWithoutList}
          context={{
            ...scopedContext,
            data: iterationData,
            item,
            index,
            params: {
              ...scopedContext.params,
              [itemAlias]: item,
              [indexAlias]: index,
            },
          }}
          registry={registry}
        />
      );
    });
  }, [node, scopedContext, registry]);

  const { style: propStyle, ...restProps } = finalProps;
  const mergedStyle = propStyle
    ? { ...(propStyle as Record<string, any>), ...resolvedStyle }
    : resolvedStyle;

  if (!supportsChildren) {
    if (listRender) {
      return <>{listRender}</>;
    }
    return (
      <span style={{ display: 'contents' }} data-mir-node-id={node.id}>
        <Component {...restProps} style={mergedStyle} />
      </span>
    );
  }

  if (listRender) {
    return <>{listRender}</>;
  }

  return (
    <span style={{ display: 'contents' }} data-mir-node-id={node.id}>
      <Component {...restProps} style={mergedStyle}>
        {adapterResult.children}
        {outletChildren ??
          node.children?.map((child) => (
            <MIRNode
              key={child.id}
              node={child}
              context={scopedContext}
              registry={registry}
            />
          ))}
      </Component>
    </span>
  );
};

export const MIRRenderer: React.FC<MIRRendererProps> = ({
  node,
  mirDoc,
  overrides = {},
  runtimeState,
  actions = {},
  selectedId,
  onNodeSelect,
  registry: registryProp,
  renderMode = 'tolerant',
  allowExternalProps = true,
  builtInActions,
  requireSelectionForEvents = false,
  outletContentNode,
  outletTargetNodeId,
}) => {
  const effectiveParams = useMemo(() => {
    const result: RenderParams = {};
    const propsDef = mirDoc.logic?.props || {};

    Object.keys(propsDef).forEach((key) => {
      result[key] = propsDef[key].default;
    });
    if (allowExternalProps) {
      Object.keys(overrides).forEach((key) => {
        if (!(key in result)) {
          result[key] = overrides[key];
        } else if (overrides[key] !== undefined) {
          result[key] = overrides[key];
        }
      });
    }
    return result;
  }, [mirDoc.logic?.props, overrides, allowExternalProps]);

  const initialState = useMemo(
    () => buildInitialState(mirDoc.logic?.state),
    [mirDoc.logic?.state]
  );
  const runtimeStateOverrides = useMemo(() => {
    if (!runtimeState || typeof runtimeState !== 'object') return {};
    return runtimeState;
  }, [runtimeState]);
  const [state, setState] = useState<RenderState>({
    ...initialState,
    ...runtimeStateOverrides,
  });

  useEffect(() => {
    setState({
      ...initialState,
      ...runtimeStateOverrides,
    });
  }, [initialState, runtimeStateOverrides]);

  const dispatchAction = useCallback(
    (actionName?: string, payload?: unknown) => {
      if (!actionName) return;

      const event = isSyntheticEvent(payload) ? payload : undefined;

      const customAction = actions[actionName];
      if (typeof customAction === 'function') {
        customAction({
          state,
          setState,
          params: effectiveParams,
          event,
          payload,
        });
        return;
      }

      const paramAction = effectiveParams[actionName];
      if (typeof paramAction === 'function') {
        paramAction(event ?? payload);
        return;
      }

      if (actionName === 'increment') {
        setState((prev) => {
          const targetKey = pickIncrementTarget(prev);
          if (!targetKey) return prev;
          const nextValue = (Number(prev[targetKey]) || 0) + 1;
          return { ...prev, [targetKey]: nextValue };
        });
      }
    },
    [actions, effectiveParams, state]
  );

  const registry = useMemo(
    () => registryProp ?? createDefaultComponentRegistry(),
    [registryProp]
  );
  const nodeEventsById = useMemo(() => collectNodeEvents(node), [node]);
  const nodesById = useMemo(() => collectNodesById(node), [node]);
  const mountedCssBlocks = useMemo(() => {
    const blocks = collectMountedCssFromNode(node);
    const seen = new Set<string>();
    return blocks.filter((block) => {
      const dedupeKey = block.content.trim();
      if (!dedupeKey || seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  }, [node]);

  const dispatchBuiltInAction = useCallback(
    (
      actionName: string,
      options: {
        params?: Record<string, unknown>;
        nodeId: string;
        trigger: string;
        eventKey: string;
        payload?: unknown;
      }
    ) => {
      const action = builtInActions?.[actionName];
      if (typeof action === 'function') {
        action(options);
        return true;
      }
      if (isBuiltInActionName(actionName)) {
        executeBuiltInAction(actionName, options as BuiltInActionContext);
        return true;
      }
      return false;
    },
    [builtInActions]
  );

  /**
   * Delegated click handler (capture phase).
   *
   * 调用链路：
   * click -> MIRRenderer(onClickCapture) -> onNodeSelect -> Canvas -> controller；
   * click -> MIRRenderer -> dispatchBuiltInAction/dispatchAction。
   */
  const handleDelegatedClickCapture = useCallback(
    (event: React.SyntheticEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      emitSelectionDebug({
        stage: 'capture',
        targetTag: target.tagName,
        targetClass: target.className,
      });
      const matched = target.closest('[data-mir-node-id], [data-mir-id]');
      if (!matched) {
        emitSelectionDebug({
          stage: 'no-match',
        });
        return;
      }
      const nodeId =
        matched.getAttribute('data-mir-node-id') ??
        matched.getAttribute('data-mir-id');
      if (!nodeId) {
        emitSelectionDebug({
          stage: 'empty-node-id',
        });
        return;
      }
      const matchedNode = nodesById[nodeId];
      if (onNodeSelect && resolveLinkCapability(matchedNode)) {
        event.preventDefault();
      }
      const wasSelected = selectedId === nodeId;

      onNodeSelect?.(nodeId, event);
      emitSelectionDebug({
        stage: 'selected',
        nodeId,
      });
      if (requireSelectionForEvents && !wasSelected) {
        emitSelectionDebug({
          stage: 'event-skipped-unselected',
          nodeId,
          selectedId,
        });
        return;
      }

      const events = nodeEventsById[nodeId];
      if (!events) {
        emitSelectionDebug({
          stage: 'no-events',
          nodeId,
        });
        return;
      }
      Object.entries(events).forEach(([eventKey, eventDef]) => {
        const trigger = eventDef.trigger || eventKey;
        if (!isClickTrigger(trigger)) return;
        emitSelectionDebug({
          stage: 'click-trigger',
          nodeId,
          eventKey,
          trigger,
          action: eventDef.action,
        });
        if (
          eventDef.action &&
          dispatchBuiltInAction(eventDef.action, {
            params: eventDef.params,
            nodeId,
            trigger,
            eventKey,
            payload: event,
          })
        ) {
          emitSelectionDebug({
            stage: 'built-in-dispatched',
            nodeId,
            eventKey,
            action: eventDef.action,
          });
          return;
        }
        dispatchAction(eventDef.action, event);
        emitSelectionDebug({
          stage: 'action-dispatched',
          nodeId,
          eventKey,
          action: eventDef.action,
        });
      });
    },
    [
      dispatchAction,
      dispatchBuiltInAction,
      nodeEventsById,
      nodesById,
      onNodeSelect,
      requireSelectionForEvents,
      selectedId,
    ]
  );

  const context = useMemo(
    () => ({
      state,
      params: effectiveParams,
      data: undefined,
      item: undefined,
      index: undefined,
      nodesById,
      dispatchAction,
      dispatchBuiltInAction,
      selectedId,
      requireSelectionForEvents,
      onNodeSelect,
      renderMode,
      outletContentNode,
      outletTargetNodeId,
    }),
    [
      state,
      effectiveParams,
      nodesById,
      dispatchAction,
      dispatchBuiltInAction,
      selectedId,
      requireSelectionForEvents,
      onNodeSelect,
      renderMode,
      outletContentNode,
      outletTargetNodeId,
    ]
  );

  return (
    <div
      style={{ display: 'contents' }}
      onClickCapture={handleDelegatedClickCapture}
    >
      {mountedCssBlocks.map((block) => (
        <style
          key={block.key}
          data-mir-mounted-css={block.key}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      ))}
      <MIRNode node={node} context={context} registry={registry} />
    </div>
  );
};
