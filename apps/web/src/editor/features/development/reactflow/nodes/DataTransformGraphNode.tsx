import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import {
  buildNodeContainerClass,
  NODE_TEXT_INPUT_CLASS,
  NodeHeader,
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
    semantic?: 'control' | 'data' | 'condition';
  }
) => {
  const semantic = options.semantic ?? 'data';
  return (
    <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-slate-700">
      {options.inHandle
        ? renderTarget(
            id,
            options.inHandle,
            semantic,
            resolveMultiplicity('target', semantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
      <span>{label}</span>
      {options.outHandle
        ? renderSource(
            id,
            options.outHandle,
            semantic,
            resolveMultiplicity('source', semantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
    </div>
  );
};

export const renderDataTransformGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  const kind = nodeData.kind;
  const isCompare = kind === 'compare';
  const isMath = kind === 'math';
  const isTemplate = kind === 'templateString';
  const isMap = kind === 'map';
  const isFilter = kind === 'filter';
  const isReduce = kind === 'reduce';
  const isJsonParse = kind === 'jsonParse';
  const isJsonStringify = kind === 'jsonStringify';

  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[230px]')}>
      <NodeHeader
        title={nodeData.label}
        leftSlot={
          kind === 'filter'
            ? renderTarget(
                id,
                'in.condition.value',
                'condition',
                resolveMultiplicity('target', 'condition'),
                undefined,
                nodeData.onPortContextMenu
              )
            : undefined
        }
      />
      <div className="pb-2">
        {(isCompare || isMath) && (
          <div className="px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.operator || (isCompare ? '===' : '+')}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'operator', value)
              }
              options={
                isCompare
                  ? [
                      { value: '===', label: '===' },
                      { value: '!==', label: '!==' },
                      { value: '>', label: '>' },
                      { value: '>=', label: '>=' },
                      { value: '<', label: '<' },
                      { value: '<=', label: '<=' },
                    ]
                  : [
                      { value: '+', label: '+' },
                      { value: '-', label: '-' },
                      { value: '*', label: '*' },
                      { value: '/', label: '/' },
                      { value: '%', label: '%' },
                    ]
              }
            />
          </div>
        )}

        {(isTemplate || isMap || isFilter || isReduce) && (
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.expression ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'expression', event.target.value)
              }
              placeholder={
                isTemplate
                  ? tNode(
                      t,
                      'dataTransform.template.placeholder',
                      'Hello ${name}'
                    )
                  : isMap
                    ? tNode(
                        t,
                        'dataTransform.map.placeholder',
                        '(item) => item * 2'
                      )
                    : isFilter
                      ? tNode(
                          t,
                          'dataTransform.filter.placeholder',
                          '(item) => item.done'
                        )
                      : tNode(
                          t,
                          'dataTransform.reduce.placeholder',
                          '(acc, item) => acc + item'
                        )
              }
              spellCheck={false}
            />
          </div>
        )}

        {isJsonParse || isJsonStringify
          ? row(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
              inHandle: 'in.data.value',
              outHandle: 'out.data.value',
              semantic: 'data',
            })
          : null}

        {!isJsonParse && !isJsonStringify
          ? row(id, nodeData, tNode(t, 'common.rows.input', 'input'), {
              inHandle: 'in.data.value',
              outHandle: isCompare ? undefined : 'out.data.value',
              semantic: 'data',
            })
          : null}

        {isCompare || isFilter
          ? row(id, nodeData, tNode(t, 'common.rows.condition', 'condition'), {
              outHandle: 'out.condition.result',
              semantic: 'condition',
            })
          : null}
      </div>
    </div>
  );
};
