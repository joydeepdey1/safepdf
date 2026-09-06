import { useState, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validatePDFs } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { DeletePagesWorkerPayload } from './worker';

function parsePageSpec(input: string): { pages: number[]; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { pages: [], error: 'Please enter at least one page or range to delete.' };
  }

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  const pageSet = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const rangeParts = part.split('-').map((s) => s.trim());
      if (rangeParts.length !== 2) {
        return { pages: [], error: `Invalid range format: "${part}". Expected format like "4-6".` };
      }

      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);

      if (isNaN(start) || isNaN(end)) {
        return { pages: [], error: `Range "${part}" contains non-numeric values.` };
      }
      if (start < 1 || end < 1) {
        return { pages: [], error: `Page numbers must be 1 or greater.` };
      }
      if (start > end) {
        return { pages: [], error: `Start page (${start}) cannot be greater than end page (${end}) in "${part}".` };
      }

      for (let i = start; i <= end; i++) {
        pageSet.add(i);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        return { pages: [], error: `"${part}" is not a valid page number.` };
      }
      if (pageNum < 1) {
        return { pages: [], error: `Page numbers must be 1 or greater.` };
      }
      pageSet.add(pageNum);
    }
  }

  if (pageSet.size === 0) {
    return { pages: [], error: 'No valid pages specified.' };
  }

  const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
  return { pages: sortedPages, error: null };
}

export function DeletePagesTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [pageInput, setPageInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Active worker cancellation
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      const { valid, errors } = validatePDFs(files);

      if (errors.length > 0) {
        setGlobalError(errors[0]);
      }

      if (valid.length > 0) {
        clearQueue();
        addFiles([valid[0]]);
      }
    },
    [addFiles, clearQueue]
  );

  const parsed = pageInput.trim() ? parsePageSpec(pageInput) : null;

  const handleDeletePages = async () => {
    if (queue.length !== 1) {
      setGlobalError('Please add exactly one PDF file to process.');
      return;
    }

    const { pages, error: parseError } = parsePageSpec(pageInput);
    if (parseError) {
      setGlobalError(parseError);
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);

    const fileItem = queue[0];

    try {
      // Validate file before processing
      const { valid, errors } = validatePDFs([fileItem.file]);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors[0]}`);
      }

      const buffer = await valid[0].arrayBuffer();

      updateItemStatus(fileItem.id, { status: 'processing', progress: 0 });

      const workerFactory = () =>
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<DeletePagesWorkerPayload, Uint8Array>({
        workerFactory,
        payload: {
          file: { name: fileItem.file.name, buffer },
          pagesToDelete: pages,
        },
        onProgress: (progress) => {
          updateItemStatus(fileItem.id, { progress });
        },
        onComplete: (resultBytes) => {
          setIsProcessing(false);
          updateItemStatus(fileItem.id, { status: 'complete', progress: 100 });

          // Download output
          const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' });
          const date = new Date().toISOString().split('T')[0];
          downloadBlob(blob, `deleted-pages-${date}.pdf`);

          cancelWorkerRef.current = null;
        },
        onError: (error) => {
          setIsProcessing(false);
          setGlobalError(error);
          updateItemStatus(fileItem.id, { status: 'error', error });
          cancelWorkerRef.current = null;
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare file for page deletion.';
      setIsProcessing(false);
      setGlobalError(message);
      updateItemStatus(fileItem.id, { status: 'error', error: message });
    }
  };

  const handleCancel = () => {
    if (cancelWorkerRef.current) {
      cancelWorkerRef.current();
      cancelWorkerRef.current = null;
    }
    setIsProcessing(false);
    queue.forEach((item) => {
      if (item.status === 'processing') {
        updateItemStatus(item.id, { status: 'idle', progress: 0 });
      }
    });
  };

  return (
    <ToolLayout
      title="Delete Pages"
      description="Remove unwanted pages or page ranges from your PDF file."
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
        <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-neutral-300 mb-2">
            Pages to Delete
          </label>
          <p className="text-xs text-neutral-500 mb-3">
            Specify page numbers and/or ranges separated by commas (e.g. <span className="text-neutral-300 font-mono">1, 3, 5-8</span>).
          </p>
          <input
            type="text"
            placeholder="e.g. 2, 4-6, 8"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
          />

          {parsed && !parsed.error && (
            <div className="mt-3 text-xs text-neutral-400 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Will remove {parsed.pages.length} {parsed.pages.length === 1 ? 'page' : 'pages'}: <span className="text-neutral-200 font-mono">{parsed.pages.join(', ')}</span></span>
            </div>
          )}
        </div>
      )}

      <FileQueue items={queue} onRemove={removeFile} onClear={clearQueue} />

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
              onClick={handleDeletePages}
              disabled={queue.length !== 1 || !pageInput.trim()}
              className="px-8 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none"
            >
              Delete Pages
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
