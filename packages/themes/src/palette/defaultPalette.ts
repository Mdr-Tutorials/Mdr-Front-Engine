import paletteJson from './defaultPalette.json';
import type { ThemePalette } from '../schema/themeManifest.types';

export const DEFAULT_PALETTE = paletteJson as ThemePalette;

export const DEFAULT_PALETTE_SCALES = Object.keys(
  DEFAULT_PALETTE
) as readonly string[];
