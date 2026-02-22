import { useEffect, useMemo, useState } from 'react';

type LibraryEntry = {
  id: string;
  label: string;
};

type ExternalLibraryManagerProps = {
  projectId?: string;
};

const EXTERNAL_COMPONENT_LIBRARY_PRESET_IDS = ['antd', 'mui'];
const ICON_LIBRARY_PRESET_IDS = [
  'fontawesome',
  'ant-design-icons',
  'mui-icons',
  'heroicons',
];
const LEGACY_ICON_LIBRARY_IDS = new Set(ICON_LIBRARY_PRESET_IDS);

const getResourceManagerExternalSelectionStorageKey = (projectId?: string) =>
  `mdr.resourceManager.external.selection.${projectId?.trim() || 'default'}`;

const getResourceManagerIconSelectionStorageKey = (projectId?: string) =>
  `mdr.resourceManager.icon.selection.${projectId?.trim() || 'default'}`;

const parseStoredLibraryIds = (raw: string | null) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return null;
  }
};

const normalizeLibraryIds = (libraryIds: string[]) =>
  [...new Set(libraryIds.map((libraryId) => libraryId.trim().toLowerCase()))]
    .map((libraryId) => libraryId.trim())
    .filter((libraryId) => libraryId.length > 0);

const normalizeExternalComponentLibraryIds = (libraryIds: string[]) =>
  normalizeLibraryIds(libraryIds).filter(
    (libraryId) => !LEGACY_ICON_LIBRARY_IDS.has(libraryId)
  );

export function ExternalLibraryManager({
  projectId,
}: ExternalLibraryManagerProps) {
  const [registeredComponentLibraries, setRegisteredComponentLibraries] =
    useState<LibraryEntry[]>([]);
  const [registeredIconLibraries, setRegisteredIconLibraries] = useState<
    LibraryEntry[]
  >([]);
  const [configuredComponentLibraryIds, setConfiguredComponentLibraryIds] =
    useState<string[]>([]);
  const [configuredIconLibraryIds, setConfiguredIconLibraryIds] = useState<
    string[]
  >([]);
  const [isBootstrapping, setBootstrapping] = useState(true);
  const [manualComponentLibraryId, setManualComponentLibraryId] = useState('');
  const [manualIconLibraryId, setManualIconLibraryId] = useState('');

  useEffect(() => {
    let disposed = false;
    setBootstrapping(true);
    void Promise.all([
      import('../design/blueprint/external'),
      import('@/mir/renderer/iconRegistry'),
    ])
      .then(([externalRuntime, iconRegistry]) => {
        if (disposed) return;
        setRegisteredComponentLibraries(
          externalRuntime.getRegisteredExternalLibraries()
        );
        setRegisteredIconLibraries(iconRegistry.getRegisteredIconLibraries());

        const storedComponentSelection =
          typeof window === 'undefined'
            ? null
            : parseStoredLibraryIds(
                window.localStorage.getItem(
                  getResourceManagerExternalSelectionStorageKey(projectId)
                )
              );
        const storedIconSelection =
          typeof window === 'undefined'
            ? null
            : parseStoredLibraryIds(
                window.localStorage.getItem(
                  getResourceManagerIconSelectionStorageKey(projectId)
                )
              );

        const nextComponentLibraryIds = normalizeExternalComponentLibraryIds(
          storedComponentSelection ??
            externalRuntime.getConfiguredExternalLibraryIds()
        );
        const nextIconLibraryIds = normalizeLibraryIds(
          storedIconSelection ?? iconRegistry.getConfiguredIconLibraryIds()
        );

        setConfiguredComponentLibraryIds(nextComponentLibraryIds);
        setConfiguredIconLibraryIds(nextIconLibraryIds);
      })
      .finally(() => {
        if (!disposed) setBootstrapping(false);
      });
    return () => {
      disposed = true;
    };
  }, [projectId]);

  const persistConfiguredComponentLibraryIds = (libraryIds: string[]) => {
    const nextIds = normalizeExternalComponentLibraryIds(libraryIds);
    setConfiguredComponentLibraryIds(nextIds);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        getResourceManagerExternalSelectionStorageKey(projectId),
        JSON.stringify(nextIds)
      );
    }
    void import('../design/blueprint/external').then((externalRuntime) => {
      externalRuntime.setConfiguredExternalLibraryIds(nextIds);
    });
  };

  const persistConfiguredIconLibraryIds = (libraryIds: string[]) => {
    const nextIds = normalizeLibraryIds(libraryIds);
    setConfiguredIconLibraryIds(nextIds);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        getResourceManagerIconSelectionStorageKey(projectId),
        JSON.stringify(nextIds)
      );
    }
    void import('@/mir/renderer/iconRegistry').then((iconRegistry) => {
      iconRegistry.setConfiguredIconLibraryIds(nextIds);
    });
  };

  const addComponentLibraryById = (libraryId: string) => {
    const normalized = normalizeLibraryIds([libraryId])[0];
    if (!normalized) return;
    if (LEGACY_ICON_LIBRARY_IDS.has(normalized)) return;
    if (configuredComponentLibraryIds.includes(normalized)) return;
    persistConfiguredComponentLibraryIds([
      ...configuredComponentLibraryIds,
      normalized,
    ]);
  };

  const addIconLibraryById = (libraryId: string) => {
    const normalized = normalizeLibraryIds([libraryId])[0];
    if (!normalized) return;
    if (configuredIconLibraryIds.includes(normalized)) return;
    persistConfiguredIconLibraryIds([...configuredIconLibraryIds, normalized]);
  };

  const configuredComponentIdSet = useMemo(
    () => new Set(configuredComponentLibraryIds),
    [configuredComponentLibraryIds]
  );
  const configuredIconIdSet = useMemo(
    () => new Set(configuredIconLibraryIds),
    [configuredIconLibraryIds]
  );
  const registeredComponentLibraryById = useMemo(
    () =>
      new Map(
        registeredComponentLibraries.map((library) => [library.id, library])
      ),
    [registeredComponentLibraries]
  );
  const registeredIconLibraryById = useMemo(
    () =>
      new Map(registeredIconLibraries.map((library) => [library.id, library])),
    [registeredIconLibraries]
  );

  const importedComponentLibraries = useMemo(
    () =>
      configuredComponentLibraryIds.map((libraryId) => {
        const registered = registeredComponentLibraryById.get(libraryId);
        return {
          id: libraryId,
          label: registered?.label ?? libraryId,
          isRegistered: Boolean(registered),
        };
      }),
    [configuredComponentLibraryIds, registeredComponentLibraryById]
  );

  const importedIconLibraries = useMemo(
    () =>
      configuredIconLibraryIds.map((libraryId) => {
        const registered = registeredIconLibraryById.get(libraryId);
        return {
          id: libraryId,
          label: registered?.label ?? libraryId,
          isRegistered: Boolean(registered),
        };
      }),
    [configuredIconLibraryIds, registeredIconLibraryById]
  );

  const componentLibraryPresets = useMemo(
    () =>
      EXTERNAL_COMPONENT_LIBRARY_PRESET_IDS.map((libraryId) => {
        const registered = registeredComponentLibraryById.get(libraryId);
        return {
          id: libraryId,
          label: registered?.label ?? libraryId,
          imported: configuredComponentIdSet.has(libraryId),
        };
      }),
    [configuredComponentIdSet, registeredComponentLibraryById]
  );

  const iconLibraryPresets = useMemo(
    () =>
      ICON_LIBRARY_PRESET_IDS.map((libraryId) => {
        const registered = registeredIconLibraryById.get(libraryId);
        return {
          id: libraryId,
          label: registered?.label ?? libraryId,
          imported: configuredIconIdSet.has(libraryId),
        };
      }),
    [configuredIconIdSet, registeredIconLibraryById]
  );

  return (
    <article className="grid gap-4 rounded-2xl border border-black/8 bg-(--color-0) p-5">
      <header>
        <h2 className="text-base font-semibold text-(--color-9)">
          External library manager
        </h2>
        <p className="mt-1 text-sm text-(--color-7)">
          Manage Blueprint component libraries and Icon Picker icon providers
          separately.
        </p>
      </header>

      <div className="grid gap-2 rounded-xl border border-black/8 bg-black/[0.015] p-3 text-xs text-(--color-7)">
        <p>
          Imported component libraries:{' '}
          <strong>{configuredComponentLibraryIds.length}</strong>
        </p>
        <p>
          Imported icon libraries:{' '}
          <strong>{configuredIconLibraryIds.length}</strong>
        </p>
      </div>

      <section className="grid gap-3 rounded-xl border border-black/8 bg-black/[0.015] p-3">
        <header>
          <h3 className="text-sm font-semibold text-(--color-9)">
            External component libraries
          </h3>
          <p className="mt-1 text-xs text-(--color-7)">
            Imported here will appear as dedicated tabs in Blueprint component
            library.
          </p>
        </header>
        <div className="grid gap-2 rounded-lg border border-black/8 bg-(--color-0) p-3">
          <p className="text-xs text-(--color-7)">
            Add by id (example: <code>antd</code>, <code>mui</code>).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              data-testid="external-library-id-input"
              className="h-8 min-w-[220px] flex-1 rounded-lg border border-black/10 bg-transparent px-2 text-sm text-(--color-9)"
              value={manualComponentLibraryId}
              onChange={(event) =>
                setManualComponentLibraryId(event.target.value)
              }
              placeholder="library id"
            />
            <button
              type="button"
              data-testid="external-library-add-button"
              className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs text-(--color-8)"
              onClick={() => {
                addComponentLibraryById(manualComponentLibraryId);
                setManualComponentLibraryId('');
              }}
            >
              Import
            </button>
          </div>
        </div>
        <div className="grid gap-2 rounded-lg border border-black/8 bg-(--color-0) p-3">
          <p className="text-xs text-(--color-7)">Frequent presets</p>
          <div className="flex flex-wrap gap-2">
            {componentLibraryPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-testid={`external-library-preset-${preset.id}`}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                  preset.imported
                    ? 'border-black/16 bg-black text-white'
                    : 'border-black/10 text-(--color-8)'
                }`}
                onClick={() => addComponentLibraryById(preset.id)}
                disabled={preset.imported}
              >
                {preset.imported
                  ? `${preset.label} Imported`
                  : `Import ${preset.label}`}
              </button>
            ))}
          </div>
        </div>
        {importedComponentLibraries.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-(--color-0) p-3 text-sm text-(--color-7)">
            No external component libraries imported.
          </div>
        ) : (
          <div className="grid gap-2">
            {importedComponentLibraries.map((library) => (
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
                    persistConfiguredComponentLibraryIds(
                      configuredComponentLibraryIds.filter(
                        (item) => item !== library.id
                      )
                    );
                  }}
                >
                  Remove
                </button>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-xl border border-black/8 bg-black/[0.015] p-3">
        <header>
          <h3 className="text-sm font-semibold text-(--color-9)">
            Icon libraries
          </h3>
          <p className="mt-1 text-xs text-(--color-7)">
            Imported here will appear in IconPickerModal provider list.
          </p>
        </header>
        <div className="grid gap-2 rounded-lg border border-black/8 bg-(--color-0) p-3">
          <p className="text-xs text-(--color-7)">
            Add by id (example: <code>fontawesome</code>,{' '}
            <code>ant-design-icons</code>, <code>mui-icons</code>,{' '}
            <code>heroicons</code>).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              data-testid="icon-library-id-input"
              className="h-8 min-w-[220px] flex-1 rounded-lg border border-black/10 bg-transparent px-2 text-sm text-(--color-9)"
              value={manualIconLibraryId}
              onChange={(event) => setManualIconLibraryId(event.target.value)}
              placeholder="icon library id"
            />
            <button
              type="button"
              data-testid="icon-library-add-button"
              className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs text-(--color-8)"
              onClick={() => {
                addIconLibraryById(manualIconLibraryId);
                setManualIconLibraryId('');
              }}
            >
              Import
            </button>
          </div>
        </div>
        <div className="grid gap-2 rounded-lg border border-black/8 bg-(--color-0) p-3">
          <p className="text-xs text-(--color-7)">Frequent presets</p>
          <div className="flex flex-wrap gap-2">
            {iconLibraryPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-testid={`icon-library-preset-${preset.id}`}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                  preset.imported
                    ? 'border-black/16 bg-black text-white'
                    : 'border-black/10 text-(--color-8)'
                }`}
                onClick={() => addIconLibraryById(preset.id)}
                disabled={preset.imported}
              >
                {preset.imported
                  ? `${preset.label} Imported`
                  : `Import ${preset.label}`}
              </button>
            ))}
          </div>
        </div>
        {importedIconLibraries.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-(--color-0) p-3 text-sm text-(--color-7)">
            No icon libraries imported.
          </div>
        ) : (
          <div className="grid gap-2">
            {importedIconLibraries.map((library) => (
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
                      ? ' (no registered provider yet)'
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-(--color-8)"
                  onClick={() => {
                    persistConfiguredIconLibraryIds(
                      configuredIconLibraryIds.filter(
                        (item) => item !== library.id
                      )
                    );
                  }}
                >
                  Remove
                </button>
              </section>
            ))}
          </div>
        )}
      </section>

      {isBootstrapping ? (
        <div className="rounded-xl border border-black/8 bg-black/[0.015] p-3 text-sm text-(--color-7)">
          Loading registered libraries...
        </div>
      ) : null}
    </article>
  );
}
