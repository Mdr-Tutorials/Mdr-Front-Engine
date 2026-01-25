import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { RouterProvider, createBrowserRouter } from 'react-router'
import './index.scss'
import '@mdr/themes'
import { createRoutes } from './App'
import { initI18n } from './i18n'

initI18n().then((i18n) => {
  const router = createBrowserRouter(createRoutes(i18n.t.bind(i18n)))
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </StrictMode>,
  )
})
