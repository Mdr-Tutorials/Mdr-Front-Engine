import type { ComponentNode } from '@/core/types/engine.types';

export type TriggerConflictPolicy = 'none' | 'warn';

export type LinkCapability = {
    kind: 'link';
    destinationProp: string;
    targetProp?: string;
    relProp?: string;
    titleProp?: string;
    triggerPolicy?: {
        onClickWithDestination?: TriggerConflictPolicy;
    };
};

export type NodeCapability = {
    key: string;
    match: (node: ComponentNode) => boolean;
    link?: LinkCapability;
};

const capabilityRegistry: NodeCapability[] = [
    {
        key: 'mdr-router-link',
        match: (node) =>
            node.type === 'MdrLink' ||
            node.type === 'MdrButtonLink' ||
            node.type === 'MdrIconLink',
        link: {
            kind: 'link',
            destinationProp: 'to',
            targetProp: 'target',
            relProp: 'rel',
            titleProp: 'title',
            triggerPolicy: {
                onClickWithDestination: 'warn',
            },
        },
    },
    {
        key: 'native-anchor',
        match: (node) => node.type === 'a',
        link: {
            kind: 'link',
            destinationProp: 'href',
            targetProp: 'target',
            relProp: 'rel',
            titleProp: 'title',
            triggerPolicy: {
                onClickWithDestination: 'warn',
            },
        },
    },
];

export const registerNodeCapability = (capability: NodeCapability) => {
    const index = capabilityRegistry.findIndex(
        (item) => item.key === capability.key
    );
    if (index >= 0) {
        capabilityRegistry[index] = capability;
        return;
    }
    capabilityRegistry.push(capability);
};

export const resolveNodeCapabilities = (node: ComponentNode | null) => {
    if (!node) return [];
    return capabilityRegistry.filter((capability) => capability.match(node));
};

export const resolveLinkCapability = (node: ComponentNode | null) =>
    resolveNodeCapabilities(node).find((capability) => capability.link)?.link ??
    null;
