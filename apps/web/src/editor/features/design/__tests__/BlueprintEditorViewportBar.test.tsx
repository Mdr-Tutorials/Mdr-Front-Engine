import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BlueprintEditorViewportBar } from '../BlueprintEditorViewportBar';

const QUICK_PRESETS = vi.hoisted(() => [
  {
    id: 'quick-desktop',
    labelKey: 'viewport.quickPresets.desktop',
    width: '1440',
    height: '900',
  },
]);

const DEVICE_PRESETS = vi.hoisted(() => [
  {
    id: 'desktop-fhd',
    nameKey: 'devices.desktopFhd',
    kind: 'Desktop',
    kindKey: 'devices.kinds.desktop',
    width: '1920',
    height: '1080',
    icon: () => null,
  },
]);

vi.mock('../BlueprintEditor.data', () => ({
  VIEWPORT_QUICK_PRESETS: QUICK_PRESETS,
  VIEWPORT_DEVICE_PRESETS: DEVICE_PRESETS,
  VIEWPORT_ZOOM_RANGE: { min: 50, max: 160, step: 5, default: 100 },
}));

vi.mock('@mdr/ui', () => ({
  MdrInput: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      data-testid="mdr-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  MdrSlider: ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => (
    <input
      data-testid="mdr-slider"
      type="range"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      onInput={(event) =>
        onChange(Number((event.target as HTMLInputElement).value))
      }
    />
  ),
  MdrPopover: ({
    children,
    content,
  }: {
    children: ReactNode;
    content: ReactNode;
  }) => (
    <div>
      {children}
      <div data-testid="popover-content">{content}</div>
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  ChevronDown: () => null,
  RotateCcw: () => null,
}));

describe('BlueprintEditorViewportBar', () => {
  it('updates zoom, width, and height', () => {
    const onViewportWidthChange = vi.fn();
    const onViewportHeightChange = vi.fn();
    const onZoomChange = vi.fn();
    const onResetView = vi.fn();

    render(
      <BlueprintEditorViewportBar
        viewportWidth="1440"
        viewportHeight="900"
        onViewportWidthChange={onViewportWidthChange}
        onViewportHeightChange={onViewportHeightChange}
        zoom={100}
        zoomStep={5}
        onZoomChange={onZoomChange}
        onResetView={onResetView}
      />
    );

    const inputs = screen.getAllByTestId('mdr-input');
    fireEvent.change(inputs[0], { target: { value: '1200' } });
    fireEvent.change(inputs[1], { target: { value: '800' } });

    expect(onViewportWidthChange).toHaveBeenCalledWith('1200');
    expect(onViewportHeightChange).toHaveBeenCalledWith('800');

    fireEvent.input(screen.getByTestId('mdr-slider'), {
      target: { value: '110' },
    });
    expect(onZoomChange).toHaveBeenCalled();
    expect(typeof onZoomChange.mock.calls[0]?.[0]).toBe('number');

    fireEvent.click(screen.getByRole('button', { name: 'viewport.reset' }));
    expect(onResetView).toHaveBeenCalledTimes(1);
  });

  it('applies quick preset buttons', () => {
    const onViewportWidthChange = vi.fn();
    const onViewportHeightChange = vi.fn();

    render(
      <BlueprintEditorViewportBar
        viewportWidth="1440"
        viewportHeight="900"
        onViewportWidthChange={onViewportWidthChange}
        onViewportHeightChange={onViewportHeightChange}
        zoom={100}
        zoomStep={5}
        onZoomChange={() => {}}
        onResetView={() => {}}
      />
    );

    const preset = QUICK_PRESETS[0];
    fireEvent.click(
      screen.getByRole('button', {
        name: `${preset.width}×${preset.height}`,
      })
    );
    expect(onViewportWidthChange).toHaveBeenCalledWith(preset.width);
    expect(onViewportHeightChange).toHaveBeenCalledWith(preset.height);
  });

  it('applies quick preset menu selections', () => {
    const onViewportWidthChange = vi.fn();
    const onViewportHeightChange = vi.fn();

    render(
      <BlueprintEditorViewportBar
        viewportWidth="1440"
        viewportHeight="900"
        onViewportWidthChange={onViewportWidthChange}
        onViewportHeightChange={onViewportHeightChange}
        zoom={100}
        zoomStep={5}
        onZoomChange={() => {}}
        onResetView={() => {}}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: QUICK_PRESETS[0].id },
    });
    expect(onViewportWidthChange).toHaveBeenCalledWith(QUICK_PRESETS[0].width);
    expect(onViewportHeightChange).toHaveBeenCalledWith(
      QUICK_PRESETS[0].height
    );
  });

  it('applies device preset selections', () => {
    const onViewportWidthChange = vi.fn();
    const onViewportHeightChange = vi.fn();

    render(
      <BlueprintEditorViewportBar
        viewportWidth="1440"
        viewportHeight="900"
        onViewportWidthChange={onViewportWidthChange}
        onViewportHeightChange={onViewportHeightChange}
        zoom={100}
        zoomStep={5}
        onZoomChange={() => {}}
        onResetView={() => {}}
      />
    );

    const popover = screen.getByTestId('popover-content');
    const deviceButtons = within(popover).getAllByRole('button', {
      name: /×/,
    });
    fireEvent.click(deviceButtons[0]);
    expect(onViewportWidthChange).toHaveBeenCalled();
    expect(onViewportHeightChange).toHaveBeenCalled();
  });
});
