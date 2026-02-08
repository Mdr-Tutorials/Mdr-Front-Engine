import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectResources } from '../ProjectResources';

describe('ProjectResources', () => {
    it('renders the resource manager label', () => {
        render(<ProjectResources />);
        expect(screen.getByText('resourceManager')).toBeTruthy();
    });
});
