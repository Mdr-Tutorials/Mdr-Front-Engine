import { useTranslation } from 'react-i18next';
import type { NodeGraphEditorController } from './NodeGraphEditor.controller';

type NodeGraphEditorFloatingIslandsProps = {
  manager: NodeGraphEditorController['manager'];
  viewport: NodeGraphEditorController['viewport'];
};

export const NodeGraphEditorFloatingIslands = ({
  manager,
  viewport,
}: NodeGraphEditorFloatingIslandsProps) => {
  const { t } = useTranslation('editor');

  return (
    <>
      {manager.isCollapsed ? (
        <button
          type="button"
          className="pointer-events-auto absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-[rgba(255,255,255,0.9)] text-[11px] font-semibold text-(--color-8) shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]"
          onDoubleClick={() => manager.setCollapsed(false)}
          title="Node Graph"
        >
          NG
        </button>
      ) : (
        <div className="pointer-events-auto absolute bottom-4 left-4 w-[280px] rounded-[14px] border border-black/10 bg-[rgba(255,255,255,0.9)] px-3 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]">
          <div
            className="text-[13px] font-semibold text-(--color-10)"
            onDoubleClick={() => manager.setCollapsed(true)}
            title={t('common.collapse', { defaultValue: 'Collapse' })}
          >
            {t('projectHome.actions.nodegraph.label', {
              defaultValue: 'Node Graph',
            })}
          </div>
          <div className="text-[11px] text-(--color-6)">
            {manager.projectId}
          </div>
          <div className="mt-2 rounded-md border border-black/10 bg-[rgba(0,0,0,0.02)] px-2 py-1 text-[11px] text-(--color-8)">
            {t('nodeGraph.manager.current', { defaultValue: 'Current:' })}{' '}
            <span data-testid="nodegraph-active-graph-name">
              {manager.activeGraph?.name ?? '-'}
            </span>
          </div>
          <div className="mt-2 grid gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                onClick={manager.onOpenModal}
                data-testid="nodegraph-open-modal-button"
              >
                {t('nodeGraph.manager.open', { defaultValue: 'Open' })}
              </button>
              <button
                type="button"
                className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                onClick={manager.onDeleteGraph}
                disabled={manager.workspace.graphs.length <= 1}
              >
                {t('nodeGraph.manager.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
            <input
              className="h-7 rounded-md border border-black/10 bg-transparent px-2 text-[12px]"
              value={manager.graphNameDraft}
              onChange={(event) =>
                manager.setGraphNameDraft(event.target.value)
              }
              placeholder={t('nodeGraph.manager.name', {
                defaultValue: 'Graph name',
              })}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                onClick={manager.onCreateGraph}
              >
                {t('nodeGraph.manager.create', { defaultValue: 'Create' })}
              </button>
              <button
                type="button"
                className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
                onClick={manager.onRenameGraph}
              >
                {t('nodeGraph.manager.rename', { defaultValue: 'Rename' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewport.isCollapsed ? (
        <button
          type="button"
          className="pointer-events-auto absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-[rgba(255,255,255,0.9)] text-[11px] font-semibold text-(--color-8) shadow-[0_8px_18px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]"
          onDoubleClick={() => viewport.setCollapsed(false)}
          title="Viewport"
        >
          VP
        </button>
      ) : (
        <div className="pointer-events-auto absolute right-4 top-4 flex items-center gap-2 rounded-[14px] border border-black/10 bg-[rgba(255,255,255,0.9)] px-3 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/14 dark:bg-[rgba(20,20,20,0.82)]">
          <div
            className="text-[11px] font-semibold text-(--color-8)"
            onDoubleClick={() => viewport.setCollapsed(true)}
            title={t('common.collapse', { defaultValue: 'Collapse' })}
          >
            View
          </div>
          <button
            type="button"
            className="h-7 w-7 rounded-md border border-black/12 text-[12px]"
            onClick={viewport.onZoomOut}
          >
            -
          </button>
          <span className="min-w-[56px] text-center text-[12px] text-(--color-8)">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            type="button"
            className="h-7 w-7 rounded-md border border-black/12 text-[12px]"
            onClick={viewport.onZoomIn}
          >
            +
          </button>
          {viewport.isResetVisible ? (
            <button
              type="button"
              className="h-7 rounded-md border border-black/12 px-2 text-[12px]"
              onClick={viewport.onReset}
            >
              {t('common.reset', { defaultValue: 'Reset' })}
            </button>
          ) : null}
        </div>
      )}
    </>
  );
};
