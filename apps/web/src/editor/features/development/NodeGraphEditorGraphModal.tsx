import { useTranslation } from 'react-i18next';
import type { NodeGraphEditorController } from './NodeGraphEditor.controller';

type NodeGraphEditorGraphModalProps = {
  modal: NodeGraphEditorController['modal'];
};

export const NodeGraphEditorGraphModal = ({
  modal,
}: NodeGraphEditorGraphModalProps) => {
  const { t } = useTranslation('editor');
  if (!modal.isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(0,0,0,0.28)]"
      data-testid="nodegraph-graph-modal"
    >
      <div className="w-[520px] max-w-[92vw] rounded-[16px] border border-black/10 bg-[var(--color-0)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.24)] dark:border-white/14">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[14px] font-semibold text-(--color-10)">
            {t('nodeGraph.manager.openTitle', {
              defaultValue: 'Open Node Graph',
            })}
          </div>
          <button
            type="button"
            className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
            onClick={modal.onClose}
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
        <div className="grid max-h-[52vh] gap-2 overflow-auto">
          {modal.graphs.map((graph, index) => (
            <div
              key={graph.id}
              className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2"
            >
              <div>
                <div className="text-[12px] font-semibold text-(--color-9)">
                  {graph.name}
                </div>
                <div className="text-[11px] text-(--color-6)">{graph.id}</div>
              </div>
              <button
                type="button"
                className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                data-testid={`nodegraph-open-graph-${index}`}
                onClick={() => modal.onOpenGraph(graph.id)}
              >
                {t('nodeGraph.manager.openAction', {
                  defaultValue: 'Open',
                })}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
