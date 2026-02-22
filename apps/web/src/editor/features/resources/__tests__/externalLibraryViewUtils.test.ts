import { describe, expect, it } from 'vitest';
import { getPackageSizeMeta } from '../externalLibraryManager/viewUtils';

describe('externalLibraryManager view utils', () => {
  it('classifies package size warning levels by thresholds', () => {
    expect(getPackageSizeMeta(500).level).toBe('healthy');
    expect(getPackageSizeMeta(501).level).toBe('caution');
    expect(getPackageSizeMeta(800).level).toBe('caution');
    expect(getPackageSizeMeta(801).level).toBe('warning');
    expect(getPackageSizeMeta(1200).level).toBe('warning');
    expect(getPackageSizeMeta(1201).level).toBe('critical');
  });

  it('supports custom package size thresholds', () => {
    const customThresholds = {
      cautionKb: 300,
      warningKb: 700,
      criticalKb: 900,
    };
    expect(getPackageSizeMeta(300, customThresholds).level).toBe('healthy');
    expect(getPackageSizeMeta(301, customThresholds).level).toBe('caution');
    expect(getPackageSizeMeta(701, customThresholds).level).toBe('warning');
    expect(getPackageSizeMeta(901, customThresholds).level).toBe('critical');
  });
});
