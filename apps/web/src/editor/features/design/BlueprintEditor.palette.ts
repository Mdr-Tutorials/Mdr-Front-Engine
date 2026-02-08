import {
    ANCHOR_ITEMS,
    BREADCRUMB_ITEMS,
    CHECKLIST_ITEMS,
    COLLAPSE_ITEMS,
    GALLERY_IMAGES,
    GRID_COLUMNS,
    GRID_DATA,
    LIST_ITEMS,
    NAVBAR_ITEMS,
    REGION_OPTIONS,
    SIDEBAR_ITEMS,
    STEPS_ITEMS,
    TAB_ITEMS,
    TABLE_COLUMNS,
    TABLE_DATA,
    TIMELINE_ITEMS,
    TREE_DATA,
    TREE_SELECT_OPTIONS,
} from './BlueprintEditor.data';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';

const collectTypeCounts = (
    node: ComponentNode,
    counts: Record<string, number>
) => {
    counts[node.type] = (counts[node.type] ?? 0) + 1;
    node.children?.forEach((child) => collectTypeCounts(child, counts));
};

export const createNodeIdFactory = (doc: MIRDocument) => {
    const counts: Record<string, number> = {};
    collectTypeCounts(doc.ui.root, counts);
    return (type: string) => {
        const next = (counts[type] ?? 0) + 1;
        counts[type] = next;
        return `${type}-${next}`;
    };
};

const PALETTE_NODE_DEFAULTS: Record<
    string,
    { type: string; props: Record<string, unknown> }
> = {
    breadcrumb: { type: 'MdrBreadcrumb', props: { items: BREADCRUMB_ITEMS } },
    table: {
        type: 'MdrTable',
        props: { data: TABLE_DATA, columns: TABLE_COLUMNS, size: 'Medium' },
    },
    'data-grid': {
        type: 'MdrDataGrid',
        props: { data: GRID_DATA, columns: GRID_COLUMNS },
    },
    list: { type: 'MdrList', props: { items: LIST_ITEMS, size: 'Medium' } },
    'check-list': {
        type: 'MdrCheckList',
        props: { items: CHECKLIST_ITEMS, defaultValue: ['wireframes'] },
    },
    tree: {
        type: 'MdrTree',
        props: { data: TREE_DATA, defaultExpandedKeys: ['root'] },
    },
    'tree-select': {
        type: 'MdrTreeSelect',
        props: { options: TREE_SELECT_OPTIONS, defaultValue: 'option-1' },
    },
    'region-picker': {
        type: 'MdrRegionPicker',
        props: {
            options: REGION_OPTIONS,
            defaultValue: {
                province: 'east',
                city: 'metro',
                district: 'downtown',
            },
        },
    },
    'anchor-navigation': {
        type: 'MdrAnchorNavigation',
        props: { items: ANCHOR_ITEMS, orientation: 'Vertical' },
    },
    tabs: { type: 'MdrTabs', props: { items: TAB_ITEMS } },
    collapse: {
        type: 'MdrCollapse',
        props: { items: COLLAPSE_ITEMS, defaultActiveKeys: ['panel-1'] },
    },
    navbar: {
        type: 'MdrNavbar',
        props: { brand: 'Mdr', items: NAVBAR_ITEMS, size: 'Medium' },
    },
    sidebar: {
        type: 'MdrSidebar',
        props: { title: 'Menu', items: SIDEBAR_ITEMS, width: 160 },
    },
    'image-gallery': {
        type: 'MdrImageGallery',
        props: {
            images: GALLERY_IMAGES,
            columns: 2,
            gap: 'Small',
            size: 'Medium',
        },
    },
    timeline: { type: 'MdrTimeline', props: { items: TIMELINE_ITEMS } },
    steps: { type: 'MdrSteps', props: { items: STEPS_ITEMS, current: 1 } },
    progress: { type: 'MdrProgress', props: { value: 62, size: 'Medium' } },
    statistic: {
        type: 'MdrStatistic',
        props: { title: 'Total', value: 248, trend: 'Up' },
    },
    pagination: { type: 'MdrPagination', props: { page: 2, total: 50 } },
};

export const createNodeFromPaletteItem = (
    itemId: string,
    createId: (type: string) => string,
    variantProps?: Record<string, unknown>,
    selectedSize?: string
): ComponentNode => {
    const typeFromPalette = (value: string) =>
        `Mdr${value
            .split(/[-_]/)
            .filter(Boolean)
            .map(
                (segment) =>
                    `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`
            )
            .join('')}`;

    if (itemId === 'text') {
        return {
            id: createId('MdrText'),
            type: 'MdrText',
            text: 'Text',
            props: { size: selectedSize ?? 'Medium' },
        };
    }
    if (itemId === 'heading') {
        const rawLevel = variantProps?.level;
        const resolvedLevel =
            typeof rawLevel === 'number'
                ? rawLevel
                : typeof rawLevel === 'string'
                  ? Number(rawLevel)
                  : 2;
        const level = Number.isFinite(resolvedLevel) ? resolvedLevel : 2;
        return {
            id: createId('MdrHeading'),
            type: 'MdrHeading',
            text: 'Heading',
            props: {
                ...variantProps,
                level,
                weight: 'Bold',
                size: selectedSize,
            },
        };
    }
    if (itemId === 'paragraph') {
        return {
            id: createId('MdrParagraph'),
            type: 'MdrParagraph',
            text: 'Paragraph',
            props: { size: selectedSize ?? 'Medium' },
        };
    }
    if (itemId === 'button') {
        return {
            id: createId('MdrButton'),
            type: 'MdrButton',
            text: 'Button',
            props: {
                size: selectedSize ?? 'Medium',
                category: 'Primary',
                ...variantProps,
            },
        };
    }
    if (itemId === 'button-link') {
        return {
            id: createId('MdrButtonLink'),
            type: 'MdrButtonLink',
            text: 'Link',
            props: {
                to: '',
                size: selectedSize ?? 'Medium',
                category: 'Secondary',
                ...variantProps,
            },
        };
    }
    if (itemId === 'link') {
        return {
            id: createId('MdrLink'),
            type: 'MdrLink',
            text: 'Link',
            props: { to: '' },
        };
    }
    if (itemId === 'input') {
        return {
            id: createId('MdrInput'),
            type: 'MdrInput',
            props: { placeholder: 'Input', size: selectedSize ?? 'Medium' },
        };
    }
    if (itemId === 'textarea') {
        return {
            id: createId('MdrTextarea'),
            type: 'MdrTextarea',
            props: {
                placeholder: 'Textarea',
                rows: 3,
                size: selectedSize ?? 'Medium',
            },
        };
    }
    if (itemId === 'div') {
        return {
            id: createId('MdrDiv'),
            type: 'MdrDiv',
        };
    }
    if (itemId === 'flex') {
        return {
            id: createId('MdrDiv'),
            type: 'MdrDiv',
            props: {
                display: 'Flex',
            },
        };
    }
    if (itemId === 'grid') {
        return {
            id: createId('MdrDiv'),
            type: 'MdrDiv',
            props: {
                display: 'Grid',
            },
        };
    }
    if (itemId === 'section') {
        return {
            id: createId('MdrSection'),
            type: 'MdrSection',
            props: {
                size: selectedSize ?? 'Medium',
                padding: 'Medium',
                backgroundColor: 'Light',
            },
        };
    }
    if (itemId === 'card') {
        return {
            id: createId('MdrCard'),
            type: 'MdrCard',
            props: {
                size: selectedSize ?? 'Medium',
                variant: 'Bordered',
                padding: 'Medium',
                ...(variantProps ?? {}),
            },
        };
    }
    if (itemId === 'panel') {
        return {
            id: createId('MdrPanel'),
            type: 'MdrPanel',
            props: {
                size: selectedSize ?? 'Medium',
                variant: 'Default',
                padding: 'Medium',
                title: 'Panel',
                ...(variantProps ?? {}),
            },
        };
    }
    if (itemId === 'icon') {
        return {
            id: createId('MdrIcon'),
            type: 'MdrIcon',
            props: {
                iconRef: {
                    provider: 'lucide',
                    name: 'Sparkles',
                },
                size: 20,
                ...variantProps,
            },
        };
    }
    if (itemId === 'icon-link') {
        return {
            id: createId('MdrIconLink'),
            type: 'MdrIconLink',
            props: {
                iconRef: {
                    provider: 'lucide',
                    name: 'Sparkles',
                },
                to: '',
                size: 18,
                ...variantProps,
            },
        };
    }

    const defaultNode = PALETTE_NODE_DEFAULTS[itemId];
    if (defaultNode) {
        return {
            id: createId(defaultNode.type),
            type: defaultNode.type,
            props: {
                ...defaultNode.props,
                ...(selectedSize ? { size: selectedSize } : {}),
                ...(variantProps ?? {}),
            },
        };
    }

    const inferredType = typeFromPalette(itemId);

    return {
        id: createId(inferredType),
        type: inferredType,
        props: {
            dataAttributes: { 'data-palette-item': itemId },
            ...(selectedSize ? { size: selectedSize } : {}),
            ...(variantProps ?? {}),
        },
    };
};
