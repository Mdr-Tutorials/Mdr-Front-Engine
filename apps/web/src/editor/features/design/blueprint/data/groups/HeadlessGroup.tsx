import type { ComponentGroup } from '../../../BlueprintEditor.types';

export const HEADLESS_GROUP: ComponentGroup = {
    id: 'radix',
    title: 'Radix UI',
    source: 'headless',
    items: [
        {
            id: 'radix-slot',
            name: 'Slot',
            preview: (
                <div className="rounded-md border border-black/12 px-2 py-1 text-[10px] text-(--color-8) dark:border-white/16">
                    Slot
                </div>
            ),
        },
        {
            id: 'radix-label',
            name: 'Label',
            preview: (
                <label className="text-[10px] font-semibold text-(--color-8)">
                    Label
                </label>
            ),
        },
        {
            id: 'radix-separator',
            name: 'Separator',
            preview: <div className="h-px w-16 bg-black/24 dark:bg-white/24" />,
        },
        {
            id: 'radix-accordion',
            name: 'Accordion',
            preview: (
                <div className="grid w-20 gap-1 rounded-md border border-black/10 bg-(--color-0) p-1.5 dark:border-white/16">
                    <div className="h-3 rounded bg-black/8 dark:bg-white/10" />
                    <div className="h-2 rounded bg-black/5 dark:bg-white/8" />
                </div>
            ),
        },
        {
            id: 'radix-tabs',
            name: 'Tabs',
            preview: (
                <div className="grid w-20 gap-1 rounded-md border border-black/10 p-1.5 dark:border-white/16">
                    <div className="grid grid-cols-2 gap-1">
                        <div className="h-3 rounded bg-black/12 dark:bg-white/16" />
                        <div className="h-3 rounded bg-black/6 dark:bg-white/8" />
                    </div>
                    <div className="h-2 rounded bg-black/5 dark:bg-white/8" />
                </div>
            ),
        },
        {
            id: 'radix-dialog',
            name: 'Dialog',
            preview: (
                <div className="grid w-20 gap-1 rounded-md border border-black/12 bg-(--color-0) p-1.5 shadow-sm dark:border-white/16">
                    <div className="h-2.5 w-10 rounded bg-black/12 dark:bg-white/16" />
                    <div className="h-2 rounded bg-black/6 dark:bg-white/8" />
                    <div className="h-2 rounded bg-black/6 dark:bg-white/8" />
                </div>
            ),
        },
        {
            id: 'radix-popover',
            name: 'Popover',
            preview: (
                <div className="relative grid w-20 place-items-center">
                    <div className="h-4 w-7 rounded bg-black/10 dark:bg-white/16" />
                    <div className="absolute top-5 grid w-14 gap-1 rounded-md border border-black/10 bg-(--color-0) p-1 dark:border-white/16">
                        <div className="h-1.5 rounded bg-black/8 dark:bg-white/10" />
                        <div className="h-1.5 rounded bg-black/8 dark:bg-white/10" />
                    </div>
                </div>
            ),
            scale: 0.62,
        },
        {
            id: 'radix-tooltip',
            name: 'Tooltip',
            preview: (
                <div className="relative grid w-20 place-items-center">
                    <div className="h-4 w-7 rounded bg-black/10 dark:bg-white/16" />
                    <div className="absolute -top-3 rounded bg-black/70 px-1.5 py-0.5 text-[8px] text-white">
                        Tip
                    </div>
                </div>
            ),
            scale: 0.64,
        },
        {
            id: 'radix-dropdown-menu',
            name: 'DropdownMenu',
            preview: (
                <div className="grid w-20 gap-1">
                    <div className="h-4 w-8 rounded bg-black/10 dark:bg-white/16" />
                    <div className="grid gap-1 rounded-md border border-black/10 bg-(--color-0) p-1 dark:border-white/16">
                        <div className="h-1.5 rounded bg-black/8 dark:bg-white/10" />
                        <div className="h-1.5 rounded bg-black/8 dark:bg-white/10" />
                        <div className="h-1.5 rounded bg-black/8 dark:bg-white/10" />
                    </div>
                </div>
            ),
            scale: 0.62,
        },
        {
            id: 'radix-switch',
            name: 'Switch',
            preview: (
                <div className="relative h-4 w-8 rounded-full bg-black/14 dark:bg-white/18">
                    <div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-(--color-0) shadow-[0_1px_2px_rgba(0,0,0,0.22)]" />
                </div>
            ),
        },
    ],
};
