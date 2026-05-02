import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueprintEditorCanvas } from '@/editor/features/design/BlueprintEditorCanvas';
import {
  createMirDoc,
  resetEditorStore,
  resetSettingsStore,
} from '@/test-utils/editorStore';

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: false,
  }),
}));

vi.mock('@/mir/renderer/MIRRenderer', () => ({
  MIRRenderer: ({
    node,
    onNodeSelect,
    requireSelectionForEvents,
  }: {
    node: { id: string; children?: { id: string }[] };
    onNodeSelect: (id: string) => void;
    requireSelectionForEvents?: boolean;
  }) => (
    <div
      data-mir-node-id={node.children?.[0]?.id ?? node.id}
      data-require-selection={String(Boolean(requireSelectionForEvents))}
    >
      <button
        type="button"
        data-testid="mir-node"
        onClick={() => onNodeSelect(node.children?.[0]?.id ?? node.id)}
      >
        Select
      </button>
    </div>
  ),
}));

vi.mock('@/mir/renderer/registry', () => ({
  createOrderedComponentRegistry: () => ({}),
  parseResolverOrder: () => [],
  getRuntimeRegistryRevision: () => 0,
  runtimeRegistryUpdatedEvent: 'mdr:runtime-registry-updated',
}));

beforeEach(() => {
  resetEditorStore();
  resetSettingsStore({ panInertia: 0 });
});

describe('BlueprintEditorCanvas', () => {
  it('renders placeholder when there are no children', () => {
    render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={() => {}}
        onZoomChange={() => {}}
        onSelectNode={() => {}}
      />
    );

    expect(screen.getByText('canvas.placeholderTitle')).toBeTruthy();
  });

  it('does not start raf autoplay when animation timelines are absent', () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1);
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const { unmount } = render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={() => {}}
        onZoomChange={() => {}}
        onSelectNode={() => {}}
      />
    );

    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();

    unmount();
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
