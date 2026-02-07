import { isBuiltInActionName } from '@/mir/actions/registry';
import type { ComponentNode } from '@/core/types/engine.types';
import type { MirDocLike, ReactComponentCompileResult } from './types';

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

const compileTextContent = (value: ComponentNode['text']) => {
  if (value === undefined) return '';
  if (typeof value === 'object' && value !== null) {
    if ('$state' in value) return `{${String(value.$state)}}`;
    if ('$param' in value) return `{${String(value.$param)}}`;
  }
  return String(value);
};

export const compileMirToReactComponent = (
  mirDoc: MirDocLike,
  options?: { componentName?: string }
): ReactComponentCompileResult => {
  const componentName =
    options?.componentName ||
    mirDoc.metadata?.name?.replace(/\s+/g, '') ||
    'MdrComponent';
  const interfaceName = `${componentName}Props`;
  const propsDef = mirDoc.logic?.props ?? {};
  const hasProps = Object.keys(propsDef).length > 0;
  const propFunctionKeys = Object.entries(propsDef)
    .filter(([, def]) => {
      const type = typeof def?.type === 'string' ? def.type : '';
      return type.includes('=>') || type.toLowerCase().includes('function');
    })
    .map(([key]) => key);
  const hasState = Boolean(
    mirDoc.logic?.state && Object.keys(mirDoc.logic.state).length > 0
  );

  const compileNode = (node: ComponentNode, indent = '    '): string => {
    const tag = node.type === 'container' ? 'div' : node.type || 'div';
    const propsArray: string[] = [];

    if (node.style) {
      const styleExpr = stringifyLiteral(node.style);
      if (styleExpr) propsArray.push(`style={${styleExpr}}`);
    }

    if (node.props) {
      Object.entries(node.props).forEach(([key, value]) => {
        const expr = compilePropExpression(value);
        if (expr !== null) {
          propsArray.push(`${key}=${expr}`);
        }
      });
    }

    if (node.events) {
      Object.entries(node.events).forEach(([eventKey, eventDef]) => {
        const trigger = eventDef?.trigger || eventKey;
        const reactEventName = toReactEventName(trigger);
        if (!reactEventName) return;

        if (eventDef?.action && propFunctionKeys.includes(eventDef.action)) {
          propsArray.push(`${reactEventName}={${toIdentifier(eventDef.action)}}`);
          return;
        }

        if (eventDef?.action && isBuiltInActionName(eventDef.action)) {
          const handlerExpr = buildBuiltInInlineHandler(
            eventDef.action,
            eventDef.params ?? {}
          );
          if (handlerExpr) {
            propsArray.push(`${reactEventName}=${handlerExpr}`);
          }
        }
      });
    }

    const allProps = propsArray.length ? ` ${propsArray.join(' ')}` : '';
    const textContent = compileTextContent(node.text);
    const childJsx =
      node.children?.map((child) => compileNode(child, `${indent}  `)).join('\n') ||
      '';

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
    ? Object.entries(mirDoc.logic?.state ?? {})
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
  const functionSignature = `export default function ${componentName}(${
    hasProps ? `{ ${destructuredProps} }: ${interfaceName}` : ''
  }) {`;
  const code = [
    reactImport,
    interfaceBlock.trim(),
    `${functionSignature}
${stateBlock ? `${stateBlock}\n` : ''}  return (
${compileNode(mirDoc.ui.root)}
  );
}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return { componentName, code };
};
