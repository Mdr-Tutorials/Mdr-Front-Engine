import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LibraryCatalog, LibraryMode } from './types';

export type BuiltinLibraryCategory = {
  id: string;
  label: string;
  libraryIds: string[];
};

type ExternalLibraryToolbarProps = {
  searchInput: string;
  mode: LibraryMode;
  modeOptions: Array<{ id: LibraryMode; label: string }>;
  builtinLibraryCategories: BuiltinLibraryCategory[];
  libraryCatalog: Record<string, LibraryCatalog>;
  onSearchInputChange: (value: string) => void;
  onModeChange: (nextMode: LibraryMode) => void;
  onBuiltinLibraryAdd: (libraryId: string) => void;
};

export function ExternalLibraryToolbar({
  searchInput,
  mode,
  modeOptions,
  builtinLibraryCategories,
  libraryCatalog,
  onSearchInputChange,
  onModeChange,
  onBuiltinLibraryAdd,
}: ExternalLibraryToolbarProps) {
  const { t } = useTranslation('editor');
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const categoriesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (categoriesRef.current?.contains(target)) return;
      setOpenCategoryId(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenCategoryId(null);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          data-testid="external-library-search-input"
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-black/10 bg-(--color-0) px-3 text-sm text-(--color-9)"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder={t('resourceManager.external.searchPlaceholder')}
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
      <div ref={categoriesRef} className="flex flex-wrap items-center gap-1">
        <p className="text-xs font-bold text-(--color-9)">
          {t('resourceManager.external.builtInLibs')}
        </p>
        <span aria-hidden="true" className="h-6 w-px ml-4 mr-2 bg-black/15" />
        {builtinLibraryCategories.map((category) => (
          <div
            key={category.id}
            className="relative inline-flex items-center gap-1 rounded-lg bg-(--color-0) px-2 py-1.5 text-xs text-(--color-8)"
          >
            <span className="whitespace-nowrap">{category.label}</span>
            <button
              type="button"
              data-testid={`external-library-category-trigger-${category.id}`}
              aria-label={t('resourceManager.external.addCategory', {
                category: category.label,
              })}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border-0 bg-transparent text-(--color-8) transition-colors hover:bg-black/[0.06] hover:text-(--color-10)"
              onClick={() => {
                setOpenCategoryId((current) =>
                  current === category.id ? null : category.id
                );
              }}
            >
              <Plus size={16} />
            </button>
            {openCategoryId === category.id ? (
              <div
                data-testid={`external-library-category-menu-${category.id}`}
                className="absolute left-0 top-full z-30 mt-1 min-w-[180px] rounded-lg bg-(--color-0) p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                <div className="grid gap-0.5">
                  {category.libraryIds.map((libraryId) => (
                    <button
                      key={libraryId}
                      type="button"
                      data-testid={`external-library-category-option-${category.id}-${libraryId}`}
                      className="rounded-md border-0 bg-transparent px-2 py-1 text-left text-xs text-(--color-8) transition-colors hover:bg-black/[0.06] hover:text-(--color-10)"
                      onClick={() => {
                        onBuiltinLibraryAdd(libraryId);
                        setOpenCategoryId(null);
                      }}
                    >
                      {libraryCatalog[libraryId]?.label ?? libraryId}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
