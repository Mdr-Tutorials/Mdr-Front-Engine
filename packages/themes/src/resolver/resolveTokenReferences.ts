import type {
  ThemeTokenIndex,
  ThemeTokenPath,
  ThemeTokenPrimitive,
} from '../schema/themeManifest.types';
import { extractReferencePath } from '../tokens/tokenPaths';

export class ThemeTokenResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThemeTokenResolutionError';
  }
}

export const resolveTokenReferences = (
  tokens: ThemeTokenIndex,
  fallbackTokens: ThemeTokenIndex = {} as ThemeTokenIndex
): ThemeTokenIndex => {
  const resolvedTokens: Partial<ThemeTokenIndex> = {};
  const resolving = new Set<ThemeTokenPath>();

  for (const path of Object.keys(tokens) as ThemeTokenPath[]) {
    resolvedTokens[path] = resolveTokenValue(path, tokens, fallbackTokens, {
      resolvedTokens,
      resolving,
    });
  }

  return resolvedTokens as ThemeTokenIndex;
};

type ResolveContext = {
  resolvedTokens: Partial<ThemeTokenIndex>;
  resolving: Set<ThemeTokenPath>;
};

const resolveTokenValue = (
  path: ThemeTokenPath,
  tokens: ThemeTokenIndex,
  fallbackTokens: ThemeTokenIndex,
  context: ResolveContext
): ThemeTokenPrimitive => {
  const cachedValue = context.resolvedTokens[path];

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  if (context.resolving.has(path)) {
    throw new ThemeTokenResolutionError(
      `Circular theme token reference detected at "${path}".`
    );
  }

  const value = getTokenValue(path, tokens, fallbackTokens);

  context.resolving.add(path);

  const referencePath = extractReferencePath(value);
  const resolvedValue = referencePath
    ? resolveTokenValue(referencePath, tokens, fallbackTokens, context)
    : value;

  context.resolving.delete(path);
  context.resolvedTokens[path] = resolvedValue;

  return resolvedValue;
};

const getTokenValue = (
  path: ThemeTokenPath,
  tokens: ThemeTokenIndex,
  fallbackTokens: ThemeTokenIndex
) => {
  const value = tokens[path] ?? fallbackTokens[path];

  if (value === undefined) {
    throw new ThemeTokenResolutionError(
      `Unknown theme token reference "${path}".`
    );
  }

  return value;
};
