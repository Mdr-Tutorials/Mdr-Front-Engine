import type { Config } from 'tailwindcss';

const cssVarRgb = (name: string) => `rgb(var(${name}-rgb) / <alpha-value>)`;

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/shared/src/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: cssVarRgb('--bg-canvas'),
        panel: cssVarRgb('--bg-panel'),
        raised: cssVarRgb('--bg-raised'),
        muted: cssVarRgb('--text-muted'),
        secondary: cssVarRgb('--text-secondary'),
        primary: cssVarRgb('--text-primary'),
        'border-default': cssVarRgb('--border-default'),
        'border-strong': cssVarRgb('--border-strong'),
        accent: cssVarRgb('--accent-color'),
        'node-bg': cssVarRgb('--node-bg'),
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
} satisfies Config;
