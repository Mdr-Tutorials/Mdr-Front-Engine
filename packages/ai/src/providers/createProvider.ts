import type { LlmProvider, LlmStructuredOutput } from '@mdr/shared';
import { MockLlmProvider } from '@mdr/shared';
import type { MdrAiSettings } from '../settings/aiSettings';
import {
  type MdrAiFetch,
  OpenAICompatibleProvider,
} from './openAICompatibleProvider';

export interface CreateMdrAiProviderOptions {
  settings: MdrAiSettings;
  fetcher?: MdrAiFetch;
  mockOutput?: LlmStructuredOutput;
}

const defaultMockOutput: LlmStructuredOutput = {
  goal: 'Draft an MFE AI task plan',
  assumptions: ['Use the current editor context summary only.'],
  milestones: [
    {
      id: 'inspect-context',
      title: 'Inspect available editor context',
    },
    {
      id: 'prepare-dry-run',
      title: 'Prepare a dry-run command batch',
    },
  ],
};

/**
 * 根据跨端 AI 设置创建 provider。app 层只提供环境相关能力，例如 fetcher 或 mock 输出，
 * provider 选择逻辑保持在 @mdr/ai 中复用。
 *
 * Creates a provider from cross-runtime AI settings. App layers only provide
 * environment-specific capabilities such as fetcher or mock output, while
 * provider selection stays reusable inside @mdr/ai.
 */
export const createMdrAiProvider = (
  options: CreateMdrAiProviderOptions
): LlmProvider => {
  if (options.settings.provider === 'mock') {
    return new MockLlmProvider(options.mockOutput ?? defaultMockOutput);
  }

  if (!options.fetcher) {
    throw new Error('OpenAI-compatible provider requires a fetcher.');
  }

  return new OpenAICompatibleProvider({
    baseURL: options.settings.baseURL,
    apiKey: options.settings.apiKey,
    model: options.settings.model,
    fetcher: options.fetcher,
  });
};
