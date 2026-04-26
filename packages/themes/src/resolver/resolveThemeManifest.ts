import type {
  ResolvedThemeManifest,
  ThemeManifest,
} from '../schema/themeManifest.types';
import { defaultFallbackTheme } from '../tokens/defaultFallback';
import { flattenThemeTokens } from '../tokens/tokenPaths';
import { resolveTokenReferences } from './resolveTokenReferences';

export type ResolveThemeManifestOptions = {
  fallbackManifest?: ThemeManifest;
};

export const resolveThemeManifest = (
  manifest: ThemeManifest,
  options: ResolveThemeManifestOptions = {}
): ResolvedThemeManifest => {
  const fallbackManifest = options.fallbackManifest ?? defaultFallbackTheme;
  const rawTokens = flattenThemeTokens(manifest);
  const fallbackTokens =
    fallbackManifest.id === manifest.id
      ? {}
      : flattenThemeTokens(fallbackManifest);
  const resolvedTokens = resolveTokenReferences(rawTokens, fallbackTokens);

  return {
    manifest,
    rawTokens,
    resolvedTokens,
  };
};
