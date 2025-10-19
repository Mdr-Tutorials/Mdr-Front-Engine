import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Home from './home/Home'
import Editor from './features/design/Editor'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/*" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
