import type { Preview } from '@storybook/react';
// 引入 MemoryRouter
import { MemoryRouter } from 'react-router';
import '@mdr/themes';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // 添加装饰器
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default preview;
