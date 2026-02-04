import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectHome from '../ProjectHome';
import { resetEditorStore } from '@/test-utils/editorStore';

const navigateMock = vi.fn();
let params: { projectId?: string } = { projectId: 'project-1' };

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
  useParams: () => params,
}));

describe('ProjectHome', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    params = { projectId: 'project-1' };
    resetEditorStore({
      projectsById: {
        'project-1': {
          id: 'project-1',
          name: 'Project Alpha',
          description: 'Demo',
        },
      },
    });
  });

  it('shows project identity and routes to blueprint', () => {
    render(<ProjectHome />);

    expect(screen.getByText('project-1')).toBeTruthy();
    expect(screen.getByText('Project Alpha')).toBeTruthy();

    const blueprintLabel = screen.getByText(
      'projectHome.actions.blueprint.label'
    );
    const blueprintButton = blueprintLabel.closest('button');
    expect(blueprintButton).not.toBeNull();
    fireEvent.click(blueprintButton as HTMLButtonElement);

    expect(navigateMock).toHaveBeenCalledWith(
      '/editor/project/project-1/blueprint'
    );
  });

  it('disables actions when no project id is available', () => {
    params = {};
    render(<ProjectHome />);

    const settingsButton = screen.getByRole('button', {
      name: 'projectHome.actions.settings.label',
    });
    const blueprintLabel = screen.getByText(
      'projectHome.actions.blueprint.label'
    );
    const blueprintButton = blueprintLabel.closest('button');

    expect(settingsButton.disabled).toBe(true);
    expect(blueprintButton).not.toBeNull();
    expect((blueprintButton as HTMLButtonElement).disabled).toBe(true);
  });
});
