export type ClassToken = {
  value: string;
  source: 'tailwind' | 'native';
};

export type ClassSuggestion = {
  token: string;
  source: 'tailwind' | 'native';
  score: number;
};

export type ClassSuggestContext = {
  query: string;
  tokens: string[];
  limit: number;
};

export interface ClassProtocolEngine {
  tokenize(input: string): ClassToken[];
  suggest(context: ClassSuggestContext): ClassSuggestion[];
  resolveConflict(tokens: string[]): string[];
}
