import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitInput } from '../UnitInput';

describe('UnitInput', () => {
  it('does not append unit text while typing incomplete numeric values', () => {
    const onChange = vi.fn();

    render(<UnitInput value={undefined} onChange={onChange} placeholder="8" />);

    fireEvent.change(screen.getByPlaceholderText('8'), {
      target: { value: '-' },
    });
    expect(onChange).toHaveBeenCalledWith('-');

    // Input should show just the raw draft, not "-px"
    expect((screen.getByPlaceholderText('8') as HTMLInputElement).value).toBe(
      '-'
    );
  });

  it('allows switching unit while amount is incomplete, and applies it once amount is complete', () => {
    const onChange = vi.fn();

    render(<UnitInput value="-" onChange={onChange} placeholder="8" />);

    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    fireEvent.click(screen.getByRole('option', { name: 'rem' }));

    fireEvent.change(screen.getByPlaceholderText('8'), {
      target: { value: '-12' },
    });
    expect(onChange).toHaveBeenCalledWith('-12rem');
  });
});
