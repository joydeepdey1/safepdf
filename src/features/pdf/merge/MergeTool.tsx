import { useState, useCallback, useRef } from 'react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validatePDFs } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { MergeWorkerPayload } from './worker';

export function MergeTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Keep track of the active worker cancellation function
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    setGlobalError(null);
    const { valid, errors } = validatePDFs(files);

    if (errors.length > 0) {
      // For simplicity, just show the first error in the UI
      setGlobalError(errors[0]);
    }

    if (valid.length > 0) {
      addFiles(valid);
    }
  }, [addFiles]);

  const handleMerge = async () => {
    if (queue.length < 2) {
      setGlobalError('Please add at least two PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);

    try {
      // Validate again before processing (defense in depth)
      const { valid, errors } = validatePDFs(queue.map(q => q.file));
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors[0]}`);
      }

      // Read all files into ArrayBuffers
      const buffers = await Promise.all(
        valid.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return { name: file.name, buffer };
        })
      );

      // Mark all items as processing
      queue.forEach(item => updateItemStatus(item.id, { status: 'processing', progress: 0 }));

      const workerFactory = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<MergeWorkerPayload, Uint8Array>({
        workerFactory,
        payload: { files: buffers },
        onProgress: (progress) => {
          queue.forEach(item => updateItemStatus(item.id, { progress }));
        },
        onComplete: (resultBytes) => {
          setIsProcessing(false);
          queue.forEach(item => updateItemStatus(item.id, { status: 'complete', progress: 100 }));

          // Download the result
          const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
          const date = new Date().toISOString().split('T')[0];
          downloadBlob(blob, `merged-${date}.pdf`);

          cancelWorkerRef.current = null;
        },
        onError: (error) => {
          setIsProcessing(false);
          setGlobalError(error);
          queue.forEach(item => updateItemStatus(item.id, { status: 'error', error }));
          cancelWorkerRef.current = null;
        }
      });

    } catch (err: any) {
      setIsProcessing(false);
      setGlobalError(err.message || 'Failed to prepare files for merging.');
      queue.forEach(item => updateItemStatus(item.id, { status: 'error', error: err.message }));
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
      title="Merge PDF"
      description="Combine multiple PDF files into a single document instantly."
    >
      <Dropzone
        onFilesSelected={handleFilesSelected}
        accept="application/pdf"
        className="mb-8"
      />

      {globalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
          {globalError}
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
              onClick={handleMerge}
              disabled={queue.length < 2}
              className="px-8 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none"
            >
              Merge PDFs
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
