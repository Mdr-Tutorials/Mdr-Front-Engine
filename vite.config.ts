import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),  // 路径别名
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {  // 代码分割（构建阶段）
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    sourcemap: true,  // Source Map（调试）
  },
  server: {
    port: 5173,
    hmr: { overlay: true },  // 错误叠加提示
  },
  optimizeDeps: {
    include: ['zustand'],  // 预优化依赖
  },
});