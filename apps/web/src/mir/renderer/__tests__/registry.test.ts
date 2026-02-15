import { describe, expect, it, vi } from 'vitest';

vi.mock('@mdr/ui', () => ({
  MdrDiv: () => null,
  MdrButton: () => null,
  MdrLink: () => null,
  MdrAvatar: () => null,
  // Should be ignored (not a valid React element type)
  MdrTokens: { colors: {} },
  // Should be accepted (valid React element type via $$typeof, like forwardRef/memo)
  MdrForwardRefLike: { $$typeof: Symbol.for('react.forward_ref') },
}));

describe('mir renderer registry', () => {
  it('auto-registers @mdr/ui Mdr* exports and skips non-components', async () => {
    const { createMdrRegistry } = await import('../registry');
    const registry = createMdrRegistry();

    expect(registry.get('MdrDiv')).toBeTruthy();
    expect(registry.get('MdrAvatar')).toBeTruthy();
    expect(registry.get('MdrForwardRefLike')).toBeTruthy();
    expect(registry.get('MdrTokens')).toBeUndefined();
  });

  it('keeps adapter overrides (e.g. MdrButton is non-children)', async () => {
    const { createMdrRegistry, mdrIconAdapter, mdrLinkAdapter } = await import(
      '../registry'
    );
    const registry = createMdrRegistry();
    const resolved = registry.resolve('MdrButton');
    const linkResolved = registry.resolve('MdrLink');

    expect(resolved.adapter.supportsChildren).toBe(false);
    expect(linkResolved.adapter.supportsChildren).toBe(false);

    const mapped = mdrLinkAdapter.mapProps?.({
      node: {
        id: 'link-1',
        type: 'MdrLink',
        text: 'Link',
        props: { to: '/' },
      },
      resolvedProps: { to: '/' },
      resolvedStyle: {},
      resolvedText: 'Link',
    });

    expect(mapped?.props?.text).toBe('Link');

    const mappedIcon = mdrIconAdapter.mapProps?.({
      node: { id: 'icon-1', type: 'MdrIcon', props: {} },
      resolvedProps: {
        iconRef: { provider: 'lucide', name: 'Sparkles' },
        size: 18,
      },
      resolvedStyle: {},
      resolvedText: undefined,
    });

    expect(mappedIcon?.props?.icon).toBeTruthy();
    expect(mappedIcon?.props?.iconRef).toBeUndefined();
  });

  it('registers Radix headless node types in ordered registry resolution', async () => {
    const { createOrderedComponentRegistry } = await import('../registry');
    const registry = createOrderedComponentRegistry();
    const resolved = registry.resolve('RadixLabel');

    expect(resolved.missing).toBeUndefined();
    expect(resolved.type).toBe('RadixLabel');
  });
});
