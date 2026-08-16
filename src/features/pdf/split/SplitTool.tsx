import { useState, useCallback, useRef } from 'react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validatePDFs } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { SplitWorkerPayload } from './worker';

export function SplitTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Page range state
  const [pageRange, setPageRange] = useState('');

  // Keep track of the active worker cancellation function
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    setGlobalError(null);
    const { valid, errors } = validatePDFs(files);

    if (errors.length > 0) {
      setGlobalError(errors[0]);
    }

    // For Split PDF, we only want 1 file in the queue at a time
    if (valid.length > 0) {
      clearQueue();
      // Only take the first file if multiple were dropped
      addFiles([valid[0]]);
    }
  }, [addFiles, clearQueue]);

  const validateRange = (range: string): { start: number; end: number; error: string | null } => {
    const trimmed = range.trim();
    if (!trimmed) return { start: 0, end: 0, error: 'Page range cannot be empty.' };

    const parts = trimmed.split('-');
    if (parts.length !== 2) return { start: 0, end: 0, error: 'Format must be Start-End (e.g. 1-5).' };

    const start = parseInt(parts[0].trim(), 10);
    const end = parseInt(parts[1].trim(), 10);

    if (isNaN(start) || isNaN(end)) {
      return { start: 0, end: 0, error: 'Pages must be valid numbers.' };
    }

    if (start < 1) {
      return { start: 0, end: 0, error: 'Start page must be at least 1.' };
    }

    if (start > end) {
      return { start: 0, end: 0, error: 'Start page cannot be greater than end page.' };
    }

    return { start, end, error: null };
  };

  const handleSplit = async () => {
    if (queue.length !== 1) {
      setGlobalError('Please add exactly one PDF file to split.');
      return;
    }

    const { start, end, error: rangeError } = validateRange(pageRange);
    if (rangeError) {
      setGlobalError(rangeError);
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);

    const fileItem = queue[0];

    try {
      // Validate again before processing
      const { valid, errors } = validatePDFs([fileItem.file]);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors[0]}`);
      }

      // Read file into ArrayBuffer
      const buffer = await valid[0].arrayBuffer();

      updateItemStatus(fileItem.id, { status: 'processing', progress: 0 });

      const workerFactory = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<SplitWorkerPayload, Uint8Array>({
        workerFactory,
        payload: {
          file: { name: fileItem.file.name, buffer },
          startPage: start,
          endPage: end,
        },
        onProgress: (progress) => {
          updateItemStatus(fileItem.id, { progress });
        },
        onComplete: (resultBytes) => {
          setIsProcessing(false);
          updateItemStatus(fileItem.id, { status: 'complete', progress: 100 });

          // Download the result
          const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
          const date = new Date().toISOString().split('T')[0];
          downloadBlob(blob, `split-${date}.pdf`);

          cancelWorkerRef.current = null;
        },
        onError: (error) => {
          setIsProcessing(false);
          setGlobalError(error);
          updateItemStatus(fileItem.id, { status: 'error', error });
          cancelWorkerRef.current = null;
        }
      });

    } catch (err: any) {
      setIsProcessing(false);
      setGlobalError(err.message || 'Failed to prepare file for splitting.');
      updateItemStatus(fileItem.id, { status: 'error', error: err.message });
    }
  };

  const handleCancel = () => {
    if (cancelWorkerRef.current) {
      cancelWorkerRef.current();
      cancelWorkerRef.current = null;
    }
    setIsProcessing(false);
    queue.forEach(item => {
      if (item.status === 'processing') {
        updateItemStatus(item.id, { status: 'idle', progress: 0 });
      }
    });
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Extract a specific page range from your PDF into a new document."
    >
      <Dropzone
        onFilesSelected={handleFilesSelected}
        accept="application/pdf"
        multiple={false}
        className="mb-8"
      />

      {globalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
          {globalError}
        </div>
      )}

      {queue.length > 0 && (
        <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Pages to extract (e.g. 1-5)
          </label>
          <input
            type="text"
            placeholder="Start-End"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      <FileQueue
        items={queue}
        onRemove={removeFile}
        onClear={clearQueue}
      />

      {queue.length > 0 && (
        <div className="mt-8 pt-8 border-t border-neutral-800 flex justify-end gap-4">
          {isProcessing ? (
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl font-medium bg-neutral-800 hover:bg-neutral-700 text-white transition-colors border border-neutral-700"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleSplit}
              disabled={queue.length !== 1 || !pageRange.trim()}
              className="px-8 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none"
            >
              Split PDF
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
