import './MdrCollapse.scss'
import { type MdrComponent } from '@mdr/shared';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type React from 'react';

export interface MdrCollapseItem {
    key: string;
    title: string;
    content: React.ReactNode;
    disabled?: boolean;
}

interface MdrCollapseSpecificProps {
    items: MdrCollapseItem[];
    activeKeys?: string[];
    defaultActiveKeys?: string[];
    accordion?: boolean;
    onChange?: (keys: string[]) => void;
}

export interface MdrCollapseProps extends MdrComponent, MdrCollapseSpecificProps { }

function MdrCollapse({
    items,
    activeKeys,
    defaultActiveKeys,
    accordion = false,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrCollapseProps) {
    const [internalKeys, setInternalKeys] = useState<string[]>(defaultActiveKeys || []);

    useEffect(() => {
        if (activeKeys) {
            setInternalKeys(activeKeys);
        }
    }, [activeKeys]);

    const currentKeys = activeKeys || internalKeys;

    const toggleKey = (key: string) => {
        let nextKeys: string[] = [];
        if (accordion) {
            nextKeys = currentKeys.includes(key) ? [] : [key];
        } else {
            nextKeys = currentKeys.includes(key)
                ? currentKeys.filter((item) => item !== key)
                : [...currentKeys, key];
        }

        if (!activeKeys) {
            setInternalKeys(nextKeys);
        }
        if (onChange) {
            onChange(nextKeys);
        }
    };

    const fullClassName = `MdrCollapse ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={fullClassName} style={style as React.CSSProperties} id={id} {...dataProps}>
            {items.map((item) => {
                const isOpen = currentKeys.includes(item.key);
                return (
                    <div key={item.key} className={`MdrCollapseItem ${isOpen ? 'Open' : ''} ${item.disabled ? 'Disabled' : ''}`}>
                        <button
                            type="button"
                            className="MdrCollapseHeader"
                            onClick={() => !item.disabled && toggleKey(item.key)}
                        >
                            <span>{item.title}</span>
                            <span className="MdrCollapseIcon">{isOpen ? <Minus size={14} /> : <Plus size={14} />}</span>
                        </button>
                        {isOpen && (
                            <div className="MdrCollapseContent">{item.content}</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default MdrCollapse;
