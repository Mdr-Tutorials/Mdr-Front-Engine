import type {
    ComponentGroup,
    ComponentPreviewItem,
} from '../BlueprintEditor.types';
import { COMPONENT_GROUPS as DEFAULT_COMPONENT_GROUPS } from './data/ComponentGroups';

const componentGroups: ComponentGroup[] = [];

const upsertGroup = (group: ComponentGroup) => {
    const index = componentGroups.findIndex((item) => item.id === group.id);
    if (index >= 0) {
        componentGroups[index] = group;
        return;
    }
    componentGroups.push(group);
};

export const registerComponentGroup = (group: ComponentGroup) => {
    upsertGroup(group);
};

export const registerComponentGroups = (groups: ComponentGroup[]) => {
    groups.forEach((group) => upsertGroup(group));
};

export const getComponentGroups = () => componentGroups;

export const getComponentItemById = (
    itemId: string
): ComponentPreviewItem | undefined => {
    for (const group of componentGroups) {
        const item = group.items.find((entry) => entry.id === itemId);
        if (item) return item;
    }
    return undefined;
};

export const resetComponentRegistry = () => {
    componentGroups.length = 0;
    registerComponentGroups(DEFAULT_COMPONENT_GROUPS);
};

registerComponentGroups(DEFAULT_COMPONENT_GROUPS);
