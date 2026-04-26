import monochromeLightManifest from '../../manifests/official/monochrome-light.json';
import monochromeDarkManifest from '../../manifests/official/monochrome-dark.json';
import type { ThemeManifest } from '../schema/themeManifest.types';

export const officialMonochromeLightTheme =
  monochromeLightManifest as ThemeManifest;

export const officialMonochromeDarkTheme =
  monochromeDarkManifest as ThemeManifest;

export const officialThemes = [
  officialMonochromeLightTheme,
  officialMonochromeDarkTheme,
] as const satisfies readonly ThemeManifest[];

export const defaultFallbackTheme = officialMonochromeLightTheme;
