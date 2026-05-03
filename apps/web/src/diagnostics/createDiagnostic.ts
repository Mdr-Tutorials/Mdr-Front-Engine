import type { CreateDiagnosticInput, MdrDiagnostic } from './diagnostic.types';

export const createDiagnostic = (
  diagnostic: CreateDiagnosticInput
): MdrDiagnostic => ({
  retryable: false,
  ...diagnostic,
});
