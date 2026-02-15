import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClassProtocolEditor } from '../ClassProtocolEditor';

describe('ClassProtocolEditor', () => {
  it('commits whitespace-separated input into class tokens', () => {
    const handleChange = vi.fn();
    render(
      <ClassProtocolEditor
        value=""
        onChange={handleChange}
        inputTestId="class-protocol-input"
      />
    );

    fireEvent.change(screen.getByTestId('class-protocol-input'), {
      target: { value: 'p-4 flex items-center gap-2' },
    });

    expect(handleChange).toHaveBeenCalledWith('p-4 flex items-center gap-2');
  });

  it('supports keyboard completion with suggestion list', () => {
    const handleChange = vi.fn();
    render(
      <ClassProtocolEditor
        value="flex"
        onChange={handleChange}
        inputTestId="class-protocol-input"
      />
    );

    const input = screen.getByTestId('class-protocol-input');
    fireEvent.change(input, { target: { value: 'it' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls.at(-1)?.[0]).toMatch(/^flex items-/);
  });

  it('keeps conflicting tokens and relies on overridden hint instead of dropping old token', () => {
    const handleChange = vi.fn();
    render(
      <ClassProtocolEditor
        value="p-3"
        onChange={handleChange}
        inputTestId="class-protocol-input"
      />
    );

    const input = screen.getByTestId('class-protocol-input');
    fireEvent.change(input, { target: { value: 'p-4' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith('p-3 p-4');
  });

  it('removes token by backspace when draft is empty', () => {
    const handleChange = vi.fn();
    render(
      <ClassProtocolEditor
        value="p-4 flex"
        onChange={handleChange}
        inputTestId="class-protocol-input"
      />
    );

    fireEvent.keyDown(screen.getByTestId('class-protocol-input'), {
      key: 'Backspace',
    });

    expect(handleChange).toHaveBeenCalledWith('p-4');
  });

  it('renders a color dot for color class tokens', () => {
    render(
      <ClassProtocolEditor
        value="text-red-500 flex"
        onChange={() => {}}
        inputTestId="class-protocol-input"
      />
    );

    expect(screen.getByTestId('inspector-classname-color-dot-0')).toBeTruthy();
  });

  it('applies semantic color dot kinds for different utilities', () => {
    render(
      <ClassProtocolEditor
        value="text-red-500 bg-blue-500 border-emerald-500"
        onChange={() => {}}
        inputTestId="class-protocol-input"
      />
    );

    expect(
      screen
        .getByTestId('inspector-classname-color-dot-0')
        .getAttribute('data-color-kind')
    ).toBe('text');
    expect(
      screen
        .getByTestId('inspector-classname-color-dot-1')
        .getAttribute('data-color-kind')
    ).toBe('background');
    expect(
      screen
        .getByTestId('inspector-classname-color-dot-2')
        .getAttribute('data-color-kind')
    ).toBe('border');
  });

  it('marks overridden tokens when tailwind merge resolves conflicts', () => {
    render(
      <ClassProtocolEditor
        value="p-4 p-6"
        onChange={() => {}}
        inputTestId="class-protocol-input"
      />
    );

    expect(
      screen.getByTestId('inspector-classname-token-overridden-0')
    ).toBeTruthy();
    expect(
      screen
        .getByTestId('inspector-classname-token-overridden-0')
        .getAttribute('title')
    ).toContain('p-6');
  });

  it('supports inline mode for raw class input', () => {
    const handleChange = vi.fn();
    render(
      <ClassProtocolEditor
        value=""
        onChange={handleChange}
        inputTestId="class-protocol-input"
      />
    );

    fireEvent.click(screen.getByTestId('inspector-classname-mode-toggle'));
    fireEvent.change(screen.getByTestId('class-protocol-input'), {
      target: { value: 'p-4 p-6 flex' },
    });

    expect(handleChange).toHaveBeenCalledWith('p-4 p-6 flex');
  });
});
