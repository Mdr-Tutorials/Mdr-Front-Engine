import './MdrAnchorNavigation.scss';
import { type MdrComponent } from '@mdr/shared';

export interface MdrAnchorItem {
    id: string;
    label: string;
    href?: string;
}

interface MdrAnchorNavigationSpecificProps {
    items: MdrAnchorItem[];
    activeId?: string;
    orientation?: 'Vertical' | 'Horizontal';
    onSelect?: (item: MdrAnchorItem) => void;
}

export interface MdrAnchorNavigationProps
    extends MdrComponent,
        MdrAnchorNavigationSpecificProps {}

function MdrAnchorNavigation({
    items,
    activeId,
    orientation = 'Vertical',
    onSelect,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrAnchorNavigationProps) {
    const fullClassName =
        `MdrAnchorNavigation ${orientation} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <nav
            className={fullClassName}
            style={style as React.CSSProperties}
            id={id}
            {...dataProps}
        >
            {items.map((item) => (
                <a
                    key={item.id}
                    href={item.href || `#${item.id}`}
                    className={`MdrAnchorNavigationItem ${activeId === item.id ? 'Active' : ''}`}
                    onClick={() => onSelect?.(item)}
                >
                    {item.label}
                </a>
            ))}
        </nav>
    );
}

export default MdrAnchorNavigation;
