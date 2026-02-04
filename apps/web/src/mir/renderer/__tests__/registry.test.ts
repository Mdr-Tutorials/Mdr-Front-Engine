import { describe, expect, it, vi } from 'vitest';

vi.mock('@mdr/ui', () => ({
  MdrDiv: () => null,
  MdrButton: () => null,
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
    const { createMdrRegistry } = await import('../registry');
    const registry = createMdrRegistry();
    const resolved = registry.resolve('MdrButton');

    expect(resolved.adapter.supportsChildren).toBe(false);
  });
});
