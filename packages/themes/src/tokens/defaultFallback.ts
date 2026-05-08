import monochromeLightManifest from '../../manifests/official/monochrome-light.json';
import monochromeDarkManifest from '../../manifests/official/monochrome-dark.json';
import monochromeLightHighContrastManifest from '../../manifests/official/monochrome-light-high-contrast.json';
import monochromeDarkHighContrastManifest from '../../manifests/official/monochrome-dark-high-contrast.json';
import type { ThemeManifest } from '../schema/themeManifest.types';

export const officialMonochromeLightTheme =
  monochromeLightManifest as ThemeManifest;

export const officialMonochromeDarkTheme =
  monochromeDarkManifest as ThemeManifest;

export const officialMonochromeLightHighContrastTheme =
  monochromeLightHighContrastManifest as ThemeManifest;

export const officialMonochromeDarkHighContrastTheme =
  monochromeDarkHighContrastManifest as ThemeManifest;

export const officialThemes = [
  officialMonochromeLightTheme,
  officialMonochromeDarkTheme,
  officialMonochromeLightHighContrastTheme,
  officialMonochromeDarkHighContrastTheme,
] as const satisfies readonly ThemeManifest[];

export const defaultFallbackTheme = officialMonochromeLightTheme;
