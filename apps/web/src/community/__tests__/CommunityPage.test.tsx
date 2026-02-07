import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityPage } from '../CommunityPage';

const listProjectsMock = vi.fn();

vi.mock('../communityApi', () => ({
  communityApi: {
    listProjects: (...args: unknown[]) => listProjectsMock(...args),
  },
}));

describe('CommunityPage', () => {
  beforeEach(() => {
    listProjectsMock.mockReset();
  });

  it('renders community cards from backend', async () => {
    listProjectsMock.mockResolvedValue({
      projects: [
        {
          id: 'community-1',
          resourceType: 'project',
          name: 'Monochrome Studio',
          description: 'A public dashboard template.',
          authorId: 'usr-1',
          authorName: 'Alice',
          starsCount: 42,
          createdAt: '2026-02-06T09:00:00Z',
          updatedAt: '2026-02-07T10:00:00Z',
        },
      ],
      page: 1,
      pageSize: 12,
      sort: 'latest',
    });

    render(<CommunityPage />);

    expect(
      screen.getByRole('link', { name: 'backHome' }).getAttribute('href')
    ).toBe('/');

    await waitFor(() => {
      expect(screen.getByText('Monochrome Studio')).toBeTruthy();
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(
        screen
          .getByRole('link', { name: /Monochrome Studio/ })
          .getAttribute('href')
      ).toBe('/community/community-1');
    });
  });

  it('passes filter params when controls change', async () => {
    listProjectsMock.mockResolvedValue({
      projects: [],
      page: 1,
      pageSize: 12,
      sort: 'latest',
    });

    render(<CommunityPage />);

    await waitFor(() => {
      expect(listProjectsMock).toHaveBeenCalled();
    });

    fireEvent.change(
      screen.getByPlaceholderText('search.placeholder'),
      { target: { value: 'graph' } }
    );
    fireEvent.change(screen.getByDisplayValue('filter.all'), {
      target: { value: 'nodegraph' },
    });
    fireEvent.change(screen.getByDisplayValue('sort.latest'), {
      target: { value: 'popular' },
    });

    await waitFor(() => {
      expect(listProjectsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          keyword: 'graph',
          resourceType: 'nodegraph',
          sort: 'popular',
          page: 1,
          pageSize: 12,
        })
      );
    });
  });
});

