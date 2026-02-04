import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { MdrInput } from '@mdr/ui';
import type { ComponentNode } from '@/core/types/engine.types';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { INSPECTOR_PANELS } from './inspector/panels/registry';

type BlueprintEditorInspectorProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

const findNodeById = (
  node: ComponentNode,
  nodeId: string
): ComponentNode | null => {
  if (node.id === nodeId) return node;
  const children = node.children ?? [];
  for (const child of children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
};

const collectIds = (
  node: ComponentNode,
  ids: Set<string> = new Set()
): Set<string> => {
  ids.add(node.id);
  node.children?.forEach((child) => collectIds(child, ids));
  return ids;
};

const renameNodeId = (
  node: ComponentNode,
  fromId: string,
  toId: string
): ComponentNode => {
  if (node.id === fromId) {
    return { ...node, id: toId };
  }
  if (!node.children?.length) return node;
  const nextChildren = node.children.map((child) =>
    renameNodeId(child, fromId, toId)
  );
  return { ...node, children: nextChildren };
};

const updateNodeById = (
  node: ComponentNode,
  targetId: string,
  updater: (node: ComponentNode) => ComponentNode
): { node: ComponentNode; updated: boolean } => {
  if (node.id === targetId) {
    return { node: updater(node), updated: true };
  }
  if (!node.children?.length) return { node, updated: false };
  let updated = false;
  const nextChildren = node.children.map((child) => {
    const result = updateNodeById(child, targetId, updater);
    if (result.updated) updated = true;
    return result.node;
  });
  return updated
    ? { node: { ...node, children: nextChildren }, updated: true }
    : { node, updated: false };
};

export function BlueprintEditorInspector({
  isCollapsed,
  onToggleCollapse,
}: BlueprintEditorInspectorProps) {
  const { t } = useTranslation('blueprint');
  const { projectId } = useParams();
  const blueprintKey = projectId ?? 'global';
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const updateMirDoc = useEditorStore((state) => state.updateMirDoc);
  const setBlueprintState = useEditorStore((state) => state.setBlueprintState);
  const selectedId = useEditorStore(
    (state) => state.blueprintStateByProject[blueprintKey]?.selectedId
  );
  const selectedNode = useMemo(
    () => (selectedId ? findNodeById(mirDoc.ui.root, selectedId) : null),
    [mirDoc.ui.root, selectedId]
  );
  const [draftId, setDraftId] = useState('');
  const allIds = useMemo(() => collectIds(mirDoc.ui.root), [mirDoc.ui.root]);

  useEffect(() => {
    setDraftId(selectedNode?.id ?? '');
  }, [selectedNode?.id]);

  const trimmedDraftId = draftId.trim();
  const isDuplicate =
    Boolean(trimmedDraftId) &&
    Boolean(selectedNode?.id) &&
    trimmedDraftId !== selectedNode?.id &&
    allIds.has(trimmedDraftId);
  const isDirty =
    Boolean(selectedNode?.id) && trimmedDraftId !== selectedNode?.id;
  const canApply =
    Boolean(selectedNode?.id) &&
    Boolean(trimmedDraftId) &&
    isDirty &&
    !isDuplicate;

  const updateSelectedNode = (
    updater: (node: ComponentNode) => ComponentNode
  ) => {
    if (!selectedNode?.id) return;
    updateMirDoc((doc) => {
      const result = updateNodeById(doc.ui.root, selectedNode.id, updater);
      return result.updated
        ? { ...doc, ui: { ...doc.ui, root: result.node } }
        : doc;
    });
  };

  const applyRename = () => {
    if (!selectedNode?.id || !canApply) return;
    const nextId = trimmedDraftId;
    updateMirDoc((doc) => ({
      ...doc,
      ui: {
        ...doc.ui,
        root: renameNodeId(doc.ui.root, selectedNode.id, nextId),
      },
    }));
    setBlueprintState(blueprintKey, { selectedId: nextId });
  };

  return (
    <aside
      className={`BlueprintEditorInspector ${isCollapsed ? 'Collapsed' : ''}`}
    >
      <div className="InspectorHeader">
        <span>{t('inspector.title')}</span>
        <button
          className="BlueprintEditorCollapse"
          onClick={onToggleCollapse}
          aria-label={t('inspector.toggle')}
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {!isCollapsed && (
        <>
          {selectedNode ? (
            <div className="InspectorSection">
              <div className="InspectorField">
                <div className="InspectorFieldHeader">
                  <span className="InspectorLabel">
                    {t('inspector.fields.id.label', {
                      defaultValue: 'Component ID',
                    })}
                  </span>
                  <span className="InspectorDescription">
                    {t('inspector.fields.id.description', {
                      defaultValue: 'Unique within the blueprint.',
                    })}
                  </span>
                </div>
                <div className="InspectorInputRow">
                  <MdrInput
                    size="Small"
                    value={draftId}
                    dataAttributes={{ 'data-testid': 'inspector-id-input' }}
                    onChange={(value) => setDraftId(value)}
                    onBlur={applyRename}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyRename();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setDraftId(selectedNode.id);
                      }
                    }}
                  />
                  {isDirty && (
                    <div className="InspectorFieldActions">
                      <button
                        type="button"
                        className="InspectorFieldAction"
                        onClick={applyRename}
                        disabled={!canApply}
                        aria-label={t('inspector.actions.apply', {
                          defaultValue: 'Apply',
                        })}
                        title={t('inspector.actions.apply', {
                          defaultValue: 'Apply',
                        })}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {isDuplicate && (
                  <div className="InspectorWarning" role="alert">
                    <AlertTriangle size={12} />
                    <span>
                      {t('inspector.fields.id.duplicate', {
                        defaultValue: 'ID already exists.',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {INSPECTOR_PANELS.filter((panel) =>
                panel.match(selectedNode)
              ).map((panel) => (
                <div key={panel.key}>
                  {panel.render({
                    node: selectedNode,
                    updateNode: updateSelectedNode,
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="InspectorPlaceholder">
              <p>{t('inspector.placeholder')}</p>
              <div className="InspectorSkeleton">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
