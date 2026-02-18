import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearGraphExecutionHandlers,
  executeGraphRequest,
  GRAPH_EXECUTE_REQUEST_EVENT,
  GRAPH_EXECUTE_RESULT_EVENT,
  mountGraphExecutionBridge,
  registerGraphExecutionHandler,
} from '../executor';

describe('executor bridge', () => {
  afterEach(() => {
    clearGraphExecutionHandlers();
    vi.restoreAllMocks();
  });

  it('resolves state patch from registered graph handler', async () => {
    registerGraphExecutionHandler('graph-1', async (request) => ({
      statePatch: {
        latestNodeId: request.nodeId,
      },
    }));

    await expect(
      executeGraphRequest({
        requestId: 'request-1',
        nodeId: 'node-a',
        trigger: 'onClick',
        eventKey: 'click',
        params: { graphId: 'graph-1' },
      })
    ).resolves.toEqual({
      statePatch: {
        latestNodeId: 'node-a',
      },
    });
  });

  it('falls back to inline patch when no handler exists', async () => {
    await expect(
      executeGraphRequest({
        requestId: 'request-inline',
        nodeId: 'node-inline',
        trigger: 'onClick',
        eventKey: 'click',
        params: {
          statePatch: {
            products: [{ id: 'p-1' }],
          },
        },
      })
    ).resolves.toEqual({
      statePatch: {
        products: [{ id: 'p-1' }],
      },
    });
  });

  it('bridges window events and dispatches result by requestId', async () => {
    const unmount = mountGraphExecutionBridge(window);
    registerGraphExecutionHandler('graph-2', () => ({
      patch: {
        counter: 2,
      },
    }));

    const resultPromise = new Promise<Record<string, unknown>>((resolve) => {
      const onResult = (event: Event) => {
        const detail = (event as CustomEvent).detail as {
          requestId?: string;
          result?: Record<string, unknown>;
        };
        if (detail.requestId !== 'request-2') return;
        window.removeEventListener(
          GRAPH_EXECUTE_RESULT_EVENT,
          onResult as EventListener
        );
        resolve(detail.result ?? {});
      };
      window.addEventListener(
        GRAPH_EXECUTE_RESULT_EVENT,
        onResult as EventListener
      );
    });

    window.dispatchEvent(
      new CustomEvent(GRAPH_EXECUTE_REQUEST_EVENT, {
        detail: {
          requestId: 'request-2',
          nodeId: 'node-b',
          trigger: 'onClick',
          eventKey: 'click',
          params: {
            graphId: 'graph-2',
          },
        },
      })
    );

    await expect(resultPromise).resolves.toEqual({
      statePatch: {
        counter: 2,
      },
    });

    unmount();
  });
});
