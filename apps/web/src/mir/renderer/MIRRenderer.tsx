import React, { useMemo } from 'react';
import { type ComponentNode, type MIRDocument } from '@/core/types/engine.types'; // 假设你的类型定义在此

const VOID_ELEMENTS = ['input', 'img', 'br', 'hr', 'meta', 'link'];

// --- 1. 物理组件映射 ---
const ComponentMap: Record<string, React.FC<any>> = {
    container: ({ children, ...props }) => <div {...props}>{children}</div>,
    text: ({ text, children, ...props }) => <span {...props}>{text || children}</span>,
    button: ({ text, children, ...props }) => <button {...props}>{text || children}</button>,
    input: (props) => <input {...props} />,
};

// --- 2. 增强型值解析引擎 ---
const resolveValue = (
    value: any,
    context: { state: any; params: any }
) => {
    if (typeof value !== 'object' || value === null) return value;

    // 处理 $state 引用
    if ('$state' in value) {
        return context.state[value.$state];
    }

    // 处理 $param 引用 (即 logic.props)
    if ('$param' in value) {
        return context.params[value.$param];
    }

    return value;
};

// --- 3. 渲染器主组件 ---
interface MIRRendererProps {
    node: ComponentNode;
    mirDoc: MIRDocument;   // 传入整个文档以获取 logic.props 定义
    overrides?: Record<string, any>; // 可选：从外部（如预览面板）手动修改的属性值
}

export const MIRRenderer: React.FC<MIRRendererProps> = ({ node, mirDoc, overrides = {} }) => {

    // 1. 计算当前生效的 Params (优先级：外部覆盖 > Schema默认值)
    const effectiveParams = useMemo(() => {
        const result: Record<string, any> = {};
        const propsDef = mirDoc.logic?.props || {};

        Object.keys(propsDef).forEach(key => {
            // 优先级：overrides 传入值 > logic.props 的 default 值
            result[key] = overrides[key] !== undefined
                ? overrides[key]
                : propsDef[key].default;
        });
        return result;
    }, [mirDoc.logic?.props, overrides]);

    // 2. 模拟组件内部状态 (这里可以接入 Zustand 或本地 useState)
    const state = useMemo(() => {
        const result: Record<string, any> = {};
        Object.entries(mirDoc.logic?.state || {}).forEach(([k, v]) => {
            result[k] = v.initial;
        });
        return result;
    }, [mirDoc.logic?.state]);

    const context = { state, params: effectiveParams };

    // 3. 解析属性
    const resolvedProps = useMemo(() => {
        const p: any = {};
        if (node.props) {
            Object.entries(node.props).forEach(([key, val]) => {
                p[key] = resolveValue(val, context);
            });
        }
        return p;
    }, [node.props, context]);

    // 4. 解析样式
    const resolvedStyle = useMemo(() => {
        const s: any = {};
        if (node.style) {
            Object.entries(node.style).forEach(([key, val]) => {
                s[key] = resolveValue(val, context);
            });
        }
        return s;
    }, [node.style, context]);

    // 5. 解析文本内容
    const resolvedText = useMemo(() => resolveValue(node.text, context), [node.text, context]);

    // 6. 渲染
    const Component = ComponentMap[node.type] || (({ children }) => <div>{children}</div>);
    const isVoidElement = VOID_ELEMENTS.includes(node.type.toLowerCase());

    // 2. 如果是自闭合标签，不传递 children
    if (isVoidElement) {
        return (
            <Component
                {...resolvedProps}
                style={resolvedStyle}
                // 注意：input 的文字应该通过 value 属性传递，而不是作为 children
                {...(node.type === 'input' ? { defaultValue: resolvedText } : {})}
            />
        );
    }
    return (
        <Component {...resolvedProps} style={resolvedStyle}>
            {resolvedText}
            {node.children?.map(child => (
                <MIRRenderer
                    key={child.id}
                    node={child}
                    mirDoc={mirDoc}
                    overrides={overrides}
                />
            ))}
        </Component>
    );
};