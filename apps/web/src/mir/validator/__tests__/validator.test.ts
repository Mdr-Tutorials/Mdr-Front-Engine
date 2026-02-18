import { describe, expect, it } from 'vitest';
import { validateMirDocument } from '../validator';

describe('validateMirDocument', () => {
  it('normalizes legacy document version to 1.2', () => {
    const result = validateMirDocument({
      version: '1.0',
      ui: { root: { id: 'root', type: 'container' } },
    });

    expect(result.document.version).toBe('1.2');
    expect(result.hasError).toBe(false);
  });

  it('reports invalid data/list contracts', () => {
    const result = validateMirDocument({
      version: '1.2',
      ui: {
        root: {
          id: 'root',
          type: 'container',
          data: {
            extend: [],
          },
          children: [
            {
              id: 'list-node',
              type: 'MdrDiv',
              list: {
                source: { invalid: 'x' },
                keyBy: 1,
                emptyNodeId: 'missing-node',
              },
            },
          ],
        },
      },
    });

    expect(result.hasError).toBe(true);
    expect(
      result.issues.some((item) => item.code === 'MIR_DATA_EXTEND_INVALID')
    ).toBe(true);
    expect(
      result.issues.some((item) => item.code === 'MIR_LIST_SOURCE_INVALID')
    ).toBe(true);
    expect(
      result.issues.some((item) => item.code === 'MIR_LIST_KEYBY_INVALID')
    ).toBe(true);
    expect(
      result.issues.some(
        (item) => item.code === 'MIR_LIST_EMPTY_NODE_NOT_FOUND'
      )
    ).toBe(true);
  });

  it('allows list without explicit source', () => {
    const result = validateMirDocument({
      version: '1.2',
      ui: {
        root: {
          id: 'root',
          type: 'container',
          children: [{ id: 'list-node', type: 'MdrDiv', list: {} }],
        },
      },
    });

    expect(
      result.issues.some((item) => item.code === 'MIR_LIST_SOURCE_REQUIRED')
    ).toBe(false);
    expect(result.hasError).toBe(false);
  });
});
