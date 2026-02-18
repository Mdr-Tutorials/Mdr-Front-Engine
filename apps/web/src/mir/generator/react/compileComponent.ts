import type { ComponentNode } from '@/core/types/engine.types';
import type { CanonicalNode } from '../core/canonicalIR';
import { buildCanonicalIR } from '../core/canonicalIR';
import type { AdapterImportSpec } from '../core/adapter';
import { createDiagnosticBag } from '../core/diagnostics';
import { resolvePackageImport } from '../core/packageResolver';
import { isBuiltInActionName } from '@/mir/actions/registry';
import type {
  MirDocLike,
  ReactCompileOptions,
  ReactComponentCompileResult,
} from './types';
import { reactAdapter } from './adapter';

const toReactEventName = (trigger: string) => {
  const normalized = trigger.toLowerCase();
  if (normalized === 'click') return 'onClick';
  if (normalized === 'change') return 'onChange';
  if (normalized === 'input') return 'onInput';
  if (normalized === 'submit') return 'onSubmit';
  if (normalized === 'focus') return 'onFocus';
  if (normalized === 'blur') return 'onBlur';
  return /^on[A-Z]/.test(trigger)
    ? trigger
    : `on${trigger.charAt(0).toUpperCase()}${trigger.slice(1)}`;
};

const toIdentifier = (value: string) => {
  const normalized = value.replace(/[^a-zA-Z0-9_$]/g, '_');
  return /^[a-zA-Z_$]/.test(normalized) ? normalized : `_${normalized}`;
};

const stringify = (value: unknown) => JSON.stringify(value);

const stringifyLiteral = (value: unknown): string | null => {
  const json = JSON.stringify(value);
  if (json === undefined) return null;
  return json;
};

const compileValueExpression = (value: unknown, scopeVar: string): string => {
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if ('$param' in record && typeof record.$param === 'string') {
      return toIdentifier(record.$param);
    }
    if ('$state' in record && typeof record.$state === 'string') {
      return toIdentifier(record.$state);
    }
    if ('$data' in record && typeof record.$data === 'string') {
      return `__readByPath(${scopeVar}.data, ${stringify(record.$data)})`;
    }
    if ('$item' in record && typeof record.$item === 'string') {
      return `__readByPath(${scopeVar}.item, ${stringify(record.$item)})`;
    }
    if ('$index' in record && record.$index === true) {
      return `${scopeVar}.index`;
    }
  }
  if (typeof value === 'string') {
    return `__resolvePathOrLiteral(${scopeVar}.data, ${stringify(value)})`;
  }
  const literal = stringifyLiteral(value);
  return literal ?? 'undefined';
};

const compileObjectExpression = (
  value: Record<string, unknown>,
  scopeVar: string
): string =>
  `{ ${Object.entries(value)
    .map(
      ([key, entry]) =>
        `${JSON.stringify(key)}: ${compileValueExpression(entry, scopeVar)}`
    )
    .join(', ')} }`;

const buildNavigateInlineHandler = (paramsExpr: string) => {
  return `{() => {
    const __params = ${paramsExpr};
    const __to = typeof __params.to === 'string' ? __params.to.trim() : '';
    if (!__to) return;
    const __target = __params.target === '_self' ? '_self' : '_blank';
    const __replace = Boolean(__params.replace);
    if (__target === '_blank') {
      window.open(__to, '_blank', 'noopener,noreferrer');
      return;
    }
    if (__replace) {
      window.location.replace(__to);
      return;
    }
    window.location.assign(__to);
  }}`;
};

const buildExecuteGraphInlineHandler = (paramsExpr: string) => {
  return `{() => {
      window.dispatchEvent(
        new CustomEvent('mdr:execute-graph', { detail: ${paramsExpr} })
      );
    }}`;
};

const buildBuiltInInlineHandler = (
  action: string,
  params: Record<string, unknown>,
  scopeVar: string
) => {
  const paramsExpr = compileObjectExpression(params, scopeVar);
  if (action === 'navigate') return buildNavigateInlineHandler(paramsExpr);
  if (action === 'executeGraph')
    return buildExecuteGraphInlineHandler(paramsExpr);
  return null;
};

const compilePropExpression = (
  value: unknown,
  scopeVar: string
): string | null => {
  const expr = compileValueExpression(value, scopeVar);
  if (!expr) return null;
  return `{${expr}}`;
};

const compileTextContent = (value: CanonicalNode['text'], scopeVar: string) => {
  if (value === undefined) return '';
  if (
    typeof value === 'object' &&
    value !== null &&
    !('$param' in value) &&
    !('$state' in value) &&
    !('$data' in value) &&
    !('$item' in value) &&
    !('$index' in value)
  ) {
    return stringify(JSON.stringify(value));
  }
  return `{${compileValueExpression(value, scopeVar)}}`;
};

const renderImport = (item: AdapterImportSpec) => {
  if (item.kind === 'namespace') {
    return `import * as ${item.local ?? item.imported} from '${item.source}';`;
  }
  if (item.kind === 'default') {
    return `import ${item.local ?? item.imported} from '${item.source}';`;
  }
  const imported = item.local
    ? `${item.imported} as ${item.local}`
    : item.imported;
  return `import { ${imported} } from '${item.source}';`;
};

const dedupeImports = (items: AdapterImportSpec[]) => {
  const map = new Map<string, AdapterImportSpec>();
  items.forEach((item) => {
    const key = `${item.kind}:${item.source}:${item.imported}:${item.local ?? ''}`;
    map.set(key, item);
  });
  return Array.from(map.values());
};

const toImportKey = (item: AdapterImportSpec) =>
  `${item.kind}:${item.source}:${item.imported}:${item.local ?? ''}`;

const toPascalCase = (value: string) =>
  value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

type ResolvedAdapterImport = AdapterImportSpec & {
  resolution: ReturnType<typeof resolvePackageImport>;
};

const resolveImportAliasPrefix = (item: ResolvedAdapterImport) => {
  const { source, resolution } = item;
  const packageName = resolution.packageName;
  if (packageName === 'antd') return 'Antd';
  if (packageName?.startsWith('@mui/')) return 'Mui';
  if (packageName?.startsWith('@radix-ui/')) return 'Radix';
  if (packageName?.startsWith('@mdr/')) return 'Mdr';
  if (source === 'antd') return 'Antd';
  if (source.startsWith('@mui/')) return 'Mui';
  if (source.startsWith('@radix-ui/')) return 'Radix';
  if (source.startsWith('@mdr/')) return 'Mdr';
  const fallback = packageName ?? source;
  return toPascalCase(fallback.replace(/^@/, '').replace(/\//g, '-')) || 'Lib';
};

const assignImportLocals = (items: ResolvedAdapterImport[]) => {
  const localCount = new Map<string, number>();
  items.forEach((item) => {
    const base = item.local ?? item.imported;
    localCount.set(base, (localCount.get(base) ?? 0) + 1);
  });

  const assigned = new Map<string, string>();
  const usedLocals = new Set<string>();

  items.forEach((item) => {
    const key = toImportKey(item);
    const baseLocal = item.local ?? item.imported;
    const needsAlias = (localCount.get(baseLocal) ?? 0) > 1;
    let candidate = baseLocal;

    if (needsAlias) {
      const prefix = resolveImportAliasPrefix(item);
      const safeBase = baseLocal.charAt(0).toUpperCase() + baseLocal.slice(1);
      candidate = `${prefix}${safeBase}`;
    }

    candidate = toIdentifier(candidate);
    let uniqueName = candidate;
    let suffix = 2;
    while (usedLocals.has(uniqueName)) {
      uniqueName = `${candidate}${suffix}`;
      suffix += 1;
    }

    usedLocals.add(uniqueName);
    assigned.set(key, uniqueName);
  });

  return assigned;
};

const rewriteElementWithAlias = (
  element: string,
  imports: AdapterImportSpec[] | undefined,
  importLocalByKey: Map<string, string>
) => {
  if (!imports?.length || !element) return element;
  const [root, ...rest] = element.split('.');
  const matchedImport = imports.find(
    (item) => (item.local ?? item.imported) === root
  );
  if (!matchedImport) return element;
  const nextRoot = importLocalByKey.get(toImportKey(matchedImport)) ?? root;
  if (nextRoot === root) return element;
  return [nextRoot, ...rest].join('.');
};

type UnsafeRecord = Record<string, unknown>;

const INTERNAL_NODE_PROP_KEYS = new Set([
  'mountedCss',
  'styleMount',
  'styleMountCss',
  'textMode',
]);

const INTERNAL_DATA_ATTRIBUTE_PREFIXES = ['data-mir-', 'data-layout-'];

const asRecord = (value: unknown): UnsafeRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnsafeRecord)
    : null;

const sanitizePathSegment = (segment: string) =>
  segment.replace(/[^a-zA-Z0-9._-]/g, '-');

const toMountedCssFilePath = (rawPath: string, fallbackName: string) => {
  const normalized = rawPath.replaceAll('\\', '/').trim();
  const rawSegments = normalized
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => segment !== '.' && segment !== '..')
    .map(sanitizePathSegment);

  const styleIndex = rawSegments.findIndex((segment) => segment === 'styles');
  const segments =
    styleIndex >= 0
      ? rawSegments.slice(styleIndex)
      : ['styles', 'mounted', rawSegments.at(-1) ?? `${fallbackName}.css`];

  if (!segments.length) {
    segments.push('styles', 'mounted', `${fallbackName}.css`);
  }

  const fileName = segments.at(-1) ?? `${fallbackName}.css`;
  if (!fileName.toLowerCase().endsWith('.css')) {
    segments[segments.length - 1] = `${fileName}.css`;
  }

  return segments.join('/');
};

const readMountedCssContent = (value: unknown): string | null => {
  const record = asRecord(value);
  if (!record) return null;
  if (typeof record.content !== 'string') return null;
  const content = record.content.trim();
  if (!content) return null;
  return `${content}\n`;
};

const collectMountedCssFiles = (
  root: ComponentNode
): Array<{ path: string; content: string }> => {
  const filesByPath = new Map<string, string>();

  const collectFromNode = (node: ComponentNode) => {
    const anyNode = node as ComponentNode & { metadata?: unknown };
    const props = asRecord(anyNode.props);
    const metadata = asRecord(anyNode.metadata);
    const candidates = [
      props?.mountedCss,
      props?.styleMount,
      props?.styleMountCss,
      metadata?.mountedCss,
      metadata?.styleMount,
    ];

    candidates.forEach((candidate, candidateIndex) => {
      const appendCssFile = (rawEntry: unknown, fallbackPath: string): void => {
        const content = readMountedCssContent(rawEntry);
        if (!content) return;
        const record = asRecord(rawEntry);
        const pathValue =
          typeof record?.path === 'string' && record.path.trim()
            ? record.path
            : fallbackPath;
        const normalizedPath = toMountedCssFilePath(pathValue, node.id);
        const previous = filesByPath.get(normalizedPath);
        if (!previous) {
          filesByPath.set(normalizedPath, content);
          return;
        }
        if (!previous.includes(content)) {
          filesByPath.set(normalizedPath, `${previous}\n${content}`);
        }
      };

      if (Array.isArray(candidate)) {
        candidate.forEach((entry, entryIndex) => {
          appendCssFile(
            entry,
            `styles/mounted/${node.id}-${candidateIndex + 1}-${entryIndex + 1}.css`
          );
        });
        return;
      }

      appendCssFile(
        candidate,
        `styles/mounted/${node.id}-${candidateIndex + 1}.css`
      );
    });

    node.children?.forEach(collectFromNode);
  };

  collectFromNode(root);

  return Array.from(filesByPath.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => ({
      path,
      content,
    }));
};

const sanitizeDataAttributesProp = (value: unknown): Record<string, string> => {
  const record = asRecord(value);
  if (!record) return {};
  return Object.entries(record).reduce<Record<string, string>>(
    (acc, [key, item]) => {
      if (
        INTERNAL_DATA_ATTRIBUTE_PREFIXES.some((prefix) =>
          key.startsWith(prefix)
        )
      ) {
        return acc;
      }
      if (typeof item === 'string' || typeof item === 'number') {
        acc[key] = String(item);
      }
      return acc;
    },
    {}
  );
};

const sanitizeNodePropsForExport = (props: Record<string, unknown>) => {
  const sanitized: Record<string, unknown> = {};
  Object.entries(props).forEach(([key, value]) => {
    if (INTERNAL_NODE_PROP_KEYS.has(key)) return;
    if (
      INTERNAL_DATA_ATTRIBUTE_PREFIXES.some((prefix) => key.startsWith(prefix))
    ) {
      return;
    }
    if (key === 'dataAttributes') {
      const dataAttributes = sanitizeDataAttributesProp(value);
      if (Object.keys(dataAttributes).length > 0) {
        sanitized[key] = dataAttributes;
      }
      return;
    }
    sanitized[key] = value;
  });
  return sanitized;
};

export const compileMirToReactComponent = (
  mirDoc: MirDocLike,
  options?: ReactCompileOptions
): ReactComponentCompileResult => {
  const bag = createDiagnosticBag();
  const canonical = buildCanonicalIR(mirDoc, bag);
  const mountedCssFiles = collectMountedCssFiles(mirDoc.ui.root);

  const componentName =
    options?.componentName ||
    canonical.metadata?.name?.replace(/\s+/g, '') ||
    'MdrComponent';
  const interfaceName = `${componentName}Props`;
  const propsDef = canonical.logic?.props ?? {};
  const hasProps = Object.keys(propsDef).length > 0;
  const propFunctionKeys = Object.entries(propsDef)
    .filter(([, def]) => {
      const type = typeof def?.type === 'string' ? def.type : '';
      return type.includes('=>') || type.toLowerCase().includes('function');
    })
    .map(([key]) => key);
  const hasState = Boolean(
    canonical.logic?.state && Object.keys(canonical.logic.state).length > 0
  );
  const adapter = options?.adapter ?? reactAdapter;

  const adapterImports: AdapterImportSpec[] = [];
  const collectAdapterArtifacts = (node: CanonicalNode) => {
    const adapterResult = adapter.resolveNode(node);
    if (adapterResult.imports?.length) {
      adapterImports.push(...adapterResult.imports);
    }
    if (adapterResult.diagnostics?.length) {
      bag.diagnostics.push(...adapterResult.diagnostics);
    }
    node.children.forEach(collectAdapterArtifacts);
  };
  collectAdapterArtifacts(canonical.root);

  const resolvedImports: ResolvedAdapterImport[] = dedupeImports(
    adapterImports
  ).map((item) => ({
    ...item,
    resolution: resolvePackageImport(item.source, options?.packageResolver),
  }));
  const importLocalByKey = assignImportLocals(resolvedImports);
  const findCanonicalNodeById = (
    target: CanonicalNode,
    nodeId: string
  ): CanonicalNode | null => {
    if (target.id === nodeId) return target;
    for (const child of target.children) {
      const found = findCanonicalNodeById(child, nodeId);
      if (found) return found;
    }
    return null;
  };

  const compileNode = (
    node: CanonicalNode,
    indent = '    ',
    scopeVar = '__scope'
  ): string => {
    if (node.list) {
      const listSourceExpr =
        node.list.source !== undefined
          ? compileValueExpression(node.list.source, scopeVar)
          : `${scopeVar}.data`;
      const itemAlias =
        typeof node.list.itemAs === 'string' && node.list.itemAs.trim()
          ? node.list.itemAs.trim()
          : 'item';
      const indexAlias =
        typeof node.list.indexAs === 'string' && node.list.indexAs.trim()
          ? node.list.indexAs.trim()
          : 'index';
      const nodeWithoutList: CanonicalNode = {
        ...node,
        list: undefined,
      };
      const bodyNode = compileNode(
        nodeWithoutList,
        `${indent}      `,
        '__nextScope'
      );
      const keyExpr =
        typeof node.list.keyBy === 'string' && node.list.keyBy.trim()
          ? `__readByPath(__item, ${stringify(node.list.keyBy)}) ?? __index`
          : '__index';
      let emptyRender = 'null';
      if (
        typeof node.list.emptyNodeId === 'string' &&
        node.list.emptyNodeId.trim()
      ) {
        const emptyNodeId = node.list.emptyNodeId.trim();
        const emptyNode =
          emptyNodeId === node.id
            ? null
            : findCanonicalNodeById(canonical.root, emptyNodeId);
        if (emptyNode) {
          emptyRender = compileNode(
            emptyNode,
            `${indent}      `,
            scopeVar
          ).trim();
        }
      }
      return `${indent}{(() => {
${indent}  const __list = ${listSourceExpr};
${indent}  if (!Array.isArray(__list) || __list.length === 0) {
${indent}    return ${emptyRender};
${indent}  }
${indent}  return __list.map((__item, __index) => {
${indent}    const __nextScope = {
${indent}      ...${scopeVar},
${indent}      item: __item,
${indent}      index: __index,
${indent}      data:
${indent}        __item && typeof __item === 'object' && !Array.isArray(__item)
${indent}          ? {
${indent}              ...(__isPlainObject(${scopeVar}.data) ? ${scopeVar}.data : {}),
${indent}              ...(__item as Record<string, unknown>),
${indent}            }
${indent}          : __item,
${indent}      params: {
${indent}        ...${scopeVar}.params,
${indent}        ${JSON.stringify(itemAlias)}: __item,
${indent}        ${JSON.stringify(indexAlias)}: __index,
${indent}      },
${indent}    };
${indent}    return (
${indent}      <React.Fragment key={String(${keyExpr})}>
${bodyNode}
${indent}      </React.Fragment>
${indent}    );
${indent}  });
${indent}})()}`;
    }
    const adapterResult = adapter.resolveNode(node);
    const tag = rewriteElementWithAlias(
      adapterResult.element,
      adapterResult.imports,
      importLocalByKey
    );
    const propsArray: string[] = [];

    if (Object.keys(node.style).length > 0) {
      const styleExpr = stringifyLiteral(node.style);
      if (styleExpr) propsArray.push(`style={${styleExpr}}`);
    }

    Object.entries(sanitizeNodePropsForExport(node.props)).forEach(
      ([key, value]) => {
        const expr = compilePropExpression(value, scopeVar);
        if (expr !== null) {
          propsArray.push(`${key}=${expr}`);
        }
      }
    );

    Object.entries(node.events).forEach(([eventKey, eventDef]) => {
      const trigger = eventDef.trigger || eventKey;
      const reactEventName = toReactEventName(trigger);
      if (!reactEventName) return;

      if (eventDef.action && propFunctionKeys.includes(eventDef.action)) {
        propsArray.push(`${reactEventName}={${toIdentifier(eventDef.action)}}`);
        return;
      }

      if (eventDef.action && isBuiltInActionName(eventDef.action)) {
        const handlerExpr = buildBuiltInInlineHandler(
          eventDef.action,
          eventDef.params ?? {},
          scopeVar
        );
        if (handlerExpr) {
          propsArray.push(`${reactEventName}=${handlerExpr}`);
        }
      }
    });

    const allProps = propsArray.length ? ` ${propsArray.join(' ')}` : '';
    const textContent = compileTextContent(node.text, scopeVar);
    const childJsx =
      node.children
        .map((child) => compileNode(child, `${indent}  `, scopeVar))
        .join('\n') || '';

    if (!childJsx && !textContent && (tag === 'input' || tag === 'img')) {
      return `${indent}<${tag}${allProps} />`;
    }

    const textBlock = textContent ? `${indent}  ${textContent}\n` : '';
    const childBlock = childJsx ? `${childJsx}\n` : '';
    return `${indent}<${tag}${allProps}>\n${textBlock}${childBlock}${indent}</${tag}>`;
  };

  const interfaceFields = Object.entries(propsDef)
    .map(([key, value]) => `  ${toIdentifier(key)}?: ${value.type || 'any'};`)
    .join('\n');
  const interfaceBlock = hasProps
    ? `interface ${interfaceName} {\n${interfaceFields}\n}\n`
    : '';
  const destructuredProps = Object.entries(propsDef)
    .map(([key, value]) => {
      const safeKey = toIdentifier(key);
      if (value.default === undefined) return safeKey;
      const serialized = stringifyLiteral(value.default);
      if (serialized === null) return safeKey;
      return `${safeKey} = ${serialized}`;
    })
    .join(', ');
  const stateBlock = hasState
    ? Object.entries(canonical.logic?.state ?? {})
        .map(([key, value]) => {
          const safeKey = toIdentifier(key);
          const setter = `set${safeKey.charAt(0).toUpperCase()}${safeKey.slice(1)}`;
          const initial = stringifyLiteral(value.initial) ?? 'null';
          return `  const [${safeKey}, ${setter}] = useState(${initial});`;
        })
        .join('\n')
    : '';

  const reactImport = hasState
    ? "import React, { useState } from 'react';"
    : "import React from 'react';";
  const rootJsx = compileNode(canonical.root);
  const adapterImportBlock = resolvedImports
    .map((item) => {
      const importKey = toImportKey(item);
      const assignedLocal = importLocalByKey.get(importKey);
      const baseLocal = item.local ?? item.imported;
      const local =
        assignedLocal && assignedLocal !== baseLocal
          ? assignedLocal
          : item.local;
      return renderImport({
        ...item,
        local,
        source: item.resolution.importSource,
      });
    })
    .join('\n');
  const mountedCssImportBlock = mountedCssFiles
    .map((file) => `import './${file.path}';`)
    .join('\n');
  const runtimeHelperBlock = `const __PATH_SEGMENT_PATTERN = /[^.[\\]]+|\\[(\\d+)\\]/g;
const __isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const __readByPath = (source: unknown, path: string): unknown => {
  const trimmed = path.trim();
  if (!trimmed) return source;
  const tokens = Array.from(trimmed.matchAll(__PATH_SEGMENT_PATTERN)).map(
    (token) => token[1] ?? token[0]
  );
  let cursor: unknown = source;
  for (const token of tokens) {
    if (cursor === null || cursor === undefined) return undefined;
    if (Array.isArray(cursor)) {
      const index = Number(token);
      if (!Number.isInteger(index)) return undefined;
      cursor = cursor[index];
      continue;
    }
    if (!__isPlainObject(cursor)) return undefined;
    cursor = cursor[token];
  }
  return cursor;
};
const __resolvePathOrLiteral = (source: unknown, value: string): unknown => {
  const resolved = __readByPath(source, value);
  return resolved === undefined ? value : resolved;
};`;
  const functionSignature = `export default function ${componentName}(${
    hasProps ? `{ ${destructuredProps} }: ${interfaceName}` : ''
  }) {`;

  const code = [
    reactImport,
    adapterImportBlock,
    mountedCssImportBlock,
    interfaceBlock.trim(),
    runtimeHelperBlock,
    `${functionSignature}
${stateBlock ? `${stateBlock}\n` : ''}  const __scope = { data: undefined as unknown, item: undefined as unknown, index: undefined as number | undefined, params: { ${Object.keys(
      propsDef
    )
      .map((key) => `${JSON.stringify(key)}: ${toIdentifier(key)}`)
      .join(', ')} } };
  return (
${rootJsx}
  );
}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const dependencies = resolvedImports.reduce<Record<string, string>>(
    (acc, item) => {
      const { packageName, packageVersion, declareDependency } =
        item.resolution;
      if (!packageName || !declareDependency) return acc;
      acc[packageName] = packageVersion ?? 'latest';
      return acc;
    },
    {}
  );

  return {
    componentName,
    code,
    diagnostics: bag.diagnostics,
    canonicalIR: canonical,
    dependencies,
    mountedCssFiles,
  };
};
