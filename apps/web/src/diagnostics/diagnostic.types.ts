export type MdrDiagnosticSeverity = 'info' | 'warning' | 'error' | 'fatal';

export type MdrDiagnosticDomain =
  | 'mir'
  | 'workspace'
  | 'route'
  | 'editor'
  | 'nodegraph'
  | 'animation'
  | 'elib'
  | 'codegen'
  | 'backend'
  | 'ai';

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
};

export type CreateDiagnosticInput = Omit<MdrDiagnostic, 'retryable'> & {
  retryable?: boolean;
};
