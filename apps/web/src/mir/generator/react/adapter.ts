import type { TargetAdapter } from '../core/adapter';

export const reactAdapter: TargetAdapter = {
  id: 'react-default',
  resolveNode: (node) => {
    if (node.type === 'container') {
      return { element: 'div' };
    }

    if (node.type.startsWith('Mdr')) {
      return {
        element: node.type,
        imports: [
          {
            source: '@mdr/ui',
            kind: 'named',
            imported: node.type,
          },
        ],
      };
    }

    if (node.type === 'RadixLabel') {
      return {
        element: 'Label.Root',
        imports: [
          {
            source: '@radix-ui/react-label',
            kind: 'namespace',
            imported: 'Label',
          },
        ],
      };
    }

    if (node.type.startsWith('Antd')) {
      const bareType = node.type.slice('Antd'.length);
      if (bareType === 'FormItem') {
        return {
          element: 'Form.Item',
          imports: [
            {
              source: 'antd',
              kind: 'named',
              imported: 'Form',
            },
          ],
        };
      }
      return {
        element: bareType || 'div',
        imports: bareType
          ? [
              {
                source: 'antd',
                kind: 'named',
                imported: bareType,
              },
            ]
          : undefined,
      };
    }

    if (node.type.startsWith('Mui')) {
      const bareType = node.type.slice('Mui'.length);
      return {
        element: bareType || 'div',
        imports: bareType
          ? [
              {
                source: `@mui/material/${bareType}`,
                kind: 'default',
                imported: bareType,
              },
            ]
          : undefined,
      };
    }

    if (node.type.startsWith('Radix')) {
      return {
        element: 'div',
        diagnostics: [
          {
            code: 'REACT_ADAPTER_UNKNOWN_RADIX_COMPONENT',
            severity: 'warning',
            source: 'adapter',
            message: `No React adapter mapping found for "${node.type}".`,
            path: node.path,
            suggestion:
              'Add a mapping in react adapter or provide a custom adapter plugin.',
          },
        ],
      };
    }

    return { element: node.type || 'div' };
  },
};
