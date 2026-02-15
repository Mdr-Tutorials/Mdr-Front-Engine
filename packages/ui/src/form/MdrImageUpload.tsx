import './MdrImageUpload.scss';
import { type MdrComponent } from '@mdr/shared';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';

interface MdrImageUploadSpecificProps {
  label?: string;
  description?: string;
  message?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  value?: File[];
  defaultValue?: File[];
  onChange?: (files: File[]) => void;
}

export interface MdrImageUploadProps
  extends MdrComponent,
    MdrImageUploadSpecificProps {}

function MdrImageUpload({
  label,
  description,
  message,
  accept = 'image/*',
  multiple = false,
  disabled = false,
  required = false,
  value,
  defaultValue,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: MdrImageUploadProps) {
  const [files, setFiles] = useState<File[]>(defaultValue || []);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value) {
      setFiles(value);
    }
  }, [value]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

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

  const fullClassName =
    `MdrImageUpload ${disabled ? 'Disabled' : ''} ${className || ''}`.trim();
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
          {required && <span className="MdrFieldRequired">*</span>}
        </div>
      )}
      {description && <div className="MdrFieldDescription">{description}</div>}
      <div
        className="MdrImageUploadDropzone"
        onClick={handleSelectClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="MdrImageUploadText">Click or drag images to upload</div>
      </div>
      <input
        ref={inputRef}
        className="MdrImageUploadInput"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
      />
      {previews.length > 0 && (
        <div className="MdrImageUploadGrid">
          {previews.map((src, index) => (
            <div key={`${src}-${index}`} className="MdrImageUploadItem">
              <img src={src} alt={`Preview ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
      {message && <div className="MdrFieldMessage">{message}</div>}
    </div>
  );
}

export default MdrImageUpload;
