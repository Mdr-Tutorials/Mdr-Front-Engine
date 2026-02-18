import { describe, expect, it } from 'vitest';
import {
  addNodeAndConnectNext,
  createDefaultNodeGraphModel,
  createNodeGraphInteractionState,
  createNodeGraphNode,
  reduceNodeGraphInteraction,
  resolveNodeDefaultPorts,
  upsertEdge,
} from '../index';
import type { NodeGraphModel } from '../index';

const point = { x: 10, y: 10 };
const createModel = (...nodes: NodeGraphModel['nodes']): NodeGraphModel => ({
  version: '1',
  nodes,
  edges: [],
});

describe('node graph core helpers', () => {
  it('creates default graph with start -> end edge', () => {
    const model = createDefaultNodeGraphModel();
    expect(model.nodes).toHaveLength(2);
    expect(model.edges).toHaveLength(1);

    const [startNode, endNode] = model.nodes;
    expect(model.edges[0].sourceNodeId).toBe(startNode.id);
    expect(model.edges[0].targetNodeId).toBe(endNode.id);
  });

  it('adds next node and auto-connects from selected source', () => {
    const model = createDefaultNodeGraphModel();
    const sourceNode = model.nodes[0];
    const next = addNodeAndConnectNext(model, {
      sourceNodeId: sourceNode.id,
      nodeType: 'if-else',
      position: { x: 300, y: 220 },
      title: 'if-else',
    });

    expect(next.nodes).toHaveLength(3);
    expect(next.edges).toHaveLength(1);
    expect(next.edges[0].sourceNodeId).toBe(sourceNode.id);
    expect(next.edges[0].targetNodeId).toBe(next.nodes[2].id);
  });

  it('keeps slot order stable for branch nodes', () => {
    const ifElsePorts = resolveNodeDefaultPorts('if-else');
    const ifElseOut = ifElsePorts.filter((port) => port.role === 'out');
    expect(ifElseOut.map((port) => port.id)).toEqual(['out.true', 'out.false']);

    const forEachPorts = resolveNodeDefaultPorts('for-each');
    const forEachOut = forEachPorts.filter((port) => port.role === 'out');
    expect(forEachOut.map((port) => port.id)).toEqual(['out.loop', 'out.done']);
  });

  it('replaces existing incoming edge when target port is single', () => {
    const sourceA = createNodeGraphNode('start', { x: 80, y: 80 }, 'start-a');
    const sourceB = createNodeGraphNode('break', { x: 80, y: 240 }, 'break-b');
    const target = createNodeGraphNode('end', { x: 360, y: 160 }, 'end');
    let model = createModel(sourceA, sourceB, target);

    model = upsertEdge(model, sourceA.id, 'out.next', target.id, 'in.prev');
    model = upsertEdge(model, sourceB.id, 'out.break', target.id, 'in.prev');

    expect(model.edges).toHaveLength(1);
    expect(model.edges[0].sourceNodeId).toBe(sourceB.id);
    expect(model.edges[0].targetNodeId).toBe(target.id);
  });

  it('keeps multiple outgoing edges when source port is multi', () => {
    const source = createNodeGraphNode('switch', { x: 80, y: 160 }, 'switch');
    const targetA = createNodeGraphNode('while', { x: 360, y: 100 }, 'while-a');
    const targetB = createNodeGraphNode('while', { x: 360, y: 240 }, 'while-b');
    let model = createModel(source, targetA, targetB);

    model = upsertEdge(
      model,
      source.id,
      'out.case-0',
      targetA.id,
      'in.condition'
    );
    model = upsertEdge(
      model,
      source.id,
      'out.case-0',
      targetB.id,
      'in.condition'
    );

    expect(model.edges).toHaveLength(2);
    expect(
      model.edges.every((edge) => edge.sourcePortId === 'out.case-0')
    ).toBe(true);
  });

  it('rejects incompatible kind connection', () => {
    const source = createNodeGraphNode('start', { x: 80, y: 80 }, 'start');
    const target = createNodeGraphNode('switch', { x: 360, y: 80 }, 'switch');
    const model = createModel(source, target);

    const next = upsertEdge(
      model,
      source.id,
      'out.next',
      target.id,
      'in.value'
    );

    expect(next).toBe(model);
    expect(next.edges).toHaveLength(0);
  });

  it('allows accepted cross-kind connection via acceptsKinds', () => {
    const source = createNodeGraphNode(
      'merge',
      { x: 80, y: 80 },
      'data-source'
    );
    source.ports = [
      {
        id: 'out.data',
        role: 'out',
        side: 'right',
        slotOrder: 0,
        kind: 'data',
        multiplicity: 'single',
        shape: 'square',
      },
    ];
    const target = createNodeGraphNode('while', { x: 360, y: 80 }, 'while');
    const model = createModel(source, target);

    const next = upsertEdge(
      model,
      source.id,
      'out.data',
      target.id,
      'in.condition'
    );

    expect(next.edges).toHaveLength(1);
    expect(next.edges[0].kind).toBe('data');
  });

  it('uses source port kind as edge kind', () => {
    const source = createNodeGraphNode('if-else', { x: 80, y: 80 }, 'if-else');
    const target = createNodeGraphNode('while', { x: 360, y: 80 }, 'while');
    let model = createModel(source, target);

    model = upsertEdge(model, source.id, 'out.true', target.id, 'in.condition');

    expect(model.edges).toHaveLength(1);
    expect(model.edges[0].kind).toBe('condition');
  });

  it('supports edge create and reconnect transitions', () => {
    const created = reduceNodeGraphInteraction(
      createNodeGraphInteractionState(),
      {
        type: 'pointer.down',
        pointerId: 1,
        point,
        target: {
          type: 'port',
          nodeId: 'node-1',
          portId: 'out.next',
          role: 'out',
        },
      }
    );

    const moved = reduceNodeGraphInteraction(created.state, {
      type: 'pointer.move',
      pointerId: 1,
      point: { x: 20, y: 20 },
    });

    const completed = reduceNodeGraphInteraction(moved.state, {
      type: 'pointer.up',
      pointerId: 1,
      point: { x: 20, y: 20 },
      target: {
        type: 'port',
        nodeId: 'node-2',
        portId: 'in.prev',
        role: 'in',
      },
    });

    expect(completed.actions).toEqual([
      {
        type: 'edge.create',
        sourceNodeId: 'node-1',
        sourcePortId: 'out.next',
        targetNodeId: 'node-2',
        targetPortId: 'in.prev',
      },
    ]);

    const reconnectStart = reduceNodeGraphInteraction(
      createNodeGraphInteractionState(),
      {
        type: 'pointer.down',
        pointerId: 2,
        point,
        target: {
          type: 'edge',
          edgeId: 'edge-1',
          handle: 'target',
          nodeId: 'node-1',
          portId: 'out.next',
          role: 'out',
        },
      }
    );

    const reconnectDone = reduceNodeGraphInteraction(reconnectStart.state, {
      type: 'pointer.up',
      pointerId: 2,
      point,
      target: {
        type: 'port',
        nodeId: 'node-3',
        portId: 'in.prev',
        role: 'in',
      },
    });

    expect(reconnectDone.actions).toEqual([
      {
        type: 'edge.reconnect',
        edgeId: 'edge-1',
        sourceNodeId: 'node-1',
        sourcePortId: 'out.next',
        targetNodeId: 'node-3',
        targetPortId: 'in.prev',
      },
    ]);
  });
});
