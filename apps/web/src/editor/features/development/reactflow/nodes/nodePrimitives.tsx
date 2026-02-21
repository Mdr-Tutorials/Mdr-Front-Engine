import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { NodeBranchItem, NodeKeyValueItem } from '../graphNodeShared';

export const NODE_TEXT_INPUT_CLASS =
  'nodrag nopan h-7 w-full rounded border border-slate-200 bg-slate-50 px-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white';
export const NODE_TEXTAREA_CLASS =
  'nodrag nopan min-h-7 w-full resize-none overflow-hidden rounded border border-slate-200 bg-slate-50 px-2 py-1 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white';

export const buildNodeContainerClass = (
  selected: boolean,
  minWidthClass = 'min-w-[200px]'
) =>
  `relative ${minWidthClass} overflow-visible rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.12)] ${
    selected
      ? 'ring-1 ring-slate-500/45 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.16)]'
      : ''
  }`;

type NodeHeaderProps = {
  title: string;
  leftSlot?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  collapseAriaLabel?: string;
};

export const NodeHeader = ({
  title,
  leftSlot,
  summary,
  actions,
  collapsed,
  onToggleCollapse,
  collapseAriaLabel,
}: NodeHeaderProps) => (
  <div className="relative flex min-h-9 items-center justify-between px-3.5 py-1.5">
    {leftSlot}
    <div className="truncate pl-1 pr-2 font-[Poppins,sans-serif] text-[13px] font-semibold tracking-[0.01em] text-slate-900">
      {title}
    </div>
    <div className="nodrag nopan ml-auto flex items-center gap-1">
      {summary}
      {actions}
      {onToggleCollapse ? (
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapse();
          }}
          aria-label={collapseAriaLabel}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : null}
    </div>
  </div>
);

export const CollapseSummary = ({
  text,
  title,
}: {
  text: string;
  title?: string;
}) => (
  <span
    className="max-w-[120px] truncate text-[11px] font-normal text-slate-500"
    title={title || text}
  >
    {text}
  </span>
);

export const NodeValidationHint = ({ message }: { message?: string }) =>
  message ? (
    <div className="px-4 pb-2 text-[10px] font-medium text-amber-600">
      {message}
    </div>
  ) : null;

type SelectFieldOption = { value: string; label: string };

export const SelectField = ({
  value,
  options,
  onChange,
  className,
  disabled,
}: {
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    className={`nodrag nopan h-7 rounded border border-slate-200 bg-slate-50 px-2 font-[Inter,sans-serif] text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${
      className ?? ''
    }`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const KVListEditor = ({
  items,
  onAdd,
  onRemove,
  onChange,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
}: {
  items: NodeKeyValueItem[];
  onAdd?: () => void;
  onRemove?: (entryId: string) => void;
  onChange?: (entryId: string, field: 'key' | 'value', value: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) => (
  <div className="space-y-1 px-4 pb-1">
    {items.map((item) => (
      <div key={item.id} className="flex items-center gap-2">
        <input
          className="nodrag nopan h-6 min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
          value={item.key}
          onChange={(event) => onChange?.(item.id, 'key', event.target.value)}
          placeholder={keyPlaceholder}
          spellCheck={false}
        />
        <input
          className="nodrag nopan h-6 min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
          value={item.value}
          onChange={(event) => onChange?.(item.id, 'value', event.target.value)}
          placeholder={valuePlaceholder}
          spellCheck={false}
        />
        {onRemove ? (
          <button
            type="button"
            className="nodrag nopan flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => onRemove(item.id)}
            aria-label="remove entry"
          >
            ×
          </button>
        ) : null}
      </div>
    ))}
    {onAdd ? (
      <button
        type="button"
        className="nodrag nopan inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-normal text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
        onClick={onAdd}
      >
        <Plus size={12} />
        <span>Add</span>
      </button>
    ) : null}
  </div>
);

export const BranchListEditor = ({
  items,
  onAdd,
  onRemove,
  onChangeLabel,
  renderStart,
  renderEnd,
}: {
  items: NodeBranchItem[];
  onAdd?: () => void;
  onRemove?: (branchId: string) => void;
  onChangeLabel?: (branchId: string, label: string) => void;
  renderStart?: (item: NodeBranchItem) => ReactNode;
  renderEnd?: (item: NodeBranchItem) => ReactNode;
}) => (
  <div className="pb-1">
    {items.map((item) => (
      <div
        key={item.id}
        className="group relative flex min-h-7 items-center gap-2 px-4 text-[11px] font-normal text-slate-700"
      >
        {renderStart ? renderStart(item) : null}
        {onChangeLabel ? (
          <input
            className="nodrag nopan h-6 min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] font-normal text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
            value={item.label}
            onChange={(event) => onChangeLabel(item.id, event.target.value)}
            placeholder="branch"
            spellCheck={false}
          />
        ) : (
          <span>{item.label}</span>
        )}
        {renderEnd ? renderEnd(item) : null}
        {onRemove ? (
          <button
            type="button"
            className="nodrag nopan ml-auto flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(item.id);
            }}
            aria-label="remove branch"
          >
            ×
          </button>
        ) : null}
      </div>
    ))}
    {onAdd ? (
      <div className="px-3">
        <button
          type="button"
          className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          aria-label="add branch"
        >
          <Plus size={14} />
        </button>
      </div>
    ) : null}
  </div>
);
