import type { ReactNode } from 'react';
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
    statusIndicator?: ReactNode;
};

export function BlueprintEditorAddressBar({
    currentPath,
    newPath,
    routes,
    onCurrentPathChange,
    onNewPathChange,
    onAddRoute,
    statusIndicator,
}: BlueprintEditorAddressBarProps) {
    const { t } = useTranslation('blueprint');

    return (
        <section className="flex flex-nowrap items-center gap-3 overflow-x-auto border-b border-black/6 bg-(--color-0) px-3 py-1.5 dark:border-white/8">
            <div className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-(--color-7)">
                    <Link2 size={14} />
                    {t('address.current')}
                </span>
                <div className="w-60 max-w-60">
                    <MdrInput
                        placeholder={t('address.currentPlaceholder')}
                        value={currentPath}
                        size="Small"
                        className="AddressInput AddressCurrentInput"
                        onChange={onCurrentPathChange}
                    />
                </div>
            </div>
            <div className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-(--color-7)">
                    <Plus size={14} />
                    {t('address.new')}
                </span>
                <div className="w-50">
                    <MdrInput
                        placeholder={t('address.newPlaceholder')}
                        value={newPath}
                        size="Small"
                        className="AddressInput AddressNewInput"
                        onChange={onNewPathChange}
                    />
                </div>
                <MdrButton
                    text={t('address.add')}
                    size="Tiny"
                    category="Ghost"
                    onClick={onAddRoute}
                />
            </div>
            <div className="ml-auto inline-flex items-center gap-2 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-(--color-7)">
                    {t('address.list')}
                </span>
                <select
                    className="h-7 rounded-full border border-black/8 bg-(--color-0) px-2 text-[11px] text-(--color-8) dark:border-white/12"
                    value={currentPath}
                    onChange={(event) =>
                        onCurrentPathChange(event.target.value)
                    }
                >
                    {routes.map((route) => (
                        <option key={route.id} value={route.path}>
                            {route.path}
                        </option>
                    ))}
                </select>
                {statusIndicator ? (
                    <div className="inline-flex shrink-0 items-center">
                        {statusIndicator}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
