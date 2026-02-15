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

const buildNavigateInlineHandler = (params: Record<string, unknown>) => {
  const to = typeof params.to === 'string' ? params.to.trim() : '';
  const target = params.target === '_self' ? '_self' : '_blank';
  const replace = Boolean(params.replace);
  if (target === '_blank') {
    return `{() => { window.open(${stringify(to)}, '_blank', 'noopener,noreferrer'); }}`;
  }
  if (replace) {
    return `{() => { window.location.replace(${stringify(to)}); }}`;
  }
  return `{() => { window.location.assign(${stringify(to)}); }}`;
};

const buildExecuteGraphInlineHandler = (params: Record<string, unknown>) => {
  const detail = stringifyLiteral(params) ?? '{}';
  return `{() => {
      window.dispatchEvent(
        new CustomEvent('mdr:execute-graph', { detail: ${detail} })
      );
    }}`;
};

const buildBuiltInInlineHandler = (
  action: string,
  params: Record<string, unknown>
) => {
  if (action === 'navigate') return buildNavigateInlineHandler(params);
  if (action === 'executeGraph') return buildExecuteGraphInlineHandler(params);
  return null;
};

const compilePropExpression = (value: unknown): string | null => {
  if (typeof value === 'object' && value !== null) {
    if ('$param' in (value as Record<string, unknown>)) {
      return `{${String((value as Record<string, unknown>).$param)}}`;
    }
    if ('$state' in (value as Record<string, unknown>)) {
      return `{${String((value as Record<string, unknown>).$state)}}`;
    }
  }
  if (typeof value === 'string') return stringify(value);
  const literal = stringifyLiteral(value);
  if (literal === null) return null;
  return `{${literal}}`;
};

const compileTextContent = (value: CanonicalNode['text']) => {
  if (value === undefined) return '';
  if (typeof value === 'object' && value !== null) {
    if ('$state' in value) return `{${String(value.$state)}}`;
    if ('$param' in value) return `{${String(value.$param)}}`;
  }
  return String(value);
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

export const compileMirToReactComponent = (
  mirDoc: MirDocLike,
  options?: ReactCompileOptions
): ReactComponentCompileResult => {
  const bag = createDiagnosticBag();
  const canonical = buildCanonicalIR(mirDoc, bag);

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

  const compileNode = (node: CanonicalNode, indent = '    '): string => {
    const adapterResult = adapter.resolveNode(node);
    if (adapterResult.imports?.length) {
      adapterImports.push(...adapterResult.imports);
    }
    if (adapterResult.diagnostics?.length) {
      bag.diagnostics.push(...adapterResult.diagnostics);
    }

    const tag = adapterResult.element;
    const propsArray: string[] = [];

    if (Object.keys(node.style).length > 0) {
      const styleExpr = stringifyLiteral(node.style);
      if (styleExpr) propsArray.push(`style={${styleExpr}}`);
    }

    Object.entries(node.props).forEach(([key, value]) => {
      const expr = compilePropExpression(value);
      if (expr !== null) {
        propsArray.push(`${key}=${expr}`);
      }
    });

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
          eventDef.params ?? {}
        );
        if (handlerExpr) {
          propsArray.push(`${reactEventName}=${handlerExpr}`);
        }
      }
    });

    const allProps = propsArray.length ? ` ${propsArray.join(' ')}` : '';
    const textContent = compileTextContent(node.text);
    const childJsx =
      node.children
        .map((child) => compileNode(child, `${indent}  `))
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
  const resolvedImports = dedupeImports(adapterImports).map((item) => ({
    ...item,
    resolution: resolvePackageImport(item.source, options?.packageResolver),
  }));
  const adapterImportBlock = resolvedImports
    .map((item) =>
      renderImport({
        ...item,
        source: item.resolution.importSource,
      })
    )
    .join('\n');
  const functionSignature = `export default function ${componentName}(${
    hasProps ? `{ ${destructuredProps} }: ${interfaceName}` : ''
  }) {`;

  const code = [
    reactImport,
    adapterImportBlock,
    interfaceBlock.trim(),
    `${functionSignature}
${stateBlock ? `${stateBlock}\n` : ''}  return (
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
  };
};
