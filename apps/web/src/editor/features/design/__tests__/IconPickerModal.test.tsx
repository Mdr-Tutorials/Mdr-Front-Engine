import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IconPickerModal } from '@/editor/features/design/inspector/components/IconPickerModal';

const registryMock = vi.hoisted(() => {
  const iconSpy = vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="mock-icon" {...props} />
  ));
  return {
    iconSpy,
    ensureReady: vi.fn(async () => undefined),
  };
});

vi.mock('@/mir/renderer/iconRegistry', () => ({
  ensureIconProviderReady: registryMock.ensureReady,
  getIconProviderState: () => ({ status: 'ready', error: null }),
  getIconRegistryRevision: () => 1,
  listIconNamesByProvider: () => ['AcademicCap'],
  listIconProviders: () => [{ id: 'heroicons', label: 'Heroicons' }],
  resolveIconRef: () => registryMock.iconSpy,
  subscribeIconRegistry: () => () => {},
}));

describe('IconPickerModal', () => {
  beforeEach(() => {
    registryMock.iconSpy.mockClear();
    registryMock.ensureReady.mockClear();
    if (!HTMLElement.prototype.scrollTo) {
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        configurable: true,
        writable: true,
        value: vi.fn(),
      });
    }
  });

  it('passes width and height when rendering provider icons', () => {
    render(
      <IconPickerModal
        open
        initialIconRef={{ provider: 'heroicons', name: 'AcademicCap' }}
        onClose={() => {}}
        onSelect={() => {}}
      />
    );

    const renderedProps = registryMock.iconSpy.mock.calls.map(
      ([props]) => props as Record<string, unknown>
    );
    const optionIcon = renderedProps.find((props) => props.size === 18);
    const previewIcon = renderedProps.find((props) => props.size === 34);

    expect(optionIcon).toMatchObject({ size: 18, width: 18, height: 18 });
    expect(previewIcon).toMatchObject({ size: 34, width: 34, height: 34 });
    expect(registryMock.ensureReady).toHaveBeenCalledWith('heroicons');
  });

  it('applies heroicons solid variant when user switches style', () => {
    const onSelect = vi.fn();
    render(
      <IconPickerModal
        open
        initialIconRef={{ provider: 'heroicons', name: 'AcademicCap' }}
        onClose={() => {}}
        onSelect={onSelect}
      />
    );

    expect(
      screen.getByRole('option', { name: 'Heroicons: Outline' })
    ).toBeTruthy();
    expect(
      screen.getByRole('option', { name: 'Heroicons: Solid' })
    ).toBeTruthy();
    fireEvent.change(screen.getByTestId('icon-picker-provider'), {
      target: { value: 'heroicons:solid' },
    });
    fireEvent.click(screen.getByTestId('icon-picker-option-AcademicCap'));
    fireEvent.click(screen.getByTestId('icon-picker-apply'));

    expect(onSelect).toHaveBeenCalledWith({
      provider: 'heroicons',
      name: 'AcademicCap',
      variant: 'solid',
    });
  });
});
