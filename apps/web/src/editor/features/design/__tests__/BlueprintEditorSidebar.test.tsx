import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlueprintEditorSidebar } from '../BlueprintEditorSidebar';

vi.mock('@dnd-kit/core', () => ({
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: () => {},
        isDragging: false,
    }),
}));

vi.mock('lucide-react', () => ({
    ChevronDown: () => null,
    ChevronLeft: () => null,
    ChevronRight: () => null,
    Search: () => null,
    X: () => null,
}));

vi.mock('../blueprint/registry', () => ({
    getComponentGroups: () => [
        {
            id: 'base',
            title: 'Base',
            items: [
                {
                    id: 'button',
                    name: 'Button',
                    preview: <div data-testid="preview">Button</div>,
                    sizeOptions: [
                        { id: 'S', label: 'S', value: 'Small' },
                        { id: 'M', label: 'M', value: 'Medium' },
                    ],
                    statusOptions: [
                        { id: 'default', label: 'Default', value: 'Default' },
                        { id: 'success', label: 'Success', value: 'Success' },
                    ],
                    variants: [
                        {
                            id: 'primary',
                            label: 'Primary',
                            element: <div>Primary</div>,
                        },
                    ],
                    renderPreview: () => (
                        <div data-testid="preview-render">Preview</div>
                    ),
                },
            ],
        },
    ],
}));

vi.mock('../BlueprintEditor.data', () => ({
    DEFAULT_PREVIEW_SCALE: 0.72,
    COMPACT_PREVIEW_SCALE: 0.6,
    getDefaultSizeId: (options: { id: string }[]) => options?.[0]?.id ?? '',
    getDefaultStatusIndex: () => 0,
    getPreviewScale: (scale?: number) => scale ?? 0.72,
    isWideComponent: () => false,
}));

describe('BlueprintEditorSidebar', () => {
    it('renders collapsed state', () => {
        render(
            <BlueprintEditorSidebar
                isCollapsed
                collapsedGroups={{}}
                expandedPreviews={{}}
                sizeSelections={{}}
                statusSelections={{}}
                onToggleCollapse={() => {}}
                onToggleGroup={() => {}}
                onTogglePreview={() => {}}
                onPreviewKeyDown={() => {}}
                onSizeSelect={() => {}}
                onStatusSelect={() => {}}
                onStatusCycleStart={() => {}}
                onStatusCycleStop={() => {}}
            />
        );

        expect(screen.getByText('sidebar.title')).toBeTruthy();
        expect(screen.queryByTestId('preview-render')).toBeNull();
    });

    it('fires callbacks for group toggles and preview interactions', () => {
        const onToggleGroup = vi.fn();
        const onTogglePreview = vi.fn();
        const onPreviewKeyDown = vi.fn();
        const onSizeSelect = vi.fn();
        const onStatusSelect = vi.fn();
        const onStatusCycleStart = vi.fn();
        const onStatusCycleStop = vi.fn();

        render(
            <BlueprintEditorSidebar
                isCollapsed={false}
                collapsedGroups={{}}
                expandedPreviews={{}}
                sizeSelections={{}}
                statusSelections={{}}
                onToggleCollapse={() => {}}
                onToggleGroup={onToggleGroup}
                onTogglePreview={onTogglePreview}
                onPreviewKeyDown={onPreviewKeyDown}
                onSizeSelect={onSizeSelect}
                onStatusSelect={onStatusSelect}
                onStatusCycleStart={onStatusCycleStart}
                onStatusCycleStop={onStatusCycleStop}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Base/ }));
        expect(onToggleGroup).toHaveBeenCalledWith('base');

        const previewCard = screen
            .getByTestId('preview-render')
            .closest('.ComponentPreviewCard');
        if (!previewCard) throw new Error('Preview card missing');
        fireEvent.keyDown(previewCard, { key: 'Enter' });
        expect(onPreviewKeyDown).toHaveBeenCalled();

        fireEvent.mouseEnter(previewCard);
        expect(onStatusCycleStart).toHaveBeenCalledWith('button', 2);
        fireEvent.mouseLeave(previewCard);
        expect(onStatusCycleStop).toHaveBeenCalledWith('button');

        fireEvent.click(screen.getByRole('button', { name: 'S' }));
        expect(onSizeSelect).toHaveBeenCalledWith('button', 'S');

        const statusDots = screen.getAllByRole('button', {
            name: /Default|Success/,
        });
        fireEvent.click(statusDots[1]);
        expect(onStatusSelect).toHaveBeenCalledWith('button', 1);

        fireEvent.click(
            screen.getByRole('button', { name: 'sidebar.expandVariants' })
        );
        expect(onTogglePreview).toHaveBeenCalledWith('button');
    });

    it('filters items by search query', () => {
        render(
            <BlueprintEditorSidebar
                isCollapsed={false}
                collapsedGroups={{}}
                expandedPreviews={{}}
                sizeSelections={{}}
                statusSelections={{}}
                onToggleCollapse={() => {}}
                onToggleGroup={() => {}}
                onTogglePreview={() => {}}
                onPreviewKeyDown={() => {}}
                onSizeSelect={() => {}}
                onStatusSelect={() => {}}
                onStatusCycleStart={() => {}}
                onStatusCycleStop={() => {}}
            />
        );

        expect(screen.getByText(/Base/)).toBeTruthy();
        fireEvent.click(
            screen.getByRole('button', { name: 'sidebar.openSearch' })
        );
        fireEvent.change(screen.getByLabelText('sidebar.searchPlaceholder'), {
            target: { value: 'missing' },
        });
        expect(screen.queryByText(/Base/)).toBeNull();

        fireEvent.change(screen.getByLabelText('sidebar.searchPlaceholder'), {
            target: { value: 'Button' },
        });
        expect(screen.getByText(/Base/)).toBeTruthy();
    });
});
