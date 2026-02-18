import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NodeGraph from '../NodeGraph';

vi.mock('react-router', () => ({
  useParams: () => ({ projectId: 'project-1' }),
}));

describe('NodeGraph Phase 0 UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders a full-canvas editor shell with 128px grid', () => {
    render(<NodeGraph />);

    const root = screen.getByTestId('nodegraph-editor-root');
    const canvas = screen.getByTestId('nodegraph-canvas-layer');
    expect(root.className).toContain('overflow-hidden');
    expect(canvas.getAttribute('style')).toContain('var(--color-2)');
    expect(canvas.getAttribute('style')).toContain('128px 128px');
  });

  it('supports graph management in island + modal', () => {
    render(<NodeGraph />);

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
});
