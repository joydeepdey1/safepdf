import type { QueueItem } from '../hooks/useFileQueue';
import { FileQueueItem } from './FileQueueItem';

interface FileQueueProps {
  items: QueueItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function FileQueue({ items, onRemove, onClear }: FileQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Selected Files ({items.length})</h3>
        <button
          onClick={onClear}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map(item => (
          <FileQueueItem key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
