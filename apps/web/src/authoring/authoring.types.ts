import type { DiagnosticTargetRef, MdrDiagnostic } from '@/diagnostics';

export type CodeArtifactLanguage =
  | 'ts'
  | 'js'
  | 'css'
  | 'scss'
  | 'glsl'
  | 'wgsl'
  | 'expr';

export type CodeArtifactOwner =
  | { kind: 'mir-node'; documentId: string; nodeId: string }
  | {
      kind: 'inspector-field';
      documentId: string;
      nodeId: string;
      fieldPath: string;
    }
  | { kind: 'nodegraph-node'; graphId: string; nodeId: string }
  | {
      kind: 'nodegraph-port';
      graphId: string;
      nodeId: string;
      portId: string;
    }
  | { kind: 'animation-track'; timelineId: string; trackId: string }
  | {
      kind: 'animation-keyframe';
      timelineId: string;
      trackId: string;
      keyframeId: string;
    }
  | { kind: 'workspace-module'; documentId: string };

export type CodeArtifact = {
  id: string;
  language: CodeArtifactLanguage;
  owner: CodeArtifactOwner;
  source: string;
  revision: string;
};

export type SymbolSource =
  | { kind: 'mir'; documentId: string }
  | { kind: 'route'; routeId: string }
  | { kind: 'nodegraph'; graphId: string }
  | { kind: 'animation'; timelineId?: string }
  | { kind: 'external-library'; libraryId: string }
  | { kind: 'workspace'; documentId?: string }
  | { kind: 'code'; artifactId: string };

export type CodeSymbolKind =
  | 'state'
  | 'param'
  | 'data'
  | 'item'
  | 'node'
  | 'prop'
  | 'event'
  | 'route'
  | 'graph'
  | 'graph-input'
  | 'graph-output'
  | 'timeline'
  | 'track'
  | 'filter-primitive'
  | 'component'
  | 'module'
  | 'asset'
  | 'function';

export type CodeSymbol = {
  id: string;
  name: string;
  kind: CodeSymbolKind;
  typeRef?: string;
  source: SymbolSource;
  scopeId: string;
  targetRef?: DiagnosticTargetRef;
};

export type CodeScopeKind =
  | 'workspace'
  | 'document'
  | 'route'
  | 'mir-node'
  | 'list-item'
  | 'inspector-field'
  | 'nodegraph'
  | 'nodegraph-node'
  | 'animation'
  | 'code-artifact';

export type CodeScope = {
  id: string;
  parentId?: string;
  kind: CodeScopeKind;
  ownerRef: DiagnosticTargetRef;
};

export type AuthoringSurface =
  | 'code-editor'
  | 'inspector'
  | 'blueprint-canvas'
  | 'nodegraph'
  | 'animation-timeline'
  | 'issues-panel';

export type AuthoringContext = {
  surface: AuthoringSurface;
  artifactId?: string;
  targetRef?: DiagnosticTargetRef;
  scopeId?: string;
};

export type CodeReference = {
  name: string;
  scopeId?: string;
};

export type ResolvedReference = {
  symbol: CodeSymbol;
};

export type CodeCompletion = {
  label: string;
  symbolId?: string;
  detail?: string;
};

export type DefinitionLocation = {
  targetRef?: DiagnosticTargetRef;
  artifactId?: string;
};

export type ReferenceLocation = {
  targetRef?: DiagnosticTargetRef;
  artifactId?: string;
};

export type AuthoringEnvironment = {
  revision: string;
  querySymbols(context: AuthoringContext): CodeSymbol[];
  resolveReference(
    reference: CodeReference,
    context: AuthoringContext
  ): ResolvedReference | null;
  getCompletions(context: AuthoringContext): CodeCompletion[];
  getDiagnostics(context: AuthoringContext): MdrDiagnostic[];
  getDefinition(
    reference: CodeReference,
    context: AuthoringContext
  ): DefinitionLocation | null;
  getReferences(
    symbolId: string,
    context?: AuthoringContext
  ): ReferenceLocation[];
};

export type CodeArtifactProvider = {
  id: string;
  source: SymbolSource;
  listArtifacts(context: AuthoringContext): CodeArtifact[];
  getArtifact(id: string): CodeArtifact | null;
};

export type CodeSymbolProvider = {
  id: string;
  source: SymbolSource;
  listSymbols(context: AuthoringContext): CodeSymbol[];
  listScopes(context: AuthoringContext): CodeScope[];
  getSymbol(id: string): CodeSymbol | null;
};

export type AuthoringDiagnosticProvider = {
  id: string;
  source: SymbolSource;
  getDiagnostics(context: AuthoringContext): MdrDiagnostic[];
};
