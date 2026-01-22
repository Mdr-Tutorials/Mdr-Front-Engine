import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [react(), nodePolyfills({
    globals: {
      Buffer: true,
      global: true,
      process: true,
    },
    protocolImports: true,
  })],
  define: {
    'process.cwd': '(() => "/")',
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@mdr/shared': resolve(__dirname, '../../packages/shared/src'),
      '@mdr/ui': resolve(__dirname, '../../packages/ui/src'),
      '@mdr/themes': resolve(__dirname, '../../packages/themes/'),
    },
  },
  // optimizeDeps: {
  //   // 关键：排除 mitosis，防止 Vite 损坏它的内部依赖
  //   exclude: ['@builder.io/mitosis']
  // },
  server: {
    port: 5173,
  },
});