import type { ActiveLibrary, PackageSizeThresholds } from './types';
import { useTranslation } from 'react-i18next';
import { formatPackageSize, getPackageSizeMeta } from './viewUtils';

type ExternalLibraryDetailsPanelProps = {
  selectedLibrary: ActiveLibrary | null;
  packageSizeThresholds: PackageSizeThresholds;
  onVersionQuickSwitch: (libraryId: string, version: string) => void;
};

const LICENSE_REFERENCE_LINKS: Record<string, string> = {
  mit: 'https://spdx.org/licenses/MIT.html',
  'apache-2.0': 'https://spdx.org/licenses/Apache-2.0.html',
  'bsd-2-clause': 'https://spdx.org/licenses/BSD-2-Clause.html',
  'bsd-3-clause': 'https://spdx.org/licenses/BSD-3-Clause.html',
  'cc-by-4.0': 'https://spdx.org/licenses/CC-BY-4.0.html',
  isc: 'https://spdx.org/licenses/ISC.html',
  'gpl-3.0': 'https://spdx.org/licenses/GPL-3.0-only.html',
  'lgpl-3.0': 'https://spdx.org/licenses/LGPL-3.0-only.html',
  'agpl-3.0': 'https://spdx.org/licenses/AGPL-3.0-only.html',
  'mpl-2.0': 'https://spdx.org/licenses/MPL-2.0.html',
};

const resolveLicenseReferenceLink = (licenseText: string): string | null => {
  const normalized = licenseText.trim();
  if (normalized.length === 0) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const compact = normalized
    .replace(/\s+license$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const directByName = LICENSE_REFERENCE_LINKS[compact];
  if (directByName) return directByName;

  if (/^[a-z0-9-.+]+$/i.test(compact)) {
    const directBySpdx = LICENSE_REFERENCE_LINKS[compact.toLowerCase()];
    if (directBySpdx) return directBySpdx;
  }

  if (compact === 'apache 2.0' || compact === 'apache-2.0') {
    return LICENSE_REFERENCE_LINKS['apache-2.0'];
  }
  if (compact === 'cc by 4.0' || compact === 'cc-by 4.0') {
    return LICENSE_REFERENCE_LINKS['cc-by-4.0'];
  }
  if (compact === 'mit license') {
    return LICENSE_REFERENCE_LINKS.mit;
  }

  return null;
};

const LICENSE_SEPARATOR_PATTERN = /(\s+\+\s+|\s+AND\s+|\s+OR\s+)/i;

const renderLicenseWithLinks = (licenseText: string) => {
  const parts = licenseText
    .split(LICENSE_SEPARATOR_PATTERN)
    .filter((part) => part.length > 0);

  return parts.map((part, index) => {
    const isSeparator = LICENSE_SEPARATOR_PATTERN.test(part);
    if (isSeparator) {
      return (
        <span key={`license-separator-${part}-${index}`} className="mx-0.5">
          {part.trim()}
        </span>
      );
    }

    const link = resolveLicenseReferenceLink(part);
    if (!link) {
      return (
        <span key={`license-token-${part}-${index}`} className="font-semibold">
          {part.trim()}
        </span>
      );
    }

    return (
      <a
        key={`license-token-${part}-${index}`}
        href={link}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline decoration-black/35 underline-offset-2 hover:text-(--color-9)"
      >
        {part.trim()}
      </a>
    );
  });
};

export function ExternalLibraryDetailsPanel({
  selectedLibrary,
  packageSizeThresholds,
  onVersionQuickSwitch,
}: ExternalLibraryDetailsPanelProps) {
  const { t } = useTranslation('editor');
  const packageSizeMeta = selectedLibrary
    ? getPackageSizeMeta(selectedLibrary.packageSizeKb, packageSizeThresholds)
    : null;

  const packageLevelLabel = packageSizeMeta
    ? t(`resourceManager.external.package.level.${packageSizeMeta.level}`)
    : '';
  const packageHint = packageSizeMeta
    ? t(`resourceManager.external.package.hint.${packageSizeMeta.level}`)
    : '';

  return (
    <aside className="self-start grid gap-3 rounded-xl border border-black/8 bg-black/[0.015] p-3">
      <header>
        <h3 className="text-sm font-semibold text-(--color-9)">
          {t('resourceManager.external.details.title')}
        </h3>
      </header>
      {!selectedLibrary ? (
        <div className="rounded-lg border border-dashed border-black/12 bg-(--color-0) p-4 text-sm text-(--color-7)">
          {t('resourceManager.external.details.empty')}
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
              {t('resourceManager.external.details.license')}:{' '}
              {renderLicenseWithLinks(selectedLibrary.license)}
            </p>
          </div>
          {packageSizeMeta ? (
            <p
              className={`rounded-lg border px-3 py-2 text-xs ${packageSizeMeta.bannerClassName}`}
            >
              {packageSizeMeta.level === 'healthy'
                ? t('resourceManager.external.details.sizeHealthy', {
                    size: formatPackageSize(selectedLibrary.packageSizeKb),
                  })
                : t('resourceManager.external.details.sizeWarning', {
                    level: packageLevelLabel,
                    size: formatPackageSize(selectedLibrary.packageSizeKb),
                    hint: packageHint,
                  })}
            </p>
          ) : null}
          <div className="rounded-lg border border-black/8 bg-(--color-0) p-3">
            <p className="text-xs font-medium text-(--color-7)">
              {t('resourceManager.external.details.providedComponents')}
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
              {t('resourceManager.external.details.versionSwitcher')}
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
