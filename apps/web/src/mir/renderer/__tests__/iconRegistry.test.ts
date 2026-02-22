import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadIconRegistry = () => import('../iconRegistry');

describe('icon registry', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('registers lucide provider with full icon catalog', async () => {
    const registry = await loadIconRegistry();
    const providers = registry.listIconProviders();
    const lucide = providers.find((provider) => provider.id === 'lucide');
    expect(lucide).toBeTruthy();

    const names = registry.listIconNamesByProvider('lucide');
    expect(names.length).toBeGreaterThan(1000);
    expect(names).toContain('Sparkles');
    expect(names).toContain('Circle');
  });

  it('registers icon libraries and keeps them hidden before import', async () => {
    const registry = await loadIconRegistry();
    const registered = registry.getRegisteredIconLibraries();
    expect(registered.map((item) => item.id)).toEqual([
      'ant-design-icons',
      'fontawesome',
      'heroicons',
      'mui-icons',
    ]);

    const visibleProviders = registry
      .listIconProviders()
      .map((item) => item.id);
    expect(visibleProviders).toContain('lucide');
    expect(visibleProviders).not.toContain('fontawesome');
    expect(registry.getIconProviderState('fontawesome').status).toBe('idle');
    expect(registry.listIconNamesByProvider('fontawesome')).toEqual([]);
  });

  it('shows imported icon libraries in provider list', async () => {
    const registry = await loadIconRegistry();
    registry.setConfiguredIconLibraryIds(['fontawesome', 'heroicons']);

    const visibleProviders = registry
      .listIconProviders()
      .map((item) => item.id);
    expect(visibleProviders).toContain('fontawesome');
    expect(visibleProviders).toContain('heroicons');
    expect(registry.getConfiguredIconLibraryIds()).toEqual([
      'fontawesome',
      'heroicons',
    ]);
  });

  it('resolves lucide icon names in different formats', async () => {
    const registry = await loadIconRegistry();
    const fromPascal = registry.resolveIconRef({
      provider: 'lucide',
      name: 'ArrowUpRight',
    });
    const fromKebab = registry.resolveIconRef({
      provider: 'lucide',
      name: 'arrow-up-right',
    });

    expect(fromPascal).toBeTruthy();
    expect(fromKebab).toBeTruthy();
  });
});
