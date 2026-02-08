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
import { resolveLinkCapability } from './capabilities';
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

type RenderContext = {
    state: RenderState;
    params: RenderParams;
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
    renderMode: 'strict' | 'tolerant';
};

const resolveValue = (value: any, state: RenderState, params: RenderParams) => {
    if (typeof value !== 'object' || value === null) return value;

    if ('$state' in value) {
        return state[value.$state];
    }

    if ('$param' in value) {
        return params[value.$param];
    }

    return value;
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
    return (
        typeof value === 'object' && value !== null && 'nativeEvent' in value
    );
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
}

const MIRNode: React.FC<{
    node: ComponentNode;
    context: RenderContext;
    registry: ComponentRegistry;
}> = ({ node, context, registry }) => {
    const resolvedProps = useMemo(() => {
        const p: Record<string, any> = {};
        if (node.props) {
            Object.entries(node.props).forEach(([key, val]) => {
                p[key] = resolveValue(val, context.state, context.params);
            });
        }
        return p;
    }, [node.props, context.state, context.params]);

    const resolvedStyle = useMemo(() => {
        const s: Record<string, any> = {};
        if (node.style) {
            Object.entries(node.style).forEach(([key, val]) => {
                s[key] = resolveValue(val, context.state, context.params);
            });
        }
        return s;
    }, [node.style, context.state, context.params]);

    const resolvedText = useMemo(
        () =>
            decodeHtmlEntities(
                resolveValue(node.text, context.state, context.params)
            ),
        [node.text, context.state, context.params]
    );

    const resolvedComponent = useMemo(
        () => registry.resolve(node.type),
        [registry, node.type]
    );

    const adapterResult = useMemo(() => {
        const adapterContext: AdapterContext = {
            node,
            resolvedProps,
            resolvedStyle,
            resolvedText,
        };
        return (
            resolvedComponent.adapter.mapProps?.(adapterContext) ?? {
                props: resolvedProps,
            }
        );
    }, [node, resolvedComponent, resolvedProps, resolvedStyle, resolvedText]);

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
                    eventDef.action &&
                    context.dispatchBuiltInAction(eventDef.action, {
                        params: eventDef.params,
                        nodeId: node.id,
                        trigger,
                        eventKey,
                        payload,
                    })
                ) {
                    return;
                }
                context.dispatchAction(eventDef.action, payload);
            };
            handlers[reactEventName] = mergeHandlers(
                handlers[reactEventName],
                handler
            );
        });
        return handlers;
    }, [
        node.events,
        context.dispatchAction,
        context.dispatchBuiltInAction,
        node.id,
    ]);

    const mergedProps = useMemo(() => {
        const combined = {
            ...(adapterResult.props ?? resolvedProps),
        } as Record<string, any>;
        Object.entries(eventProps).forEach(([key, handler]) => {
            combined[key] = mergeHandlers(combined[key], handler);
        });
        return combined;
    }, [adapterResult.props, resolvedProps, eventProps]);

    const selectionData = context.onNodeSelect
        ? {
              'data-mir-id': node.id,
              ...(context.selectedId === node.id
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

    const { style: propStyle, ...restProps } = finalProps;
    const mergedStyle = propStyle
        ? { ...(propStyle as Record<string, any>), ...resolvedStyle }
        : resolvedStyle;

    if (!supportsChildren) {
        return (
            <span style={{ display: 'contents' }} data-mir-node-id={node.id}>
                <Component {...restProps} style={mergedStyle} />
            </span>
        );
    }

    return (
        <span style={{ display: 'contents' }} data-mir-node-id={node.id}>
            <Component {...restProps} style={mergedStyle}>
                {adapterResult.children}
                {node.children?.map((child) => (
                    <MIRNode
                        key={child.id}
                        node={child}
                        context={context}
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
    actions = {},
    selectedId,
    onNodeSelect,
    registry: registryProp,
    renderMode = 'tolerant',
    allowExternalProps = true,
    builtInActions,
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
    const [state, setState] = useState<RenderState>(initialState);

    useEffect(() => {
        setState(initialState);
    }, [initialState]);

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
                executeBuiltInAction(
                    actionName,
                    options as BuiltInActionContext
                );
                return true;
            }
            return false;
        },
        [builtInActions]
    );

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

            onNodeSelect?.(nodeId, event);
            emitSelectionDebug({
                stage: 'selected',
                nodeId,
            });

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
        ]
    );

    const context = useMemo(
        () => ({
            state,
            params: effectiveParams,
            dispatchAction,
            dispatchBuiltInAction,
            selectedId,
            onNodeSelect,
            renderMode,
        }),
        [
            state,
            effectiveParams,
            dispatchAction,
            dispatchBuiltInAction,
            selectedId,
            onNodeSelect,
            renderMode,
        ]
    );

    return (
        <div
            style={{ display: 'contents' }}
            onClickCapture={handleDelegatedClickCapture}
        >
            <MIRNode node={node} context={context} registry={registry} />
        </div>
    );
};
