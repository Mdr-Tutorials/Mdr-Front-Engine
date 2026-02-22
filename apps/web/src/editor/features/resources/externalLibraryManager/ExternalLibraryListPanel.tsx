import type { ActiveLibrary, PackageSizeThresholds } from './types';
import {
  formatPackageSize,
  getPackageSizeMeta,
  getStatusMeta,
} from './viewUtils';

type ExternalLibraryListPanelProps = {
  activeLibraries: ActiveLibrary[];
  filteredLibraries: ActiveLibrary[];
  selectedLibraryId: string | null;
  searchInput: string;
  debouncedSearchInput: string;
  packageSizeThresholds: PackageSizeThresholds;
  onSelectLibrary: (libraryId: string) => void;
  onOpenAddModal: () => void;
  onRemoveLibrary: (libraryId: string) => void;
  onRetryLibrary: (libraryId: string, version: string) => void;
  onVersionChange: (libraryId: string, version: string) => void;
};

export function ExternalLibraryListPanel({
  activeLibraries,
  filteredLibraries,
  selectedLibraryId,
  searchInput,
  debouncedSearchInput,
  packageSizeThresholds,
  onSelectLibrary,
  onOpenAddModal,
  onRemoveLibrary,
  onRetryLibrary,
  onVersionChange,
}: ExternalLibraryListPanelProps) {
  return (
    <section className="grid gap-3 rounded-xl border border-black/8 bg-black/[0.015] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-(--color-9)">
            Active libraries
          </h3>
          <p className="mt-1 text-xs text-(--color-7)">
            {activeLibraries.length} libraries ·{' '}
            {searchInput.trim().toLowerCase() !== debouncedSearchInput
              ? 'Debouncing search...'
              : 'Search ready'}
          </p>
        </div>
        <button
          type="button"
          data-testid="external-library-open-add-modal"
          className="rounded-lg border border-black/12 bg-(--color-0) px-3 py-1.5 text-xs text-(--color-8)"
          onClick={onOpenAddModal}
        >
          + Add new library
        </button>
      </div>

      {filteredLibraries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/12 bg-(--color-0) p-4 text-sm text-(--color-7)">
          No library matches current search.
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredLibraries.map((library) => {
            const statusMeta = getStatusMeta(library.status);
            const packageSizeMeta = getPackageSizeMeta(
              library.packageSizeKb,
              packageSizeThresholds
            );
            const isSelected = library.id === selectedLibraryId;
            return (
              <section
                key={library.id}
                data-testid={`external-library-card-${library.id}`}
                className={`grid gap-2 rounded-xl border p-3 ${
                  isSelected
                    ? 'border-black/20 bg-white'
                    : 'border-black/8 bg-(--color-0)'
                }`}
              >
                <button
                  type="button"
                  className="grid gap-2 text-left"
                  onClick={() => onSelectLibrary(library.id)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-(--color-9)">
                      {library.label}
                    </p>
                    <span className="rounded-md border border-black/10 bg-black/[0.02] px-2 py-0.5 text-[11px] text-(--color-7)">
                      {library.version}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-(--color-7)">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`}
                    />
                    <span>{statusMeta.text}</span>
                    <span>·</span>
                    <span>{formatPackageSize(library.packageSizeKb)}</span>
                    {packageSizeMeta.level !== 'healthy' ? (
                      <>
                        <span>·</span>
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[11px] ${packageSizeMeta.badgeClassName}`}
                        >
                          {packageSizeMeta.label}
                        </span>
                      </>
                    ) : null}
                    <span>·</span>
                    <span>{library.components.length} exports</span>
                  </div>
                </button>
                {library.status === 'loading' ? (
                  <div className="grid gap-1">
                    <div className="h-2 w-2/3 animate-pulse rounded bg-black/10" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-black/10" />
                  </div>
                ) : null}
                {library.status === 'error' ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                    {library.errorMessage}
                  </p>
                ) : null}
                {packageSizeMeta.level !== 'healthy' ? (
                  <p
                    className={`rounded-lg border px-2 py-1 text-xs ${packageSizeMeta.bannerClassName}`}
                  >
                    Size {packageSizeMeta.label}: {packageSizeMeta.hint}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    data-testid={`external-library-version-select-${library.id}`}
                    className="h-8 min-w-[140px] rounded-lg border border-black/10 bg-transparent px-2 text-xs text-(--color-8)"
                    value={library.version}
                    onChange={(event) =>
                      onVersionChange(library.id, event.target.value)
                    }
                  >
                    {library.versions.map((version) => (
                      <option key={version} value={version}>
                        {version}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    data-testid={`external-library-remove-${library.id}`}
                    className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-(--color-8)"
                    onClick={() => onRemoveLibrary(library.id)}
                  >
                    Remove
                  </button>
                  {library.status === 'error' ? (
                    <button
                      type="button"
                      data-testid={`external-library-retry-${library.id}`}
                      className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs text-rose-700"
                      onClick={() =>
                        onRetryLibrary(library.id, library.version)
                      }
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="rounded-lg border border-dashed border-black/18 bg-(--color-0) px-3 py-2 text-sm text-(--color-8)"
        onClick={onOpenAddModal}
      >
        + Add new library
      </button>
    </section>
  );
}
