import { describe, expect, it } from 'vitest';
import {
  addNodeAndConnectNext,
  createDefaultNodeGraphModel,
  createNodeGraphInteractionState,
  createNodeGraphNode,
  normalizeNodeGraphModel,
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

  it('creates switch case input/output port pairs from config', () => {
    const switchPorts = resolveNodeDefaultPorts('switch', {
      valueExpression: '$data.kind',
      cases: [
        { id: 'case-alpha', comparator: 'equals', value: 'alpha' },
        { id: 'case-beta', comparator: 'equals', value: 'beta' },
      ],
    });
    expect(switchPorts.map((port) => port.id)).toEqual([
      'in.prev',
      'out.case-alpha',
      'in.value',
      'out.case-beta',
      'in.case-alpha',
      'out.default',
      'in.case-beta',
    ]);
    expect(switchPorts.find((port) => port.id === 'in.case-alpha')?.kind).toBe(
      'data'
    );
    expect(switchPorts.find((port) => port.id === 'out.case-alpha')?.kind).toBe(
      'control'
    );
  });

  it('replaces existing incoming edge when target port is single', () => {
    const sourceA = createNodeGraphNode('merge', { x: 80, y: 80 }, 'source-a');
    sourceA.ports = [
      {
        id: 'out.data',
        role: 'out',
        side: 'right',
        slotOrder: 0,
        kind: 'data',
        multiplicity: 'single',
      },
    ];
    const sourceB = createNodeGraphNode('merge', { x: 80, y: 240 }, 'source-b');
    sourceB.ports = [
      {
        id: 'out.data',
        role: 'out',
        side: 'right',
        slotOrder: 0,
        kind: 'data',
        multiplicity: 'single',
      },
    ];
    const target = createNodeGraphNode('merge', { x: 360, y: 160 }, 'target');
    target.ports = [
      {
        id: 'in.data',
        role: 'in',
        side: 'left',
        slotOrder: 0,
        kind: 'data',
        multiplicity: 'single',
      },
    ];
    let model = createModel(sourceA, sourceB, target);

    model = upsertEdge(model, sourceA.id, 'out.data', target.id, 'in.data');
    model = upsertEdge(model, sourceB.id, 'out.data', target.id, 'in.data');

    expect(model.edges).toHaveLength(1);
    expect(model.edges[0].sourceNodeId).toBe(sourceB.id);
    expect(model.edges[0].targetNodeId).toBe(target.id);
  });

  it('keeps multiple outgoing edges when source port is multi', () => {
    const source = createNodeGraphNode('merge', { x: 80, y: 160 }, 'source');
    source.ports = [
      {
        id: 'out.payload',
        role: 'out',
        side: 'right',
        slotOrder: 0,
        kind: 'data',
        multiplicity: 'multi',
      },
    ];
    const targetA = createNodeGraphNode(
      'merge',
      { x: 360, y: 100 },
      'target-a'
    );
    targetA.ports = [
      {
        id: 'in.payload',
        role: 'in',
        side: 'left',
        slotOrder: 0,
        kind: 'data',
        multiplicity: 'single',
      },
    ];
    const targetB = createNodeGraphNode(
      'merge',
      { x: 360, y: 240 },
      'target-b'
    );
    targetB.ports = [
      {
        id: 'in.payload',
        role: 'in',
        side: 'left',
        slotOrder: 0,
        kind: 'data',
        multiplicity: 'single',
      },
    ];
    let model = createModel(source, targetA, targetB);

    model = upsertEdge(
      model,
      source.id,
      'out.payload',
      targetA.id,
      'in.payload'
    );
    model = upsertEdge(
      model,
      source.id,
      'out.payload',
      targetB.id,
      'in.payload'
    );

    expect(model.edges).toHaveLength(2);
    expect(
      model.edges.every((edge) => edge.sourcePortId === 'out.payload')
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
      },
    ];
    const target = createNodeGraphNode('merge', { x: 360, y: 80 }, 'target');
    target.ports = [
      {
        id: 'in.node',
        role: 'in',
        side: 'left',
        slotOrder: 0,
        kind: 'node',
        acceptsKinds: ['data'],
        multiplicity: 'single',
      },
    ];
    const model = createModel(source, target);

    const next = upsertEdge(model, source.id, 'out.data', target.id, 'in.node');

    expect(next.edges).toHaveLength(1);
    expect(next.edges[0].kind).toBe('data');
  });

  it('uses source port kind as edge kind', () => {
    const source = createNodeGraphNode('if-else', { x: 80, y: 80 }, 'if-else');
    const target = createNodeGraphNode('while', { x: 360, y: 80 }, 'target');
    let model = createModel(source, target);

    model = upsertEdge(model, source.id, 'out.true', target.id, 'in.prev');

    expect(model.edges).toHaveLength(1);
    expect(model.edges[0].kind).toBe('control');
  });

  it('normalizes legacy if-else ports into current control defaults', () => {
    const normalized = normalizeNodeGraphModel({
      version: '1',
      nodes: [
        {
          id: 'node-1',
          type: 'if-else',
          position: { x: 20, y: 30 },
          ports: [
            {
              id: 'out.true',
              role: 'out',
              side: 'right',
              slotOrder: 0,
              kind: 'condition',
              shape: 'diamond',
              multiplicity: 'single',
            },
          ],
        },
        {
          id: 'node-2',
          type: 'while',
          position: { x: 320, y: 30 },
          ports: [
            {
              id: 'in.prev',
              role: 'in',
              side: 'left',
              slotOrder: 0,
              kind: 'condition',
              multiplicity: 'single',
            },
          ],
        },
      ],
      edges: [
        {
          id: 'edge-1',
          sourceNodeId: 'node-1',
          sourcePortId: 'out.true',
          targetNodeId: 'node-2',
          targetPortId: 'in.prev',
        },
      ],
    });

    expect(normalized.nodes[0].ports?.[0].kind).toBe('control');
    expect(normalized.nodes[0].ports?.[0].multiplicity).toBe('multi');
    expect(normalized.nodes[0].ports?.[0].shape).toBe('circle');
    expect(normalized.edges[0].kind).toBe('control');
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
