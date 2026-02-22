import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Edge, Node } from '@xyflow/react';
import type { GraphNodeData } from './GraphNode';
import {
  createGraphId,
  createNodeId,
  createStarterGraph,
  type GraphDocument,
} from './nodeGraphEditorModel';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type UseNodeGraphGraphActionsParams = {
  activeGraphId: string;
  graphDocs: GraphDocument[];
  keepAtLeastOneGraphHint: string;
  localizeNodeLabel: (node: Node<GraphNodeData>) => Node<GraphNodeData>;
  setActiveGraphId: Dispatch<SetStateAction<string>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setGraphDocs: Dispatch<SetStateAction<GraphDocument[]>>;
  setHint: Dispatch<SetStateAction<string | null>>;
  setNodes: Dispatch<SetStateAction<Node<GraphNodeData>[]>>;
  t: TranslateFn;
};

export const useNodeGraphGraphActions = ({
  activeGraphId,
  graphDocs,
  keepAtLeastOneGraphHint,
  localizeNodeLabel,
  setActiveGraphId,
  setEdges,
  setGraphDocs,
  setHint,
  setNodes,
  t,
}: UseNodeGraphGraphActionsParams) => {
  const activeGraphName = useMemo(
    () => graphDocs.find((graph) => graph.id === activeGraphId)?.name ?? '',
    [activeGraphId, graphDocs]
  );

  const switchGraph = useCallback(
    (nextGraphId: string) => {
      const nextGraph = graphDocs.find((graph) => graph.id === nextGraphId);
      if (!nextGraph) return;
      setActiveGraphId(nextGraph.id);
      setNodes(nextGraph.nodes);
      setEdges(nextGraph.edges);
    },
    [graphDocs, setActiveGraphId, setEdges, setNodes]
  );

  const createGraph = useCallback(() => {
    const existingNames = new Set(graphDocs.map((graph) => graph.name));
    let index = graphDocs.length + 1;
    let nextName = t('nodeGraph.graph.flowName', {
      index,
      defaultValue: 'Flow {{index}}',
    });
    while (existingNames.has(nextName)) {
      index += 1;
      nextName = t('nodeGraph.graph.flowName', {
        index,
        defaultValue: 'Flow {{index}}',
      });
    }
    const starterGraph = createStarterGraph(nextName);
    const nextGraph: GraphDocument = {
      ...starterGraph,
      nodes: starterGraph.nodes.map(localizeNodeLabel),
    };
    setGraphDocs((current) => [...current, nextGraph]);
    setActiveGraphId(nextGraph.id);
    setNodes(nextGraph.nodes);
    setEdges(nextGraph.edges);
  }, [
    graphDocs,
    localizeNodeLabel,
    setActiveGraphId,
    setEdges,
    setGraphDocs,
    setNodes,
    t,
  ]);

  const duplicateGraph = useCallback(() => {
    const source = graphDocs.find((graph) => graph.id === activeGraphId);
    if (!source) return;
    const nodeIdMap = new Map<string, string>();
    const clonedNodes = source.nodes.map((node) => {
      const nextId = createNodeId();
      nodeIdMap.set(node.id, nextId);
      return { ...node, id: nextId };
    });
    const clonedEdges = source.edges.map((edge) => ({
      ...edge,
      id: `e-${createNodeId()}`,
      source: nodeIdMap.get(edge.source) ?? edge.source,
      target: nodeIdMap.get(edge.target) ?? edge.target,
    }));
    const duplicated: GraphDocument = {
      id: createGraphId(),
      name: `${source.name} ${t('nodeGraph.graph.copySuffix', {
        defaultValue: 'Copy',
      })}`,
      nodes: clonedNodes,
      edges: clonedEdges,
    };
    setGraphDocs((current) => [...current, duplicated]);
    setActiveGraphId(duplicated.id);
    setNodes(duplicated.nodes);
    setEdges(duplicated.edges);
  }, [
    activeGraphId,
    graphDocs,
    setActiveGraphId,
    setEdges,
    setGraphDocs,
    setNodes,
    t,
  ]);

  const deleteGraph = useCallback(() => {
    if (graphDocs.length <= 1) {
      setHint(keepAtLeastOneGraphHint);
      return;
    }
    const currentIndex = graphDocs.findIndex(
      (graph) => graph.id === activeGraphId
    );
    if (currentIndex < 0) return;
    const nextGraphs = graphDocs.filter((graph) => graph.id !== activeGraphId);
    const nextActive =
      nextGraphs[currentIndex] ?? nextGraphs[Math.max(0, currentIndex - 1)];
    setGraphDocs(nextGraphs);
    setActiveGraphId(nextActive.id);
    setNodes(nextActive.nodes);
    setEdges(nextActive.edges);
  }, [
    activeGraphId,
    graphDocs,
    keepAtLeastOneGraphHint,
    setActiveGraphId,
    setEdges,
    setGraphDocs,
    setHint,
    setNodes,
  ]);

  const renameActiveGraph = useCallback(
    (name: string) => {
      setGraphDocs((current) =>
        current.map((graph) =>
          graph.id === activeGraphId
            ? {
                ...graph,
                name:
                  name.trimStart().slice(0, 40) ||
                  t('nodeGraph.graph.untitled', {
                    defaultValue: 'Untitled',
                  }),
              }
            : graph
        )
      );
    },
    [activeGraphId, setGraphDocs, t]
  );

  return {
    activeGraphName,
    createGraph,
    deleteGraph,
    duplicateGraph,
    renameActiveGraph,
    switchGraph,
  };
};
