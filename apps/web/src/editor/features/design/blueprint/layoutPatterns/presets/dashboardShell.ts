import type { LayoutPatternDefinition } from '../layoutPattern.types';
import { createPatternRoleNode, createPatternRootNode } from './utils';

export const DASHBOARD_SHELL_LAYOUT_PATTERN: LayoutPatternDefinition<{
  gap: { kind: 'length'; label: 'Gap'; defaultValue: string };
  columns: {
    kind: 'enum';
    label: 'Main Columns';
    defaultValue: string;
    options: { label: string; value: string }[];
  };
}> = {
  id: 'dashboard-shell',
  name: 'Dashboard Shell',
  category: 'page',
  description: 'Top bar + cards grid + detail section.',
  schema: {
    gap: {
      kind: 'length',
      label: 'Gap',
      defaultValue: '12px',
    },
    columns: {
      kind: 'enum',
      label: 'Main Columns',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
    },
  },
  build: ({ createId, patternId, resolvedParams }) => {
    const root = createPatternRootNode({
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
            display: 'Flex',
            justifyContent: 'SpaceBetween',
            alignItems: 'Center',
            padding: '12px 16px',
            backgroundColor: 'var(--color-1)',
            borderRadius: '8px',
          },
        }),
        createPatternRoleNode({
          id: createId('MdrDiv'),
          patternId,
          role: 'main',
          props: {
            display: 'Grid',
            gap: resolvedParams.gap,
          },
        }),
        createPatternRoleNode({
          id: createId('MdrDiv'),
          patternId,
          role: 'content',
          props: {
            padding: '16px',
            backgroundColor: 'var(--color-0)',
            border: '1px solid var(--color-3)',
            borderRadius: '8px',
          },
        }),
      ],
    });

    return {
      ...root,
      children: (root.children ?? []).map((child) => {
        const role =
          (child.props?.dataAttributes as Record<string, string> | undefined)?.[
            'data-layout-role'
          ] ?? '';

        if (role === 'main') {
          return {
            ...child,
            style: {
              ...(child.style ?? {}),
              gridTemplateColumns: `repeat(${resolvedParams.columns}, minmax(0, 1fr))`,
            },
            children: [
              createPatternRoleNode({
                id: createId('MdrDiv'),
                patternId,
                role: 'left',
                props: {
                  height: '96px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-1)',
                },
              }),
              createPatternRoleNode({
                id: createId('MdrDiv'),
                patternId,
                role: 'content',
                props: {
                  height: '96px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-1)',
                },
              }),
              createPatternRoleNode({
                id: createId('MdrDiv'),
                patternId,
                role: 'right',
                props: {
                  height: '96px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-1)',
                },
              }),
            ],
          };
        }

        return child;
      }),
    };
  },
  update: (root, context) => {
    const nextChildren = (root.children ?? []).map((child) => {
      const role =
        (child.props?.dataAttributes as Record<string, string> | undefined)?.[
          'data-layout-role'
        ] ?? '';
      if (role !== 'main') return child;

      return {
        ...child,
        props: {
          ...(child.props ?? {}),
          gap: context.nextParams.gap,
        },
        style: {
          ...(child.style ?? {}),
          gridTemplateColumns: `repeat(${context.nextParams.columns}, minmax(0, 1fr))`,
        },
      };
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
