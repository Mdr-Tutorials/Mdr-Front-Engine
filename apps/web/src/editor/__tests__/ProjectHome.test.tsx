import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectHome from '../ProjectHome';
import { resetEditorStore } from '@/test-utils/editorStore';
import { useEditorStore } from '@/editor/store/useEditorStore';

const navigateMock = vi.fn();
const publishProjectMock = vi.fn();
let params: { projectId?: string } = { projectId: 'project-1' };

vi.mock('react-router', () => ({
    useNavigate: () => navigateMock,
    useParams: () => params,
}));

vi.mock('@/auth/useAuthStore', () => ({
    useAuthStore: (selector: (state: { token: string | null }) => unknown) =>
        selector({ token: 'token-1' }),
}));

vi.mock('../editorApi', () => ({
    editorApi: {
        publishProject: (...args: unknown[]) => publishProjectMock(...args),
    },
}));

describe('ProjectHome', () => {
    beforeEach(() => {
        navigateMock.mockClear();
        publishProjectMock.mockReset();
        params = { projectId: 'project-1' };
        resetEditorStore({
            projectsById: {
                'project-1': {
                    id: 'project-1',
                    name: 'Project Alpha',
                    description: 'Demo',
                    isPublic: false,
                    starsCount: 0,
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

    it('publishes a private project and keeps community entry in new tab', async () => {
        publishProjectMock.mockResolvedValue({
            project: {
                id: 'project-1',
                ownerId: 'usr-1',
                resourceType: 'project',
                name: 'Project Alpha',
                description: 'Demo',
                mir: {
                    version: '1.0',
                    ui: { root: { id: 'root', type: 'container' } },
                },
                isPublic: true,
                starsCount: 3,
                createdAt: '2026-02-07T00:00:00Z',
                updatedAt: '2026-02-07T00:00:00Z',
            },
        });

        render(<ProjectHome />);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'projectHome.visibility.publish',
            })
        );

        await waitFor(() => {
            expect(publishProjectMock).toHaveBeenCalledWith(
                'token-1',
                'project-1'
            );
        });

        expect(
            useEditorStore.getState().projectsById['project-1']?.isPublic
        ).toBe(true);
        const communityLink = screen.getByRole('link', {
            name: 'projectHome.visibility.openCommunity',
        });
        expect(communityLink.getAttribute('target')).toBe('_blank');
    });
});
