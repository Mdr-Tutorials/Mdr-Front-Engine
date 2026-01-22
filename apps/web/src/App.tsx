import './App.scss'
import Home from './home/Home'
import Editor from './editor/Editor'
import EditorHome from './editor/EditorHome'
import BlueprintEditor from './editor/features/design/BlueprintEditor'

export const routes = [
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
          { path: 'nodegraph', element: <div>Node Graph Editor</div> },
          { path: 'component', element: <div>Component Editor</div> },
          { path: 'animation', element: <div>Animation Editor</div> },
          { path: 'test', element: <div>Testing</div> },
          { path: 'export', element: <div>Export Settings</div> },
          { path: 'deployment', element: <div>Deployment Settings</div> },
        ],
      },
      { path: 'component', element: <div>Component Editor</div> },
      { path: 'blueprint', element: <BlueprintEditor /> },
      { path: 'settings', element: <div>Editor Settings</div> },
    ],
  },
  { path: 'community', element: <div>Community Page</div> },
  { path: 'about', element: <div>About Page</div> },
]
