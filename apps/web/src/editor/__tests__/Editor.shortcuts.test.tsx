import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Editor from '@/editor/Editor';

const navigateMock = vi.fn();
const getProjectMock = vi.fn();
const mountGraphExecutionBridgeMock = vi.fn();
let params: { projectId?: string } = { projectId: 'project-1' };
let location = { pathname: '/editor/project/project-1/blueprint' };

vi.mock('react-router', () => ({
  useParams: () => params,
  useLocation: () => location,
  useNavigate: () => navigateMock,
  Outlet: () => <div data-testid="editor-outlet" />,
}));

vi.mock('@/auth/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: { token: string | null }) => unknown
  ): unknown => selector({ token: null }),
}));

vi.mock('../EditorBar/EditorBar', () => ({
  default: () => <div data-testid="editor-bar" />,
}));

vi.mock('../features/settings/SettingsEffects', () => ({
  SettingsEffects: () => null,
}));

vi.mock('../editorApi', () => ({
  editorApi: {
    getProject: (...args: unknown[]) => getProjectMock(...args),
  },
}));

vi.mock('@/core/executor/executor', () => ({
  mountGraphExecutionBridge: () => mountGraphExecutionBridgeMock(),
}));

vi.mock('../store/useEditorStore', () => ({
  useEditorStore: (
    selector: (state: {
      setProject: (...args: unknown[]) => void;
      setMirDoc: (...args: unknown[]) => void;
      setWorkspaceSnapshot: (...args: unknown[]) => void;
      setWorkspaceCapabilities: (...args: unknown[]) => void;
      clearWorkspaceState: (...args: unknown[]) => void;
    }) => unknown
  ) =>
    selector({
      setProject: vi.fn(),
      setMirDoc: vi.fn(),
      setWorkspaceSnapshot: vi.fn(),
      setWorkspaceCapabilities: vi.fn(),
      clearWorkspaceState: vi.fn(),
    }),
}));

vi.mock('../store/useSettingsStore', () => ({
  useSettingsStore: (
    selector: (state: {
      hydrateWorkspaceSettings: (...args: unknown[]) => void;
    }) => unknown
  ) =>
    selector({
      hydrateWorkspaceSettings: vi.fn(),
    }),
}));

describe('Editor shortcuts', () => {
  beforeEach(() => {
    params = { projectId: 'project-1' };
    location = { pathname: '/editor/project/project-1/blueprint' };
    navigateMock.mockReset();
    getProjectMock.mockReset();
    mountGraphExecutionBridgeMock.mockReset();
  });

  it('navigates to mapped project pages with Alt+1..Alt+9', () => {
    location = { pathname: '/editor/project/project-1' };
    render(<Editor />);

    fireEvent.keyDown(window, { key: '1', altKey: true });
    fireEvent.keyDown(window, { key: '2', altKey: true });
    fireEvent.keyDown(window, { key: '3', altKey: true });
    fireEvent.keyDown(window, { key: '4', altKey: true });
    fireEvent.keyDown(window, { key: '5', altKey: true });
    fireEvent.keyDown(window, { key: '6', altKey: true });
    fireEvent.keyDown(window, { key: '7', altKey: true });
    fireEvent.keyDown(window, { key: '8', altKey: true });
    fireEvent.keyDown(window, { key: '9', altKey: true });

    expect(navigateMock.mock.calls).toEqual([
      ['/editor/project/project-1/blueprint'],
      ['/editor/project/project-1/nodegraph'],
      ['/editor/project/project-1/animation'],
      ['/editor/project/project-1/component'],
      ['/editor/project/project-1/resources'],
      ['/editor/project/project-1/test'],
      ['/editor/project/project-1/export'],
      ['/editor/project/project-1/deployment'],
    ]);
  });

  it('does not navigate without project id', () => {
    params = {};
    render(<Editor />);

    fireEvent.keyDown(window, { key: '1', altKey: true });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('does not navigate when target route is current path', () => {
    location = { pathname: '/editor/project/project-1/blueprint' };
    render(<Editor />);

    fireEvent.keyDown(window, { key: '2', altKey: true });

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
