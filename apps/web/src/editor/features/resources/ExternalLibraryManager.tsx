import { useEffect, useMemo, useState } from 'react';

type ExternalLibraryEntry = {
  id: string;
  label: string;
};

const getResourceManagerExternalSelectionStorageKey = (projectId?: string) =>
  `mdr.resourceManager.external.selection.${projectId?.trim() || 'default'}`;

type ExternalLibraryManagerProps = {
  projectId?: string;
};

const FREQUENT_LIBRARY_PRESET_IDS = ['antd', 'mui'];

export function ExternalLibraryManager({
  projectId,
}: ExternalLibraryManagerProps) {
  const [registeredLibraries, setRegisteredLibraries] = useState<
    ExternalLibraryEntry[]
  >([]);
  const [configuredLibraryIds, setConfiguredLibraryIds] = useState<string[]>(
    []
  );
  const [isBootstrapping, setBootstrapping] = useState(true);
  const [manualLibraryId, setManualLibraryId] = useState('');

  useEffect(() => {
    let disposed = false;
    setBootstrapping(true);
    void import('../design/blueprint/external')
      .then((mod) => {
        if (disposed) return;
        setRegisteredLibraries(mod.getRegisteredExternalLibraries());
        const storedSelection =
          typeof window === 'undefined'
            ? null
            : window.localStorage.getItem(
                getResourceManagerExternalSelectionStorageKey(projectId)
              );
        let configured: unknown = mod.getConfiguredExternalLibraryIds();
        if (storedSelection && storedSelection.length > 0) {
          try {
            configured = JSON.parse(storedSelection);
          } catch {
            configured = mod.getConfiguredExternalLibraryIds();
          }
        }
        const nextConfigured = Array.isArray(configured)
          ? configured.filter(
              (item): item is string =>
                typeof item === 'string' && item.length > 0
            )
          : mod.getConfiguredExternalLibraryIds();
        setConfiguredLibraryIds(nextConfigured);
      })
      .finally(() => {
        if (!disposed) setBootstrapping(false);
      });
    return () => {
      disposed = true;
    };
  }, [projectId]);

  const persistConfiguredIds = (libraryIds: string[]) => {
    const next = [...new Set(libraryIds)];
    setConfiguredLibraryIds(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        getResourceManagerExternalSelectionStorageKey(projectId),
        JSON.stringify(next)
      );
    }
    void import('../design/blueprint/external').then((mod) => {
      mod.setConfiguredExternalLibraryIds(next);
    });
  };

  const importedCount = configuredLibraryIds.length;
  const configuredLibraryIdSet = useMemo(
    () => new Set(configuredLibraryIds),
    [configuredLibraryIds]
  );
  const registeredLibraryById = useMemo(
    () => new Map(registeredLibraries.map((item) => [item.id, item])),
    [registeredLibraries]
  );
  const importedLibraries = useMemo(
    () =>
      configuredLibraryIds.map((libraryId) => {
        const registered = registeredLibraryById.get(libraryId);
        return {
          id: libraryId,
          label: registered?.label ?? libraryId,
          isRegistered: Boolean(registered),
        };
      }),
    [configuredLibraryIds, registeredLibraryById]
  );
  const frequentLibraryPresets = useMemo(
    () =>
      FREQUENT_LIBRARY_PRESET_IDS.map((libraryId) => {
        const registered = registeredLibraryById.get(libraryId);
        return {
          id: libraryId,
          label: registered?.label ?? libraryId,
          isRegistered: Boolean(registered),
          imported: configuredLibraryIdSet.has(libraryId),
        };
      }),
    [configuredLibraryIdSet, registeredLibraryById]
  );

  const addLibraryById = (libraryId: string) => {
    const normalized = libraryId.trim().toLowerCase();
    if (!normalized) return;
    if (configuredLibraryIdSet.has(normalized)) return;
    persistConfiguredIds([...configuredLibraryIds, normalized]);
  };

  return (
    <article className="grid gap-4 rounded-2xl border border-black/8 bg-(--color-0) p-5">
      <header>
        <h2 className="text-base font-semibold text-(--color-9)">
          External library manager
        </h2>
        <p className="mt-1 text-sm text-(--color-7)">
          Import external UI libraries into Blueprint component tabs.
        </p>
      </header>
      <div className="grid gap-2 rounded-xl border border-black/8 bg-black/[0.015] p-3 text-xs text-(--color-7)">
        <p>
          Imported libraries: <strong>{importedCount}</strong>
        </p>
        <p>
          Registered presets: <strong>{registeredLibraries.length}</strong>
        </p>
      </div>
      <section className="grid gap-2 rounded-xl border border-black/8 bg-black/[0.015] p-3">
        <p className="text-xs text-(--color-7)">
          Add library by id (for example: <code>antd</code>, <code>mui</code>,
          <code> shadcn-ui</code>).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            data-testid="external-library-id-input"
            className="h-8 min-w-[220px] flex-1 rounded-lg border border-black/10 bg-transparent px-2 text-sm text-(--color-9)"
            value={manualLibraryId}
            onChange={(event) => setManualLibraryId(event.target.value)}
            placeholder="library id"
          />
          <button
            type="button"
            data-testid="external-library-add-button"
            className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs text-(--color-8)"
            onClick={() => {
              addLibraryById(manualLibraryId);
              setManualLibraryId('');
            }}
          >
            Import
          </button>
        </div>
      </section>
      <section className="grid gap-2 rounded-xl border border-black/8 bg-black/[0.015] p-3">
        <p className="text-xs text-(--color-7)">Frequent library presets</p>
        <div className="flex flex-wrap gap-2">
          {frequentLibraryPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-testid={`external-library-preset-${preset.id}`}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                preset.imported
                  ? 'border-black/16 bg-black text-white'
                  : 'border-black/10 text-(--color-8)'
              }`}
              onClick={() => addLibraryById(preset.id)}
              disabled={preset.imported}
            >
              {preset.imported
                ? `${preset.label} Imported`
                : `Import ${preset.label}`}
            </button>
          ))}
        </div>
      </section>
      {isBootstrapping ? (
        <div className="rounded-xl border border-black/8 bg-black/[0.015] p-3 text-sm text-(--color-7)">
          Loading registered libraries...
        </div>
      ) : null}
      {!isBootstrapping && importedLibraries.length === 0 ? (
        <div className="rounded-xl border border-black/8 bg-black/[0.015] p-3 text-sm text-(--color-7)">
          No external libraries imported yet.
        </div>
      ) : null}
      {!isBootstrapping && importedLibraries.length > 0 ? (
        <div className="grid gap-2">
          {importedLibraries.map((library) => {
            return (
              <section
                key={library.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-(--color-0) p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-(--color-9)">
                    {library.label}
                  </p>
                  <p className="text-xs text-(--color-6)">
                    {library.id}
                    {!library.isRegistered
                      ? ' (no registered profile yet)'
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-(--color-8)"
                  onClick={() => {
                    persistConfiguredIds(
                      configuredLibraryIds.filter((item) => item !== library.id)
                    );
                  }}
                >
                  Remove
                </button>
              </section>
            );
          })}
        </div>
      ) : null}
      <footer className="text-xs text-(--color-6)">
        Imported libraries become dedicated tabs in Blueprint (for example:
        Material UI, Ant Design).
      </footer>
    </article>
  );
}
