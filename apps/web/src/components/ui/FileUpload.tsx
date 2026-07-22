'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { FormLabel, HelperText, ValidationMessage } from './input';
import { Button } from './button';

export interface FileUploadProps {
  label?: string;
  helperText?: string;
  error?: string;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  value?: File | { name: string; size?: number; url?: string } | null;
  isUploading?: boolean;
  uploadProgress?: number;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload Document',
  helperText = 'PDF or DOCX up to 5MB. Files are handled securely.',
  error,
  acceptedTypes = ['.pdf', '.docx', '.doc'],
  maxSizeMB = 5,
  value,
  isUploading = false,
  uploadProgress = 0,
  onChange,
  onRemove,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (onChange) onChange(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onChange) onChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileName = value ? value.name : '';
  const fileSize = value && 'size' in value ? formatFileSize(value.size) : '';

  return (
    <div className={`w-full flex flex-col space-y-1.5 ${className}`}>
      {label && <FormLabel>{label}</FormLabel>}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── 1. UPLOADING STATE ── */}
      {isUploading ? (
        <div className="w-full p-6 border border-primary/30 bg-primary/[0.02] rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Uploading document...</span>
          </div>

          <div className="w-full max-w-xs h-1.5 bg-accent rounded-full overflow-hidden relative">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(uploadProgress, 15)}%` }}
            />
          </div>

          {fileName && <p className="text-xs text-muted-foreground font-light">{fileName}</p>}
        </div>
      ) : value ? (
        /* ── 2. UPLOADED STATE ── */
        <div className="w-full p-4 border border-border/80 bg-card rounded-2xl flex items-center justify-between gap-4 transition-all duration-150">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-foreground truncate">{fileName}</span>
              {fileSize && (
                <span className="text-xs text-muted-foreground font-light">{fileSize}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary"
            >
              Replace
            </Button>
            <button
              type="button"
              onClick={() => {
                if (onRemove) onRemove();
                if (onChange) onChange(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/60 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ── 3. EMPTY DROPZONE STATE ── */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3 cursor-pointer transition-all duration-150 text-center select-none
            ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : error
                  ? 'border-destructive/60 bg-destructive/[0.02]'
                  : 'border-border/80 hover:border-primary/40 bg-card hover:bg-muted/20'
            }
          `}
        >
          <div className="w-10 h-10 rounded-xl bg-muted/60 text-secondary flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Click to upload or drag & drop file
            </p>
            <p className="text-xs text-muted-foreground font-light">
              Supported formats: {acceptedTypes.join(', ').toUpperCase()} (max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}

      {error ? (
        <ValidationMessage type="error">{error}</ValidationMessage>
      ) : (
        helperText && <HelperText>{helperText}</HelperText>
      )}
    </div>
  );
};

export default FileUpload;
