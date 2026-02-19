import { Suspense, lazy, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import './App.scss';
import Home from './home/Home';
import { AuthPage } from './auth/AuthPage';
import { ProfilePage } from './auth/ProfilePage';
import { CommunityPage } from './community/CommunityPage';
import { CommunityDetailPage } from './community/CommunityDetailPage';

const Editor = lazy(() => import('./editor/Editor'));
const EditorHome = lazy(() => import('./editor/EditorHome'));
const ProjectHome = lazy(() => import('./editor/ProjectHome'));
const BlueprintEditor = lazy(
  () => import('./editor/features/design/BlueprintEditor')
);
const NodeGraphEditor = lazy(
  () => import('./editor/features/development/NodeGraphEditor')
);
const ProjectResources = lazy(() =>
  import('./editor/features/resources/ProjectResources').then((module) => ({
    default: module.ProjectResources,
  }))
);
const EditorSettingsPage = lazy(() =>
  import('./editor/features/settings/EditorSettingsPage').then((module) => ({
    default: module.EditorSettingsPage,
  }))
);
const ProjectSettingsPage = lazy(() =>
  import('./editor/features/settings/ProjectSettingsPage').then((module) => ({
    default: module.ProjectSettingsPage,
  }))
);
const ExportMirPage = lazy(() =>
  import('./editor/features/export/ExportMirPage').then((module) => ({
    default: module.ExportMirPage,
  }))
);

const editorRouteFallback = (
  <div className="px-4 py-3 text-xs text-(--color-7)">Loading editor...</div>
);

const withEditorSuspense = (node: ReactNode) => (
  <Suspense fallback={editorRouteFallback}>{node}</Suspense>
);

export const createRoutes = (t: TFunction) => [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: 'auth',
    element: <AuthPage />,
  },
  {
    path: 'profile',
    element: <ProfilePage />,
  },
  {
    path: 'editor',
    element: withEditorSuspense(<Editor />),
    children: [
      { index: true, element: withEditorSuspense(<EditorHome />) },
      {
        path: 'project/:projectId',
        children: [
          { index: true, element: withEditorSuspense(<ProjectHome />) },
          {
            path: 'blueprint',
            element: withEditorSuspense(<BlueprintEditor />),
          },
          {
            path: 'nodegraph',
            element: withEditorSuspense(<NodeGraphEditor />),
          },
          {
            path: 'component',
            element: (
              <div>
                {t('componentEditor', 'componentEditor', { ns: 'routes' })}
              </div>
            ),
          },
          {
            path: 'animation',
            element: (
              <div>
                {t('animationEditor', 'animationEditor', { ns: 'routes' })}
              </div>
            ),
          },
          {
            path: 'resources',
            element: withEditorSuspense(<ProjectResources />),
          },
          {
            path: 'test',
            element: <div>{t('testing', 'testing', { ns: 'routes' })}</div>,
          },
          {
            path: 'export',
            element: withEditorSuspense(<ExportMirPage />),
          },
          {
            path: 'deployment',
            element: (
              <div>
                {t('deploymentSettings', 'deploymentSettings', {
                  ns: 'routes',
                })}
              </div>
            ),
          },
          {
            path: 'settings',
            element: withEditorSuspense(<ProjectSettingsPage />),
          },
        ],
      },
      {
        path: 'component',
        element: (
          <div>{t('componentEditor', 'componentEditor', { ns: 'routes' })}</div>
        ),
      },
      {
        path: 'blueprint',
        element: withEditorSuspense(<BlueprintEditor />),
      },
      {
        path: 'nodegraph',
        element: withEditorSuspense(<NodeGraphEditor />),
      },
      {
        path: 'settings',
        element: withEditorSuspense(<EditorSettingsPage />),
      },
    ],
  },
  {
    path: 'community',
    element: <CommunityPage />,
  },
  {
    path: 'community/:projectId',
    element: <CommunityDetailPage />,
  },
  {
    path: 'about',
    element: <div>{t('aboutPage', 'aboutPage', { ns: 'routes' })}</div>,
  },
];
