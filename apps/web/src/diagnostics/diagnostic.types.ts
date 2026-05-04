export type MdrDiagnosticSeverity = 'info' | 'warning' | 'error' | 'fatal';

export type MdrDiagnosticDomain =
  | 'mir'
  | 'workspace'
  | 'route'
  | 'editor'
  | 'code'
  | 'nodegraph'
  | 'animation'
  | 'elib'
  | 'codegen'
  | 'backend'
  | 'ai';

export type DiagnosticTargetRef =
  | { kind: 'workspace'; workspaceId: string }
  | { kind: 'document'; workspaceId?: string; documentId: string }
  | { kind: 'mir-node'; documentId: string; nodeId: string }
  | {
      kind: 'inspector-field';
      documentId: string;
      nodeId: string;
      fieldPath: string;
    }
  | { kind: 'route'; routeId: string }
  | { kind: 'nodegraph-node'; graphId: string; nodeId: string }
  | {
      kind: 'nodegraph-port';
      graphId: string;
      nodeId: string;
      portId: string;
    }
  | { kind: 'animation-track'; timelineId: string; trackId: string }
  | { kind: 'code-artifact'; artifactId: string }
  | { kind: 'operation'; operation: string };

export type SourceSpan = {
  artifactId: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export type MdrDiagnostic = {
  code: string;
  severity: MdrDiagnosticSeverity;
  domain: MdrDiagnosticDomain;
  message: string;
  hint?: string;
  docsUrl?: string;
  retryable?: boolean;
  cause?: unknown;
  meta?: Record<string, unknown>;
  targetRef?: DiagnosticTargetRef;
  sourceSpan?: SourceSpan;
};

export type CreateDiagnosticInput = Omit<MdrDiagnostic, 'retryable'> & {
  retryable?: boolean;
};
