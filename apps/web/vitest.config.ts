import { defineConfig } from 'vitest/config';
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        'src/editor/features/design/**': {
          statements: 80,
          branches: 60,
          functions: 60,
          lines: 80,
        },
      },
    },
  },
});
