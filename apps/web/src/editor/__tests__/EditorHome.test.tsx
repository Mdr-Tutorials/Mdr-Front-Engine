import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditorHome from '../EditorHome';
import { useEditorStore } from '@/editor/store/useEditorStore';

vi.mock('../features/newfile/NewResourceModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="resource-modal" /> : null,
}));
const navigateMock = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
}));

const listProjectsMock = vi.fn();
const publishProjectMock = vi.fn();
const deleteProjectMock = vi.fn();
const updateProjectMock = vi.fn();

vi.mock('../editorApi', () => ({
  editorApi: {
    listProjects: (...args: unknown[]) => listProjectsMock(...args),
    publishProject: (...args: unknown[]) => publishProjectMock(...args),
    deleteProject: (...args: unknown[]) => deleteProjectMock(...args),
    updateProject: (...args: unknown[]) => updateProjectMock(...args),
  },
}));

vi.mock('@/auth/useAuthStore', () => ({
  useAuthStore: (selector: (state: { token: string | null }) => unknown) =>
    selector({ token: 'token-1' }),
}));

describe('EditorHome', () => {
  beforeEach(() => {
    listProjectsMock.mockReset();
    publishProjectMock.mockReset();
    deleteProjectMock.mockReset();
    updateProjectMock.mockReset();
    navigateMock.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    useEditorStore.setState({ projectsById: {} });
  });

  it('opens the new resource modal when clicking the create button', async () => {
    listProjectsMock.mockImplementation(
      () => new Promise<{ projects: [] }>(() => undefined)
    );
    render(<EditorHome />);

    fireEvent.click(
      screen.getByRole('button', { name: 'home.actions.newProject' })
    );

    expect(screen.getByTestId('resource-modal')).toBeTruthy();
  });

  it('renders projects from backend sorted by updated time', async () => {
    listProjectsMock.mockResolvedValue({
      projects: [
        {
          id: 'p2',
          resourceType: 'project',
          name: 'Older Project',
          updatedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'p1',
          resourceType: 'project',
          name: 'Latest Project',
          updatedAt: '2026-02-01T00:00:00Z',
          createdAt: '2026-02-01T00:00:00Z',
        },
      ],
    });

    render(<EditorHome />);

    await waitFor(() => {
      const titles = screen
        .getAllByRole('heading', { level: 3 })
        .map((node) => node.textContent);
      expect(titles[0]).toBe('Latest Project');
    });
  });

  it('can publish and delete project from card actions', async () => {
    listProjectsMock.mockResolvedValue({
      projects: [
        {
          id: 'p1',
          resourceType: 'project',
          name: 'Project One',
          description: 'Demo',
          isPublic: false,
          starsCount: 0,
          updatedAt: '2026-02-01T00:00:00Z',
          createdAt: '2026-02-01T00:00:00Z',
        },
      ],
    });
    publishProjectMock.mockResolvedValue({
      project: {
        id: 'p1',
        ownerId: 'usr-1',
        resourceType: 'project',
        name: 'Project One',
        description: 'Demo',
        mir: {
          version: '1.0',
          ui: { root: { id: 'root', type: 'container' } },
        },
        isPublic: true,
        starsCount: 0,
        updatedAt: '2026-02-03T00:00:00Z',
        createdAt: '2026-02-01T00:00:00Z',
      },
    });
    deleteProjectMock.mockResolvedValue(undefined);

    render(<EditorHome />);

    await screen.findByText('Project One');
    fireEvent.click(
      screen.getByRole('button', { name: 'home.card.moreActions' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'home.card.publish' }));

    await waitFor(() => {
      expect(publishProjectMock).toHaveBeenCalledWith('token-1', 'p1');
    });

    if (!screen.queryByRole('button', { name: 'home.card.delete' })) {
      fireEvent.click(
        screen.getByRole('button', { name: 'home.card.moreActions' })
      );
    }
    fireEvent.click(screen.getByRole('button', { name: 'home.card.delete' }));

    await waitFor(() => {
      expect(deleteProjectMock).toHaveBeenCalledWith('token-1', 'p1');
      expect(screen.queryByText('Project One')).toBeNull();
    });
  });

  it('opens exit modal on Escape and returns home on confirm', async () => {
    listProjectsMock.mockResolvedValue({ projects: [] });
    render(<EditorHome />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('bar.exitTitle')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Enter' });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  it('renames project inline from card title action', async () => {
    listProjectsMock.mockResolvedValue({
      projects: [
        {
          id: 'p1',
          resourceType: 'project',
          name: 'Project One',
          description: 'Demo',
          isPublic: false,
          starsCount: 0,
          updatedAt: '2026-02-01T00:00:00Z',
          createdAt: '2026-02-01T00:00:00Z',
        },
      ],
    });
    updateProjectMock.mockResolvedValue({
      project: {
        id: 'p1',
        ownerId: 'usr-1',
        resourceType: 'project',
        name: 'Project Renamed',
        description: 'Demo',
        mir: {
          version: '1.0',
          ui: { root: { id: 'root', type: 'container' } },
        },
        isPublic: false,
        starsCount: 0,
        updatedAt: '2026-02-04T00:00:00Z',
        createdAt: '2026-02-01T00:00:00Z',
      },
    });

    render(<EditorHome />);

    await screen.findByText('Project One');
    fireEvent.click(screen.getByRole('button', { name: 'home.card.rename' }));

    const renameInput = screen.getByRole('textbox', {
      name: 'home.card.renameInput',
    });
    fireEvent.change(renameInput, { target: { value: 'Project Renamed' } });
    fireEvent.keyDown(renameInput, { key: 'Enter' });

    await waitFor(() => {
      expect(updateProjectMock).toHaveBeenCalledWith('token-1', 'p1', {
        name: 'Project Renamed',
      });
      expect(screen.getByText('Project Renamed')).toBeTruthy();
    });
  });
});
