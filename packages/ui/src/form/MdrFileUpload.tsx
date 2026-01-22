import './MdrFileUpload.scss'
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';

interface MdrFileUploadSpecificProps {
    label?: string,
    description?: string,
    message?: string,
    accept?: string,
    multiple?: boolean,
    disabled?: boolean,
    required?: boolean,
    showList?: boolean,
    value?: File[],
    defaultValue?: File[],
    onChange?: (files: File[]) => void,
}

export interface MdrFileUploadProps extends MdrComponent, MdrFileUploadSpecificProps { }

function MdrFileUpload({
    label,
    description,
    message,
    accept,
    multiple = false,
    disabled = false,
    required = false,
    showList = true,
    value,
    defaultValue,
    onChange,
    className,
    style,
    id,
    dataAttributes = {},
}: MdrFileUploadProps) {
    const [files, setFiles] = useState<File[]>(defaultValue || []);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (value) {
            setFiles(value);
        }
    }, [value]);

    const updateFiles = (nextFiles: File[]) => {
        if (!value) {
            setFiles(nextFiles);
        }
        if (onChange) {
            onChange(nextFiles);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = Array.from(event.target.files || []);
        updateFiles(nextFiles);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (disabled) return;
        const nextFiles = Array.from(event.dataTransfer.files || []);
        updateFiles(nextFiles);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleSelectClick = () => {
        if (!disabled) {
            inputRef.current?.click();
        }
    };

    const fullClassName = `MdrFileUpload ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
    const dataProps = { ...dataAttributes };

    return (
        <div className={`MdrField ${fullClassName}`} style={style as React.CSSProperties} id={id} {...dataProps}>
            {label && (
                <div className="MdrFieldHeader">
                    <label className="MdrFieldLabel">{label}</label>
                    {required && <span className="MdrFieldRequired">*</span>}
                </div>
            )}
            {description && <div className="MdrFieldDescription">{description}</div>}
            <div
                className="MdrFileUploadDropzone"
                onClick={handleSelectClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <div className="MdrFileUploadIcon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v12" />
                        <path d="m7 8 5-5 5 5" />
                        <path d="M5 21h14" />
                    </svg>
                </div>
                <div className="MdrFileUploadText">
                    Click or drag files to upload
                </div>
                <div className="MdrFileUploadHint">
                    {multiple ? 'Multiple files allowed' : 'Single file only'}
                </div>
            </div>
            <input
                ref={inputRef}
                className="MdrFileUploadInput"
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                onChange={handleInputChange}
            />
            {showList && files.length > 0 && (
                <ul className="MdrFileUploadList">
                    {files.map((file) => (
                        <li key={`${file.name}-${file.size}`} className="MdrFileUploadItem">
                            <span className="MdrFileUploadName">{file.name}</span>
                            <span className="MdrFileUploadSize">{Math.round(file.size / 1024)} KB</span>
                        </li>
                    ))}
                </ul>
            )}
            {message && <div className="MdrFieldMessage">{message}</div>}
        </div>
    );
}

export default MdrFileUpload;
