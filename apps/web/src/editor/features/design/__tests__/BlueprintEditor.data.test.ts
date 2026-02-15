import { describe, expect, it } from 'vitest';
import {
  getDefaultSizeId,
  getDefaultStatusIndex,
  getPreviewScale,
  isWideComponent,
} from '../BlueprintEditor.data';
import type {
  ComponentGroup,
  ComponentPreviewItem,
  ComponentPreviewOption,
  ComponentPreviewStatus,
} from '../BlueprintEditor.types';

describe('BlueprintEditor.data helpers', () => {
  it('selects the default size option', () => {
    const options: ComponentPreviewOption[] = [
      { id: 'S', label: 'S', value: 'Small' },
      { id: 'M', label: 'M', value: 'Medium' },
      { id: 'L', label: 'L', value: 'Large' },
    ];

    expect(getDefaultSizeId(options)).toBe('M');
    expect(getDefaultSizeId([{ id: 'XS', label: 'XS', value: 'Tiny' }])).toBe(
      'XS'
    );
  });

  it('resolves the default status index', () => {
    const statuses: ComponentPreviewStatus[] = [
      { id: 'default', label: 'Default', value: 'Default' },
      { id: 'success', label: 'Success', value: 'Success' },
    ];

    expect(getDefaultStatusIndex(statuses, 'Success')).toBe(1);
    expect(getDefaultStatusIndex(statuses, 'missing')).toBe(0);
  });

  it('scales previews and caps wide layouts', () => {
    expect(getPreviewScale(0.7, false)).toBe(0.7);
    expect(getPreviewScale(undefined, false)).toBe(0.72);
    expect(getPreviewScale(0.9, true)).toBeLessThanOrEqual(0.95);
  });

  it('detects wide components by group or item', () => {
    const group: ComponentGroup = {
      id: 'layout',
      title: 'Layout',
      items: [],
    };
    const item: ComponentPreviewItem = {
      id: 'custom',
      name: 'Custom',
      preview: null,
    };
    expect(isWideComponent(group, item)).toBe(true);

    const narrowGroup: ComponentGroup = {
      id: 'base',
      title: 'Base',
      items: [],
    };
    const wideItem: ComponentPreviewItem = {
      id: 'date-range-picker',
      name: 'Range',
      preview: null,
    };
    expect(isWideComponent(narrowGroup, wideItem)).toBe(true);
  });
});
