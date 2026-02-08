import { describe, expect, it } from 'vitest';
import {
    listIconNamesByProvider,
    listIconProviders,
    resolveIconRef,
} from '../iconRegistry';

describe('icon registry', () => {
    it('registers lucide provider with full icon catalog', () => {
        const providers = listIconProviders();
        const lucide = providers.find((provider) => provider.id === 'lucide');
        expect(lucide).toBeTruthy();

        const names = listIconNamesByProvider('lucide');
        expect(names.length).toBeGreaterThan(1000);
        expect(names).toContain('Sparkles');
        expect(names).toContain('Circle');
    });

    it('resolves lucide icon names in different formats', () => {
        const fromPascal = resolveIconRef({
            provider: 'lucide',
            name: 'ArrowUpRight',
        });
        const fromKebab = resolveIconRef({
            provider: 'lucide',
            name: 'arrow-up-right',
        });

        expect(fromPascal).toBeTruthy();
        expect(fromKebab).toBeTruthy();
    });
});
