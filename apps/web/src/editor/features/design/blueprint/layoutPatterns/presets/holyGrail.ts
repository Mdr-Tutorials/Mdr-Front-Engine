import type { LayoutPatternDefinition } from '../layoutPattern.types';
import { createPatternRoleNode, createPatternRootNode } from './utils';

export const HOLY_GRAIL_LAYOUT_PATTERN: LayoutPatternDefinition<{
  gap: { kind: 'length'; label: 'Gap'; defaultValue: string };
  sidebarWidth: {
    kind: 'length';
    label: 'Sidebar Width';
    defaultValue: string;
  };
}> = {
  id: 'holy-grail',
  name: 'Holy Grail',
  category: 'page',
  description: 'Header + sidebar + main + footer layout.',
  schema: {
    gap: {
      kind: 'length',
      label: 'Gap',
      defaultValue: '12px',
    },
    sidebarWidth: {
      kind: 'length',
      label: 'Sidebar Width',
      defaultValue: '240px',
    },
  },
  build: ({ createId, patternId, resolvedParams }) =>
    createPatternRootNode({
      id: createId('MdrDiv'),
      patternId,
      props: {
        display: 'Flex',
        flexDirection: 'Column',
        gap: resolvedParams.gap,
      },
      children: [
        createPatternRoleNode({
          id: createId('MdrDiv'),
          patternId,
          role: 'header',
          props: {
            padding: '12px 16px',
            backgroundColor: 'var(--color-1)',
            borderRadius: '8px',
          },
        }),
        createPatternRoleNode({
          id: createId('MdrDiv'),
          patternId,
          role: 'content',
          props: {
            display: 'Flex',
            gap: resolvedParams.gap,
          },
          children: [
            createPatternRoleNode({
              id: createId('MdrDiv'),
              patternId,
              role: 'sidebar',
              props: {
                width: resolvedParams.sidebarWidth,
                padding: '12px',
                backgroundColor: 'var(--color-1)',
                borderRadius: '8px',
              },
            }),
            createPatternRoleNode({
              id: createId('MdrDiv'),
              patternId,
              role: 'main',
              props: {
                display: 'Block',
                padding: '12px',
                backgroundColor: 'var(--color-0)',
                border: '1px solid var(--color-3)',
                borderRadius: '8px',
                width: '100%',
              },
            }),
          ],
        }),
        createPatternRoleNode({
          id: createId('MdrDiv'),
          patternId,
          role: 'footer',
          props: {
            padding: '12px 16px',
            backgroundColor: 'var(--color-1)',
            borderRadius: '8px',
          },
        }),
      ],
    }),
  update: (root, context) => {
    const nextChildren = (root.children ?? []).map((child) => {
      const role =
        (child.props?.dataAttributes as Record<string, string> | undefined)?.[
          'data-layout-role'
        ] ?? '';

      if (role === 'content') {
        const contentChildren = (child.children ?? []).map((contentChild) => {
          const contentRole =
            (
              contentChild.props?.dataAttributes as
                | Record<string, string>
                | undefined
            )?.['data-layout-role'] ?? '';
          if (contentRole === 'sidebar') {
            return {
              ...contentChild,
              props: {
                ...(contentChild.props ?? {}),
                width: context.nextParams.sidebarWidth,
              },
            };
          }
          return contentChild;
        });
        return {
          ...child,
          props: {
            ...(child.props ?? {}),
            gap: context.nextParams.gap,
          },
          children: contentChildren,
        };
      }

      return child;
    });

    return {
      ...root,
      props: {
        ...(root.props ?? {}),
        gap: context.nextParams.gap,
      },
      children: nextChildren,
    };
  },
};
