import { useState, useRef, useCallback } from 'react';
import { CloudUpload } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function Dropzone({ onFilesSelected, accept, multiple = true, className }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      // Reset input so the same files can be selected again if needed
      e.target.value = '';
    }
  }, [onFilesSelected]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload files: Drag and drop files here or press Enter to browse files"
      className={cn(
        "relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none select-none",
        isDragActive ? "border-blue-500 bg-blue-500/10" : "border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-500",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        aria-hidden="true"
      />
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className={cn("p-4 rounded-full transition-colors duration-200", isDragActive ? "bg-blue-500/20 text-blue-400" : "bg-neutral-800 text-neutral-400")}>
          <CloudUpload className="w-8 h-8" />
        </div>
        <div>
          <p className="text-lg font-medium text-white mb-1">
            Drag & drop your files here
          </p>
          <p className="text-sm text-neutral-400">
            or click to select files from your device
          </p>
        </div>
      </div>
    </div>
  );
}
