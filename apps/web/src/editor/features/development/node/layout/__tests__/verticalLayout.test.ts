import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NODE_LAYOUT_TEXT_STYLE,
  measureNodeVerticalLayout,
} from '../verticalLayout';

describe('measureNodeVerticalLayout', () => {
  it('adapts width by content length', () => {
    const measurer = (text: string) => text.length * 8;
    const compact = measureNodeVerticalLayout(
      {
        id: 'n1',
        type: 'merge',
        position: { x: 0, y: 0 },
        config: { text: 'short' },
      },
      measurer,
      DEFAULT_NODE_LAYOUT_TEXT_STYLE
    );

    const expanded = measureNodeVerticalLayout(
      {
        id: 'n2',
        type: 'merge',
        position: { x: 0, y: 0 },
        config: { text: 'a very very long content line for layout sizing' },
      },
      measurer,
      DEFAULT_NODE_LAYOUT_TEXT_STYLE
    );

    expect(expanded.width).toBeGreaterThan(compact.width);
    expect(expanded.height).toBe(compact.height);
  });
});
