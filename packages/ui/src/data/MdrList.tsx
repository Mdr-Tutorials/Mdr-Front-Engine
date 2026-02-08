import './MdrList.scss';
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

export interface MdrListItem {
    title: string;
    description?: string;
    extra?: React.ReactNode;
}

interface MdrListSpecificProps {
    items: Array<MdrListItem>;
    size?: 'Small' | 'Medium' | 'Large';
    bordered?: boolean;
    split?: boolean;
    renderItem?: (item: MdrListItem, index: number) => React.ReactNode;
}

export interface MdrListProps extends MdrComponent, MdrListSpecificProps {}

function MdrList({
    items,
    size = 'Medium',
    bordered = false,
    split = true,
    renderItem,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrListProps) {
    const fullClassName =
        `MdrList ${size} ${bordered ? 'Bordered' : ''} ${split ? 'Split' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <ul
            className={fullClassName}
            style={style as React.CSSProperties}
            id={id}
            {...dataProps}
        >
            {items.map((item, index) => (
                <li key={index} className="MdrListItem">
                    {renderItem ? (
                        renderItem(item, index)
                    ) : (
                        <>
                            <div className="MdrListContent">
                                <div className="MdrListTitle">{item.title}</div>
                                {item.description && (
                                    <div className="MdrListDescription">
                                        {item.description}
                                    </div>
                                )}
                            </div>
                            {item.extra && (
                                <div className="MdrListExtra">{item.extra}</div>
                            )}
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
}

export default MdrList;
