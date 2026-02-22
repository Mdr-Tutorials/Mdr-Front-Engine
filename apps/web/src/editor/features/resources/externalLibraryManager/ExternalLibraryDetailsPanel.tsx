import type { ActiveLibrary, PackageSizeThresholds } from './types';
import { formatPackageSize, getPackageSizeMeta } from './viewUtils';

type ExternalLibraryDetailsPanelProps = {
  selectedLibrary: ActiveLibrary | null;
  packageSizeThresholds: PackageSizeThresholds;
  onVersionQuickSwitch: (libraryId: string, version: string) => void;
};

export function ExternalLibraryDetailsPanel({
  selectedLibrary,
  packageSizeThresholds,
  onVersionQuickSwitch,
}: ExternalLibraryDetailsPanelProps) {
  const packageSizeMeta = selectedLibrary
    ? getPackageSizeMeta(selectedLibrary.packageSizeKb, packageSizeThresholds)
    : null;

  return (
    <aside className="self-start grid gap-3 rounded-xl border border-black/8 bg-black/[0.015] p-3">
      <header>
        <h3 className="text-sm font-semibold text-(--color-9)">
          Library details
        </h3>
      </header>
      {!selectedLibrary ? (
        <div className="rounded-lg border border-dashed border-black/12 bg-(--color-0) p-4 text-sm text-(--color-7)">
          Select a library from the left list.
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="rounded-lg border border-black/8 bg-(--color-0) p-3">
            <p className="text-sm font-semibold text-(--color-9)">
              {selectedLibrary.label}
            </p>
            <p className="mt-2 text-xs text-(--color-7)">
              {selectedLibrary.description}
            </p>
            <p className="mt-2 text-xs text-(--color-6)">
              License: <strong>{selectedLibrary.license}</strong>
            </p>
          </div>
          {packageSizeMeta ? (
            <p
              className={`rounded-lg border px-3 py-2 text-xs ${packageSizeMeta.bannerClassName}`}
            >
              {packageSizeMeta.level === 'healthy'
                ? `Size healthy: ${formatPackageSize(selectedLibrary.packageSizeKb)}.`
                : `Size ${packageSizeMeta.label}: ${formatPackageSize(selectedLibrary.packageSizeKb)}. ${packageSizeMeta.hint}`}
            </p>
          ) : null}
          <div className="rounded-lg border border-black/8 bg-(--color-0) p-3">
            <p className="text-xs font-medium text-(--color-7)">
              Provided components
            </p>
            <ul className="mt-2 grid max-h-44 gap-1 overflow-auto">
              {selectedLibrary.components.map((componentName) => (
                <li
                  key={`${selectedLibrary.id}-${componentName}`}
                  className="rounded-md border border-black/8 px-2 py-1 text-xs text-(--color-7)"
                >
                  {componentName}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-black/8 bg-(--color-0) p-3">
            <p className="text-xs font-medium text-(--color-7)">
              Version history quick switcher
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedLibrary.versions.map((version) => (
                <button
                  key={`${selectedLibrary.id}-${version}`}
                  type="button"
                  className={`rounded-md border px-2 py-1 text-xs ${
                    version === selectedLibrary.version
                      ? 'border-black/16 bg-black text-white'
                      : 'border-black/10 text-(--color-8)'
                  }`}
                  onClick={() =>
                    onVersionQuickSwitch(selectedLibrary.id, version)
                  }
                >
                  {version}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
