import { BrowserRouter, Route, Routes } from 'react-router'
import './App.scss'
import Home from './home/Home'
import Editor from './editor/Editor'
import EditorHome from './editor/EditorHome'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path="editor" element={<Editor />} >
          <Route index element={<EditorHome />} />
          <Route path="project/:projectId" element={<Editor />} >
            <Route index element={<EditorHome />} />
            <Route path="blueprint" element={<div>Blueprint Editor</div>} />
            <Route path="nodegraph" element={<div>Node Graph Editor</div>} />
            <Route path="component" element={<div>Component Editor</div>} />
            <Route path="animation" element={<div>Animation Editor</div>} />
            <Route path="test" element={<div>Testing</div>} />
            <Route path="export" element={<div>Export Settings</div>} />
            <Route path="deployment" element={<div>Deployment Settings</div>} />
          </Route>
          <Route path="component" element={<div>Component Editor</div>} /> {/* Standalone components */}
          <Route path="blueprint" element={<div>Blueprint Editor</div>} /> {/* Standalone blueprints */}
          <Route path="settings" element={<div>Editor Settings</div>} />
        </Route>
        <Route path="community" element={<div>Community Page</div>} />
        <Route path="about" element={<div>About Page</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
