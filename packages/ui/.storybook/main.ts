import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig, type UserConfig } from 'vite';

function shouldIgnoreRollupWarning(warning: {
  code?: string;
  message?: string;
}) {
  return (
    warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
    warning.message?.includes('"use client"') &&
    warning.message.includes('react-router')
  );
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (baseConfig) =>
    mergeConfig(baseConfig, {
      build: {
        rollupOptions: {
          onwarn(warning, warn) {
            if (shouldIgnoreRollupWarning(warning)) {
              return;
            }

            warn(warning);
          },
        },
      },
    } satisfies UserConfig),
};

export default config;
