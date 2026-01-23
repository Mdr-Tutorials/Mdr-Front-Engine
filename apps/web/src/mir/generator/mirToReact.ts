// src/mir/generator/mirToReact.ts

export const generateReactCode = (mirDoc: any): string => {
    const { ui, logic, metadata } = mirDoc;
    const componentName = metadata?.name?.replace(/\s+/g, '') || 'MdrComponent';

    const componentPropsDef = logic?.props || {};
    const interfaceName = `${componentName}Props`;

    const isFunctionProp = (def: any) => {
        const type = typeof def?.type === 'string' ? def.type : '';
        return type.includes('=>') || type.toLowerCase().includes('function');
    };

    const toReactEventName = (trigger: string) => {
        const normalized = trigger.toLowerCase();
        if (normalized === 'click') return 'onClick';
        if (normalized === 'change') return 'onChange';
        if (normalized === 'input') return 'onInput';
        if (normalized === 'submit') return 'onSubmit';
        if (normalized === 'focus') return 'onFocus';
        if (normalized === 'blur') return 'onBlur';
        return `on${trigger.charAt(0).toUpperCase()}${trigger.slice(1)}`;
    };

    const propFunctionKeys = Object.entries(componentPropsDef)
        .filter(([, def]) => isFunctionProp(def))
        .map(([key]) => key);

    const hasState = !!(logic?.state && Object.keys(logic.state).length > 0);

    const generateInterface = () => {
        const keys = Object.keys(componentPropsDef);
        if (keys.length === 0) return '';
        const fields = Object.entries(componentPropsDef)
            .map(([key, val]: [string, any]) => `  ${key}?: ${val.type || 'any'};`)
            .join('\n');
        return `interface ${interfaceName} {\n${fields}\n}\n`;
    };

    const generateDestructuredProps = () => {
        const keys = Object.keys(componentPropsDef);
        if (keys.length === 0) return '';

        const args = Object.entries(componentPropsDef)
            .map(([key, val]: [string, any]) => {
                const hasDefault = val.default !== undefined;
                const defaultValue = hasDefault ? ` = ${JSON.stringify(val.default)}` : '';
                return `${key}${defaultValue}`;
            })
            .join(', ');

        return `{ ${args} }: ${interfaceName}`;
    };

    const generateStates = () => {
        if (!logic?.state) return '';
        return Object.entries(logic.state)
            .map(([key, value]: [string, any]) => {
                const initial = JSON.stringify(value.initial ?? '');
                const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
                return `  const [${key}, ${setterName}] = useState(${initial});`;
            })
            .join('\n');
    };

    const resolveAction = (actionName?: string) => {
        if (!actionName) return null;
        if (propFunctionKeys.includes(actionName)) return actionName;
        return null;
    };

    const generateJSX = (node: any, indent: string = '    '): string => {
        const Tag = node.type === 'container' ? 'div' : (node.type || 'div');
        const propsArray: string[] = [];

        if (node.style) {
            propsArray.push(`style={${JSON.stringify(node.style)}}`);
        }

        if (node.props) {
            Object.entries(node.props).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    if ('$param' in value) {
                        propsArray.push(`${key}={${value.$param}}`);
                    } else if ('$state' in value) {
                        propsArray.push(`${key}={${value.$state}}`);
                    }
                } else {
                    const formattedValue = typeof value === 'string' ? `"${value}"` : `{${value}}`;
                    propsArray.push(`${key}=${formattedValue}`);
                }
            });
        }

        if (node.events) {
            Object.entries(node.events).forEach(([eventKey, eventDef]: [string, any]) => {
                const trigger = eventDef?.trigger || eventKey;
                const reactEventName = toReactEventName(trigger);
                const actionExpr = resolveAction(eventDef?.action);
                if (reactEventName && actionExpr) {
                    propsArray.push(`${reactEventName}={${actionExpr}}`);
                }
            });
        }

        const allProps = propsArray.length ? ' ' + propsArray.join(' ') : '';

        let content = '';
        if (node.text) {
            if (typeof node.text === 'object' && node.text.$state) {
                content = `{${node.text.$state}}`;
            } else if (typeof node.text === 'object' && node.text.$param) {
                content = `{${node.text.$param}}`;
            } else {
                content = node.text;
            }
        }

        const childrenJSX = node.children?.map((c: any) => generateJSX(c, indent + '  ')).join('\n') || '';

        if (!childrenJSX && (Tag === 'input' || Tag === 'img')) {
            return `${indent}<${Tag}${allProps} />`;
        }

        return `${indent}<${Tag}${allProps}>\n${indent}  ${content}\n${childrenJSX ? childrenJSX + '\n' : ''}${indent}</${Tag}>`;
    };

    const destructuredArgs = generateDestructuredProps();
    const stateBlock = generateStates();
    const bodyBlocks = [stateBlock].filter(Boolean).join('\n');
    const reactImport = hasState ? "import React, { useState } from 'react';" : "import React from 'react';";

    return `
${reactImport}

${generateInterface()}

export default function ${componentName}(${destructuredArgs}) {
${bodyBlocks ? bodyBlocks + '\n' : ''}
  return (
${generateJSX(ui.root)}
  );
}
`.trim();
};
