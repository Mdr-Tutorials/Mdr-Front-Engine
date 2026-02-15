import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityDetailPage } from '../CommunityDetailPage';

const getProjectMock = vi.fn();
const createProjectMock = vi.fn();
const navigateMock = vi.fn();
const setProjectMock = vi.fn();
const setMirDocMock = vi.fn();
let authState: { token: string | null; user: { id: string } | null } = {
  token: 'token-1',
  user: { id: 'usr-2' },
};

vi.mock('../communityApi', () => ({
  communityApi: {
    getProject: (...args: unknown[]) => getProjectMock(...args),
  },
}));

vi.mock('react-router', () => ({
  useParams: () => ({ projectId: 'community-1' }),
  useNavigate: () => navigateMock,
}));

vi.mock('@/mir/renderer/MIRRenderer', () => ({
  MIRRenderer: () => <div data-testid="mir-renderer" />,
}));

vi.mock('@/auth/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: {
      token: string | null;
      user: { id: string } | null;
    }) => unknown
  ) => selector(authState),
}));

vi.mock('@/editor/editorApi', () => ({
  editorApi: {
    createProject: (...args: unknown[]) => createProjectMock(...args),
  },
}));

vi.mock('@/editor/store/useEditorStore', () => ({
  useEditorStore: (
    selector: (state: { setProject: unknown; setMirDoc: unknown }) => unknown
  ) =>
    selector({
      setProject: setProjectMock,
      setMirDoc: setMirDocMock,
    }),
}));

describe('CommunityDetailPage', () => {
  beforeEach(() => {
    getProjectMock.mockReset();
    createProjectMock.mockReset();
    navigateMock.mockReset();
    setProjectMock.mockReset();
    setMirDocMock.mockReset();
    authState = {
      token: 'token-1',
      user: { id: 'usr-2' },
    };
  });

  it('renders project detail payload', async () => {
    getProjectMock.mockResolvedValue({
      project: {
        id: 'community-1',
        ownerId: 'usr-1',
        resourceType: 'project',
        name: 'Public System',
        description: 'Read-only preview sample.',
        mir: {
          version: '1.0',
          ui: { root: { id: 'root', type: 'container' } },
        },
        isPublic: true,
        starsCount: 9,
        createdAt: '2026-02-07T00:00:00Z',
        updatedAt: '2026-02-07T01:00:00Z',
        authorName: 'Alice',
      },
    });

    render(<CommunityDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Public System')).toBeTruthy();
      expect(screen.getByText(/Alice/)).toBeTruthy();
      expect(screen.getByTestId('mir-renderer')).toBeTruthy();
    });
  });

  it('shows API error state', async () => {
    getProjectMock.mockRejectedValue(new Error('detail failed'));

    render(<CommunityDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('detail failed')).toBeTruthy();
    });
  });

  it('clones project into workspace and navigates to editor', async () => {
    getProjectMock.mockResolvedValue({
      project: {
        id: 'community-1',
        ownerId: 'usr-1',
        resourceType: 'project',
        name: 'Public System',
        description: 'Read-only preview sample.',
        mir: {
          version: '1.0',
          ui: { root: { id: 'root', type: 'container' } },
        },
        isPublic: true,
        starsCount: 9,
        createdAt: '2026-02-07T00:00:00Z',
        updatedAt: '2026-02-07T01:00:00Z',
        authorName: 'Alice',
      },
    });
    createProjectMock.mockResolvedValue({
      project: {
        id: 'clone-1',
        ownerId: 'usr-2',
        resourceType: 'project',
        name: 'Public System (Copy)',
        description: 'Read-only preview sample.',
        mir: {
          version: '1.0',
          ui: { root: { id: 'root', type: 'container' } },
        },
        isPublic: false,
        starsCount: 0,
        createdAt: '2026-02-07T02:00:00Z',
        updatedAt: '2026-02-07T02:00:00Z',
      },
    });

    render(<CommunityDetailPage />);

    const cloneButton = await screen.findByRole('button', {
      name: 'detail.clone',
    });
    fireEvent.click(cloneButton);

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith(
        'token-1',
        expect.objectContaining({
          name: 'Public System (Copy)',
          resourceType: 'project',
          isPublic: false,
        })
      );
      expect(setProjectMock).toHaveBeenCalled();
      expect(setMirDocMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith(
        '/editor/project/clone-1/blueprint'
      );
    });
  });

  it('blocks cloning when project belongs to current user', async () => {
    authState = {
      token: 'token-1',
      user: { id: 'usr-1' },
    };
    getProjectMock.mockResolvedValue({
      project: {
        id: 'community-1',
        ownerId: 'usr-1',
        resourceType: 'project',
        name: 'My Public Project',
        description: 'Owned by current user.',
        mir: {
          version: '1.0',
          ui: { root: { id: 'root', type: 'container' } },
        },
        isPublic: true,
        starsCount: 2,
        createdAt: '2026-02-07T00:00:00Z',
        updatedAt: '2026-02-07T01:00:00Z',
        authorName: 'Alice',
      },
    });

    render(<CommunityDetailPage />);
    const cloneButton = await screen.findByRole('button', {
      name: 'detail.clone',
    });
    fireEvent.click(cloneButton);

    await waitFor(() => {
      expect(createProjectMock).not.toHaveBeenCalled();
      expect(screen.getByText('detail.error.cloneSelf')).toBeTruthy();
    });
  });
});
