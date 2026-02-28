import type { LibraryCatalog, LibraryMode } from './types';

type ExternalLibraryToolbarProps = {
  searchInput: string;
  mode: LibraryMode;
  modeOptions: Array<{ id: LibraryMode; label: string }>;
  quickLibraryIds: string[];
  libraryCatalog: Record<string, LibraryCatalog>;
  onSearchInputChange: (value: string) => void;
  onModeChange: (nextMode: LibraryMode) => void;
  onQuickLibraryAdd: (libraryId: string) => void;
};

export function ExternalLibraryToolbar({
  searchInput,
  mode,
  modeOptions,
  quickLibraryIds,
  libraryCatalog,
  onSearchInputChange,
  onModeChange,
  onQuickLibraryAdd,
}: ExternalLibraryToolbarProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          data-testid="external-library-search-input"
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-black/10 bg-(--color-0) px-3 text-sm text-(--color-9)"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder="Search libraries..."
        />
        <div className="inline-flex rounded-lg border border-black/10 bg-(--color-0) p-1">
          {modeOptions.map((modeOption) => (
            <button
              key={modeOption.id}
              type="button"
              data-testid={`external-library-mode-${modeOption.id}`}
              className={`rounded-md px-2.5 py-1 text-xs ${
                mode === modeOption.id
                  ? 'bg-black text-white'
                  : 'text-(--color-7) hover:bg-black/[0.06]'
              }`}
              onClick={() => onModeChange(modeOption.id)}
            >
              {modeOption.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-(--color-7)">Built-in libs</p>
        {quickLibraryIds.map((libraryId) => (
          <button
            key={libraryId}
            type="button"
            data-testid={`external-library-tag-${libraryId}`}
            className="rounded-lg border border-black/10 bg-(--color-0) px-2.5 py-1 text-xs text-(--color-8)"
            onClick={() => onQuickLibraryAdd(libraryId)}
          >
            + {libraryCatalog[libraryId]?.label ?? libraryId}
          </button>
        ))}
      </div>
    </>
  );
}
