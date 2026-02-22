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
import type { NodeI18n } from './nodeI18n';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

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
  t,
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
              placeholder={tNode(
                t,
                'systemEnvironment.envVar.keyPlaceholder',
                'ENV_KEY'
              )}
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
              placeholder={tNode(
                t,
                'systemEnvironment.envVar.fallbackPlaceholder',
                'fallback'
              )}
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.parse ?? 'string'}
              onChange={(value) => nodeData.onChangeField?.(id, 'parse', value)}
              options={[
                {
                  value: 'string',
                  label: tNode(
                    t,
                    'systemEnvironment.envVar.parse.string',
                    'string'
                  ),
                },
                {
                  value: 'number',
                  label: tNode(
                    t,
                    'systemEnvironment.envVar.parse.number',
                    'number'
                  ),
                },
                {
                  value: 'boolean',
                  label: tNode(
                    t,
                    'systemEnvironment.envVar.parse.boolean',
                    'boolean'
                  ),
                },
                {
                  value: 'json',
                  label: tNode(
                    t,
                    'systemEnvironment.envVar.parse.json',
                    'json'
                  ),
                },
              ]}
            />
          </div>
          {row(
            id,
            nodeData,
            tNode(t, 'systemEnvironment.rows.keyInput', 'key input'),
            {
              inHandle: 'in.data.key',
              inSemantic: 'data',
            }
          )}
          {row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
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
                {
                  value: 'set',
                  label: tNode(t, 'systemEnvironment.theme.actions.set', 'set'),
                },
                {
                  value: 'toggle',
                  label: tNode(
                    t,
                    'systemEnvironment.theme.actions.toggle',
                    'toggle'
                  ),
                },
                {
                  value: 'system',
                  label: tNode(
                    t,
                    'systemEnvironment.theme.actions.system',
                    'system'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.theme ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'theme', event.target.value)
              }
              placeholder={tNode(
                t,
                'systemEnvironment.theme.themePlaceholder',
                'theme'
              )}
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.persist ?? 'true'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'persist', value)
              }
              options={[
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'systemEnvironment.theme.persist.true',
                    'persist'
                  ),
                },
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'systemEnvironment.theme.persist.false',
                    'session'
                  ),
                },
              ]}
            />
          </div>
          {row(
            id,
            nodeData,
            tNode(t, 'systemEnvironment.rows.themeIn', 'theme in'),
            {
              inHandle: 'in.data.theme',
              inSemantic: 'data',
            }
          )}
          {row(id, nodeData, tNode(t, 'common.rows.done', 'done'), {
            outHandle: 'out.control.done',
          })}
          {row(
            id,
            nodeData,
            tNode(t, 'systemEnvironment.rows.themeOut', 'theme out'),
            {
              outHandle: 'out.data.theme',
              outSemantic: 'data',
            }
          )}
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
              placeholder={tNode(
                t,
                'systemEnvironment.i18n.localePlaceholder',
                'locale'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.namespace ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'namespace', event.target.value)
              }
              placeholder={tNode(
                t,
                'systemEnvironment.i18n.namespacePlaceholder',
                'namespace'
              )}
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
              placeholder={tNode(
                t,
                'systemEnvironment.i18n.fallbackPlaceholder',
                'fallback'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.key', 'key'), {
            inHandle: 'in.data.key',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.params', 'params'), {
            inHandle: 'in.data.params',
            inSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.missing', 'missing'), {
            outHandle: 'out.control.missing',
          })}
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
              placeholder={tNode(
                t,
                'systemEnvironment.mediaQuery.mobileMaxPlaceholder',
                'mobile max'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.tabletMax ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'tabletMax', event.target.value)
              }
              placeholder={tNode(
                t,
                'systemEnvironment.mediaQuery.tabletMaxPlaceholder',
                'tablet max'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.debounceMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'debounceMs', event.target.value)
              }
              placeholder={tNode(
                t,
                'systemEnvironment.mediaQuery.debouncePlaceholder',
                'debounce'
              )}
              spellCheck={false}
            />
          </div>
          {row(id, nodeData, tNode(t, 'common.rows.changed', 'changed'), {
            outHandle: 'out.control.changed',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.current', 'current'), {
            outHandle: 'out.data.current',
            outSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.isMobile', 'isMobile'), {
            outHandle: 'out.data.isMobile',
            outSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.isTablet', 'isTablet'), {
            outHandle: 'out.data.isTablet',
            outSemantic: 'data',
          })}
          {row(id, nodeData, tNode(t, 'common.rows.isDesktop', 'isDesktop'), {
            outHandle: 'out.data.isDesktop',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  return null;
};
