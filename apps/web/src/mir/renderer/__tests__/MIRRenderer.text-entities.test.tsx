import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';
import { MIRRenderer } from '../MIRRenderer';

const createDoc = (root: ComponentNode): MIRDocument => ({
    version: '1.0',
    ui: { root },
});

describe('MIRRenderer html entities', () => {
    it('decodes html entities from node text before rendering', () => {
        const root: ComponentNode = {
            id: 'root',
            type: 'div',
            children: [
                {
                    id: 'text-1',
                    type: 'text',
                    text: '&copy; MDR',
                },
            ],
        };

        const { container } = render(
            <MIRRenderer node={root} mirDoc={createDoc(root)} />
        );

        expect(container.textContent).toContain('\u00a9 MDR');
        expect(container.textContent).not.toContain('&copy; MDR');
    });

    it.each([
        ['&#169; MDR', '\u00a9 MDR'],
        ['&#xA9; MDR', '\u00a9 MDR'],
    ])('decodes numeric entity %s', (sourceText, expectedText) => {
        const root: ComponentNode = {
            id: 'root',
            type: 'div',
            children: [
                {
                    id: 'text-1',
                    type: 'text',
                    text: sourceText,
                },
            ],
        };

        const { container } = render(
            <MIRRenderer node={root} mirDoc={createDoc(root)} />
        );

        expect(container.textContent).toContain(expectedText);
        expect(container.textContent).not.toContain(sourceText);
    });

    it('mounts node-level mounted css content into style tags', () => {
        const root: ComponentNode = {
            id: 'root',
            type: 'div',
            props: {
                mountedCss: [
                    {
                        id: 'mounted-1',
                        path: 'src/styles/card.css',
                        content: '.card { color: rgb(255, 0, 0); }',
                        classes: ['card'],
                    },
                ],
            },
            children: [
                {
                    id: 'text-1',
                    type: 'text',
                    text: 'Mounted css test',
                    props: {
                        className: 'card',
                    },
                },
            ],
        };

        const { container } = render(
            <MIRRenderer node={root} mirDoc={createDoc(root)} />
        );

        const styleTag = container.querySelector('style[data-mir-mounted-css]');
        expect(styleTag?.textContent).toContain('.card');
        expect(styleTag?.textContent).toContain('rgb(255, 0, 0)');
    });
});
