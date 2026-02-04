import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EditorHome from '../EditorHome';

vi.mock('../features/newfile/NewResourceModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="resource-modal" /> : null,
}));

describe('EditorHome', () => {
  it('opens the new resource modal when clicking the create button', () => {
    render(<EditorHome />);

    fireEvent.click(
      screen.getByRole('button', { name: 'home.actions.newProject' })
    );

    expect(screen.getByTestId('resource-modal')).toBeTruthy();
  });

  it('sorts projects by most recently updated', () => {
    render(<EditorHome />);

    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((node) => node.textContent);

    expect(titles[0]).toBe('SaaS Dashboard');
  });
});
