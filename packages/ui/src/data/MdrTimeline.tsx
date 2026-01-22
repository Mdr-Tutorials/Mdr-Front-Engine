import './MdrTimeline.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

export interface MdrTimelineItem {
    title: string;
    time?: string;
    description?: string;
    status?: 'Default' | 'Success' | 'Warning' | 'Danger';
}

interface MdrTimelineSpecificProps {
    items: MdrTimelineItem[];
}

export interface MdrTimelineProps extends MdrComponent, MdrTimelineSpecificProps { }

function MdrTimeline({
    items,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrTimelineProps) {
    const fullClassName = `MdrTimeline ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            {items.map((item, index) => (
                <div key={index} className="MdrTimelineItem">
                    <div className={`MdrTimelineDot ${item.status || 'Default'}`} />
                    <div className="MdrTimelineContent">
                        <div className="MdrTimelineTitle">{item.title}</div>
                        {item.time && <div className="MdrTimelineTime">{item.time}</div>}
                        {item.description && <div className="MdrTimelineDescription">{item.description}</div>}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MdrTimeline;
