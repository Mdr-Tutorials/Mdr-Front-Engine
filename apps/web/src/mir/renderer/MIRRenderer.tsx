import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type ComponentNode, type MIRDocument } from '@/core/types/engine.types';
import { createDefaultComponentRegistry, type AdapterContext, type ComponentRegistry } from './registry';

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
    const numericKey = Object.keys(state).find((key) => typeof state[key] === 'number');
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
}

const MIRNode: React.FC<{ node: ComponentNode; context: RenderContext; registry: ComponentRegistry }> = ({
    node,
    context,
    registry,
}) => {
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
        () => resolveValue(node.text, context.state, context.params),
        [node.text, context.state, context.params]
    );

    const resolvedComponent = useMemo(() => registry.resolve(node.type), [registry, node.type]);

    const adapterResult = useMemo(() => {
        const adapterContext: AdapterContext = {
            node,
            resolvedProps,
            resolvedStyle,
            resolvedText,
        };
        return resolvedComponent.adapter.mapProps?.(adapterContext) ?? { props: resolvedProps };
    }, [node, resolvedComponent, resolvedProps, resolvedStyle, resolvedText]);

    const eventProps = useMemo(() => {
        const handlers: Record<string, any> = {};
        if (!node.events) return handlers;
        Object.entries(node.events).forEach(([eventKey, eventDef]) => {
            const trigger = eventDef.trigger || eventKey;
            const reactEventName = toReactEventName(trigger);
            if (!reactEventName) return;
            const handler = (payload: unknown) => {
                context.dispatchAction(eventDef.action, payload);
            };
            handlers[reactEventName] = mergeHandlers(handlers[reactEventName], handler);
        });
        return handlers;
    }, [node.events, context.dispatchAction]);

    const mergedProps = useMemo(() => {
        const combined = { ...(adapterResult.props ?? resolvedProps) } as Record<string, any>;
        Object.entries(eventProps).forEach(([key, handler]) => {
            combined[key] = mergeHandlers(combined[key], handler);
        });
        return combined;
    }, [adapterResult.props, resolvedProps, eventProps]);

    const selectionHandler = context.onNodeSelect
        ? (event: React.SyntheticEvent) => {
            event.stopPropagation();
            context.onNodeSelect?.(node.id, event);
        }
        : undefined;

    const selectionData = context.onNodeSelect
        ? {
            'data-mir-id': node.id,
            ...(context.selectedId === node.id ? { 'data-mir-selected': 'true' } : {}),
        }
        : {};

    const selectionClick = context.onNodeSelect
        ? {
            onClick: mergeHandlers(mergedProps.onClick, selectionHandler),
        }
        : {};

    let finalProps: Record<string, any> = { ...mergedProps, ...selectionClick };

    if (resolvedComponent.missing && context.renderMode === 'strict') {
        finalProps = {
            ...finalProps,
            'data-mir-missing': 'true',
            'data-mir-type': node.type,
        };
    }

    if (resolvedComponent.adapter.applySelection) {
        finalProps = resolvedComponent.adapter.applySelection(finalProps, selectionData);
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
        (adapterResult.supportsChildren ?? resolvedComponent.adapter.supportsChildren ?? true) && !isVoid;

    const { style: propStyle, ...restProps } = finalProps;
    const mergedStyle = propStyle ? { ...(propStyle as Record<string, any>), ...resolvedStyle } : resolvedStyle;

    if (!supportsChildren) {
        return <Component {...restProps} style={mergedStyle} />;
    }

    return (
        <Component {...restProps} style={mergedStyle}>
            {adapterResult.children}
            {node.children?.map((child) => (
                <MIRNode key={child.id} node={child} context={context} registry={registry} />
            ))}
        </Component>
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

    const initialState = useMemo(() => buildInitialState(mirDoc.logic?.state), [mirDoc.logic?.state]);
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
                customAction({ state, setState, params: effectiveParams, event, payload });
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

    const registry = useMemo(() => registryProp ?? createDefaultComponentRegistry(), [registryProp]);

    const context = useMemo(
        () => ({
            state,
            params: effectiveParams,
            dispatchAction,
            selectedId,
            onNodeSelect,
            renderMode,
        }),
        [state, effectiveParams, dispatchAction, selectedId, onNodeSelect, renderMode]
    );

    return <MIRNode node={node} context={context} registry={registry} />;
};
