import type {
  MdrDiagnosticDomain,
  MdrDiagnosticSeverity,
} from './diagnostic.types';

export type DiagnosticRegistryEntry = {
  code: string;
  domain: MdrDiagnosticDomain;
  severity: MdrDiagnosticSeverity;
  docsUrl?: string;
};

export const MIR_DIAGNOSTIC_REGISTRY = {
  MIR_1001: {
    code: 'MIR-1001',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_1002: {
    code: 'MIR-1002',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_1003: {
    code: 'MIR-1003',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_2001: {
    code: 'MIR-2001',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_2002: {
    code: 'MIR-2002',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_2003: {
    code: 'MIR-2003',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_2004: {
    code: 'MIR-2004',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_2005: {
    code: 'MIR-2005',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_2006: {
    code: 'MIR-2006',
    domain: 'mir',
    severity: 'warning',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_2007: {
    code: 'MIR-2007',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_3001: {
    code: 'MIR-3001',
    domain: 'mir',
    severity: 'warning',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_3002: {
    code: 'MIR-3002',
    domain: 'mir',
    severity: 'warning',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_3010: {
    code: 'MIR-3010',
    domain: 'mir',
    severity: 'warning',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_4001: {
    code: 'MIR-4001',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
  MIR_9001: {
    code: 'MIR-9001',
    domain: 'mir',
    severity: 'error',
    docsUrl: '/reference/diagnostic-codes#mir',
  },
} as const satisfies Record<string, DiagnosticRegistryEntry>;
