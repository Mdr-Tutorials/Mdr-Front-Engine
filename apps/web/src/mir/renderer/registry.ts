import React, { createElement } from 'react';
import * as MdrUi from '@mdr/ui';
import type { ComponentNode } from '@/core/types/engine.types';
import { isIconRef, resolveIconRef } from './iconRegistry';

export type ComponentKind = 'html' | 'mdr' | 'custom';
export type RegistryGroup = 'custom' | 'mdr' | 'native';

export type AdapterContext = {
    node: ComponentNode;
    resolvedProps: Record<string, any>;
    resolvedStyle: Record<string, any>;
    resolvedText: any;
};

export type AdapterResult = {
    props?: Record<string, any>;
    children?: React.ReactNode;
    supportsChildren?: boolean;
    isVoid?: boolean;
};

export type ComponentAdapter = {
    kind: ComponentKind;
    supportsChildren?: boolean;
    isVoid?: boolean;
    mapProps?: (context: AdapterContext) => AdapterResult;
    applySelection?: (
        props: Record<string, any>,
        selectionData: Record<string, string>
    ) => Record<string, any>;
};

export type RegistryEntry = {
    component: React.ElementType;
    adapter: ComponentAdapter;
};

export type ResolvedComponent = RegistryEntry & {
    type: string;
    missing?: boolean;
};

export type ComponentRegistry = {
    register: (
        type: string,
        component: React.ElementType,
        adapter?: ComponentAdapter
    ) => void;
    get: (type: string) => RegistryEntry | undefined;
    resolve: (type: string) => ResolvedComponent;
};

const runtimeEntries = new Map<string, RegistryEntry>();
const RUNTIME_REGISTRY_UPDATED_EVENT = 'mdr:runtime-registry-updated';
let runtimeRegistryRevision = 0;

type RuntimeBoundaryState = { hasError: boolean };

class RuntimeComponentBoundary extends React.Component<
    { typeName: string; children: React.ReactNode },
    RuntimeBoundaryState
> {
    state: RuntimeBoundaryState = { hasError: false };

    static getDerivedStateFromError(): RuntimeBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.warn(
            '[runtime-component] render failed',
            this.props.typeName,
            error
        );
    }

    render() {
        if (this.state.hasError) {
            return createElement(
                'span',
                {
                    'data-runtime-error': this.props.typeName,
                    style: {
                        display: 'inline-flex',
                        minHeight: 24,
                        alignItems: 'center',
                        padding: '0 8px',
                        border: '1px dashed rgba(0,0,0,0.25)',
                        borderRadius: 8,
                        fontSize: 11,
                        color: 'var(--color-7)',
                    },
                },
                `${this.props.typeName} (runtime fallback)`
            );
        }
        return this.props.children;
    }
}

const createGuardedRuntimeComponent = (
    type: string,
    component: React.ElementType
): React.ElementType => {
    const GuardedRuntimeComponent = (props: Record<string, unknown>) =>
        createElement(
            RuntimeComponentBoundary,
            { typeName: type },
            createElement(component, props)
        );
    GuardedRuntimeComponent.displayName = `Guarded${type}`;
    return GuardedRuntimeComponent;
};

const normalizeSelectionData = (selectionData?: Record<string, string>) =>
    selectionData ?? {};

const applyHtmlSelection = (
    props: Record<string, any>,
    selectionData: Record<string, string>
) => {
    const { dataAttributes, ...rest } = props;
    const dataProps =
        typeof dataAttributes === 'object' && dataAttributes
            ? dataAttributes
            : {};
    return { ...rest, ...dataProps, ...normalizeSelectionData(selectionData) };
};

const applyMdrSelection = (
    props: Record<string, any>,
    selectionData: Record<string, string>
) => {
    const dataProps =
        typeof props.dataAttributes === 'object' && props.dataAttributes
            ? props.dataAttributes
            : {};
    return {
        ...props,
        dataAttributes: {
            ...dataProps,
            ...normalizeSelectionData(selectionData),
        },
    };
};

export const htmlAdapter: ComponentAdapter = {
    kind: 'html',
    supportsChildren: true,
    applySelection: applyHtmlSelection,
};

export const mdrAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: true,
    applySelection: applyMdrSelection,
};

export const htmlTextAdapter: ComponentAdapter = {
    kind: 'html',
    supportsChildren: true,
    applySelection: applyHtmlSelection,
    mapProps: ({ resolvedProps, resolvedText }) => ({
        props: resolvedProps,
        children: resolvedText,
    }),
};

export const htmlButtonAdapter: ComponentAdapter = {
    kind: 'html',
    supportsChildren: true,
    applySelection: applyHtmlSelection,
    mapProps: ({ resolvedProps, resolvedText }) => ({
        props: resolvedProps,
        children: resolvedText,
    }),
};

export const htmlInputAdapter: ComponentAdapter = {
    kind: 'html',
    supportsChildren: false,
    isVoid: true,
    applySelection: applyHtmlSelection,
    mapProps: ({ resolvedProps, resolvedText }) => {
        const props = { ...resolvedProps };
        if (
            resolvedText !== undefined &&
            props.value === undefined &&
            props.defaultValue === undefined
        ) {
            props.defaultValue = resolvedText;
        }
        return { props };
    },
};

export const mdrTextAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: true,
    applySelection: applyMdrSelection,
    mapProps: ({ resolvedProps, resolvedText }) => ({
        props: resolvedProps,
        children: resolvedText,
    }),
};

export const mdrButtonAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: false,
    applySelection: applyMdrSelection,
    mapProps: ({ resolvedProps, resolvedText }) => {
        const props = { ...resolvedProps };
        if (resolvedText !== undefined && props.text === undefined) {
            props.text = resolvedText;
        }
        return { props };
    },
};

export const mdrTextPropAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: true,
    applySelection: applyMdrSelection,
    mapProps: ({ resolvedProps, resolvedText }) => {
        const props = { ...resolvedProps };
        if (resolvedText !== undefined && props.text === undefined) {
            props.text = String(resolvedText);
        }
        return { props };
    },
};

export const mdrLinkAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: false,
    applySelection: applyMdrSelection,
    mapProps: ({ resolvedProps, resolvedText }) => {
        const props = { ...resolvedProps };
        if (resolvedText !== undefined && props.text === undefined) {
            props.text = String(resolvedText);
        }
        return { props };
    },
};

export const mdrInputAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: false,
    applySelection: applyMdrSelection,
    mapProps: ({ resolvedProps, resolvedText }) => {
        const props = { ...resolvedProps };
        if (resolvedText !== undefined && props.value === undefined) {
            props.value = String(resolvedText);
        }
        return { props };
    },
};

const resolveIconProps = (resolvedProps: Record<string, any>) => {
    const props = { ...resolvedProps };
    const iconRef =
        props.iconRef ??
        (typeof props.iconName === 'string'
            ? {
                  provider:
                      typeof props.iconProvider === 'string'
                          ? props.iconProvider
                          : 'lucide',
                  name: props.iconName,
              }
            : null);

    if (isIconRef(iconRef)) {
        const resolvedIcon = resolveIconRef(iconRef);
        if (resolvedIcon) {
            props.icon = resolvedIcon;
        }
    }

    delete props.iconRef;
    delete props.iconName;
    delete props.iconProvider;
    return props;
};

export const mdrIconAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: false,
    applySelection: applyMdrSelection,
    mapProps: ({ resolvedProps }) => ({
        props: resolveIconProps(resolvedProps),
    }),
};

export const mdrIconLinkAdapter: ComponentAdapter = {
    kind: 'mdr',
    supportsChildren: false,
    applySelection: applyMdrSelection,
    mapProps: ({ resolvedProps }) => ({
        props: resolveIconProps(resolvedProps),
    }),
};

const DEFAULT_RESOLVER_ORDER: RegistryGroup[] = ['custom', 'mdr', 'native'];

const registerNativeComponents = (registry: ComponentRegistry) => {
    registry.register('container', 'div', htmlAdapter);
    registry.register('div', 'div', htmlAdapter);
    registry.register('text', 'span', htmlTextAdapter);
    registry.register('button', 'button', htmlButtonAdapter);
    registry.register('input', 'input', htmlInputAdapter);
};

const createHeadlessPrimitive = (tag: string) => {
    const HeadlessPrimitive = ({
        children,
        ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) =>
        createElement(tag, props, children);
    HeadlessPrimitive.displayName = `Headless${tag.charAt(0).toUpperCase()}${tag.slice(1)}`;
    return HeadlessPrimitive;
};

const registerHeadlessComponents = (registry: ComponentRegistry) => {
    registry.register(
        'RadixSlot',
        createHeadlessPrimitive('span'),
        htmlTextAdapter
    );
    registry.register(
        'RadixLabel',
        createHeadlessPrimitive('label'),
        htmlTextAdapter
    );
    registry.register(
        'RadixSeparator',
        createHeadlessPrimitive('div'),
        htmlAdapter
    );
    registry.register(
        'RadixAccordion',
        createHeadlessPrimitive('div'),
        htmlAdapter
    );
    registry.register('RadixTabs', createHeadlessPrimitive('div'), htmlAdapter);
    registry.register(
        'RadixDialog',
        createHeadlessPrimitive('div'),
        htmlAdapter
    );
    registry.register(
        'RadixPopover',
        createHeadlessPrimitive('div'),
        htmlAdapter
    );
    registry.register(
        'RadixTooltip',
        createHeadlessPrimitive('div'),
        htmlAdapter
    );
    registry.register(
        'RadixDropdownMenu',
        createHeadlessPrimitive('div'),
        htmlAdapter
    );
    registry.register(
        'RadixSwitch',
        createHeadlessPrimitive('button'),
        htmlButtonAdapter
    );
};

const registerMdrComponents = (registry: ComponentRegistry) => {
    // Auto-register all components exported by @mdr/ui to keep the canvas renderer extensible.
    // Defaults to mdrAdapter; specific components override via adapterOverrides below.
    Object.entries(MdrUi).forEach(([key, component]) => {
        if (!key.startsWith('Mdr')) return;
        if (!component) return;
        const isValidElementType =
            typeof component === 'function' ||
            (typeof component === 'object' &&
                component !== null &&
                '$$typeof' in component);
        if (!isValidElementType) return;
        registry.register(key, component as React.ElementType, mdrAdapter);
    });

    const adapterOverrides: Record<string, ComponentAdapter> = {
        MdrDiv: mdrAdapter,
        MdrSection: mdrAdapter,
        MdrCard: mdrAdapter,
        MdrPanel: mdrAdapter,

        MdrText: mdrTextAdapter,
        MdrHeading: mdrTextAdapter,
        MdrParagraph: mdrTextAdapter,

        MdrButton: mdrButtonAdapter,
        MdrButtonLink: mdrButtonAdapter,

        MdrInput: mdrInputAdapter,
        MdrTextarea: mdrInputAdapter,
        MdrSearch: mdrInputAdapter,
        MdrIcon: mdrIconAdapter,
        MdrIconLink: mdrIconLinkAdapter,

        MdrLink: mdrLinkAdapter,
    };

    Object.keys(MdrUi).forEach((type) => {
        const adapter = adapterOverrides[type];
        if (!adapter) return;
        const component = (MdrUi as Record<string, unknown>)[type];
        if (!component) return;
        registry.register(type, component as React.ElementType, adapter);
    });
};

export const createComponentRegistry = (): ComponentRegistry => {
    const entries = new Map<string, RegistryEntry>();

    const register = (
        type: string,
        component: React.ElementType,
        adapter: ComponentAdapter = htmlAdapter
    ) => {
        entries.set(type, { component, adapter });
    };

    const get = (type: string) => entries.get(type);

    const resolve = (type: string): ResolvedComponent => {
        const entry = entries.get(type);
        if (entry) {
            return { ...entry, type };
        }
        if (type && type.toLowerCase() === type) {
            return {
                type,
                component: type as React.ElementType,
                adapter: htmlAdapter,
            };
        }
        return { type, component: 'div', adapter: htmlAdapter, missing: true };
    };

    return { register, get, resolve };
};

export const registerRuntimeComponent = (
    type: string,
    component: React.ElementType,
    adapter: ComponentAdapter = htmlAdapter
) => {
    runtimeEntries.set(type, {
        component: createGuardedRuntimeComponent(type, component),
        adapter,
    });
    runtimeRegistryRevision += 1;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent(RUNTIME_REGISTRY_UPDATED_EVENT, {
                detail: { revision: runtimeRegistryRevision },
            })
        );
    }
};

export const resetRuntimeComponents = () => {
    runtimeEntries.clear();
    runtimeRegistryRevision += 1;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent(RUNTIME_REGISTRY_UPDATED_EVENT, {
                detail: { revision: runtimeRegistryRevision },
            })
        );
    }
};

export const getRuntimeRegistryRevision = () => runtimeRegistryRevision;
export const runtimeRegistryUpdatedEvent = RUNTIME_REGISTRY_UPDATED_EVENT;

const registerRuntimeEntries = (registry: ComponentRegistry) => {
    runtimeEntries.forEach((entry, type) => {
        registry.register(type, entry.component, entry.adapter);
    });
};

export const createNativeRegistry = () => {
    const registry = createComponentRegistry();
    registerNativeComponents(registry);
    return registry;
};

export const createMdrRegistry = () => {
    const registry = createComponentRegistry();
    registerMdrComponents(registry);
    registerHeadlessComponents(registry);
    return registry;
};

export const parseResolverOrder = (value?: string): RegistryGroup[] => {
    if (!value) return [...DEFAULT_RESOLVER_ORDER];
    const segments = value
        .split('>')
        .map((segment) => segment.trim().toLowerCase())
        .filter(Boolean);
    const order: RegistryGroup[] = [];
    segments.forEach((segment) => {
        if (
            (segment === 'custom' ||
                segment === 'mdr' ||
                segment === 'native') &&
            !order.includes(segment)
        ) {
            order.push(segment);
        }
    });
    return order.length > 0 ? order : [...DEFAULT_RESOLVER_ORDER];
};

/**
 * 组件解析链路：
 * 设置项 `resolverOrder` -> parseResolverOrder -> createOrderedComponentRegistry ->
 * MIRRenderer 在 custom/mdr/native 分层查找组件。
 */
export const createOrderedComponentRegistry = (
    order: RegistryGroup[] = DEFAULT_RESOLVER_ORDER,
    customRegistry?: ComponentRegistry
) => {
    const resolvedOrder = order.length > 0 ? order : DEFAULT_RESOLVER_ORDER;
    const registries = {
        custom:
            customRegistry ??
            (() => {
                const runtimeRegistry = createComponentRegistry();
                registerRuntimeEntries(runtimeRegistry);
                return runtimeRegistry;
            })(),
        mdr: createMdrRegistry(),
        native: createNativeRegistry(),
    };

    /**
     * Runtime registration call chain:
     * registerRuntimeComponent(...) -> runtimeEntries -> createOrderedComponentRegistry(custom layer)
     * -> MIRRenderer(registry.resolve) -> concrete render component.
     */
    const register = (
        type: string,
        component: React.ElementType,
        adapter: ComponentAdapter = htmlAdapter
    ) => {
        registries.custom.register(type, component, adapter);
    };

    const get = (type: string) => {
        for (const group of resolvedOrder) {
            const entry = registries[group].get(type);
            if (entry) return entry;
        }
        return undefined;
    };

    const resolve = (type: string): ResolvedComponent => {
        for (const group of resolvedOrder) {
            const entry = registries[group].get(type);
            if (entry) {
                return { ...entry, type };
            }
            if (group === 'native' && type && type.toLowerCase() === type) {
                return {
                    type,
                    component: type as React.ElementType,
                    adapter: htmlAdapter,
                };
            }
        }
        if (type && type.toLowerCase() === type) {
            return {
                type,
                component: type as React.ElementType,
                adapter: htmlAdapter,
            };
        }
        return { type, component: 'div', adapter: htmlAdapter, missing: true };
    };

    return { register, get, resolve };
};

export const createDefaultComponentRegistry = () => {
    const registry = createComponentRegistry();
    registerNativeComponents(registry);
    registerMdrComponents(registry);
    registerHeadlessComponents(registry);
    registerRuntimeEntries(registry);
    return registry;
};

export const defaultComponentRegistry = createDefaultComponentRegistry();
