import type { GraphDocument } from './nodeGraphEditorModel';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type NodeGraphGraphManagerProps = {
  activeGraphId: string;
  activeGraphName: string;
  graphDocs: GraphDocument[];
  onCreateGraph: () => void;
  onDeleteGraph: () => void;
  onDuplicateGraph: () => void;
  onRenameGraph: (value: string) => void;
  onSwitchGraph: (graphId: string) => void;
  t: TranslateFn;
};

export const NodeGraphGraphManager = ({
  activeGraphId,
  activeGraphName,
  graphDocs,
  onCreateGraph,
  onDeleteGraph,
  onDuplicateGraph,
  onRenameGraph,
  onSwitchGraph,
  t,
}: NodeGraphGraphManagerProps) => (
  <div
    className="nodegraph-graph-manager nodrag nopan"
    onClick={(event) => event.stopPropagation()}
  >
    <div className="nodegraph-graph-manager__title">
      {t('nodeGraph.manager.title', { defaultValue: 'Node Graphs' })}
    </div>
    <select
      className="nodegraph-graph-manager__select"
      value={activeGraphId}
      onChange={(event) => onSwitchGraph(event.target.value)}
    >
      {graphDocs.map((graph) => (
        <option key={graph.id} value={graph.id}>
          {graph.name}
        </option>
      ))}
    </select>
    <input
      className="nodegraph-graph-manager__name"
      value={activeGraphName}
      onChange={(event) => onRenameGraph(event.target.value)}
      placeholder={t('nodeGraph.manager.namePlaceholder', {
        defaultValue: 'Graph name',
      })}
      spellCheck={false}
    />
    <div className="nodegraph-graph-manager__actions">
      <button type="button" onClick={onCreateGraph}>
        {t('nodeGraph.manager.new', { defaultValue: 'New' })}
      </button>
      <button type="button" onClick={onDuplicateGraph}>
        {t('nodeGraph.manager.clone', { defaultValue: 'Clone' })}
      </button>
      <button type="button" onClick={onDeleteGraph}>
        {t('nodeGraph.manager.delete', { defaultValue: 'Delete' })}
      </button>
    </div>
  </div>
);
