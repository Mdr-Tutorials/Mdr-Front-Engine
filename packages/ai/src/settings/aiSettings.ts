import type { LlmExecutionBudget, LlmModelPreferences } from '@mdr/shared';

export type MdrAiProviderKind = 'mock' | 'openai-compatible';

export interface MdrAiBaseSettings {
  enabled: boolean;
  provider: MdrAiProviderKind;
}

export interface MdrAiOpenAICompatibleSettings extends MdrAiBaseSettings {
  provider: 'openai-compatible';
  baseURL: string;
  apiKey?: string;
  model: string;
  modelPreferences?: LlmModelPreferences;
  budget?: LlmExecutionBudget;
}

export interface MdrAiMockSettings extends MdrAiBaseSettings {
  provider: 'mock';
}

export type MdrAiSettings = MdrAiMockSettings | MdrAiOpenAICompatibleSettings;

export const createDefaultMdrAiSettings = (): MdrAiSettings => ({
  enabled: true,
  provider: 'mock',
});
