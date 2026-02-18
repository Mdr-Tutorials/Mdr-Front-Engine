import { fireEvent, render } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';
import { MIRRenderer } from '../MIRRenderer';
import { createComponentRegistry, mdrAdapter } from '../registry';
import { registerNodeCapability } from '../capabilities';

type BareBoxProps = {
  children?: ReactNode;
  dataAttributes?: Record<string, string>;
};

const BareBox = ({ children, dataAttributes = {} }: BareBoxProps) => {
  // Intentionally ignore onClick props to verify delegated click handling.
  return <section {...dataAttributes}>{children}</section>;
};

const createDoc = (root: ComponentNode): MIRDocument => ({
  version: '1.0',
  ui: { root },
});

describe('MIRRenderer delegated click behavior', () => {
  it('selects node and triggers click actions even when component drops onClick props', () => {
    const onNodeSelect = vi.fn();
    const navigate = vi.fn();
    const registry = createComponentRegistry();
    registry.register('BareBox', BareBox, mdrAdapter);

    const root: ComponentNode = {
      id: 'root',
      type: 'BareBox',
      children: [
        {
          id: 'box-1',
          type: 'BareBox',
          text: 'Box',
          events: {
            click1: {
              trigger: 'onClick',
              action: 'navigate',
              params: { to: '/demo' },
            },
          },
        },
      ],
    };

    const { container } = render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        onNodeSelect={onNodeSelect}
        registry={registry}
        builtInActions={{ navigate }}
      />
    );

    const targets = container.querySelectorAll('section');
    expect(targets.length).toBeGreaterThan(1);
    fireEvent.click(targets[1] as Element);

    expect(onNodeSelect).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        nodeId: 'box-1',
        trigger: 'onClick',
        eventKey: 'click1',
      })
    );
  });

  it('triggers click actions only after node is selected when selection requirement is enabled', () => {
    const navigate = vi.fn();
    const registry = createComponentRegistry();
    registry.register('BareBox', BareBox, mdrAdapter);

    const root: ComponentNode = {
      id: 'root',
      type: 'BareBox',
      children: [
        {
          id: 'box-1',
          type: 'BareBox',
          text: 'Box',
          events: {
            click1: {
              trigger: 'onClick',
              action: 'navigate',
              params: { to: '/demo' },
            },
          },
        },
      ],
    };

    const onNodeSelect = vi.fn();
    const Harness = () => {
      const [selectedId, setSelectedId] = useState<string | undefined>();
      return (
        <MIRRenderer
          node={root}
          mirDoc={createDoc(root)}
          selectedId={selectedId}
          onNodeSelect={(nodeId, event) => {
            onNodeSelect(nodeId, event);
            setSelectedId(nodeId);
          }}
          registry={registry}
          builtInActions={{ navigate }}
          requireSelectionForEvents
        />
      );
    };

    const { container } = render(<Harness />);
    const targets = container.querySelectorAll('section');
    expect(targets.length).toBeGreaterThan(1);

    fireEvent.click(targets[1] as Element);
    expect(onNodeSelect).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(targets[1] as Element);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('prevents default navigation for registered link capability while selecting in editor mode', () => {
    registerNodeCapability({
      key: 'test-custom-link',
      match: (node) => node.type === 'CustomLink',
      link: {
        kind: 'link',
        destinationProp: 'url',
      },
    });
    const onNodeSelect = vi.fn();
    const root: ComponentNode = {
      id: 'root',
      type: 'div',
      children: [
        {
          id: 'link-1',
          type: 'CustomLink',
          text: 'Open',
          props: {
            url: 'https://example.com',
          },
        },
      ],
    };

    const { container } = render(
      <MIRRenderer
        node={root}
        mirDoc={createDoc(root)}
        onNodeSelect={onNodeSelect}
      />
    );

    const anchor = container.querySelector('[data-mir-id="link-1"]');
    expect(anchor).toBeTruthy();
    const dispatched = fireEvent.click(anchor as Element);
    expect(dispatched).toBe(false);
    expect(onNodeSelect).toHaveBeenCalled();
  });
});
