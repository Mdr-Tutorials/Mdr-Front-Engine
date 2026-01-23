import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type ComponentNode, type MIRDocument } from '@/core/types/engine.types';

const VOID_ELEMENTS = ['input', 'img', 'br', 'hr', 'meta', 'link'];

const ComponentMap: Record<string, React.FC<any>> = {
    container: ({ children, ...props }) => <div {...props}>{children}</div>,
    text: ({ text, children, ...props }) => <span {...props}>{text || children}</span>,
    button: ({ text, children, ...props }) => <button {...props}>{text || children}</button>,
    input: (props) => <input {...props} />,
};

type RenderState = Record<string, any>;
type RenderParams = Record<string, any>;

type ActionContext = {
    state: RenderState;
    setState: React.Dispatch<React.SetStateAction<RenderState>>;
    params: RenderParams;
    event?: React.SyntheticEvent;
};

type ActionHandlers = Record<string, (context: ActionContext) => void>;

type RenderContext = {
    state: RenderState;
    params: RenderParams;
    dispatchAction: (actionName?: string, event?: React.SyntheticEvent) => void;
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
    const normalized = trigger.toLowerCase();
    if (normalized === 'click') return 'onClick';
    if (normalized === 'change') return 'onChange';
    if (normalized === 'input') return 'onInput';
    if (normalized === 'submit') return 'onSubmit';
    if (normalized === 'focus') return 'onFocus';
    if (normalized === 'blur') return 'onBlur';
    return `on${trigger.charAt(0).toUpperCase()}${trigger.slice(1)}`;
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

interface MIRRendererProps {
    node: ComponentNode;
    mirDoc: MIRDocument;
    overrides?: Record<string, any>;
    actions?: ActionHandlers;
}

const MIRNode: React.FC<{ node: ComponentNode; context: RenderContext }> = ({ node, context }) => {
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

    const eventProps = useMemo(() => {
        const handlers: Record<string, any> = {};
        if (!node.events) return handlers;
        Object.entries(node.events).forEach(([eventKey, eventDef]) => {
            const trigger = eventDef.trigger || eventKey;
            const reactEventName = toReactEventName(trigger);
            if (!reactEventName) return;
            const handler = (event: React.SyntheticEvent) => {
                context.dispatchAction(eventDef.action, event);
            };
            handlers[reactEventName] = mergeHandlers(handlers[reactEventName], handler);
        });
        return handlers;
    }, [node.events, context.dispatchAction]);

    const mergedProps = useMemo(() => {
        const combined = { ...resolvedProps } as Record<string, any>;
        Object.entries(eventProps).forEach(([key, handler]) => {
            combined[key] = mergeHandlers(combined[key], handler);
        });
        return combined;
    }, [resolvedProps, eventProps]);

    const Component = ComponentMap[node.type] || (({ children }: any) => <div>{children}</div>);
    const isVoidElement = VOID_ELEMENTS.includes(node.type.toLowerCase());

    if (isVoidElement) {
        return (
            <Component
                {...mergedProps}
                style={resolvedStyle}
                {...(node.type === 'input' ? { defaultValue: resolvedText } : {})}
            />
        );
    }

    return (
        <Component {...mergedProps} style={resolvedStyle}>
            {resolvedText}
            {node.children?.map((child) => (
                <MIRNode key={child.id} node={child} context={context} />
            ))}
        </Component>
    );
};

export const MIRRenderer: React.FC<MIRRendererProps> = ({
    node,
    mirDoc,
    overrides = {},
    actions = {}
}) => {
    const effectiveParams = useMemo(() => {
        const result: RenderParams = {};
        const propsDef = mirDoc.logic?.props || {};

        Object.keys(propsDef).forEach((key) => {
            result[key] = overrides[key] !== undefined ? overrides[key] : propsDef[key].default;
        });
        Object.keys(overrides).forEach((key) => {
            if (!(key in result)) {
                result[key] = overrides[key];
            }
        });
        return result;
    }, [mirDoc.logic?.props, overrides]);

    const initialState = useMemo(() => buildInitialState(mirDoc.logic?.state), [mirDoc.logic?.state]);
    const [state, setState] = useState<RenderState>(initialState);

    useEffect(() => {
        setState(initialState);
    }, [initialState]);

    const dispatchAction = useCallback(
        (actionName?: string, event?: React.SyntheticEvent) => {
            if (!actionName) return;

            const customAction = actions[actionName];
            if (typeof customAction === 'function') {
                customAction({ state, setState, params: effectiveParams, event });
                return;
            }

            const paramAction = effectiveParams[actionName];
            if (typeof paramAction === 'function') {
                paramAction(event);
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

    const context = useMemo(
        () => ({ state, params: effectiveParams, dispatchAction }),
        [state, effectiveParams, dispatchAction]
    );

    return <MIRNode node={node} context={context} />;
};
