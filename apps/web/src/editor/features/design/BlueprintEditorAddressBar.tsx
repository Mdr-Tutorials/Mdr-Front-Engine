import { MdrButton, MdrInput } from '@mdr/ui';
import { Link2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RouteItem } from './BlueprintEditor.types';

type BlueprintEditorAddressBarProps = {
  currentPath: string;
  newPath: string;
  routes: RouteItem[];
  onCurrentPathChange: (value: string) => void;
  onNewPathChange: (value: string) => void;
  onAddRoute: () => void;
};

export function BlueprintEditorAddressBar({
  currentPath,
  newPath,
  routes,
  onCurrentPathChange,
  onNewPathChange,
  onAddRoute,
}: BlueprintEditorAddressBarProps) {
  const { t } = useTranslation('blueprint');

  return (
    <section className="BlueprintEditorAddressBar">
      <div className="AddressInlineGroup">
        <span className="AddressLabelInline">
          <Link2 size={14} />
          {t('address.current')}
        </span>
        <MdrInput
          placeholder={t('address.currentPlaceholder')}
          value={currentPath}
          size="Small"
          className="AddressInput AddressCurrentInput"
          onChange={onCurrentPathChange}
        />
      </div>
      <div className="AddressInlineGroup">
        <span className="AddressLabelInline">
          <Plus size={14} />
          {t('address.new')}
        </span>
        <MdrInput
          placeholder={t('address.newPlaceholder')}
          value={newPath}
          size="Small"
          className="AddressInput AddressNewInput"
          onChange={onNewPathChange}
        />
        <MdrButton
          text={t('address.add')}
          size="Tiny"
          category="Ghost"
          onClick={onAddRoute}
        />
      </div>
      <div className="AddressInlineGroup AddressSelect">
        <span className="AddressLabelInline">{t('address.list')}</span>
        <select
          className="AddressSelectControl"
          value={currentPath}
          onChange={(event) => onCurrentPathChange(event.target.value)}
        >
          {routes.map((route) => (
            <option key={route.id} value={route.path}>
              {route.path}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
