import CodeMirror from '@uiw/react-codemirror';
import { autocompletion, completeFromList } from '@codemirror/autocomplete';
import {
  CODE_LANGUAGE_KEYWORDS,
  formatCountLabel,
  renderSource,
  renderTarget,
  resolveCodeLanguageExtension,
  resolveMultiplicity,
  type GraphNodeData,
} from '../graphNodeShared';
import {
  buildNodeContainerClass,
  CollapseSummary,
  NodeHeader,
  SelectField,
} from './nodePrimitives';

type Props = { id: string; nodeData: GraphNodeData; selected: boolean };

export const renderCodeGraphNode = ({ id, nodeData, selected }: Props) => {
  const isCollapsed = Boolean(nodeData.collapsed);
  const codeSize = nodeData.codeSize ?? 'md';
  const codeLanguage = nodeData.codeLanguage ?? 'tsx';
  const widthClass =
    codeSize === 'lg'
      ? 'min-w-[560px]'
      : codeSize === 'sm'
        ? 'min-w-[320px]'
        : 'min-w-[440px]';
  const lineCount = (nodeData.code ?? '').split('\n').length;
  const languageExtension = resolveCodeLanguageExtension(codeLanguage);
  const completionExtension = autocompletion({
    override: [completeFromList(CODE_LANGUAGE_KEYWORDS[codeLanguage])],
  });
  return (
    <div className={buildNodeContainerClass(selected, widthClass)}>
      <NodeHeader
        title={nodeData.label}
        collapsed={isCollapsed}
        onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
        collapseAriaLabel={isCollapsed ? 'expand code' : 'collapse code'}
        leftSlot={renderTarget(
          id,
          'in.control.prev',
          'control',
          resolveMultiplicity('target', 'control'),
          undefined,
          nodeData.onPortContextMenu
        )}
        summary={
          isCollapsed ? (
            <CollapseSummary
              text={formatCountLabel(lineCount, 'line', 'lines')}
            />
          ) : null
        }
        actions={
          <div className="flex items-center gap-1">
            <SelectField
              value={codeLanguage}
              onChange={(value) =>
                nodeData.onChangeCodeLanguage?.(
                  id,
                  value as NonNullable<GraphNodeData['codeLanguage']>
                )
              }
              options={[
                { value: 'jsx', label: 'jsx' },
                { value: 'tsx', label: 'tsx' },
                { value: 'js', label: 'js' },
                { value: 'ts', label: 'ts' },
                { value: 'glsl', label: 'glsl' },
                { value: 'wgsl', label: 'wgsl' },
              ]}
              className="h-6 px-1.5 text-[10px]"
            />
            <SelectField
              value={codeSize}
              onChange={(value) =>
                nodeData.onChangeCodeSize?.(
                  id,
                  value as NonNullable<GraphNodeData['codeSize']>
                )
              }
              options={[
                { value: 'sm', label: 'S' },
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
              ]}
              className="h-6 px-1.5 text-[10px]"
            />
          </div>
        }
      />
      {isCollapsed ? (
        <div className="px-4 pb-2" />
      ) : (
        <div className="relative px-3.5 pb-3">
          <CodeMirror
            value={nodeData.code ?? ''}
            onChange={(value) => nodeData.onChangeCode?.(id, value)}
            extensions={[languageExtension, completionExtension]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: false,
              autocompletion: true,
            }}
            className="nodrag nopan native-code-node__editor"
          />
        </div>
      )}
      {renderSource(
        id,
        'out.control.next',
        'control',
        resolveMultiplicity('source', 'control'),
        isCollapsed ? '65%' : undefined,
        nodeData.onPortContextMenu
      )}
    </div>
  );
};
