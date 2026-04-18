import { useInspectorSectionContext } from '@/editor/features/design/inspector/sections/InspectorSectionContext';
import { InspectorNodeIdentityFields } from '@/editor/features/design/inspector/sections/basic/InspectorNodeIdentityFields';
import { InspectorNodeCapabilitiesFields } from '@/editor/features/design/inspector/sections/basic/InspectorNodeCapabilitiesFields';

export function InspectorBasicTab() {
  const { t, expandedSections, toggleSection } = useInspectorSectionContext();

  return (
    <div className="flex flex-col gap-2 px-3 pt-2 pb-3">
      <InspectorNodeIdentityFields />
      <InspectorNodeCapabilitiesFields />
    </div>
  );
}