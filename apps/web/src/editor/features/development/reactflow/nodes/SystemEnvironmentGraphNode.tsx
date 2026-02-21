import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  buildNodeContainerClass,
  NODE_TEXT_INPUT_CLASS,
  NodeHeader,
  NodeValidationHint,
  SelectField,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

const row = (
  id: string,
  nodeData: GraphNodeData,
  label: string,
  options: {
    inHandle?: string;
    outHandle?: string;
    inSemantic?: 'control' | 'data' | 'condition';
    outSemantic?: 'control' | 'data' | 'condition';
  }
) => (
  <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
    {options.inHandle
      ? renderTarget(
          id,
          options.inHandle,
          options.inSemantic ?? 'control',
          resolveMultiplicity('target', options.inSemantic ?? 'control'),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
    <span>{label}</span>
    {options.outHandle
      ? renderSource(
          id,
          options.outHandle,
          options.outSemantic ?? 'control',
          resolveMultiplicity('source', options.outSemantic ?? 'control'),
          undefined,
          nodeData.onPortContextMenu
        )
      : null}
  </div>
);

export const renderSystemEnvironmentGraphNode = ({
  id,
  nodeData,
  selected,
}: Props) => {
  if (nodeData.kind === 'envVar') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[240px]')}>
        <NodeHeader title={nodeData.label} />
        <div className="pb-1">
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.key ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'key', event.target.value)
              }
              placeholder="ENV_KEY"
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.fallback ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'fallback', event.target.value)
              }
              placeholder="fallback"
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.parse ?? 'string'}
              onChange={(value) => nodeData.onChangeField?.(id, 'parse', value)}
              options={[
                { value: 'string', label: 'string' },
                { value: 'number', label: 'number' },
                { value: 'boolean', label: 'boolean' },
                { value: 'json', label: 'json' },
              ]}
            />
          </div>
          {row(id, nodeData, 'key input', {
            inHandle: 'in.data.key',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'value', {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'theme') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[250px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.action ?? 'set'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'action', value)
              }
              options={[
                { value: 'set', label: 'set' },
                { value: 'toggle', label: 'toggle' },
                { value: 'system', label: 'system' },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.theme ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'theme', event.target.value)
              }
              placeholder="theme"
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.persist ?? 'true'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'persist', value)
              }
              options={[
                { value: 'true', label: 'persist' },
                { value: 'false', label: 'session' },
              ]}
            />
          </div>
          {row(id, nodeData, 'theme in', {
            inHandle: 'in.data.theme',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'done', { outHandle: 'out.control.done' })}
          {row(id, nodeData, 'theme out', {
            outHandle: 'out.data.theme',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'i18n') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[270px]')}>
        <NodeHeader title={nodeData.label} />
        <div className="pb-1">
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.locale ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'locale', event.target.value)
              }
              placeholder="locale"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.namespace ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'namespace', event.target.value)
              }
              placeholder="namespace"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.fallbackLocale ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(
                  id,
                  'fallbackLocale',
                  event.target.value
                )
              }
              placeholder="fallback"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'key', {
            inHandle: 'in.data.key',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'params', {
            inHandle: 'in.data.params',
            inSemantic: 'data',
          })}
          {row(id, nodeData, 'value', {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'missing', { outHandle: 'out.control.missing' })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'mediaQuery') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[250px]')}>
        <NodeHeader title={nodeData.label} />
        <div className="pb-1">
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.mobileMax ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'mobileMax', event.target.value)
              }
              placeholder="mobile max"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.tabletMax ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'tabletMax', event.target.value)
              }
              placeholder="tablet max"
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.debounceMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'debounceMs', event.target.value)
              }
              placeholder="debounce"
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, 'changed', { outHandle: 'out.control.changed' })}
          {row(id, nodeData, 'current', {
            outHandle: 'out.data.current',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'isMobile', {
            outHandle: 'out.data.isMobile',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'isTablet', {
            outHandle: 'out.data.isTablet',
            outSemantic: 'data',
          })}
          {row(id, nodeData, 'isDesktop', {
            outHandle: 'out.data.isDesktop',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  return null;
};
