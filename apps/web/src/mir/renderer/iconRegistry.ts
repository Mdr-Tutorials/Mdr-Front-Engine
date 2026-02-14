import type React from 'react';
import * as LucideIcons from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

export type IconRef = {
    provider: string;
    name: string;
};

type IconResolver = (name: string) => React.ComponentType<any> | null;
type IconNameProvider = () => string[];

type IconProviderRegistration = {
    label?: string;
    resolve: IconResolver;
    listIcons?: IconNameProvider;
};

export type IconProviderMeta = {
    id: string;
    label: string;
};

type IconProviderRecord = {
    id: string;
    label: string;
    resolve: IconResolver;
    listIcons: IconNameProvider;
};

const iconProviders = new Map<string, IconProviderRecord>();

const normalizeProvider = (provider: string) => provider.trim().toLowerCase();

const isIconComponent = (value: unknown): value is React.ComponentType<any> =>
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && '$$typeof' in value);

export const isIconRef = (value: unknown): value is IconRef => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return (
        typeof record.provider === 'string' &&
        record.provider.trim() !== '' &&
        typeof record.name === 'string' &&
        record.name.trim() !== ''
    );
};

export const registerIconProvider = (
    provider: string,
    registration: IconResolver | IconProviderRegistration
) => {
    if (!provider.trim()) return;
    const normalizedId = normalizeProvider(provider);
    const normalizedRegistration =
        typeof registration === 'function'
            ? { resolve: registration, listIcons: () => [] }
            : registration;
    iconProviders.set(normalizedId, {
        id: normalizedId,
        label: normalizedRegistration.label ?? provider,
        resolve: normalizedRegistration.resolve,
        listIcons: normalizedRegistration.listIcons ?? (() => []),
    });
};

/**
 * 图标解析主链路：
 * Inspector/MIR 写入 `props.iconRef` -> registry 的 icon adapter -> resolveIconRef ->
 * 对应 provider 返回 React 组件 -> MIRRenderer 渲染。
 */
export const resolveIconRef = (value: unknown) => {
    if (!isIconRef(value)) return null;
    const provider = iconProviders.get(normalizeProvider(value.provider));
    if (!provider) return null;
    return provider.resolve(value.name);
};

export const listIconProviders = (): IconProviderMeta[] => {
    return [...iconProviders.values()]
        .map((provider) => ({ id: provider.id, label: provider.label }))
        .sort((left, right) => left.label.localeCompare(right.label));
};

export const listIconNamesByProvider = (providerId: string) => {
    const provider = iconProviders.get(normalizeProvider(providerId));
    if (!provider) return [];
    return provider.listIcons();
};

const toPascalCase = (value: string) =>
    value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map(
            (segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`
        )
        .join('');

const resolveLucideIcon = (name: string) => {
    const candidates = [
        name,
        toPascalCase(name),
        toPascalCase(name.toLowerCase()),
    ];
    for (const candidate of candidates) {
        const icon = (LucideIcons as Record<string, unknown>)[candidate];
        if (isIconComponent(icon)) {
            return icon as React.ComponentType<any>;
        }
    }
    return null;
};

const LUCIDE_ICON_NAMES = Object.keys(dynamicIconImports)
    .map(toPascalCase)
    .filter((name, index, names) => names.indexOf(name) === index)
    .filter((name) => Boolean(resolveLucideIcon(name)))
    .sort((left, right) => left.localeCompare(right));

registerIconProvider('lucide', {
    label: 'Lucide',
    resolve: resolveLucideIcon,
    listIcons: () => LUCIDE_ICON_NAMES,
});
