import type {
  LibraryCatalog,
  LibraryMode,
  PackageSizeThresholds,
} from './types';

type ExternalLibraryToolbarProps = {
  searchInput: string;
  mode: LibraryMode;
  modeOptions: Array<{ id: LibraryMode; label: string }>;
  quickLibraryIds: string[];
  libraryCatalog: Record<string, LibraryCatalog>;
  sizeThresholds: PackageSizeThresholds;
  onSearchInputChange: (value: string) => void;
  onModeChange: (nextMode: LibraryMode) => void;
  onQuickLibraryAdd: (libraryId: string) => void;
  onSizeThresholdChange: (
    field: keyof PackageSizeThresholds,
    value: number
  ) => void;
};

export function ExternalLibraryToolbar({
  searchInput,
  mode,
  modeOptions,
  quickLibraryIds,
  libraryCatalog,
  sizeThresholds,
  onSearchInputChange,
  onModeChange,
  onQuickLibraryAdd,
  onSizeThresholdChange,
}: ExternalLibraryToolbarProps) {
  return (
    <section className="grid gap-3 rounded-xl border border-black/8 bg-black/[0.015] p-3">
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
      <div className="grid gap-2 rounded-lg border border-black/10 bg-(--color-0) p-2">
        <p className="text-xs font-medium text-(--color-7)">
          Size warning thresholds (KB)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1 text-xs text-(--color-7)">
            L1
            <input
              data-testid="external-library-size-threshold-caution"
              className="h-7 w-20 rounded-md border border-black/10 px-2 text-xs text-(--color-8)"
              type="number"
              min={1}
              step={1}
              value={sizeThresholds.cautionKb}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (!Number.isFinite(nextValue)) return;
                onSizeThresholdChange('cautionKb', nextValue);
              }}
            />
          </label>
          <label className="inline-flex items-center gap-1 text-xs text-(--color-7)">
            L2
            <input
              data-testid="external-library-size-threshold-warning"
              className="h-7 w-20 rounded-md border border-black/10 px-2 text-xs text-(--color-8)"
              type="number"
              min={sizeThresholds.cautionKb + 1}
              step={1}
              value={sizeThresholds.warningKb}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (!Number.isFinite(nextValue)) return;
                onSizeThresholdChange('warningKb', nextValue);
              }}
            />
          </label>
          <label className="inline-flex items-center gap-1 text-xs text-(--color-7)">
            L3
            <input
              data-testid="external-library-size-threshold-critical"
              className="h-7 w-20 rounded-md border border-black/10 px-2 text-xs text-(--color-8)"
              type="number"
              min={sizeThresholds.warningKb + 1}
              step={1}
              value={sizeThresholds.criticalKb}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (!Number.isFinite(nextValue)) return;
                onSizeThresholdChange('criticalKb', nextValue);
              }}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
