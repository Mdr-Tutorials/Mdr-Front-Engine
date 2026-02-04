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
        'color-0': cssVarRgb('--color-0'),
        'color-1': cssVarRgb('--color-1'),
        'color-2': cssVarRgb('--color-2'),
        'color-3': cssVarRgb('--color-3'),
        'color-4': cssVarRgb('--color-4'),
        'color-5': cssVarRgb('--color-5'),
        'color-6': cssVarRgb('--color-6'),
        'color-7': cssVarRgb('--color-7'),
        'color-8': cssVarRgb('--color-8'),
        'color-9': cssVarRgb('--color-9'),
        'brand-primary': cssVarRgb('--color-0'),
        'node-bg': cssVarRgb('--color-node-bg'),
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
} satisfies Config;
