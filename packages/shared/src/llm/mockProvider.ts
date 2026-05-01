import type {
  LlmProvider,
  LlmProviderRequest,
  LlmStructuredOutput,
} from './types';

export class MockLlmProvider implements LlmProvider {
  readonly id = 'mock';

  constructor(private readonly output: LlmStructuredOutput) {}

  generate(_request: LlmProviderRequest): Promise<LlmStructuredOutput> {
    return Promise.resolve(this.output);
  }
}
