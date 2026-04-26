import type { ThemeManifest } from '../schema/themeManifest.types';
import {
  createCssVariables,
  type CreateCssVariablesOptions,
} from './createCssVariables';

export type CreateThemeStyleTextOptions = CreateCssVariablesOptions & {
  selector?: string;
  includeRootSelector?: boolean;
};

export const createThemeStyleText = (
  manifest: ThemeManifest,
  options: CreateThemeStyleTextOptions = {}
) => {
  const variables = createCssVariables(manifest, options);
  const selector =
    options.selector ?? `[data-theme-id='${escapeCssString(manifest.id)}']`;
  const selectors = options.includeRootSelector
    ? [':root', selector]
    : [selector];
  const declarations = Object.entries(variables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `${selectors.join(',\n')} {\n${declarations}\n}`;
};

const escapeCssString = (value: string) => {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
};
