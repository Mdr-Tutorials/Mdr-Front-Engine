import './MdrTree.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface MdrTreeNode {
    id: string;
    label: string;
    children?: MdrTreeNode[];
    disabled?: boolean;
}

interface MdrTreeSpecificProps {
    data: MdrTreeNode[];
    expandedKeys?: string[];
    defaultExpandedKeys?: string[];
    selectedKey?: string;
    onToggle?: (keys: string[]) => void;
    onSelect?: (node: MdrTreeNode) => void;
}

export interface MdrTreeProps extends MdrComponent, MdrTreeSpecificProps {}

function MdrTree({
    data,
    expandedKeys,
    defaultExpandedKeys,
    selectedKey,
    onToggle,
    onSelect,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrTreeProps) {
    const [internalExpanded, setInternalExpanded] = useState<string[]>(
        defaultExpandedKeys || []
    );

    useEffect(() => {
        if (expandedKeys) {
            setInternalExpanded(expandedKeys);
        }
    }, [expandedKeys]);

    const currentExpanded = expandedKeys || internalExpanded;
    const expandedSet = useMemo(
        () => new Set(currentExpanded),
        [currentExpanded]
    );

    const toggleNode = (nodeId: string) => {
        const nextExpanded = expandedSet.has(nodeId)
            ? currentExpanded.filter((key) => key !== nodeId)
            : [...currentExpanded, nodeId];

        if (!expandedKeys) {
            setInternalExpanded(nextExpanded);
        }
        if (onToggle) {
            onToggle(nextExpanded);
        }
    };

    const handleSelect = (node: MdrTreeNode) => {
        if (node.disabled) return;
        if (onSelect) {
            onSelect(node);
        }
    };

    const renderNodes = (nodes: MdrTreeNode[], depth: number) => {
        return nodes.map((node) => {
            const hasChildren = !!node.children?.length;
            const isExpanded = expandedSet.has(node.id);
            return (
                <div key={node.id} className="MdrTreeNode">
                    <div
                        className="MdrTreeRow"
                        style={{ paddingLeft: depth * 16 }}
                    >
                        {hasChildren ? (
                            <button
                                type="button"
                                className="MdrTreeToggle"
                                onClick={() => toggleNode(node.id)}
                            >
                                {isExpanded ? (
                                    <Minus size={14} />
                                ) : (
                                    <Plus size={14} />
                                )}
                            </button>
                        ) : (
                            <span className="MdrTreeSpacer" />
                        )}
                        <button
                            type="button"
                            className={`MdrTreeLabel ${selectedKey === node.id ? 'Selected' : ''} ${node.disabled ? 'Disabled' : ''}`}
                            onClick={() => handleSelect(node)}
                        >
                            {node.label}
                        </button>
                    </div>
                    {hasChildren && isExpanded && (
                        <div className="MdrTreeChildren">
                            {renderNodes(node.children || [], depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const fullClassName = `MdrTree ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div
            className={fullClassName}
            style={style as React.CSSProperties}
            id={id}
            {...dataProps}
        >
            {renderNodes(data, 0)}
        </div>
    );
}

export default MdrTree;
