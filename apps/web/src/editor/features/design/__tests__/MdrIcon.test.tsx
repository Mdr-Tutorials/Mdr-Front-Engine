import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MdrIcon } from '@mdr/ui';

describe('MdrIcon', () => {
  it('passes width and height for component-based icons', () => {
    const HeroiconLike = (props: Record<string, unknown>) => (
      <svg data-testid="heroicon-like" {...props} />
    );

    render(<MdrIcon icon={HeroiconLike} size={20} />);

    const icon = screen.getByTestId('heroicon-like');
    expect(icon.getAttribute('width')).toBe('20');
    expect(icon.getAttribute('height')).toBe('20');
  });
});
