import { describe, expect, it } from 'vitest';
import { formatValue, withDisabled } from '../SettingsShared';

describe('SettingsShared helpers', () => {
    it('formats values for display', () => {
        expect(formatValue(['a', 'b'])).toBe('a, b');
        expect(formatValue('')).toBe('--');
        expect(formatValue(null)).toBe('--');
        expect(formatValue(undefined)).toBe('--');
        expect(formatValue(42)).toBe('42');
    });

    it('applies disabled flag to checklist options', () => {
        const items = [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b', disabled: true },
        ];

        const result = withDisabled(items, true);

        expect(result).toEqual([
            { label: 'A', value: 'a', disabled: true },
            { label: 'B', value: 'b', disabled: true },
        ]);
    });
});
