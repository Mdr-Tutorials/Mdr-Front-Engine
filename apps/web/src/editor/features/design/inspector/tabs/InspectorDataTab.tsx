import { useInspectorSectionContext } from '@/editor/features/design/inspector/sections/InspectorSectionContext';
import { InspectorDataScopeFields } from '@/editor/features/design/inspector/sections/basic/InspectorDataScopeFields';
import { InspectorListTemplateFields } from '@/editor/features/design/inspector/sections/basic/InspectorListTemplateFields';

export function InspectorDataTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pt-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
      <InspectorDataScopeFields />
      <InspectorListTemplateFields />
    </div>
  );
}