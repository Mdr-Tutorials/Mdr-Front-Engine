import type {
  ExternalLibraryDescriptor,
  ExternalLibraryDiagnostic,
} from './types';

let importMapInjected = false;
const REACT_IMPORTS = {
  react: '/src/esm-bridge/react-interop.mjs',
  'react-dom': '/src/esm-bridge/react-dom-interop.mjs',
  'react/jsx-runtime': '/src/esm-bridge/react-jsx-runtime-interop.mjs',
  'react/jsx-dev-runtime': '/src/esm-bridge/react-jsx-dev-runtime-interop.mjs',
};

const createImportMapConflictDiagnostic = (
  details: string
): ExternalLibraryDiagnostic => ({
  code: 'ELIB-1010',
  level: 'warning',
  stage: 'load',
  message: 'Detected existing import map conflict for React bridge aliases.',
  hint: details,
  retryable: false,
});

export const ensureHostReactImportMap = (
  diagnostics: ExternalLibraryDiagnostic[]
) => {
  if (importMapInjected || typeof document === 'undefined') return;
  const existingImportMap = document.getElementById('mdr-esm-importmap');
  if (existingImportMap) {
    try {
      const parsed = JSON.parse(existingImportMap.textContent ?? '{}') as {
        imports?: Record<string, string>;
      };
      const imports = parsed.imports ?? {};
      const conflicts = Object.entries(REACT_IMPORTS)
        .filter(([name, url]) => imports[name] && imports[name] !== url)
        .map(([name, url]) => `${name}: expected ${url}, got ${imports[name]}`);
      if (conflicts.length > 0) {
        diagnostics.push(
          createImportMapConflictDiagnostic(conflicts.join(' | '))
        );
      }
    } catch {
      diagnostics.push(
        createImportMapConflictDiagnostic(
          'Existing import map is not valid JSON.'
        )
      );
    }
    importMapInjected = true;
    return;
  }
  const script = document.createElement('script');
  script.id = 'mdr-esm-importmap';
  script.type = 'importmap';
  script.textContent = JSON.stringify({
    imports: REACT_IMPORTS,
  });
  document.head.appendChild(script);
  importMapInjected = true;
};

export const loadExternalEsmModule = async (
  descriptor: ExternalLibraryDescriptor,
  diagnostics: ExternalLibraryDiagnostic[]
) => {
  ensureHostReactImportMap(diagnostics);
  let loadedModule: Record<string, unknown> | null = null;
  const attemptErrors: string[] = [];

  for (const url of descriptor.entryCandidates) {
    try {
      loadedModule = (await import(/* @vite-ignore */ url)) as Record<
        string,
        unknown
      >;
      break;
    } catch (error) {
      attemptErrors.push(`${url} -> ${String(error)}`);
    }
  }

  if (loadedModule) return loadedModule;

  diagnostics.push({
    code: 'ELIB-1001',
    level: 'error',
    stage: 'load',
    libraryId: descriptor.libraryId,
    message: `Failed to load ${descriptor.packageName}@${descriptor.version} from ${descriptor.source}.`,
    hint:
      attemptErrors.join(' | ') ||
      'No entry candidates were provided for this library descriptor.',
    retryable: true,
  });
  return null;
};
