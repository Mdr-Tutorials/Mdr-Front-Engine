import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';
import { MIRRenderer } from '@/mir/renderer/MIRRenderer';

const createDoc = (root: ComponentNode): MIRDocument => ({
  version: '1.2',
  ui: { root },
});

describe('MIRRenderer data scope and list render', () => {
  it('resolves child text with parent mounted data model paths', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'parent',
          type: 'MdrDiv',
          data: {
            extend: {
              title: 'Desk Lamp',
              detail: { price: 199 },
            },
          },
          children: [
            { id: 'name', type: 'MdrText', text: 'title' },
            { id: 'price', type: 'MdrText', text: 'detail.price' },
            { id: 'literal', type: 'MdrText', text: 'NotAFieldPath' },
          ],
        },
      ],
    };

    render(<MIRRenderer node={root} mirDoc={createDoc(root)} />);

    expect(screen.getByText('Desk Lamp')).toBeTruthy();
    expect(screen.getByText('199')).toBeTruthy();
    expect(screen.getByText('NotAFieldPath')).toBeTruthy();
  });

  it('renders list template by arrayField from mock JSON data', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'container',
      data: {
        value: {
          products: [
            {
              id: 'string',
              name: 'string',
            },
          ],
        },
        mock: {
          products: [
            { id: 'a', name: 'Alpha' },
            { id: 'b', name: 'Beta' },
          ],
        },
      },
      children: [
        {
          id: 'product-list',
          type: 'MdrDiv',
          list: {
            arrayField: 'products',
            keyBy: 'id',
          },
          children: [{ id: 'product-name', type: 'MdrText', text: 'name' }],
        },
      ],
    };

    render(<MIRRenderer node={root} mirDoc={createDoc(root)} />);

    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('reads list source from injected runtime state', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'container',
      children: [
        {
          id: 'runtime-list',
          type: 'MdrDiv',
          list: {
            source: { $state: 'products' },
            keyBy: 'id',
          },
          children: [{ id: 'runtime-name', type: 'MdrText', text: 'name' }],
        },
      ],
    };

    render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        runtimeState={{
          products: [{ id: 'p-1', name: 'Runtime Product' }],
        }}
      />
    );

    expect(screen.getByText('Runtime Product')).toBeTruthy();
  });

  it('uses parent scoped data as list source when list.source is omitted', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'container',
      data: {
        source: { $state: 'rows' },
      },
      children: [
        {
          id: 'row-list',
          type: 'MdrDiv',
          list: {},
          children: [{ id: 'row-text', type: 'MdrText', text: 'data' }],
        },
      ],
    };

    render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        runtimeState={{
          rows: [{ data: 'mdr' }, { data: 'mar' }],
        }}
      />
    );

    expect(screen.getByText('mdr')).toBeTruthy();
    expect(screen.getByText('mar')).toBeTruthy();
  });
});
