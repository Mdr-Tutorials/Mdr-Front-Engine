import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@mdr/shared': resolve(__dirname, '../../packages/shared/src'),
      '@mdr/ui': resolve(__dirname, '../../packages/ui/src'),
      '@mdr/themes': resolve(__dirname, '../../packages/themes/'),
    },
  },
  server: {
    port: 5173,
  },
});