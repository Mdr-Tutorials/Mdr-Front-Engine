import { describe, expect, it } from 'vitest';
import type { ComponentNode } from '@/core/types/engine.types';
import {
  collectMountedCssBlocks,
  collectMountedCssFromNode,
  stripInternalProps,
} from '@/mir/renderer/MIRRenderer.helpers';
import type { RendererCodeArtifact } from '@/mir/renderer/MIRRenderer.types';

describe('MIRRenderer helpers', () => {
  it('collects mounted CSS from CodeReference artifacts', () => {
    const node: ComponentNode = {
      id: 'MdrText-1',
      type: 'MdrText',
      props: {
        codeBindings: {
          mountedCss: [
            {
              slotId: 'blueprint.node.MdrText-1.mountedCss',
              reference: {
                artifactId: 'code_mounted_css_MdrText-1',
              },
            },
          ],
        },
      },
    };
    const artifactsById = new Map<string, RendererCodeArtifact>([
      [
        'code_mounted_css_MdrText-1',
        {
          id: 'code_mounted_css_MdrText-1',
          path: '/styles/mounted/MdrText-1.css',
          language: 'css',
          source: '.my { color: red; }',
        },
      ],
    ]);

    expect(collectMountedCssFromNode(node, [], artifactsById)).toEqual([
      {
        key: 'MdrText-1-code-code_mounted_css_MdrText-1-0',
        content: '.my { color: red; }',
      },
    ]);
  });

  it('does not pass code bindings through as rendered props', () => {
    expect(
      stripInternalProps({
        className: 'my',
        codeBindings: {
          mountedCss: [],
        },
      })
    ).toEqual({ className: 'my' });
  });

  it('collects mounted CSS from outlet content nodes', () => {
    const rootNode: ComponentNode = {
      id: 'layout-root',
      type: 'MdrDiv',
      children: [{ id: 'outlet-1', type: 'MdrOutlet' }],
    };
    const outletContentNode: ComponentNode = {
      id: 'MdrText-1',
      type: 'MdrText',
      props: {
        className: 'my',
        codeBindings: {
          mountedCss: [
            {
              slotId: 'blueprint.node.MdrText-1.mountedCss',
              reference: {
                artifactId: 'code_mounted_css_MdrText-1',
              },
            },
          ],
        },
      },
    };
    const artifacts: RendererCodeArtifact[] = [
      {
        id: 'code_mounted_css_MdrText-1',
        path: '/styles/mounted/MdrText-1.css',
        language: 'css',
        source: '.my { color: red; }',
      },
    ];

    expect(
      collectMountedCssBlocks(rootNode, artifacts, [outletContentNode])
    ).toEqual([
      {
        key: 'MdrText-1-code-code_mounted_css_MdrText-1-0',
        content: '.my { color: red; }',
      },
    ]);
  });
});
