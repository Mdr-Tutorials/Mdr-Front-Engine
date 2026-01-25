if (typeof window !== 'undefined') {
  // 模拟 Node 环境中的 process 对象
  window.process = {
    env: { NODE_ENV: 'development' },
    cwd: () => '/',
    platform: 'browser',
    nextTick: (cb: any) => setTimeout(cb, 0),
    version: '',
    versions: {},
    binding: () => { throw new Error('No binding'); },
  } as any;

  // 模拟全局 global 变量
  window.global = window;
}


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
