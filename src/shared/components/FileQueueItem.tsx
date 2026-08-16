import { X, File as FileIcon, FileText, Image as ImageIcon } from 'lucide-react';
import type { QueueItem } from '../hooks/useFileQueue';
import { formatFileSize, isPdf, isImage } from '../utils/file';

interface FileQueueItemProps {
  item: QueueItem;
  onRemove: (id: string) => void;
}

export function FileQueueItem({ item, onRemove }: FileQueueItemProps) {
  const isPdfFile = isPdf(item.file);
  const isImageFile = isImage(item.file);

  const Icon = isPdfFile ? FileText : (isImageFile ? ImageIcon : FileIcon);
  const iconColor = isPdfFile ? "text-blue-400" : (isImageFile ? "text-emerald-400" : "text-neutral-400");
  const bgColor = isPdfFile ? "bg-blue-400/10" : (isImageFile ? "bg-emerald-400/10" : "bg-neutral-800");

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800">
      <div className="flex items-center gap-4 truncate">
        <div className={`p-3 rounded-lg ${bgColor} ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-white truncate max-w-full">
            {item.file.name}
          </p>
          <p className="text-xs text-neutral-400">
            {formatFileSize(item.file.size)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 pl-4">
        {item.status === 'processing' && (
          <div className="text-xs font-medium text-blue-400">
            {Math.round(item.progress)}%
          </div>
        )}
        {item.status === 'error' && (
          <div className="text-xs font-medium text-red-400 max-w-[100px] truncate" title={item.error}>
            {item.error || 'Error'}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
