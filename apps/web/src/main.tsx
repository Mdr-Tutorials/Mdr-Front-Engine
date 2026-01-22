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
import { RouterProvider, createBrowserRouter } from 'react-router'
import './index.scss'
import '@mdr/themes'
import { routes } from './App'

const router = createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
