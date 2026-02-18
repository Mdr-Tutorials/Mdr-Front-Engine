import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  const [isRouteTreeOpen, setRouteTreeOpen] = useState(false);
  const routeTreeRootRef = useRef<HTMLDivElement | null>(null);
  const routeTreePanelRef = useRef<HTMLDivElement | null>(null);
  const routeTreeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [routeTreeRect, setRouteTreeRect] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!isRouteTreeOpen) return;
    const updateRect = () => {
      const trigger = routeTreeTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setRouteTreeRect({
        top: rect.bottom + 8,
        left: rect.right,
      });
    };
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (routeTreeRootRef.current?.contains(target)) return;
      if (routeTreePanelRef.current?.contains(target)) return;
      setRouteTreeOpen(false);
    };

    updateRect();
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isRouteTreeOpen]);

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
      <div className="ml-auto flex min-w-[260px] items-center gap-2">
        <span className="shrink-0 text-[11px] text-(--color-7)">
          {t('address.list', { defaultValue: 'Routes' })}
        </span>
        <div className="relative min-w-0 flex-1" ref={routeTreeRootRef}>
          <button
            ref={routeTreeTriggerRef}
            type="button"
            data-testid="address-route-menu-trigger"
            className="h-7 w-full truncate rounded-full border border-black/8 px-3 text-left text-[11px] text-(--color-8) hover:bg-black/4 dark:border-white/12 dark:hover:bg-white/8"
            onClick={() => setRouteTreeOpen((prev) => !prev)}
          >
            {currentPath}
          </button>
        </div>
        {isRouteTreeOpen && routeTreeRect && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={routeTreePanelRef}
                className="fixed z-[80] flex max-h-52 min-w-[320px] max-w-[420px] flex-col gap-1 overflow-y-auto rounded-lg border border-black/10 bg-(--color-0) p-1 shadow-[0_16px_32px_rgba(0,0,0,0.16)] dark:border-white/16"
                style={{
                  top: `${routeTreeRect.top}px`,
                  left: `${Math.max(12, routeTreeRect.left)}px`,
                  transform: 'translateX(-100%)',
                }}
              >
                {routes.map((route) => {
                  const depth = Math.max(0, route.depth ?? 0);
                  const isActive = route.path === currentPath;
                  const label = route.label?.trim() || route.path;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      data-testid={`address-route-item-${route.id}`}
                      className={`flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-left text-[11px] ${
                        isActive
                          ? 'bg-black/8 text-(--color-10) dark:bg-white/18'
                          : 'text-(--color-8) hover:bg-black/4 dark:hover:bg-white/8'
                      }`}
                      style={{ paddingLeft: `${8 + depth * 12}px` }}
                      onClick={() => {
                        onCurrentPathChange(route.path);
                        setRouteTreeOpen(false);
                      }}
                    >
                      <span className="truncate">{label}</span>
                      <span className="truncate text-(--color-6)">
                        {route.path}
                      </span>
                    </button>
                  );
                })}
              </div>,
              document.body
            )
          : null}
        {statusIndicator ? (
          <div className="inline-flex shrink-0 items-center">
            {statusIndicator}
          </div>
        ) : null}
      </div>
    </section>
  );
}
