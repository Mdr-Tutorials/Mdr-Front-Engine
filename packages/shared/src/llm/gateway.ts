import type {
  LlmOutputChannel,
  LlmProvider,
  LlmStructuredOutput,
  LlmTaskRequest,
  LlmTaskResult,
} from './types';
import type { LlmTraceStore } from './traceStore';
import { LlmToolRegistry } from './toolRegistry';

export interface LlmGatewayOptions {
  provider: LlmProvider;
  tools: LlmToolRegistry;
  traceStore?: LlmTraceStore;
  createId?: () => string;
  now?: () => string;
}

const defaultCreateId = () =>
  `llm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

const defaultNow = () => new Date().toISOString();

const getOutputChannel = (
  output: LlmStructuredOutput
): LlmOutputChannel | 'plan' => {
  if ('channel' in output) {
    return output.channel;
  }

  return 'plan';
};

/**
 * LLM Gateway 是 MFE 内部 AI 调用链路的统一入口：先按任务挑选允许的工具，
 * 再调用 provider，随后校验输出通道并写入 trace，最后返回可 dry-run 或可计划化的结果。
 *
 * LlmGateway is the unified MFE AI execution entrypoint: it picks task-allowed
 * tools, calls the provider, validates the output channel, records trace data,
 * and returns a result ready for planning or dry-run handling.
 */
export class LlmGateway {
  private readonly provider: LlmProvider;
  private readonly tools: LlmToolRegistry;
  private readonly traceStore?: LlmTraceStore;
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: LlmGatewayOptions) {
    this.provider = options.provider;
    this.tools = options.tools;
    this.traceStore = options.traceStore;
    this.createId = options.createId ?? defaultCreateId;
    this.now = options.now ?? defaultNow;
  }

  async run(task: LlmTaskRequest): Promise<LlmTaskResult> {
    const startedAt = this.now();
    const traceId = this.createId();
    const allowedTools = this.tools.pick(task.allowedTools);

    try {
      const output = await this.provider.generate({
        task,
        tools: allowedTools,
      });
      const outputChannel = getOutputChannel(output);

      if (
        outputChannel !== 'plan' &&
        !task.outputChannels.includes(outputChannel)
      ) {
        throw new Error(
          `Provider returned disallowed LLM output channel: ${outputChannel}`
        );
      }

      const completedAt = this.now();

      await this.traceStore?.append({
        id: traceId,
        taskId: task.id,
        userIntent: task.intent,
        modelProviderId: this.provider.id,
        context: task.context,
        toolNames: allowedTools.map((tool) => tool.name),
        toolCalls: [],
        diagnostics: [],
        startedAt,
        completedAt,
      });

      return {
        taskId: task.id,
        status: task.requiresPlan ? 'planned' : 'dry-run',
        output,
        diagnostics: [],
        traceId,
      };
    } catch (error) {
      const diagnostic = {
        code: 'LLM_PROVIDER_FAILED',
        severity: 'error' as const,
        message:
          error instanceof Error ? error.message : 'LLM provider failed.',
      };

      await this.traceStore?.append({
        id: traceId,
        taskId: task.id,
        userIntent: task.intent,
        modelProviderId: this.provider.id,
        context: task.context,
        toolNames: allowedTools.map((tool) => tool.name),
        toolCalls: [],
        diagnostics: [diagnostic],
        startedAt,
        completedAt: this.now(),
      });

      return {
        taskId: task.id,
        status: 'failed',
        diagnostics: [diagnostic],
        traceId,
      };
    }
  }
}
