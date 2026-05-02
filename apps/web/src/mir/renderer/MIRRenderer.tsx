import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  executeBuiltInAction,
  isBuiltInActionName,
  type BuiltInActionContext,
} from '@/mir/actions/registry';
import { materializeUiTree } from '@/mir/graph/materialize';
import { getDefaultComponentRegistry } from './registry';
import { resolveLinkCapability } from './capabilities';
import { MIRNode } from './MIRNode';
import type {
  BuiltInActionDispatchOptions,
  MIRRendererProps,
  RenderParams,
  RenderState,
} from './MIRRenderer.types';
import {
  buildInitialState,
  collectMountedCssFromNode,
  collectNodeEvents,
  collectNodesById,
  deferSelectionNotification,
  emitSelectionDebug,
  isClickTrigger,
  isInteractiveEventTarget,
  isSyntheticEvent,
  pickIncrementTarget,
} from './MIRRenderer.helpers';

export type {
  ActionContext,
  ActionHandlers,
  MIRRendererProps,
  RenderContext,
  RenderState,
  RenderParams,
} from './MIRRenderer.types';

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
  const rootNode = useMemo(
    () => node ?? materializeUiTree(mirDoc.ui.graph),
    [mirDoc.ui.graph, node]
  );
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
    () => registryProp ?? getDefaultComponentRegistry(),
    [registryProp]
  );
  const nodeEventsById = useMemo(() => collectNodeEvents(rootNode), [rootNode]);
  const nodesById = useMemo(() => collectNodesById(rootNode), [rootNode]);
  const mountedCssBlocks = useMemo(() => {
    const blocks = collectMountedCssFromNode(rootNode);
    const seen = new Set<string>();
    return blocks.filter((block) => {
      const dedupeKey = block.content.trim();
      if (!dedupeKey || seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  }, [rootNode]);

  const dispatchBuiltInAction = useCallback(
    (actionName: string, options: BuiltInActionDispatchOptions) => {
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
      const shouldDeferSelection =
        isInteractiveEventTarget(target) && !wasSelected;

      if (shouldDeferSelection) {
        deferSelectionNotification(() => onNodeSelect?.(nodeId, event));
      } else {
        onNodeSelect?.(nodeId, event);
      }
      emitSelectionDebug({
        stage: 'selected',
        nodeId,
        deferred: shouldDeferSelection,
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
      <MIRNode node={rootNode} context={context} registry={registry} />
    </div>
  );
};
