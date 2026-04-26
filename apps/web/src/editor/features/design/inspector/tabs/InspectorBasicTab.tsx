import { InspectorExternalPropsFields } from '@/editor/features/design/inspector/fields/InspectorExternalPropsFields';
import { InspectorNodeCapabilitiesFields } from '@/editor/features/design/inspector/fields/InspectorNodeCapabilitiesFields';
import { InspectorNodeIdentityFields } from '@/editor/features/design/inspector/fields/InspectorNodeIdentityFields';

export function InspectorBasicTab() {
  return (
    <div className="flex flex-col gap-2 px-4 pt-2 pb-3">
      <InspectorNodeIdentityFields />
      <InspectorNodeCapabilitiesFields />
      <InspectorExternalPropsFields />
    </div>
  );
}
