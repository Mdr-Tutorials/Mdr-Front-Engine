import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MdrIcon } from '@mdr/ui';
import {
  createNodeFromPaletteItem,
  getTreeDropPlacement,
} from '@/editor/features/design/BlueprintEditor';
import { getComponentGroups } from '@/editor/features/design/BlueprintEditor.data';
import {
  registerComponentGroup,
  resetComponentRegistry,
} from '@/editor/features/design/blueprint/registry';
import { MIRRenderer } from '@/mir/renderer/MIRRenderer';
import { mdrAdapter } from '@/mir/renderer/registry';
import { createMirDoc } from '@/test-utils/editorStore';

describe('createNodeFromPaletteItem', () => {
  const paletteItems = getComponentGroups().flatMap((group) => group.items);

  it('applies heading variantProps.level when provided', () => {
    const createId = (type: string) => `${type}-1`;
    const node = createNodeFromPaletteItem('heading', createId, {
      level: 5,
    });
    expect(node.type).toBe('MdrHeading');
    expect(node.props?.level).toBe(5);
  });

  it('coerces heading variantProps.level when it is a string', () => {
    const createId = (type: string) => `${type}-1`;
    const node = createNodeFromPaletteItem('heading', createId, {
      level: '6',
    });
    expect(node.props?.level).toBe(6);
  });

  it('creates nodes for every palette item', () => {
    const createId = (type: string) => `${type}-1`;
    paletteItems.forEach((item) => {
      const node = createNodeFromPaletteItem(item.id, createId);
      expect(node.id).toBe(`${node.type}-1`);
    });
  });

  it('creates nodes for palette variants and size selections', () => {
    const createId = (type: string) => `${type}-1`;
    paletteItems.forEach((item) => {
      const selectedSize = item.sizeOptions?.[0]?.value;
      if (selectedSize) {
        const node = createNodeFromPaletteItem(
          item.id,
          createId,
          undefined,
          selectedSize
        );
        expect(node.id).toBe(`${node.type}-1`);
      }
      item.variants?.forEach((variant) => {
        const node = createNodeFromPaletteItem(
          item.id,
          createId,
          variant.props,
          selectedSize
        );
        expect(node.id).toBe(`${node.type}-1`);
      });
    });
  });

  it('creates icon nodes with default icon props', () => {
    const createId = (type: string) => `${type}-1`;

    const iconNode = createNodeFromPaletteItem('icon', createId);
    expect(iconNode.type).toBe('MdrIcon');
    expect(iconNode.props?.iconRef).toEqual({
      provider: 'lucide',
      name: 'Sparkles',
    });

    const iconLinkNode = createNodeFromPaletteItem('icon-link', createId);
    expect(iconLinkNode.type).toBe('MdrIconLink');
    expect(iconLinkNode.props?.iconRef).toEqual({
      provider: 'lucide',
      name: 'Sparkles',
    });
    expect(iconLinkNode.props?.to).toBe('');
  });

  it('creates external nodes with runtimeType and stable prop merging', () => {
    const createId = (type: string) => `${type}-1`;
    try {
      registerComponentGroup({
        id: 'external-test-group',
        title: 'External',
        source: 'external',
        items: [
          {
            id: 'external-button',
            name: 'External Button',
            preview: <div>External Button</div>,
            runtimeType: 'MuiButton',
            defaultProps: {
              variant: 'contained',
              size: 'small',
              disabled: false,
            },
          },
        ],
      });

      const node = createNodeFromPaletteItem(
        'external-button',
        createId,
        { variant: 'outlined' },
        'large'
      );
      expect(node.type).toBe('MuiButton');
      expect(node.props).toMatchObject({
        variant: 'outlined',
        size: 'large',
        disabled: false,
      });
    } finally {
      resetComponentRegistry();
    }
  });

  it('keeps external runtimeType and props serializable across save snapshots', () => {
    const createId = (type: string) => `${type}-1`;
    try {
      registerComponentGroup({
        id: 'external-test-group',
        title: 'External',
        source: 'external',
        items: [
          {
            id: 'external-text-field',
            name: 'External TextField',
            preview: <div>External TextField</div>,
            runtimeType: 'MuiTextField',
            defaultProps: { label: 'Text Field', size: 'small' },
          },
        ],
      });

      const node = createNodeFromPaletteItem(
        'external-text-field',
        createId,
        { label: 'Name' },
        'medium'
      );
      const rehydrated = JSON.parse(JSON.stringify(node));
      expect(rehydrated.type).toBe('MuiTextField');
      expect(rehydrated.props).toMatchObject({
        label: 'Name',
        size: 'medium',
      });
    } finally {
      resetComponentRegistry();
    }
  });
});

describe('getTreeDropPlacement', () => {
  it('uses thirds when nesting is allowed', () => {
    expect(
      getTreeDropPlacement({
        canNest: true,
        overTop: 0,
        overHeight: 90,
        activeCenterY: 10,
      })
    ).toBe('before');
    expect(
      getTreeDropPlacement({
        canNest: true,
        overTop: 0,
        overHeight: 90,
        activeCenterY: 45,
      })
    ).toBe('child');
    expect(
      getTreeDropPlacement({
        canNest: true,
        overTop: 0,
        overHeight: 90,
        activeCenterY: 80,
      })
    ).toBe('after');
  });

  it('uses halves when nesting is not allowed', () => {
    expect(
      getTreeDropPlacement({
        canNest: false,
        overTop: 0,
        overHeight: 100,
        activeCenterY: 10,
      })
    ).toBe('before');
    expect(
      getTreeDropPlacement({
        canNest: false,
        overTop: 0,
        overHeight: 100,
        activeCenterY: 60,
      })
    ).toBe('after');
  });
});

describe('palette drag rendering', () => {
  const paletteItems = getComponentGroups().flatMap((group) => group.items);

  const createIdFactory = () => {
    const counts: Record<string, number> = {};
    return (type: string) => {
      const next = (counts[type] ?? 0) + 1;
      counts[type] = next;
      return `${type}-${next}`;
    };
  };

  it('creates nodes with expected props and renders without crashing', () => {
    const StubComponent = ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    );
    const registry = {
      register: () => {},
      get: () => undefined,
      resolve: (type: string) => ({
        type,
        component: StubComponent,
        adapter: mdrAdapter,
      }),
    };

    paletteItems.forEach((item) => {
      const selectedSize = item.sizeOptions?.[0]?.value;
      const variantEntries = [
        {
          id: 'base',
          props: undefined as Record<string, unknown> | undefined,
        },
      ].concat(
        item.variants?.map((variant) => ({
          id: variant.id,
          props: variant.props,
        })) ?? []
      );

      variantEntries.forEach((variant) => {
        const createId = createIdFactory();
        const node = createNodeFromPaletteItem(
          item.id,
          createId,
          variant.props,
          selectedSize
        );

        if (selectedSize) {
          expect(node.props?.size).toBe(selectedSize);
        }

        if (variant.props) {
          Object.entries(variant.props).forEach(([key, value]) => {
            if (item.id === 'heading' && key === 'level') {
              const resolved =
                typeof value === 'string' ? Number(value) : value;
              expect(node.props?.level).toBe(resolved);
              return;
            }
            expect(
              (node.props as Record<string, unknown> | undefined)?.[key]
            ).toBe(value);
          });
        }

        let renderError: unknown;
        try {
          const { unmount } = render(
            <MIRRenderer
              node={node}
              mirDoc={createMirDoc([node])}
              registry={registry}
            />
          );
          unmount();
        } catch (error) {
          renderError = error;
        }
        expect(renderError).toBeUndefined();
      });
    });
  });

  it('does not throw when MdrIcon receives an invalid icon prop at runtime', () => {
    let renderError: unknown;
    try {
      const { unmount } = render(
        <MdrIcon
          {...({ icon: undefined } as unknown as Parameters<typeof MdrIcon>[0])}
        />
      );
      unmount();
    } catch (error) {
      renderError = error;
    }

    expect(renderError).toBeUndefined();
  });
});
