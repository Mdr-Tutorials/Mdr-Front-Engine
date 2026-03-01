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

  it('renders the grid when assist includes grid', () => {
    resetSettingsStore({ assist: ['grid'] });

    const { container } = render(
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

    expect(container.querySelector('.BlueprintEditorCanvasGrid')).toBeTruthy();
  });

  it('keeps canvas container clipped and lets artboard own scrolling', () => {
    const { container } = render(
      <BlueprintEditorCanvas
        viewportWidth="2000"
        viewportHeight="1400"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={() => {}}
        onZoomChange={() => {}}
        onSelectNode={() => {}}
      />
    );

    const surface = container.querySelector('.BlueprintEditorCanvasSurface');
    const artboard = container.querySelector('.BlueprintEditorCanvasArtboard');
    expect(surface?.className).toContain('overflow-hidden');
    expect(artboard?.className).toContain('overflow-auto');
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

  it('requires selection before triggering node events by default', () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Hello' }]),
    });

    const { container } = render(
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

    expect(
      container.querySelector('[data-require-selection="true"]')
    ).toBeTruthy();
  });

  it('allows triggering node events without selection when setting is always', () => {
    resetSettingsStore({ eventTriggerMode: 'always' });
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Hello' }]),
    });

    const { container } = render(
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

    expect(
      container.querySelector('[data-require-selection="false"]')
    ).toBeTruthy();
  });

  it('handles wheel zoom and pan', () => {
    const onPanChange = vi.fn();
    const onZoomChange = vi.fn();

    const { container } = render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={onPanChange}
        onZoomChange={onZoomChange}
        onSelectNode={() => {}}
      />
    );

    const surface = container.querySelector('.BlueprintEditorCanvasSurface');
    if (!surface) throw new Error('Surface not found');

    fireEvent.wheel(surface, { deltaX: 10, deltaY: 20 });
    expect(onPanChange).toHaveBeenCalledWith({ x: -10, y: -20 });

    fireEvent.wheel(surface, { deltaX: 0, deltaY: -120, ctrlKey: true });
    expect(onZoomChange).toHaveBeenCalled();
  });

  it('keeps wheel event for artboard scroll when overflow is consumable', () => {
    const onPanChange = vi.fn();

    const { container } = render(
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

    const artboard = container.querySelector(
      '.BlueprintEditorCanvasArtboard'
    ) as HTMLElement | null;
    if (!artboard) throw new Error('Artboard not found');

    Object.defineProperty(artboard, 'scrollHeight', {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(artboard, 'clientHeight', {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(artboard, 'scrollTop', {
      configurable: true,
      value: 200,
    });

    fireEvent.wheel(artboard, { deltaY: 120 });
    expect(onPanChange).not.toHaveBeenCalled();
  });

  it('supports pointer panning and keyboard zoom', () => {
    const onPanChange = vi.fn();
    const onZoomChange = vi.fn();

    const { container } = render(
      <BlueprintEditorCanvas
        viewportWidth="1440"
        viewportHeight="900"
        zoom={100}
        pan={{ x: 0, y: 0 }}
        selectedId={undefined}
        onPanChange={onPanChange}
        onZoomChange={onZoomChange}
        onSelectNode={() => {}}
      />
    );

    const surface = container.querySelector(
      '.BlueprintEditorCanvasSurface'
    ) as HTMLElement;
    surface.setPointerCapture = () => {};

    fireEvent.pointerDown(surface, {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      button: 0,
    });
    fireEvent.pointerMove(surface, {
      pointerId: 1,
      clientX: 12,
      clientY: 0,
    });
    fireEvent.pointerUp(surface, { pointerId: 1 });

    expect(onPanChange).toHaveBeenCalledWith({ x: 12, y: 0 });

    fireEvent.keyDown(surface, { key: '+', ctrlKey: true });
    expect(onZoomChange).toHaveBeenCalled();
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

  it('auto-injects animation styles from mir animation timelines', () => {
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

    const { container } = render(
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

    expect(container.querySelector('style')?.textContent).toContain(
      '[data-mir-node-id="child-1"] > *'
    );
  });

  it('auto-injects animated svg filters from mir animation timelines', () => {
    resetEditorStore({
      mirDoc: {
        ...createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Hello' }]),
        animation: {
          version: 1,
          svgFilters: [
            {
              id: 'filter-1',
              units: 'objectBoundingBox',
              primitives: [
                {
                  id: 'primitive-1',
                  type: 'feGaussianBlur',
                  attrs: { stdDeviation: 0 },
                },
              ],
            },
          ],
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
                      kind: 'svg-filter-attr',
                      filterId: 'filter-1',
                      primitiveId: 'primitive-1',
                      attr: 'stdDeviation',
                      keyframes: [
                        { atMs: 0, value: 0 },
                        { atMs: 1000, value: 6 },
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

    const { container } = render(
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

    expect(container.querySelector('defs filter#filter-1')).toBeTruthy();
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
