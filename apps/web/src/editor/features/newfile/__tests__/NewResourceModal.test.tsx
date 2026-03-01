import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewResourceModal from '@/editor/features/newfile/NewResourceModal';
import { resetEditorStore } from '@/test-utils/editorStore';
import { useEditorStore } from '@/editor/store/useEditorStore';

const navigateMock = vi.fn();
const createProjectMock = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/auth/useAuthStore', () => ({
  useAuthStore: (selector: (state: { token: string | null }) => unknown) =>
    selector({ token: 'token-1' }),
}));

vi.mock('@/editor/editorApi', () => ({
  editorApi: {
    createProject: (...args: unknown[]) => createProjectMock(...args),
  },
}));

vi.mock('@mdr/ui', () => ({
  MdrButton: ({
    text,
    onClick,
    disabled,
  }: {
    text: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
  MdrInput: ({
    value,
    onChange,
    ...rest
  }: {
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...rest}
    />
  ),
  MdrTextarea: ({
    value,
    onChange,
    ...rest
  }: {
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <textarea
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...rest}
    />
  ),
}));

describe('NewResourceModal', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    createProjectMock.mockReset();
    resetEditorStore();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <NewResourceModal open={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('creates a project in backend and navigates to blueprint', async () => {
    const onClose = vi.fn();
    createProjectMock.mockResolvedValue({
      project: {
        id: 'project-1',
        name: 'My Project',
        description: 'Demo',
        resourceType: 'project',
        isPublic: false,
        starsCount: 0,
        updatedAt: '2026-02-07T00:00:00Z',
        createdAt: '2026-02-07T00:00:00Z',
      },
    });

    render(<NewResourceModal open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('modals.newResource.nameLabel'), {
      target: { value: 'My Project' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'modals.actions.create' })
    );

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalled();
    });

    const project = useEditorStore.getState().projectsById['project-1'];
    expect(project?.name).toBe('My Project');
    expect(navigateMock).toHaveBeenCalledWith(
      '/editor/project/project-1/blueprint'
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('creates a component resource and navigates to component editor', async () => {
    const onClose = vi.fn();
    createProjectMock.mockResolvedValue({
      project: {
        id: 'component-1',
        name: 'Untitled',
        resourceType: 'component',
        isPublic: false,
        starsCount: 0,
        updatedAt: '2026-02-07T00:00:00Z',
        createdAt: '2026-02-07T00:00:00Z',
      },
    });

    render(<NewResourceModal open onClose={onClose} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'modals.newComponent.title' })
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'modals.actions.create' })
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        '/editor/project/component-1/component'
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('passes isPublic=true when publish checkbox is enabled', async () => {
    createProjectMock.mockResolvedValue({
      project: {
        id: 'project-public-1',
        name: 'Public Demo',
        resourceType: 'project',
        isPublic: true,
        starsCount: 0,
        updatedAt: '2026-02-07T00:00:00Z',
        createdAt: '2026-02-07T00:00:00Z',
      },
    });

    render(<NewResourceModal open onClose={() => {}} />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(
      screen.getByRole('button', { name: 'modals.actions.create' })
    );

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith(
        'token-1',
        expect.objectContaining({
          resourceType: 'project',
          isPublic: true,
        })
      );
    });
  });
});
