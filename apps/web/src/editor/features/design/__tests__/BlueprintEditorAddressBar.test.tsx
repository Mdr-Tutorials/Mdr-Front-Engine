import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlueprintEditorAddressBar } from '../BlueprintEditorAddressBar';

vi.mock('@mdr/ui', () => ({
  MdrInput: ({
    value,
    onChange,
    placeholder,
    className,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }) => (
    <input
      data-testid={className ?? 'mdr-input'}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  MdrButton: ({ text, onClick }: { text: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Link2: () => null,
  Plus: () => null,
}));

describe('BlueprintEditorAddressBar', () => {
  it('propagates input changes and adds routes', () => {
    const onCurrentPathChange = vi.fn();
    const onNewPathChange = vi.fn();
    const onAddRoute = vi.fn();

    render(
      <BlueprintEditorAddressBar
        currentPath="/"
        newPath="/new"
        routes={[{ id: 'home', path: '/' }]}
        onCurrentPathChange={onCurrentPathChange}
        onNewPathChange={onNewPathChange}
        onAddRoute={onAddRoute}
      />
    );

    fireEvent.change(screen.getByTestId('AddressInput AddressCurrentInput'), {
      target: { value: '/next' },
    });
    fireEvent.change(screen.getByTestId('AddressInput AddressNewInput'), {
      target: { value: '/draft' },
    });

    expect(onCurrentPathChange).toHaveBeenCalledWith('/next');
    expect(onNewPathChange).toHaveBeenCalledWith('/draft');

    fireEvent.click(screen.getByRole('button', { name: 'address.add' }));
    expect(onAddRoute).toHaveBeenCalledTimes(1);
  });

  it('renders the route list', () => {
    render(
      <BlueprintEditorAddressBar
        currentPath="/"
        newPath=""
        routes={[
          { id: 'home', path: '/' },
          { id: 'about', path: '/about' },
        ]}
        onCurrentPathChange={() => {}}
        onNewPathChange={() => {}}
        onAddRoute={() => {}}
      />
    );

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      '/',
      '/about',
    ]);
  });
});
