import type {
  ThemeManifest,
  ThemeTokenIndex,
  ThemeTokenPath,
  ThemeTokenPrimitive,
} from '../schema/themeManifest.types';
import {
  extractReferencePath,
  flattenThemeTokens,
  tokenPathToCssVariable,
} from '../tokens/tokenPaths';

export type ThemeCssVariableMap = Record<`--${string}`, string>;

export type CreateCssVariablesOptions = {
  includeRgbChannels?: boolean;
};

export const createCssVariables = (
  manifest: ThemeManifest,
  options: CreateCssVariablesOptions = {}
): ThemeCssVariableMap => {
  const includeRgbChannels = options.includeRgbChannels ?? true;
  const tokens = flattenThemeTokens(manifest);
  const variables: Partial<ThemeCssVariableMap> = {};

  for (const path of Object.keys(tokens) as ThemeTokenPath[]) {
    const cssVariable = tokenPathToCssVariable(path) as `--${string}`;
    const cssValue = createCssValue(tokens[path]);

    variables[cssVariable] = cssValue;

    if (includeRgbChannels) {
      addRgbChannelVariable(cssVariable, tokens[path], tokens, variables);
    }
  }

  return variables as ThemeCssVariableMap;
};

const createCssValue = (value: ThemeTokenPrimitive) => {
  const referencePath = extractReferencePath(value);

  if (referencePath) {
    return `var(${tokenPathToCssVariable(referencePath)})`;
  }

  return String(value);
};

const addRgbChannelVariable = (
  cssVariable: `--${string}`,
  value: ThemeTokenPrimitive,
  tokens: ThemeTokenIndex,
  variables: Partial<ThemeCssVariableMap>
) => {
  if (!supportsRgbChannelVariable(cssVariable)) {
    return;
  }

  const colorValue = resolveColorValue(value, tokens);

  if (!colorValue) {
    return;
  }

  variables[`${cssVariable}-rgb`] = colorValue;
};

const supportsRgbChannelVariable = (cssVariable: `--${string}`) => {
  return (
    cssVariable.startsWith('--palette-') ||
    cssVariable.startsWith('--bg-') ||
    cssVariable.startsWith('--text-') ||
    cssVariable.startsWith('--border-') ||
    cssVariable.startsWith('--accent-') ||
    cssVariable.startsWith('--success-') ||
    cssVariable.startsWith('--danger-') ||
    cssVariable.startsWith('--warning-') ||
    cssVariable.startsWith('--info-') ||
    cssVariable.startsWith('--editor-') ||
    cssVariable.startsWith('--inspector-') ||
    cssVariable.startsWith('--node-') ||
    cssVariable.startsWith('--home-')
  );
};

const resolveColorValue = (
  value: ThemeTokenPrimitive,
  tokens: ThemeTokenIndex
): string | undefined => {
  const referencePath = extractReferencePath(value);

  if (referencePath) {
    const referencedValue = tokens[referencePath];

    return referencedValue === undefined
      ? undefined
      : resolveColorValue(referencedValue, tokens);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  return hexToRgbChannels(value);
};

const hexToRgbChannels = (value: string) => {
  const normalizedValue = value.trim();
  const shortHexMatch = normalizedValue.match(/^#([0-9a-f]{3})$/i);
  const longHexMatch = normalizedValue.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);

  if (shortHexMatch) {
    return shortHexMatch[1]
      .split('')
      .map((part) => parseInt(`${part}${part}`, 16))
      .join(' ');
  }

  if (!longHexMatch) {
    return undefined;
  }

  const hex = longHexMatch[1];
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
};
