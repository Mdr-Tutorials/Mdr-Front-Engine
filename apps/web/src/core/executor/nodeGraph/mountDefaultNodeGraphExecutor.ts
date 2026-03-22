import type { MIRDocument } from '@/core/types/engine.types';
import {
  registerGraphExecutionHandler,
  type GraphExecutionRequest,
} from '@/core/executor/executor';
import { executeMirNodeGraph } from '@/core/executor/nodeGraph/nodeGraphExecutor';

type MountDefaultNodeGraphExecutorOptions = {
  getMirDoc: () => MIRDocument;
};

/**
 * 默认节点图执行器挂载链路：
 * executeGraph bridge -> default graph handler -> MIR graph executor。
 */
export const mountDefaultNodeGraphExecutor = ({
  getMirDoc,
}: MountDefaultNodeGraphExecutorOptions) =>
  registerGraphExecutionHandler('*', (request: GraphExecutionRequest) =>
    executeMirNodeGraph(getMirDoc(), request)
  );
