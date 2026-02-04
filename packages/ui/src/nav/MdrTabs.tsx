import './MdrTabs.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

export interface MdrTabItem {
  key: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface MdrTabsSpecificProps {
  items: MdrTabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
}

export interface MdrTabsProps extends MdrComponent, MdrTabsSpecificProps {}

function MdrTabs({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrTabsProps) {
  const [internalKey, setInternalKey] = useState(
    defaultActiveKey || items[0]?.key
  );

  useEffect(() => {
    if (activeKey !== undefined) {
      setInternalKey(activeKey);
    }
  }, [activeKey]);

  const currentKey = activeKey !== undefined ? activeKey : internalKey;
  const currentTab = items.find((item) => item.key === currentKey) || items[0];

  const handleChange = (key: string, disabled?: boolean) => {
    if (disabled) return;
    if (activeKey === undefined) {
      setInternalKey(key);
    }
    if (onChange) {
      onChange(key);
    }
  };

  const fullClassName = `MdrTabs ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <div
      className={fullClassName}
      style={style as React.CSSProperties}
      id={id}
      {...dataProps}
    >
      <div className="MdrTabsHeader">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`MdrTabsTab ${item.key === currentKey ? 'Active' : ''} ${item.disabled ? 'Disabled' : ''}`}
            onClick={() => handleChange(item.key, item.disabled)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="MdrTabsContent">{currentTab?.content}</div>
    </div>
  );
}

export default MdrTabs;
