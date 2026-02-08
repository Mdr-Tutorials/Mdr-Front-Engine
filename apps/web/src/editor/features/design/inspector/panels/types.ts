import type React from 'react';
import type { ComponentNode } from '@/core/types/engine.types';

export type InspectorUpdateNode = (
    updater: (node: ComponentNode) => ComponentNode
) => void;

export type InspectorPanelRenderProps = {
    node: ComponentNode;
    updateNode: InspectorUpdateNode;
};

export type InspectorPanelDefinition = {
    key: string;
    title: string;
    description?: string;
    match: (node: ComponentNode) => boolean;
    render: (props: InspectorPanelRenderProps) => React.ReactNode;
};
