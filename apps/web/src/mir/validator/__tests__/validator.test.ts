import { describe, expect, it } from 'vitest';
import { validateMirDocument } from '@/mir/validator/validator';

describe('validateMirDocument', () => {
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
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'MIR-3002',
          domain: 'mir',
          severity: 'warning',
        }),
        expect.objectContaining({
          code: 'MIR-3010',
          domain: 'mir',
          severity: 'warning',
        }),
        expect.objectContaining({
          code: 'MIR-3010',
          domain: 'mir',
          severity: 'warning',
        }),
        expect.objectContaining({
          code: 'MIR-2007',
          domain: 'mir',
          severity: 'error',
        }),
      ])
    );
  });
});
