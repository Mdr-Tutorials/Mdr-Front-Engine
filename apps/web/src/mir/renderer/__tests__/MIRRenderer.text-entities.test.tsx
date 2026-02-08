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
});
