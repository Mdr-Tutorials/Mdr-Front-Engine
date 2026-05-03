import type {
  MdrDiagnostic,
  MdrDiagnosticDomain,
  MdrDiagnosticSeverity,
} from './diagnostic.types';

const DIAGNOSTIC_SEVERITIES: ReadonlySet<MdrDiagnosticSeverity> = new Set([
  'info',
  'warning',
  'error',
  'fatal',
]);

const DIAGNOSTIC_DOMAINS: ReadonlySet<MdrDiagnosticDomain> = new Set([
  'mir',
  'workspace',
  'route',
  'editor',
  'nodegraph',
  'animation',
  'elib',
  'codegen',
  'backend',
  'ai',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isDiagnostic = (value: unknown): value is MdrDiagnostic => {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === 'string' &&
    DIAGNOSTIC_SEVERITIES.has(value.severity as MdrDiagnosticSeverity) &&
    DIAGNOSTIC_DOMAINS.has(value.domain as MdrDiagnosticDomain) &&
    typeof value.message === 'string'
  );
};
