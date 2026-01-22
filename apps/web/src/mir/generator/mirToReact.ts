// src/mir/generator/mirToReact.ts

export const generateReactCode = (mirDoc: any): string => {
    const { ui, logic, metadata } = mirDoc;
    const componentName = metadata?.name?.replace(/\s+/g, '') || 'MdrComponent';

    // 1. 读取组件的 Props 定义
    const componentPropsDef = logic?.props || {};
    const interfaceName = `${componentName}Props`;

    // 生成 TypeScript Interface
    const generateInterface = () => {
        const keys = Object.keys(componentPropsDef);
        if (keys.length === 0) return '';
        const fields = Object.entries(componentPropsDef)
            .map(([key, val]: [string, any]) => `  ${key}?: ${val.type || 'any'};`)
            .join('\n');
        return `interface ${interfaceName} {\n${fields}\n}\n`;
    };

    // --- 重点：生成带默认值的解构参数列表 ---
    const generateDestructuredProps = () => {
        const keys = Object.keys(componentPropsDef);
        if (keys.length === 0) return '';

        const args = Object.entries(componentPropsDef)
            .map(([key, val]: [string, any]) => {
                // 如果定义了 default 字段，则生成 = 默认值
                const hasDefault = val.default !== undefined;
                const defaultValue = hasDefault ? ` = ${JSON.stringify(val.default)}` : '';
                return `${key}${defaultValue}`;
            })
            .join(', ');

        return `{ ${args} }: ${interfaceName}`;
    };

    // 2. 生成 State
    const generateStates = () => {
        if (!logic?.state) return '';
        return Object.entries(logic.state)
            .map(([key, value]: [string, any]) => {
                const initial = JSON.stringify(value.initial ?? '');
                return `  const [${key}, set${key.charAt(0).toUpperCase() + key.slice(1)}] = useState(${initial});`;
            })
            .join('\n');
    };

    // 3. 递归生成 JSX
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
                        // 👈 修改：因为参数已解构，直接使用变量名，不再加 props.
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

        const allProps = propsArray.length ? ' ' + propsArray.join(' ') : '';

        // 处理内容 (Text)
        let content = '';
        if (node.text) {
            if (typeof node.text === 'object' && node.text.$state) {
                content = `{${node.text.$state}}`;
            } else if (typeof node.text === 'object' && node.text.$param) {
                // 👈 修改：直接使用变量名
                content = `{${node.text.$param}}`;
            } else {
                content = node.text;
            }
        }

        const childrenJSX = node.children?.map((c: any) => generateJSX(c, indent + '  ')).join('\n') || '';

        if (!childrenJSX && (Tag === 'input' || Tag === 'img')) {
            return `${indent}<${Tag}${allProps} />`;
        }

        return `${indent}<${Tag}${allProps}>
${indent}  ${content}
${childrenJSX ? childrenJSX + '\n' : ''}${indent}</${Tag}>`;
    };

    // 4. 组装文件
    const destructuredArgs = generateDestructuredProps();

    return `
import React, { useState } from 'react';

${generateInterface()}

export default function ${componentName}(${destructuredArgs}) {
${generateStates()}

  return (
${generateJSX(ui.root)}
  );
}
`.trim();
};