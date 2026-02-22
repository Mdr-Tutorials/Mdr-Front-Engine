import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { Edge, Node } from '@xyflow/react';
import type { GraphNodeData } from './GraphNode';
import {
  createBindingId,
  createBranchId,
  createFetchStatusId,
  createNodeId,
  createSwitchCaseId,
  resolveNodeValidationMessage,
  sanitizeFieldValue,
  type ContextMenuState,
  type NodeValidationText,
} from './nodeGraphEditorModel';
import {
  estimateStickyNoteSize,
  normalizeBindingEntries,
  normalizeBranches,
  normalizeCases,
  normalizeStatusCodes,
} from './graphNodeShared';

type FlowNodesHintText = {
  keepAtLeastOneBinding: string;
  keepAtLeastOneBranch: string;
  keepAtLeastOneCase: string;
  keepAtLeastOneEntry: string;
  keepAtLeastOneStatus: string;
};

type BuildFlowNodesParams = {
  edges: Edge[];
  groupAutoLayoutById: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  hintText: FlowNodesHintText;
  nodes: Node<GraphNodeData>[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setHint: Dispatch<SetStateAction<string | null>>;
  setMenu: Dispatch<SetStateAction<ContextMenuState>>;
  setNodes: Dispatch<SetStateAction<Node<GraphNodeData>[]>>;
  validationText: NodeValidationText;
};

export const buildFlowNodes = ({
  edges,
  groupAutoLayoutById,
  hintText,
  nodes,
  setEdges,
  setHint,
  setMenu,
  setNodes,
  validationText,
}: BuildFlowNodesParams): Node<GraphNodeData>[] =>
  nodes.map((node) => {
    const isAnnotationNode =
      node.data.kind === 'groupBox' || node.data.kind === 'stickyNote';
    const isMinimalStickyNote =
      node.data.kind === 'stickyNote' &&
      (node.data.color ?? 'minimal') === 'minimal';
    const className = [
      node.className,
      node.data.kind === 'stickyNote' ? 'nodegraph-node-sticky-note' : '',
      isMinimalStickyNote ? 'nodegraph-node-sticky-note-minimal' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return {
      ...node,
      className: className || undefined,
      style: isAnnotationNode
        ? {
            ...(node.style ?? {}),
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            borderRadius: 0,
          }
        : node.style,
      zIndex: node.data.kind === 'groupBox' ? -10 : 10,
      data: {
        ...node.data,
        onPortContextMenu: (
          event: MouseEvent,
          nodeId: string,
          handleId: string,
          role: 'source' | 'target'
        ) => {
          event.preventDefault();
          event.stopPropagation();
          const x = event.clientX;
          const y = event.clientY;
          setMenu({ kind: 'port', x, y, nodeId, handleId, role });
        },
        onAddCase: (nodeId: string) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'switch')
                return item;
              const cases = normalizeCases(item.data.cases);
              return {
                ...item,
                data: {
                  ...item.data,
                  cases: [
                    ...cases,
                    {
                      id: createSwitchCaseId(),
                      label: `case-${cases.length + 1}`,
                    },
                  ],
                },
              };
            })
          );
        },
        onRemoveCase: (nodeId: string, caseId: string) => {
          let blocked = false;
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'switch')
                return item;
              const cases = normalizeCases(item.data.cases);
              if (cases.length <= 1) {
                blocked = true;
                return item;
              }
              return {
                ...item,
                data: {
                  ...item.data,
                  cases: cases.filter((caseItem) => caseItem.id !== caseId),
                },
              };
            })
          );
          if (blocked) {
            setHint(hintText.keepAtLeastOneCase);
            return;
          }
          setEdges((current) =>
            current.filter(
              (edge) =>
                !(
                  (edge.source === nodeId &&
                    edge.sourceHandle === `out.control.case-${caseId}`) ||
                  (edge.target === nodeId &&
                    edge.targetHandle === `in.condition.case-${caseId}`)
                )
            )
          );
        },
        onChangeBranchLabel: (
          nodeId: string,
          branchId: string,
          label: string
        ) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId) return item;
              if (item.data.kind === 'switch') {
                const cases = normalizeCases(item.data.cases);
                return {
                  ...item,
                  data: {
                    ...item.data,
                    cases: cases.map((caseItem) =>
                      caseItem.id === branchId
                        ? { ...caseItem, label }
                        : caseItem
                    ),
                  },
                };
              }
              if (item.data.kind !== 'parallel' && item.data.kind !== 'race')
                return item;
              const branches = normalizeBranches(item.data.branches);
              return {
                ...item,
                data: {
                  ...item.data,
                  branches: branches.map((branch) =>
                    branch.id === branchId ? { ...branch, label } : branch
                  ),
                },
              };
            })
          );
        },
        onAddBranch: (nodeId: string) => {
          setNodes((current) =>
            current.map((item) => {
              if (
                item.id !== nodeId ||
                (item.data.kind !== 'parallel' && item.data.kind !== 'race')
              ) {
                return item;
              }
              const branches = normalizeBranches(item.data.branches);
              return {
                ...item,
                data: {
                  ...item.data,
                  branches: [
                    ...branches,
                    {
                      id: createBranchId(),
                      label: `branch-${branches.length + 1}`,
                    },
                  ],
                },
              };
            })
          );
        },
        onRemoveBranch: (nodeId: string, branchId: string) => {
          let blocked = false;
          setNodes((current) =>
            current.map((item) => {
              if (
                item.id !== nodeId ||
                (item.data.kind !== 'parallel' && item.data.kind !== 'race')
              ) {
                return item;
              }
              const branches = normalizeBranches(item.data.branches);
              if (branches.length <= 1) {
                blocked = true;
                return item;
              }
              return {
                ...item,
                data: {
                  ...item.data,
                  branches: branches.filter((branch) => branch.id !== branchId),
                },
              };
            })
          );
          if (blocked) {
            setHint(hintText.keepAtLeastOneBranch);
            return;
          }
          setEdges((current) =>
            current.filter(
              (edge) =>
                !(
                  edge.source === nodeId &&
                  edge.sourceHandle === `out.control.branch-${branchId}`
                )
            )
          );
        },
        onAddStatusCode: (nodeId: string) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'fetch') return item;
              const statusCodes = normalizeStatusCodes(item.data.statusCodes);
              return {
                ...item,
                data: {
                  ...item.data,
                  statusCodes: [
                    ...statusCodes,
                    { id: createFetchStatusId(), code: '200' },
                  ],
                },
              };
            })
          );
        },
        onRemoveStatusCode: (nodeId: string, statusId: string) => {
          let blocked = false;
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'fetch') return item;
              const statusCodes = normalizeStatusCodes(item.data.statusCodes);
              if (statusCodes.length <= 1) {
                blocked = true;
                return item;
              }
              return {
                ...item,
                data: {
                  ...item.data,
                  statusCodes: statusCodes.filter(
                    (entry) => entry.id !== statusId
                  ),
                },
              };
            })
          );
          if (blocked) {
            setHint(hintText.keepAtLeastOneStatus);
            return;
          }
          setEdges((current) =>
            current.filter(
              (edge) =>
                !(
                  edge.source === nodeId &&
                  edge.sourceHandle === `out.control.status-${statusId}`
                )
            )
          );
        },
        onChangeStatusCode: (
          nodeId: string,
          statusId: string,
          code: string
        ) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'fetch') return item;
              const statusCodes = normalizeStatusCodes(item.data.statusCodes);
              return {
                ...item,
                data: {
                  ...item.data,
                  statusCodes: statusCodes.map((entry) =>
                    entry.id === statusId ? { ...entry, code } : entry
                  ),
                },
              };
            })
          );
        },
        onChangeMethod: (nodeId: string, method: string) => {
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId && item.data.kind === 'fetch'
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      method,
                    },
                  }
                : item
            )
          );
        },
        onChangeField: (nodeId: string, field: string, value: string) => {
          const nextValue = sanitizeFieldValue(field, value);
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      [field]: nextValue,
                    },
                  }
                : item
            )
          );
        },
        onAddKeyValueEntry: (nodeId: string) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId) return item;
              const entries = Array.isArray(item.data.keyValueEntries)
                ? item.data.keyValueEntries
                : [];
              return {
                ...item,
                data: {
                  ...item.data,
                  keyValueEntries: [
                    ...entries,
                    {
                      id: createNodeId(),
                      key: '',
                      value: '',
                    },
                  ],
                },
              };
            })
          );
        },
        onRemoveKeyValueEntry: (nodeId: string, entryId: string) => {
          let blocked = false;
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId) return item;
              const entries = Array.isArray(item.data.keyValueEntries)
                ? item.data.keyValueEntries
                : [];
              const requireMinOne =
                item.data.kind === 'setState' ||
                item.data.kind === 'computed' ||
                item.data.kind === 'renderComponent' ||
                item.data.kind === 'conditionalRender' ||
                item.data.kind === 'listRender';
              if (requireMinOne && entries.length <= 1) {
                blocked = true;
                return item;
              }
              return {
                ...item,
                data: {
                  ...item.data,
                  keyValueEntries: entries.filter(
                    (entry) => entry.id !== entryId
                  ),
                },
              };
            })
          );
          if (blocked) {
            setHint(hintText.keepAtLeastOneEntry);
          }
        },
        onChangeKeyValueEntry: (
          nodeId: string,
          entryId: string,
          field: 'key' | 'value',
          value: string
        ) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId) return item;
              const entries = Array.isArray(item.data.keyValueEntries)
                ? item.data.keyValueEntries
                : [];
              return {
                ...item,
                data: {
                  ...item.data,
                  keyValueEntries: entries.map((entry) =>
                    entry.id === entryId ? { ...entry, [field]: value } : entry
                  ),
                },
              };
            })
          );
        },
        onAddBindingEntry: (
          nodeId: string,
          binding: 'inputBindings' | 'outputBindings'
        ) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'subFlowCall')
                return item;
              const entries = normalizeBindingEntries(item.data[binding]);
              return {
                ...item,
                data: {
                  ...item.data,
                  [binding]: [
                    ...entries,
                    {
                      id: createBindingId(),
                      key: '',
                      value: '',
                    },
                  ],
                },
              };
            })
          );
        },
        onRemoveBindingEntry: (
          nodeId: string,
          binding: 'inputBindings' | 'outputBindings',
          entryId: string
        ) => {
          let blocked = false;
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'subFlowCall')
                return item;
              const entries = normalizeBindingEntries(item.data[binding]);
              if (entries.length <= 1) {
                blocked = true;
                return item;
              }
              return {
                ...item,
                data: {
                  ...item.data,
                  [binding]: entries.filter((entry) => entry.id !== entryId),
                },
              };
            })
          );
          if (blocked) {
            setHint(hintText.keepAtLeastOneBinding);
          }
        },
        onChangeBindingEntry: (
          nodeId: string,
          binding: 'inputBindings' | 'outputBindings',
          entryId: string,
          field: 'key' | 'value',
          value: string
        ) => {
          setNodes((current) =>
            current.map((item) => {
              if (item.id !== nodeId || item.data.kind !== 'subFlowCall')
                return item;
              const entries = normalizeBindingEntries(item.data[binding]);
              return {
                ...item,
                data: {
                  ...item.data,
                  [binding]: entries.map((entry) =>
                    entry.id === entryId ? { ...entry, [field]: value } : entry
                  ),
                },
              };
            })
          );
        },
        onToggleCollapse: (nodeId: string) => {
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      collapsed: !item.data.collapsed,
                    },
                  }
                : item
            )
          );
        },
        onChangeValue: (nodeId: string, value: string) => {
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId &&
              (item.data.kind === 'string' ||
                item.data.kind === 'number' ||
                item.data.kind === 'boolean' ||
                item.data.kind === 'object' ||
                item.data.kind === 'array' ||
                item.data.kind === 'fetch')
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      value,
                    },
                  }
                : item
            )
          );
        },
        onChangeExpression: (nodeId: string, expression: string) => {
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId && item.data.kind === 'expression'
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      expression,
                    },
                  }
                : item
            )
          );
        },
        onChangeCode: (nodeId: string, code: string) => {
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId && item.data.kind === 'code'
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      code,
                    },
                  }
                : item
            )
          );
        },
        onChangeCodeLanguage: (
          nodeId: string,
          language: NonNullable<GraphNodeData['codeLanguage']>
        ) => {
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId && item.data.kind === 'code'
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      codeLanguage: language,
                    },
                  }
                : item
            )
          );
        },
        onChangeCodeSize: (
          nodeId: string,
          size: NonNullable<GraphNodeData['codeSize']>
        ) => {
          setNodes((current) =>
            current.map((item) =>
              item.id === nodeId && item.data.kind === 'code'
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      codeSize: size,
                    },
                  }
                : item
            )
          );
        },
        autoBoxWidth:
          node.data.kind === 'groupBox'
            ? groupAutoLayoutById.get(node.id)?.width
            : undefined,
        autoBoxHeight:
          node.data.kind === 'groupBox'
            ? groupAutoLayoutById.get(node.id)?.height
            : undefined,
        autoNoteWidth:
          node.data.kind === 'stickyNote'
            ? estimateStickyNoteSize(
                node.data.description ?? node.data.value ?? ''
              ).width
            : undefined,
        autoNoteHeight:
          node.data.kind === 'stickyNote'
            ? estimateStickyNoteSize(
                node.data.description ?? node.data.value ?? ''
              ).height
            : undefined,
        validationMessage: resolveNodeValidationMessage(
          node,
          edges,
          validationText
        ),
        hasUrlInput:
          node.data.kind === 'fetch'
            ? edges.some(
                (edge) =>
                  edge.target === node.id && edge.targetHandle === 'in.data.url'
              )
            : undefined,
      },
    };
  });
