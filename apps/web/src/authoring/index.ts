export { createAuthoringDiagnosticProviderRegistry } from '@/authoring/authoringDiagnosticProviderRegistry';
export { createAuthoringEnvironment } from '@/authoring/createAuthoringEnvironment';
export { createCodeArtifactProviderRegistry } from '@/authoring/codeArtifactProviderRegistry';
export { createCodeSymbolProviderRegistry } from '@/authoring/codeSymbolProviderRegistry';
export { createEmptyAuthoringEnvironment } from '@/authoring/createEmptyAuthoringEnvironment';
export type { AuthoringDiagnosticProviderRegistry } from '@/authoring/authoringDiagnosticProviderRegistry';
export type { CreateAuthoringEnvironmentInput } from '@/authoring/createAuthoringEnvironment';
export type { CodeArtifactProviderRegistry } from '@/authoring/codeArtifactProviderRegistry';
export type { CodeSymbolProviderRegistry } from '@/authoring/codeSymbolProviderRegistry';
export type {
  AuthoringContext,
  AuthoringDiagnosticProvider,
  AuthoringEnvironment,
  AuthoringSurface,
  CodeArtifact,
  CodeArtifactLanguage,
  CodeArtifactOwner,
  CodeArtifactProvider,
  CodeCompletion,
  CodeReference,
  CodeScope,
  CodeScopeKind,
  CodeSymbol,
  CodeSymbolKind,
  CodeSymbolProvider,
  DefinitionLocation,
  ReferenceLocation,
  ResolvedReference,
  SymbolSource,
} from '@/authoring/authoring.types';
