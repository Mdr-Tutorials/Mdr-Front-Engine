import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import EditorBar from '../EditorBar';
import { resetSettingsStore } from '@/test-utils/editorStore';

const navigateMock = vi.fn();
let params: { projectId?: string } = { projectId: 'project-123' };
let location = { pathname: '/editor/project/project-123/blueprint' };

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
  useParams: () => params,
  useLocation: () => location,
}));

vi.mock('@mdr/ui', () => ({
  MdrIcon: ({ icon }: { icon?: ReactNode }) => (
    <span data-testid="mdr-icon">{icon}</span>
  ),
  MdrIconLink: ({
    to,
    title,
    icon,
  }: {
    to: string;
    title?: string;
    icon?: ReactNode;
  }) => (
    <a href={to} title={title} data-testid={`icon-link-${title ?? to}`}>
      {icon}
      {title}
    </a>
  ),
  MdrButton: ({ text, onClick }: { text: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
}));

describe('EditorBar', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    params = { projectId: 'project-123' };
    location = { pathname: '/editor/project/project-123/blueprint' };
    resetSettingsStore();
  });

  it('renders project navigation links when a project is active', () => {
    render(<EditorBar />);

    expect(screen.getByTitle('bar.projectHome').getAttribute('href')).toBe(
      '/editor/project/project-123'
    );
    expect(
      screen
        .getByTitle('projectHome.actions.blueprint.label')
        .getAttribute('href')
    ).toBe('/editor/project/project-123/blueprint');
    expect(
      screen
        .getByTitle('projectHome.actions.resources.label')
        .getAttribute('href')
    ).toBe('/editor/project/project-123/resources');
    const allLinks = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('title'));
    expect(allLinks).toEqual([
      'bar.projectHome',
      'projectHome.actions.blueprint.label',
      'projectHome.actions.nodegraph.label',
      'projectHome.actions.animation.label',
      'projectHome.actions.component.label',
      'projectHome.actions.resources.label',
      'projectHome.actions.testing.label',
      'projectHome.actions.export.label',
      'projectHome.actions.deployment.label',
      'projectHome.actions.settings.label',
    ]);
  });

  it('shows confirmation modal before leaving when prompts include leave', () => {
    resetSettingsStore({ confirmPrompts: ['leave'] });
    render(<EditorBar />);

    fireEvent.click(screen.getByLabelText('bar.exitAria'));

    expect(screen.getByText('bar.exitTitle')).toBeTruthy();
    fireEvent.click(screen.getByText('bar.exit'));

    expect(navigateMock).toHaveBeenCalledWith('/editor');
  });

  it('opens confirmation modal on Escape in blueprint route', () => {
    render(<EditorBar />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByText('bar.exitTitle')).toBeTruthy();
  });

  it('supports Enter confirm and Backspace cancel in exit modal', () => {
    resetSettingsStore({ confirmPrompts: ['leave'] });
    render(<EditorBar />);

    fireEvent.click(screen.getByLabelText('bar.exitAria'));
    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(screen.queryByText('bar.exitTitle')).toBeNull();

    fireEvent.click(screen.getByLabelText('bar.exitAria'));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(navigateMock).toHaveBeenCalledWith('/editor');
  });

  it('navigates immediately when leave prompts are disabled', () => {
    resetSettingsStore({ confirmPrompts: [] });
    render(<EditorBar />);

    fireEvent.click(screen.getByLabelText('bar.exitAria'));

    expect(navigateMock).toHaveBeenCalledWith('/editor');
  });

  it('falls back to the home exit target when no project is selected', () => {
    params = {};
    resetSettingsStore({ confirmPrompts: [] });
    render(<EditorBar />);

    fireEvent.click(screen.getByLabelText('bar.exitAria'));

    expect(navigateMock).toHaveBeenCalledWith('/');
    expect(screen.queryByTitle('bar.projectHome')).toBeNull();
  });
});
