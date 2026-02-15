import { type MIRDocument } from '@/core/types/engine.types';

export const testDoc: MIRDocument = {
  version: '1.0',
  ui: {
    root: {
      id: 'root',
      type: 'MdrDiv',
      props: {
        display: 'Flex',
        flexDirection: 'Column',
        alignItems: 'Center',
        gap: '20px',
        padding: '40px',
        backgroundColor: '#e4ffb4',
        border: '1px solid #ccc',
      },
      style: {
        minHeight: '50vh',
      },
      children: [
        {
          id: 'h1',
          type: 'MdrText',
          text: 'MDR 渲染引擎测试',
          props: {
            size: 'Big',
            weight: 'Bold',
          },
          style: {
            display: 'block',
            marginBottom: '20px',
          },
        },
        {
          id: 'countDisplay',
          type: 'MdrDiv',
          props: {
            display: 'Flex',
            alignItems: 'Center',
            gap: '8px',
          },
          children: [
            {
              id: 'p',
              type: 'MdrText',
              text: '当前计数：',
              props: { size: 'Large' },
            },
            {
              id: 'countValue',
              type: 'MdrText',
              text: { $state: 'count' },
              props: { size: 'Large', weight: 'Bold' },
            },
          ],
        },
        {
          id: 'btn',
          type: 'MdrButton',
          text: { $param: 'buttonText' },
          props: { size: 'Medium', category: 'Primary' },
          events: {
            click: {
              trigger: 'click',
              action: 'increment',
            },
          },
        },
        {
          id: 'input_1',
          type: 'MdrInput',
          props: {
            placeholder: '搜索项目...',
            maxLength: 20,
            size: 'Medium',
          },
        },
      ],
    },
  },
  logic: {
    state: {
      count: { initial: 0 },
    },
    props: {
      buttonText: { type: 'string', default: 'Click Me' },
    },
  },
};
