import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { EditorSettingsPage } from '@/editor/features/settings/EditorSettingsPage';
import { ProjectSettingsPage } from '@/editor/features/settings/ProjectSettingsPage';

const navigateMock = vi.fn();
let params: { projectId?: string } = { projectId: 'project-99' };
const tabsSpy = vi.fn();

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
  MdrTabs: ({
    items,
  }: {
    items: { key: string; label: string; content: ReactNode }[];
  }) => {
    tabsSpy(items);
    return (
      <div data-testid="tabs">
        {items.map((item) => (
          <div key={item.key} data-testid={`tab-${item.key}`}>
            {item.label}
            {item.content}
          </div>
        ))}
      </div>
    );
  },
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
    tabsSpy.mockClear();
    params = { projectId: 'project-99' };
  });

  it('routes back to editor home from editor settings', () => {
    render(<EditorSettingsPage />);

    fireEvent.click(
      screen.getByRole('button', { name: 'settings.actions.exit' })
    );

    expect(navigateMock).toHaveBeenCalledWith('/editor');
  });

  it('renders project and global tabs and exits to project home', () => {
    render(<ProjectSettingsPage />);

    expect(screen.getByTestId('tab-project')).toBeTruthy();
    expect(screen.getByTestId('tab-global')).toBeTruthy();
    expect(screen.getByTestId('global-settings-project')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'settings.actions.exit' })
    );

    expect(navigateMock).toHaveBeenCalledWith('/editor/project/project-99');
  });
});
