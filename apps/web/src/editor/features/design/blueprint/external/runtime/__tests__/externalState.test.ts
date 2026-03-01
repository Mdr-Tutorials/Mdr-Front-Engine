import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../libraries/antdProfile', () => ({
  antdExternalLibraryProfile: {
    descriptor: () => ({ libraryId: 'antd' }),
  },
}));

vi.mock('../../libraries/muiProfile', () => ({
  muiExternalLibraryProfile: {
    descriptor: () => ({ libraryId: 'mui' }),
  },
}));

vi.mock('../../runtime/profileRegistry', () => {
  const profiles = new Map<string, any>();
  return {
    registerExternalLibraryProfile: (profile: any) => {
      const descriptor = profile.descriptor?.();
      profiles.set(descriptor?.libraryId ?? '', profile);
    },
    unregisterExternalLibraryProfile: (libraryId: string) => {
      profiles.delete(libraryId);
    },
    getExternalLibraryProfile: (libraryId: string) => profiles.get(libraryId),
    listExternalLibraryIds: () => Array.from(profiles.keys()),
  };
});

vi.mock('../../runtime/engine', () => ({
  ensureExternalLibrary: vi.fn(async (profile: any) => {
    const libraryId = profile.descriptor?.().libraryId;
    if (libraryId === 'mui') {
      return [
        {
          code: 'ELIB-1099',
          level: 'error',
          stage: 'load',
          message: 'failed',
          libraryId: 'mui',
        },
      ];
    }
    return [];
  }),
}));

const loadExternalModule = async () =>
  import('@/editor/features/design/blueprint/external/index');

describe('external library state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('tracks unknown library load failure as error state', async () => {
    const mod = await loadExternalModule();
    const diagnostics = await mod.ensureExternalLibraryById('unknown');
    expect(diagnostics[0]?.code).toBe('ELIB-1004');
    expect(mod.getExternalLibraryState('unknown').status).toBe('error');
  }, 15000);

  it('tracks configured library states for success and failure', async () => {
    const mod = await loadExternalModule();
    await mod.ensureConfiguredExternalLibraries(['antd', 'mui']);
    expect(mod.getExternalLibraryState('antd').status).toBe('success');
    expect(mod.getExternalLibraryState('mui').status).toBe('error');
  }, 15000);
});
