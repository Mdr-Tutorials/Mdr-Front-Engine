import './MdrSteps.scss'
import { type MdrComponent } from '@mdr/shared';
import type React from 'react';

export interface MdrStepItem {
    title: string;
    description?: string;
}

interface MdrStepsSpecificProps {
    items: MdrStepItem[];
    current?: number;
    direction?: 'Horizontal' | 'Vertical';
}

export interface MdrStepsProps extends MdrComponent, MdrStepsSpecificProps { }

function MdrSteps({
    items,
    current = 0,
    direction = 'Horizontal',
    className,
    style,
    id,
    dataAttributes = {},
}: MdrStepsProps) {
    const fullClassName = `MdrSteps ${direction} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            {items.map((item, index) => {
                const status = index < current ? 'Completed' : index === current ? 'Active' : 'Pending';
                return (
                    <div key={item.title} className={`MdrStep ${status}`}>
                        <div className="MdrStepIndicator">{index + 1}</div>
                        <div className="MdrStepContent">
                            <div className="MdrStepTitle">{item.title}</div>
                            {item.description && <div className="MdrStepDescription">{item.description}</div>}
                        </div>
                        {index < items.length - 1 && <div className="MdrStepConnector" />}
                    </div>
                );
            })}
        </div>
    );
}

export default MdrSteps;
