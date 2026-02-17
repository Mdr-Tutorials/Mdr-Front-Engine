import type { MIRDocument } from '@/core/types/engine.types';
import type { TargetAdapter } from '../core/adapter';
import type { CompileDiagnostic } from '../core/diagnostics';
import type { CanonicalIRDocument } from '../core/canonicalIR';
import type { PackageResolverOptions } from '../core/packageResolver';

export type ExportResourceType = 'project' | 'component' | 'nodegraph';

export type ReactExportFile = {
  path: string;
  language: 'typescript' | 'json' | 'html' | 'css';
  content: string;
};

export type ReactExportBundle = {
  type: ExportResourceType;
  entryFilePath: string;
  files: ReactExportFile[];
  diagnostics?: CompileDiagnostic[];
};

export type MountedCssFile = {
  path: string;
  content: string;
};

export type ReactGeneratorOptions = {
  resourceType?: ExportResourceType;
  componentName?: string;
  adapter?: TargetAdapter;
  packageResolver?: PackageResolverOptions;
};

export type ReactCompileOptions = Pick<
  ReactGeneratorOptions,
  'componentName' | 'adapter' | 'packageResolver'
>;

export type ReactComponentCompileResult = {
  componentName: string;
  code: string;
  diagnostics: CompileDiagnostic[];
  canonicalIR: CanonicalIRDocument;
  dependencies: Record<string, string>;
  mountedCssFiles: MountedCssFile[];
};

export type MirDocLike = MIRDocument;
