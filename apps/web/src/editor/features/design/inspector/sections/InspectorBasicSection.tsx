import { ChevronDown } from 'lucide-react';
import { useInspectorSectionContext } from './InspectorSectionContext';
import { InspectorNodeIdentityFields } from './basic/InspectorNodeIdentityFields';
import { InspectorNodeCapabilitiesFields } from './basic/InspectorNodeCapabilitiesFields';
import { InspectorDataScopeFields } from './basic/InspectorDataScopeFields';
import { InspectorListTemplateFields } from './basic/InspectorListTemplateFields';
import { InspectorExternalPropsFields } from './basic/InspectorExternalPropsFields';

export function InspectorBasicSection() {
  const { t, expandedSections, toggleSection } = useInspectorSectionContext();

  return (
    <section className="pt-1">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 py-1 text-left"
        onClick={() => toggleSection('basic')}
      >
        <span className="text-[13px] font-semibold tracking-[0.01em] text-(--color-9)">
          {t('inspector.groups.basic', {
            defaultValue: 'Basic Info',
          })}
        </span>
        <ChevronDown
          size={14}
          className={`${expandedSections.basic ? 'rotate-0' : '-rotate-90'} text-(--color-6) transition-transform`}
        />
      </button>
      {expandedSections.basic && (
        <div className="flex flex-col gap-2 pb-1 pt-1">
          <InspectorNodeIdentityFields />
          <InspectorNodeCapabilitiesFields />
          <InspectorDataScopeFields />
          <InspectorListTemplateFields />
          <InspectorExternalPropsFields />
        </div>
      )}
    </section>
  );
}
