import './MdrRichTextEditor.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';

interface MdrRichTextEditorSpecificProps {
    label?: string;
    description?: string;
    message?: string;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    showToolbar?: boolean;
    onChange?: (value: string) => void;
}

export interface MdrRichTextEditorProps
    extends MdrComponent,
        MdrRichTextEditorSpecificProps {}

function MdrRichTextEditor({
    label,
    description,
    message,
    value,
    defaultValue,
    placeholder = 'Write something...',
    disabled = false,
    readOnly = false,
    showToolbar = true,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrRichTextEditorProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const editorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== currentValue) {
            editorRef.current.innerHTML = currentValue;
        }
    }, [currentValue]);

    const emitChange = () => {
        const html = editorRef.current?.innerHTML || '';
        if (value === undefined) {
            setInternalValue(html);
        }
        if (onChange) {
            onChange(html);
        }
    };

    const handleCommand = (command: string, commandValue?: string) => () => {
        if (disabled || readOnly) return;
        if (typeof document !== 'undefined') {
            document.execCommand(command, false, commandValue);
        }
        emitChange();
    };

    const handleLink = () => {
        if (disabled || readOnly) return;
        const url =
            typeof window !== 'undefined'
                ? window.prompt('Enter URL')
                : undefined;
        if (url) {
            handleCommand('createLink', url)();
        }
    };

    const fullClassName =
        `MdrRichTextEditor ${disabled ? 'Disabled' : ''} ${readOnly ? 'ReadOnly' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div
            className={`MdrField ${fullClassName}`}
            style={style as React.CSSProperties}
            id={id}
            {...dataProps}
        >
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel">{label}</label>
                </div>
            )}
            {description && (
                <div className="MdrFieldDescription">{description}</div>
            )}
            {showToolbar && (
                <div className="MdrRichTextEditorToolbar">
                    <button type="button" onClick={handleCommand('bold')}>
                        B
                    </button>
                    <button type="button" onClick={handleCommand('italic')}>
                        I
                    </button>
                    <button type="button" onClick={handleCommand('underline')}>
                        U
                    </button>
                    <button
                        type="button"
                        onClick={handleCommand('insertUnorderedList')}
                    >
                        ?
                    </button>
                    <button
                        type="button"
                        onClick={handleCommand('insertOrderedList')}
                    >
                        1.
                    </button>
                    <button type="button" onClick={handleLink}>
                        Link
                    </button>
                </div>
            )}
            <div
                ref={editorRef}
                className="MdrRichTextEditorContent"
                contentEditable={!disabled && !readOnly}
                data-placeholder={placeholder}
                onInput={emitChange}
            />
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrRichTextEditor;
