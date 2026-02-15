import { describe, expect, it } from 'vitest';
import { generateReactBundle, generateReactCode } from '../mirToReact';
import type { MIRDocument } from '@/core/types/engine.types';
import { antdReactAdapter } from '../react/antdAdapter';

const createDoc = (): MIRDocument => ({
    version: '1.0',
    metadata: { name: 'Demo' },
    ui: {
        root: {
            id: 'root',
            type: 'MdrButton',
            text: 'Open',
            events: {
                click: {
                    trigger: 'onClick',
                    action: 'navigate',
                    params: { to: 'https://example.com', target: '_blank' },
                },
            },
        },
    },
});

describe('mirToReact generator', () => {
    it('imports @mdr/ui components through adapter', () => {
        const code = generateReactCode(createDoc(), {
            resourceType: 'component',
        });
        expect(code).toContain("import { MdrButton } from '@mdr/ui';");
        expect(code).toContain('<MdrButton');
    });

    it('inlines built-in handlers into JSX attributes', () => {
        const code = generateReactCode(createDoc(), {
            resourceType: 'component',
        });
        expect(code).toContain('onClick={() => {');
        expect(code).toContain(
            `window.open("https://example.com", '_blank', 'noopener,noreferrer');`
        );
        expect(code).not.toContain('runNavigate');
    });

    it('omits props interface when MIR has no props', () => {
        const code = generateReactCode(createDoc(), {
            resourceType: 'component',
        });
        expect(code).not.toContain('interface DemoProps');
        expect(code).toContain('export default function Demo()');
    });

    it('emits full project bundle for project resource type', () => {
        const bundle = generateReactBundle(createDoc(), {
            resourceType: 'project',
        });
        const paths = bundle.files.map((item) => item.path);
        expect(paths).toContain('package.json');
        expect(paths).toContain('src/main.tsx');
        expect(paths).toContain('src/App.tsx');
        expect(bundle.entryFilePath).toBe('src/App.tsx');
    });

    it('maps RadixLabel through react adapter imports', () => {
        const doc = createDoc();
        doc.ui.root = {
            id: 'root',
            type: 'RadixLabel',
            text: 'Name',
        };

        const code = generateReactCode(doc, { resourceType: 'component' });
        expect(code).toContain(
            "import * as Label from '@radix-ui/react-label';"
        );
        expect(code).toContain('<Label.Root>');
    });

    it('emits adapter diagnostics for unknown Radix component', () => {
        const doc = createDoc();
        doc.ui.root = {
            id: 'root',
            type: 'RadixUnknownThing',
            text: 'Fallback',
        };

        const bundle = generateReactBundle(doc, { resourceType: 'component' });
        expect(
            bundle.diagnostics?.some(
                (d) => d.code === 'REACT_ADAPTER_UNKNOWN_RADIX_COMPONENT'
            )
        ).toBe(true);
    });

    it('supports esm.sh import strategy without package dependency declarations', () => {
        const code = generateReactCode(createDoc(), {
            resourceType: 'component',
            packageResolver: {
                strategy: 'esm-sh',
                packageVersions: {
                    '@mdr/ui': '0.1.0',
                },
            },
        });
        expect(code).toContain("from 'https://esm.sh/@mdr/ui@0.1.0';");

        const bundle = generateReactBundle(createDoc(), {
            resourceType: 'project',
            packageResolver: {
                strategy: 'esm-sh',
                packageVersions: {
                    '@mdr/ui': '0.1.0',
                },
            },
        });
        const packageJson = bundle.files.find((f) => f.path === 'package.json');
        expect(packageJson).toBeTruthy();
        expect(packageJson?.content).not.toContain('"@mdr/ui"');
    });

    it('supports antd adapter with esm.sh remote imports', () => {
        const doc = createDoc();
        doc.ui.root = {
            id: 'root',
            type: 'AntdFormItem',
            children: [
                {
                    id: 'name-input',
                    type: 'AntdInput',
                },
            ],
        };

        const code = generateReactCode(doc, {
            resourceType: 'component',
            adapter: antdReactAdapter,
            packageResolver: {
                strategy: 'esm-sh',
                packageVersions: {
                    antd: '5.28.0',
                },
            },
        });

        expect(code).toContain(
            "import { Form } from 'https://esm.sh/antd@5.28.0';"
        );
        expect(code).toContain(
            "import { Input } from 'https://esm.sh/antd@5.28.0';"
        );
        expect(code).toContain('<Form.Item>');
        expect(code).toContain('<Input>');
    });
});
