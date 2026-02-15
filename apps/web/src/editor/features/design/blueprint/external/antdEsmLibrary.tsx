import React from 'react';
import type { ComponentAdapter } from '@/mir/renderer/registry';
import { registerRuntimeComponent } from '@/mir/renderer/registry';
import { registerComponentGroup } from '../registry';
import type { ComponentGroup } from '../../BlueprintEditor.types';

type EsmLoadDiagnostic = {
    level: 'warning' | 'error';
    message: string;
};

type AntdModule = {
    Button?: React.ElementType;
    Input?: React.ElementType;
    Modal?: React.ElementType;
    Form?: {
        Item?: React.ElementType;
    };
};

const ANTD_ESM_URL_CANDIDATES = [
    'https://esm.sh/antd@5.28.0?bundle&target=es2022&external=react,react-dom',
    'https://esm.sh/antd@5.28.0?bundle',
    'https://esm.sh/v135/antd@5.28.0?bundle',
];

const antdTextAdapter: ComponentAdapter = {
    kind: 'custom',
    supportsChildren: true,
    mapProps: ({ resolvedProps, resolvedText }) => {
        const props = { ...resolvedProps };
        return {
            props,
            children:
                props.children ?? (resolvedText ? String(resolvedText) : null),
        };
    },
};

const antdInputAdapter: ComponentAdapter = {
    kind: 'custom',
    supportsChildren: false,
    mapProps: ({ resolvedProps, resolvedText }) => {
        const props = { ...resolvedProps };
        if (resolvedText !== undefined && props.value === undefined) {
            props.value = String(resolvedText);
        }
        return { props };
    },
};

const buildAntdGroup = (): ComponentGroup => ({
    id: 'antd-esm',
    title: 'Ant Design (esm.sh)',
    source: 'external',
    items: [
        {
            id: 'antd-button',
            name: 'Button',
            preview: <button type="button">Button</button>,
            sizeOptions: [
                { id: 'small', label: 'S', value: 'small' },
                { id: 'middle', label: 'M', value: 'middle' },
                { id: 'large', label: 'L', value: 'large' },
            ],
        },
        {
            id: 'antd-input',
            name: 'Input',
            preview: <input placeholder="Input" readOnly />,
            sizeOptions: [
                { id: 'small', label: 'S', value: 'small' },
                { id: 'middle', label: 'M', value: 'middle' },
                { id: 'large', label: 'L', value: 'large' },
            ],
        },
        {
            id: 'antd-modal',
            name: 'Modal',
            preview: <div>Modal</div>,
        },
        {
            id: 'antd-form-item',
            name: 'Form.Item',
            preview: <div>Form.Item</div>,
        },
    ],
});

let loadPromise: Promise<EsmLoadDiagnostic[]> | null = null;
let styleInjected = false;

const ensureAntdStyle = () => {
    if (styleInjected || typeof document === 'undefined') return;
    const id = 'mdr-antd-esm-style';
    if (document.getElementById(id)) {
        styleInjected = true;
        return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://esm.sh/antd@5.28.0/dist/reset.css';
    document.head.appendChild(link);
    styleInjected = true;
};

/**
 * Runtime external library registration chain:
 * Sidebar("External") -> ensureAntdEsmLibrary -> import(esm.sh antd) -> registerRuntimeComponent
 * -> createOrderedComponentRegistry(custom layer) -> MIRRenderer.
 */
export const ensureAntdEsmLibrary = async (): Promise<EsmLoadDiagnostic[]> => {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        const diagnostics: EsmLoadDiagnostic[] = [];

        try {
            ensureAntdStyle();
            let module: AntdModule | null = null;
            let lastError: unknown = null;
            for (const url of ANTD_ESM_URL_CANDIDATES) {
                try {
                    module = (await import(
                        /* @vite-ignore */ url
                    )) as AntdModule;
                    break;
                } catch (error) {
                    lastError = error;
                }
            }

            if (!module) {
                throw lastError ?? new Error('No reachable esm.sh antd URL.');
            }

            if (module.Button) {
                registerRuntimeComponent(
                    'AntdButton',
                    module.Button,
                    antdTextAdapter
                );
            } else {
                diagnostics.push({
                    level: 'warning',
                    message: 'antd.Button is not available from esm.sh bundle.',
                });
            }

            if (module.Input) {
                registerRuntimeComponent(
                    'AntdInput',
                    module.Input,
                    antdInputAdapter
                );
            } else {
                diagnostics.push({
                    level: 'warning',
                    message: 'antd.Input is not available from esm.sh bundle.',
                });
            }

            if (module.Modal) {
                registerRuntimeComponent(
                    'AntdModal',
                    module.Modal,
                    antdTextAdapter
                );
            } else {
                diagnostics.push({
                    level: 'warning',
                    message: 'antd.Modal is not available from esm.sh bundle.',
                });
            }

            if (module.Form?.Item) {
                registerRuntimeComponent(
                    'AntdFormItem',
                    module.Form.Item,
                    antdTextAdapter
                );
            } else {
                diagnostics.push({
                    level: 'warning',
                    message:
                        'antd.Form.Item is not available from esm.sh bundle.',
                });
            }
        } catch (error) {
            diagnostics.push({
                level: 'error',
                message: `Failed to load antd from esm.sh (tried ${ANTD_ESM_URL_CANDIDATES.length} endpoints): ${String(error)}`,
            });
        }

        registerComponentGroup(buildAntdGroup());
        return diagnostics;
    })();

    return loadPromise;
};
