import { twMerge } from 'tailwind-merge';
import tailwindCatalog from '../tailwind4.catalog.json';
import type { ClassProtocolEngine, ClassSuggestion } from '../types';
import { parseClassProtocolTokens } from '../tokenizer';

const TAILWIND_CLASSES = tailwindCatalog.classes as string[];
const TAILWIND_VARIANTS = tailwindCatalog.variants as string[];

const COMMON_VARIANTS = [
  'hover',
  'focus',
  'active',
  'disabled',
  'dark',
  'sm',
  'md',
  'lg',
  'xl',
];

const rankTailwindToken = (
  token: string,
  query: string,
  tokens: Set<string>,
  hasFlex: boolean,
  hasGrid: boolean
) => {
  if (tokens.has(token)) return -1;
  const lowerToken = token.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let score = 0;
  if (!query) score += 8;
  if (lowerToken === lowerQuery) score += 120;
  else if (lowerToken.startsWith(lowerQuery)) score += 100;
  else if (lowerToken.includes(lowerQuery)) score += 70;
  else return -1;

  if (
    hasFlex &&
    (token.startsWith('flex-') ||
      token.startsWith('items-') ||
      token.startsWith('justify-'))
  ) {
    score += 25;
  }
  if (hasGrid && token.startsWith('grid-')) score += 25;
  if (
    token.startsWith('p-') ||
    token.startsWith('m-') ||
    token.startsWith('gap-')
  ) {
    score += 8;
  }
  return score;
};

const toVariantSuggestions = (
  query: string,
  tokens: Set<string>,
  limit: number
): ClassSuggestion[] => {
  const colonIndex = query.lastIndexOf(':');
  if (colonIndex < 0) return [];
  const variantSegment = query.slice(0, colonIndex).trim();
  const utilitySegment = query.slice(colonIndex + 1).trim();
  if (!variantSegment) return [];

  const candidateVariants = TAILWIND_VARIANTS.filter(
    (variant) =>
      variant === variantSegment ||
      variant.startsWith(variantSegment) ||
      variantSegment.startsWith(variant)
  );
  if (!candidateVariants.length) return [];

  const utilityCandidates = TAILWIND_CLASSES.filter((utility) => {
    if (!utilitySegment) return true;
    return utility.includes(utilitySegment);
  }).slice(0, limit * 4);

  const suggestions: ClassSuggestion[] = [];
  candidateVariants.forEach((variant) => {
    utilityCandidates.forEach((utility) => {
      const token = `${variant}:${utility}`;
      if (tokens.has(token)) return;
      const score =
        (variant === variantSegment ? 60 : 45) +
        (utility.startsWith(utilitySegment) ? 40 : 20);
      suggestions.push({ token, source: 'tailwind', score });
    });
  });

  return suggestions
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
};

export const tailwind4ClassEngine: ClassProtocolEngine = {
  tokenize: (input) => parseClassProtocolTokens(input, 'tailwind'),
  suggest: ({ query, tokens, limit }) => {
    const tokenSet = new Set(tokens);
    const hasFlex = tokenSet.has('flex');
    const hasGrid = tokenSet.has('grid');
    const baseSuggestions: ClassSuggestion[] = [];
    const trimmedQuery = query.trim();

    for (const token of TAILWIND_CLASSES) {
      const score = rankTailwindToken(
        token,
        trimmedQuery,
        tokenSet,
        hasFlex,
        hasGrid
      );
      if (score < 0) continue;
      baseSuggestions.push({ token, source: 'tailwind', score });
    }

    const variantSuggestions = toVariantSuggestions(
      trimmedQuery,
      tokenSet,
      limit
    );
    const commonVariantSuggestions =
      trimmedQuery && !trimmedQuery.includes(':')
        ? COMMON_VARIANTS.filter((variant) =>
            variant.startsWith(trimmedQuery.toLowerCase())
          ).map((variant) => ({
            token: `${variant}:`,
            source: 'tailwind' as const,
            score: 40,
          }))
        : [];

    return [
      ...variantSuggestions,
      ...baseSuggestions,
      ...commonVariantSuggestions,
    ]
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  },
  resolveConflict: (tokens) =>
    twMerge(tokens.join(' ')).split(/\s+/).filter(Boolean),
};
