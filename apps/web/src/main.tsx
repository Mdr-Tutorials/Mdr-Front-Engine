import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import '@mdr/themes'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
