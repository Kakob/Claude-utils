import { useCallback, useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  label: string;
  hint: string;
  accentColor?: 'violet' | 'emerald';
  disabled?: boolean;
}

export function DropZone({
  onFiles,
  accept,
  multiple = false,
  label,
  hint,
  accentColor = 'violet',
  disabled = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFiles(multiple ? files : [files[0]]);
    }
  }, [onFiles, multiple, disabled]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFiles(multiple ? files : [files[0]]);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [onFiles, multiple]);

  const borderColor = isDragging
    ? accentColor === 'violet'
      ? 'border-violet-400 dark:border-violet-500'
      : 'border-emerald-400 dark:border-emerald-500'
    : 'border-gray-200 dark:border-gray-700';

  const bgColor = isDragging
    ? accentColor === 'violet'
      ? 'bg-violet-50 dark:bg-violet-900/10'
      : 'bg-emerald-50 dark:bg-emerald-900/10'
    : '';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
        ${borderColor}
        ${bgColor}
        ${disabled ? 'opacity-50 cursor-not-allowed' : `hover:border-${accentColor}-400 dark:hover:border-${accentColor}-500`}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      <Upload className="mx-auto mb-3 text-gray-400" size={32} />
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );
}
