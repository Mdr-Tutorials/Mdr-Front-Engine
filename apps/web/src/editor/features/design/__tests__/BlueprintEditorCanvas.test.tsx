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
    node: any;
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

  it('calls onNodeSelect when a rendered node is clicked', () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Hello' }]),
    });

    const onSelectNode = vi.fn();

    render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={() => {}}
        onZoomChange={() => {}}
        onSelectNode={onSelectNode}
      />
    );

    fireEvent.click(screen.getByTestId('mir-node'));
    expect(onSelectNode).toHaveBeenCalledWith('child-1');
  });

  it('does not start panning when pointer down happens on a MIR node', () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Hello' }]),
    });
    const onPanChange = vi.fn();

    render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={onPanChange}
        onZoomChange={() => {}}
        onSelectNode={() => {}}
      />
    );

    fireEvent.pointerDown(screen.getByTestId('mir-node'), {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      button: 0,
    });
    fireEvent.pointerMove(screen.getByTestId('mir-node'), {
      pointerId: 1,
      clientX: 16,
      clientY: 0,
    });
    fireEvent.pointerUp(screen.getByTestId('mir-node'), { pointerId: 1 });

    expect(onPanChange).not.toHaveBeenCalled();
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

  it('cancels animation raf on unmount', () => {
    resetEditorStore({
      mirDoc: {
        ...createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Hello' }]),
        animation: {
          version: 1,
          timelines: [
            {
              id: 'timeline-1',
              name: 'Timeline 1',
              durationMs: 1000,
              bindings: [
                {
                  id: 'binding-1',
                  targetNodeId: 'child-1',
                  tracks: [
                    {
                      id: 'track-1',
                      kind: 'style',
                      property: 'opacity',
                      keyframes: [
                        { atMs: 0, value: 0 },
                        { atMs: 1000, value: 1 },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 42);
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

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    unmount();
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(42);

    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
