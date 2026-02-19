import type { NodeGraphPort } from './types';

export type SwitchCaseComparator = 'equals' | 'contains' | 'not-equals';

export type SwitchCaseItem = {
  id: string;
  value: string;
  comparator: SwitchCaseComparator;
};

export type SwitchNodeConfig = {
  valueExpression: string;
  cases: SwitchCaseItem[];
  collapsed: boolean;
};

const SWITCH_CASE_COMPARATOR_SET = new Set<SwitchCaseComparator>([
  'equals',
  'contains',
  'not-equals',
]);

const createSwitchCaseId = (seed?: number) => {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return `case-${Math.floor(seed)}`;
  }
  return `case-${Math.random().toString(36).slice(2, 8)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toSwitchOutputPortId = (caseId: string) => `out.${caseId}`;
const toSwitchInputPortId = (caseId: string) => `in.${caseId}`;

const toCaseIdFromPortId = (portId: string): string | null => {
  if (portId.startsWith('in.case-')) return portId.slice(3);
  if (portId.startsWith('out.case-')) return portId.slice(4);
  return null;
};

const normalizeComparator = (value: unknown): SwitchCaseComparator =>
  typeof value === 'string' &&
  SWITCH_CASE_COMPARATOR_SET.has(value as SwitchCaseComparator)
    ? (value as SwitchCaseComparator)
    : 'equals';

const normalizeCaseId = (value: unknown, fallbackIndex: number) =>
  typeof value === 'string' && value.startsWith('case-')
    ? value
    : createSwitchCaseId(fallbackIndex);

const dedupeCases = (cases: SwitchCaseItem[]) => {
  const deduped: SwitchCaseItem[] = [];
  const seen = new Set<string>();
  cases.forEach((item, index) => {
    let id = item.id;
    if (seen.has(id)) {
      id = createSwitchCaseId(index);
      while (seen.has(id)) {
        id = createSwitchCaseId();
      }
    }
    seen.add(id);
    deduped.push({ ...item, id });
  });
  return deduped;
};

const readSwitchCasesFromPorts = (rawPorts: unknown): SwitchCaseItem[] => {
  if (!Array.isArray(rawPorts)) return [];
  const caseIds: string[] = [];
  const seen = new Set<string>();
  rawPorts.forEach((candidate, index) => {
    if (!isRecord(candidate) || typeof candidate.id !== 'string') return;
    const caseId = toCaseIdFromPortId(candidate.id);
    if (!caseId || caseId === 'default' || seen.has(caseId)) return;
    seen.add(caseId);
    caseIds.push(normalizeCaseId(caseId, index));
  });
  return caseIds.map((id) => ({
    id,
    value: '',
    comparator: 'equals',
  }));
};

export const createDefaultSwitchNodeConfig = (): SwitchNodeConfig => ({
  valueExpression: '',
  collapsed: false,
  cases: [
    {
      id: 'case-0',
      value: '',
      comparator: 'equals',
    },
  ],
});

export const createSwitchCaseDraft = (): SwitchCaseItem => ({
  id: createSwitchCaseId(),
  value: '',
  comparator: 'equals',
});

export const normalizeSwitchNodeConfig = (
  value: unknown,
  rawPorts?: unknown
): SwitchNodeConfig => {
  const fallback = createDefaultSwitchNodeConfig();
  if (!isRecord(value)) {
    const legacyCases = readSwitchCasesFromPorts(rawPorts);
    if (!legacyCases.length) return fallback;
    return {
      valueExpression: '',
      collapsed: false,
      cases: legacyCases,
    };
  }

  const valueExpression =
    typeof value.valueExpression === 'string' ? value.valueExpression : '';
  const collapsed = value.collapsed === true;
  const hasCasesField = Object.prototype.hasOwnProperty.call(value, 'cases');
  const rawCases = Array.isArray(value.cases) ? value.cases : [];
  const normalizedCases = rawCases.flatMap((candidate, index) => {
    if (!isRecord(candidate)) return [];
    return [
      {
        id: normalizeCaseId(candidate.id, index),
        value: typeof candidate.value === 'string' ? candidate.value : '',
        comparator: normalizeComparator(candidate.comparator),
      },
    ];
  });

  if (!normalizedCases.length) {
    if (
      hasCasesField &&
      Array.isArray(value.cases) &&
      value.cases.length === 0
    ) {
      return {
        valueExpression,
        collapsed,
        cases: [],
      };
    }
    const legacyCases = readSwitchCasesFromPorts(rawPorts);
    if (legacyCases.length) {
      return {
        valueExpression,
        collapsed,
        cases: legacyCases,
      };
    }
    return {
      ...fallback,
      valueExpression,
      collapsed,
    };
  }

  return {
    valueExpression,
    collapsed,
    cases: dedupeCases(normalizedCases),
  };
};

export const resolveSwitchNodePorts = (
  config: SwitchNodeConfig
): NodeGraphPort[] => {
  const caseInputPorts = config.cases.map((item, index) => ({
    id: toSwitchInputPortId(item.id),
    role: 'in' as const,
    side: 'left' as const,
    slotOrder: index + 2,
    kind: 'data' as const,
    multiplicity: 'single' as const,
  }));
  const casePorts = config.cases.map((item, index) => ({
    id: toSwitchOutputPortId(item.id),
    role: 'out' as const,
    side: 'right' as const,
    slotOrder: index,
    kind: 'control' as const,
    multiplicity: 'single' as const,
  }));

  return [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'in.value',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'data',
      multiplicity: 'single',
    },
    ...caseInputPorts,
    ...casePorts,
    {
      id: 'out.default',
      role: 'out',
      side: 'right',
      slotOrder: casePorts.length,
      kind: 'control',
      multiplicity: 'single',
    },
  ];
};

export const toSwitchCasePortId = toSwitchOutputPortId;
export const toSwitchCaseInputPortId = toSwitchInputPortId;
