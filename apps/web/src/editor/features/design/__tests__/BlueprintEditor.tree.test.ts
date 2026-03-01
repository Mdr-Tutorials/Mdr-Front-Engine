import { describe, expect, it } from 'vitest';
import { insertIntoMirDoc } from '@/editor/features/design/BlueprintEditor.tree';
import type { MIRDocument } from '@/core/types/engine.types';

const createDoc = (): MIRDocument => ({
  version: '1.0.0',
  ui: {
    root: {
      id: 'root',
      type: 'MdrDiv',
      children: [
        {
          id: 'heading-1',
          type: 'MdrHeading',
          text: 'Heading',
        },
      ],
    },
  },
});

describe('BlueprintEditor tree insertion', () => {
  it('inserts after heading instead of nesting under heading', () => {
    const doc = createDoc();
    const next = insertIntoMirDoc(doc, 'heading-1', {
      id: 'heading-2',
      type: 'MdrHeading',
      text: 'Heading',
    });

    const rootChildren = next.ui.root.children ?? [];
    expect(rootChildren).toHaveLength(2);
    expect(rootChildren[0]?.id).toBe('heading-1');
    expect(rootChildren[1]?.id).toBe('heading-2');
    expect(rootChildren[0]?.children).toBeUndefined();
  });
});
