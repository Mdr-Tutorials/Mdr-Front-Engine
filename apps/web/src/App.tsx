import type { TFunction } from 'i18next'
import './App.scss'
import Home from './home/Home'
import Editor from './editor/Editor'
import EditorHome from './editor/EditorHome'
import BlueprintEditor from './editor/features/design/BlueprintEditor'

export const createRoutes = (t: TFunction) => [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: 'editor',
    element: <Editor />,
    children: [
      { index: true, element: <EditorHome /> },
      {
        path: 'project/:projectId',
        children: [
          { index: true, element: <EditorHome /> },
          { path: 'blueprint', element: <BlueprintEditor /> },
          { path: 'nodegraph', element: <div>{t('nodeGraphEditor', { ns: 'routes' })}</div> },
          { path: 'component', element: <div>{t('componentEditor', { ns: 'routes' })}</div> },
          { path: 'animation', element: <div>{t('animationEditor', { ns: 'routes' })}</div> },
          { path: 'test', element: <div>{t('testing', { ns: 'routes' })}</div> },
          { path: 'export', element: <div>{t('exportSettings', { ns: 'routes' })}</div> },
          { path: 'deployment', element: <div>{t('deploymentSettings', { ns: 'routes' })}</div> },
        ],
      },
      { path: 'component', element: <div>{t('componentEditor', { ns: 'routes' })}</div> },
      { path: 'blueprint', element: <BlueprintEditor /> },
      { path: 'settings', element: <div>{t('editorSettings', { ns: 'routes' })}</div> },
    ],
  },
  { path: 'community', element: <div>{t('communityPage', { ns: 'routes' })}</div> },
  { path: 'about', element: <div>{t('aboutPage', { ns: 'routes' })}</div> },
]
