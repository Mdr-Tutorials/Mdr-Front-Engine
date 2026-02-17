import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';
import { MIRRenderer } from '../MIRRenderer';

const createDoc = (root: ComponentNode): MIRDocument => ({
  version: '1.0',
  ui: { root },
});

describe('MIRRenderer outlet mounting', () => {
  it('mounts outlet content node into MdrOutlet', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'MdrDiv',
      children: [
        {
          id: 'outlet-1',
          type: 'MdrOutlet',
        },
      ],
    };
    const outletContentNode: ComponentNode = {
      id: 'page-root',
      type: 'MdrDiv',
      children: [
        {
          id: 'page-text',
          type: 'MdrText',
          text: 'Outlet page content',
        },
      ],
    };

    render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        outletContentNode={outletContentNode}
      />
    );

    expect(screen.getByText('Outlet page content')).toBeTruthy();
  });

  it('respects outletTargetNodeId when mounting outlet content', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'MdrDiv',
      children: [
        {
          id: 'outlet-a',
          type: 'MdrOutlet',
        },
        {
          id: 'outlet-b',
          type: 'MdrOutlet',
        },
      ],
    };
    const outletContentNode: ComponentNode = {
      id: 'page-root',
      type: 'MdrDiv',
      children: [
        {
          id: 'page-text',
          type: 'MdrText',
          text: 'Only target outlet gets this',
        },
      ],
    };

    render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        outletContentNode={outletContentNode}
        outletTargetNodeId="outlet-b"
      />
    );

    expect(screen.getAllByText('Only target outlet gets this')).toHaveLength(1);
  });
});
