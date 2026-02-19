import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NodeGraphEditor from '../NodeGraphEditor';

vi.mock('react-router', () => ({
  useParams: () => ({ projectId: 'project-1' }),
}));

describe('NodeGraph Phase 0 UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders a full-canvas editor shell with 128px grid', () => {
    render(<NodeGraphEditor />);

    const root = screen.getByTestId('nodegraph-editor-root');
    const canvas = screen.getByTestId('nodegraph-canvas-layer');
    expect(root.className).toContain('overflow-hidden');
    expect(canvas.getAttribute('style')).toContain('var(--color-2)');
    expect(canvas.getAttribute('style')).toContain('128px 128px');
  });

  it('toggles debug overlay with F3 and grid visibility with F3+G', () => {
    render(<NodeGraphEditor />);

    const canvas = screen.getByTestId('nodegraph-canvas-layer');
    expect(screen.queryByTestId('nodegraph-debug-overlay')).toBeNull();
    expect(canvas.getAttribute('style')).toContain('linear-gradient');

    fireEvent.keyDown(window, { key: 'F3' });
    fireEvent.keyDown(window, { key: 'g' });
    expect(canvas.getAttribute('style')).toContain('background-image: none');
    expect(screen.queryByTestId('nodegraph-debug-overlay')).toBeNull();
    fireEvent.keyUp(window, { key: 'F3' });

    fireEvent.keyDown(window, { key: 'F3' });
    fireEvent.keyUp(window, { key: 'F3' });
    expect(screen.getByTestId('nodegraph-debug-overlay')).not.toBeNull();
    expect(screen.getByTestId('nodegraph-debug-counts').textContent).toContain(
      'nodes:'
    );
    expect(screen.getByText('grid: off')).not.toBeNull();

    fireEvent.keyDown(window, { key: 'F3' });
    fireEvent.keyUp(window, { key: 'F3' });
    expect(screen.queryByTestId('nodegraph-debug-overlay')).toBeNull();
  });

  it('supports graph management in island + modal', () => {
    render(<NodeGraphEditor />);

    fireEvent.change(screen.getByPlaceholderText('Graph name'), {
      target: { value: 'Products Graph' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByTestId('nodegraph-active-graph-name').textContent).toBe(
      'Products Graph'
    );

    fireEvent.click(screen.getByTestId('nodegraph-open-modal-button'));
    expect(screen.getByTestId('nodegraph-graph-modal')).not.toBeNull();
    fireEvent.click(screen.getByTestId('nodegraph-open-graph-0'));
    expect(screen.queryByTestId('nodegraph-graph-modal')).toBeNull();
    expect(screen.getByTestId('nodegraph-active-graph-name').textContent).toBe(
      'Main Graph'
    );
  });

  it('renders a custom cursor inside node graph editor', () => {
    render(<NodeGraphEditor />);

    const root = screen.getByTestId('nodegraph-editor-root');
    fireEvent.pointerMove(root, {
      clientX: 24,
      clientY: 30,
      pointerType: 'mouse',
    });
    expect(screen.getByTestId('nodegraph-custom-cursor')).not.toBeNull();

    fireEvent.pointerLeave(root, { pointerType: 'mouse' });
    expect(screen.queryByTestId('nodegraph-custom-cursor')).toBeNull();
  });

  it('zooms around mouse position instead of world origin', () => {
    render(<NodeGraphEditor />);

    const canvas = screen.getByTestId('nodegraph-canvas-layer');
    expect(canvas.getAttribute('style')).toContain(
      'background-position: 0px 0px'
    );

    fireEvent.wheel(canvas, {
      deltaY: -120,
      clientX: 300,
      clientY: 200,
    });

    expect(canvas.getAttribute('style')).toContain('background-position: -30');
    expect(canvas.getAttribute('style')).toContain('-20');
  });

  it('creates a standalone node from canvas context menu', () => {
    render(<NodeGraphEditor />);

    fireEvent.keyDown(window, { key: 'F3' });
    fireEvent.keyUp(window, { key: 'F3' });
    expect(screen.getByTestId('nodegraph-debug-counts').textContent).toContain(
      'nodes: 2'
    );

    const canvas = screen.getByTestId('nodegraph-canvas-layer');
    fireEvent.contextMenu(canvas, {
      clientX: 280,
      clientY: 220,
    });

    fireEvent.click(screen.getByRole('button', { name: /Create node/ }));
    fireEvent.click(screen.getByRole('button', { name: 'if-else' }));

    expect(screen.queryByTestId('nodegraph-context-menu')).toBeNull();
    expect(screen.getByTestId('nodegraph-debug-counts').textContent).toContain(
      'nodes: 3'
    );
  });
});
