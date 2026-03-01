import { useTranslation } from 'react-i18next';

type ExternalLibraryAddModalProps = {
  libraryId: string;
  libraryVersion: string;
  isOpen: boolean;
  onLibraryIdChange: (value: string) => void;
  onLibraryVersionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ExternalLibraryAddModal({
  libraryId,
  libraryVersion,
  isOpen,
  onLibraryIdChange,
  onLibraryVersionChange,
  onClose,
  onSubmit,
}: ExternalLibraryAddModalProps) {
  const { t } = useTranslation('editor');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="grid w-full max-w-md gap-3 rounded-2xl border border-black/10 bg-(--color-0) p-4 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
        <h3 className="text-sm font-semibold text-(--color-9)">
          {t('resourceManager.external.modal.title')}
        </h3>
        <input
          data-testid="external-library-modal-name-input"
          className="h-9 rounded-lg border border-black/10 bg-transparent px-3 text-sm text-(--color-9)"
          value={libraryId}
          onChange={(event) => onLibraryIdChange(event.target.value)}
          placeholder={t('resourceManager.external.modal.packageId')}
        />
        <input
          data-testid="external-library-modal-version-input"
          className="h-9 rounded-lg border border-black/10 bg-transparent px-3 text-sm text-(--color-9)"
          value={libraryVersion}
          onChange={(event) => onLibraryVersionChange(event.target.value)}
          placeholder={t('resourceManager.external.modal.versionOptional')}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-(--color-8)"
            onClick={onClose}
          >
            {t('resourceManager.external.actions.cancel')}
          </button>
          <button
            type="button"
            data-testid="external-library-modal-submit"
            className="rounded-lg border border-black/12 bg-black px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!libraryId.trim()}
            onClick={onSubmit}
          >
            {t('resourceManager.external.actions.addLibrary')}
          </button>
        </div>
      </div>
    </div>
  );
}
