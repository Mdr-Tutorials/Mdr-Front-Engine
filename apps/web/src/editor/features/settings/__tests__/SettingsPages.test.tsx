import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { EditorSettingsPage } from '@/editor/features/settings/EditorSettingsPage';
import { ProjectSettingsPage } from '@/editor/features/settings/ProjectSettingsPage';

const navigateMock = vi.fn();
let params: { projectId?: string } = { projectId: 'project-99' };

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
  useParams: () => params,
}));

vi.mock('@mdr/ui', () => ({
  MdrButton: ({ text, onClick }: { text: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
  MdrHeading: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  MdrParagraph: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

vi.mock('../GlobalSettingsContent', () => ({
  GlobalSettingsContent: ({ mode }: { mode?: string }) => (
    <div data-testid={`global-settings-${mode ?? 'global'}`} />
  ),
}));

vi.mock('../ProjectSettingsContent', () => ({
  ProjectSettingsContent: () => <div data-testid="project-settings" />,
}));

describe('Settings pages', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    params = { projectId: 'project-99' };
  });

  it('routes back to editor home from editor settings', () => {
    render(<EditorSettingsPage />);

    fireEvent.click(
      screen.getByRole('button', { name: 'settings.actions.exit' })
    );

    expect(navigateMock).toHaveBeenCalledWith('/editor');
  });

  it('renders project settings and editor settings sections without tabs', () => {
    render(<ProjectSettingsPage />);

    expect(screen.queryByTestId('tabs')).toBeNull();
    expect(screen.getByTestId('project-settings')).toBeTruthy();
    expect(screen.getByTestId('global-settings-project')).toBeTruthy();
  });

  it('routes back to project home from project settings', () => {
    render(<ProjectSettingsPage />);

    fireEvent.click(
      screen.getByRole('button', { name: 'settings.actions.exit' })
    );

    expect(navigateMock).toHaveBeenCalledWith('/editor/project/project-99');
  });
});
