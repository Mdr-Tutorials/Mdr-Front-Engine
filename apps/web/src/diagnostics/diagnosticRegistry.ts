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

export type DiagnosticPlacement =
  | 'code-editor'
  | 'inspector'
  | 'blueprint-canvas'
  | 'nodegraph'
  | 'animation-timeline'
  | 'issues-panel'
  | 'operation-status';

export type DiagnosticDefinition = DiagnosticRegistryEntry & {
  stage: string;
  retryable: boolean;
  docsPath: string;
  defaultPlacement?: DiagnosticPlacement[];
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

export const COD_DIAGNOSTIC_DEFINITIONS = {
  COD_1001: {
    code: 'COD-1001',
    domain: 'code',
    severity: 'error',
    stage: 'parse',
    retryable: false,
    docsPath: '/reference/diagnostics/cod-1001',
    docsUrl: '/reference/diagnostics/cod-1001',
    defaultPlacement: ['code-editor', 'issues-panel'],
  },
  COD_1002: {
    code: 'COD-1002',
    domain: 'code',
    severity: 'error',
    stage: 'parse',
    retryable: false,
    docsPath: '/reference/diagnostics/cod-1002',
    docsUrl: '/reference/diagnostics/cod-1002',
    defaultPlacement: ['code-editor', 'inspector', 'issues-panel'],
  },
  COD_2001: {
    code: 'COD-2001',
    domain: 'code',
    severity: 'warning',
    stage: 'symbol',
    retryable: true,
    docsPath: '/reference/diagnostics/cod-2001',
    docsUrl: '/reference/diagnostics/cod-2001',
    defaultPlacement: ['code-editor', 'inspector', 'issues-panel'],
  },
  COD_2002: {
    code: 'COD-2002',
    domain: 'code',
    severity: 'error',
    stage: 'symbol',
    retryable: true,
    docsPath: '/reference/diagnostics/cod-2002',
    docsUrl: '/reference/diagnostics/cod-2002',
    defaultPlacement: ['code-editor', 'issues-panel'],
  },
  COD_2003: {
    code: 'COD-2003',
    domain: 'code',
    severity: 'warning',
    stage: 'symbol',
    retryable: false,
    docsPath: '/reference/diagnostics/cod-2003',
    docsUrl: '/reference/diagnostics/cod-2003',
    defaultPlacement: ['code-editor', 'inspector', 'issues-panel'],
  },
  COD_2004: {
    code: 'COD-2004',
    domain: 'code',
    severity: 'warning',
    stage: 'symbol',
    retryable: true,
    docsPath: '/reference/diagnostics/cod-2004',
    docsUrl: '/reference/diagnostics/cod-2004',
    defaultPlacement: ['operation-status', 'issues-panel'],
  },
  COD_3001: {
    code: 'COD-3001',
    domain: 'code',
    severity: 'error',
    stage: 'binding',
    retryable: false,
    docsPath: '/reference/diagnostics/cod-3001',
    docsUrl: '/reference/diagnostics/cod-3001',
    defaultPlacement: ['inspector', 'blueprint-canvas', 'issues-panel'],
  },
  COD_3002: {
    code: 'COD-3002',
    domain: 'code',
    severity: 'error',
    stage: 'binding',
    retryable: false,
    docsPath: '/reference/diagnostics/cod-3002',
    docsUrl: '/reference/diagnostics/cod-3002',
    defaultPlacement: ['code-editor', 'inspector', 'issues-panel'],
  },
  COD_3003: {
    code: 'COD-3003',
    domain: 'code',
    severity: 'warning',
    stage: 'binding',
    retryable: false,
    docsPath: '/reference/diagnostics/cod-3003',
    docsUrl: '/reference/diagnostics/cod-3003',
    defaultPlacement: ['code-editor', 'inspector', 'issues-panel'],
  },
  COD_4001: {
    code: 'COD-4001',
    domain: 'code',
    severity: 'error',
    stage: 'runtime',
    retryable: true,
    docsPath: '/reference/diagnostics/cod-4001',
    docsUrl: '/reference/diagnostics/cod-4001',
    defaultPlacement: ['code-editor', 'issues-panel'],
  },
  COD_5001: {
    code: 'COD-5001',
    domain: 'code',
    severity: 'error',
    stage: 'compile',
    retryable: true,
    docsPath: '/reference/diagnostics/cod-5001',
    docsUrl: '/reference/diagnostics/cod-5001',
    defaultPlacement: ['code-editor', 'issues-panel'],
  },
  COD_5002: {
    code: 'COD-5002',
    domain: 'code',
    severity: 'error',
    stage: 'compile',
    retryable: false,
    docsPath: '/reference/diagnostics/cod-5002',
    docsUrl: '/reference/diagnostics/cod-5002',
    defaultPlacement: ['code-editor', 'issues-panel'],
  },
  COD_9001: {
    code: 'COD-9001',
    domain: 'code',
    severity: 'error',
    stage: 'environment',
    retryable: true,
    docsPath: '/reference/diagnostics/cod-9001',
    docsUrl: '/reference/diagnostics/cod-9001',
    defaultPlacement: ['issues-panel'],
  },
} as const satisfies Record<string, DiagnosticDefinition>;
