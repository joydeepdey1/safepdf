import { useState, useCallback, useRef } from 'react';
import { Images, FileText, LayoutTemplate } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validateImages } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { ImagesToPdfWorkerPayload } from './worker';

type PageSizeOption = 'fit' | 'a4-portrait' | 'a4-landscape';

export function ImagesToPdfTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [pageSize, setPageSize] = useState<PageSizeOption>('fit');
  const [margin, setMargin] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Active worker cancellation
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      const { valid, errors } = validateImages(files);

      if (errors.length > 0) {
        setGlobalError(errors[0]);
      }

      if (valid.length > 0) {
        addFiles(valid);
      }
    },
    [addFiles]
  );

  const handleConvert = async () => {
    if (queue.length === 0) {
      setGlobalError('Please add at least one image file.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);

    try {
      // Validate all files
      const { valid, errors } = validateImages(queue.map((q) => q.file));
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors[0]}`);
      }

      // Read images to ArrayBuffers
      const images = await Promise.all(
        valid.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return {
            name: file.name,
            buffer,
            mimeType: file.type || 'image/jpeg',
          };
        })
      );

      queue.forEach((item) => updateItemStatus(item.id, { status: 'processing', progress: 0 }));

      const workerFactory = () =>
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<ImagesToPdfWorkerPayload, Uint8Array>({
        workerFactory,
        payload: {
          images,
          pageSize,
          margin,
        },
        onProgress: (progress) => {
          queue.forEach((item) => updateItemStatus(item.id, { progress }));
        },
        onComplete: (resultBytes) => {
          setIsProcessing(false);
          queue.forEach((item) => updateItemStatus(item.id, { status: 'complete', progress: 100 }));

          // Download output PDF
          const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
          const date = new Date().toISOString().split('T')[0];
          downloadBlob(blob, `images-${date}.pdf`);

          cancelWorkerRef.current = null;
        },
        onError: (error) => {
          setIsProcessing(false);
          setGlobalError(error);
          queue.forEach((item) => updateItemStatus(item.id, { status: 'error', error }));
          cancelWorkerRef.current = null;
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setGlobalError(err.message || 'Failed to prepare images for conversion.');
      queue.forEach((item) => updateItemStatus(item.id, { status: 'error', error: err.message }));
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
      title="Images to PDF"
      description="Convert and combine your JPEG, PNG, or WebP images into a single PDF document."
    >
      <Dropzone
        onFilesSelected={handleFilesSelected}
        accept="image/*,image/jpeg,image/png,image/webp,image/avif"
        multiple={true}
        className="mb-8"
      />

      {globalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
          {globalError}
        </div>
      )}

      {queue.length > 0 && (
        <div className="mb-6 grid md:grid-cols-2 gap-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          {/* Page Sizing */}
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-blue-400" />
              <span>Page Layout & Sizing</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPageSize('fit')}
                disabled={isProcessing}
                className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  pageSize === 'fit'
                    ? 'border-blue-500 bg-blue-600/15 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                Fit Image
                <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">Original aspect</span>
              </button>

              <button
                type="button"
                onClick={() => setPageSize('a4-portrait')}
                disabled={isProcessing}
                className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  pageSize === 'a4-portrait'
                    ? 'border-blue-500 bg-blue-600/15 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                A4 Portrait
                <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">Standard page</span>
              </button>

              <button
                type="button"
                onClick={() => setPageSize('a4-landscape')}
                disabled={isProcessing}
                className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  pageSize === 'a4-landscape'
                    ? 'border-blue-500 bg-blue-600/15 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                A4 Landscape
                <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">Wide page</span>
              </button>
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Page Margins</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMargin(0)}
                disabled={isProcessing}
                className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  margin === 0
                    ? 'border-emerald-500 bg-emerald-600/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                No Margin
                <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">0 pt</span>
              </button>

              <button
                type="button"
                onClick={() => setMargin(20)}
                disabled={isProcessing}
                className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  margin === 20
                    ? 'border-emerald-500 bg-emerald-600/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                Small
                <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">20 pt</span>
              </button>

              <button
                type="button"
                onClick={() => setMargin(36)}
                disabled={isProcessing}
                className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  margin === 36
                    ? 'border-emerald-500 bg-emerald-600/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                Standard
                <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">36 pt (0.5 in)</span>
              </button>
            </div>
          </div>
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
              onClick={handleConvert}
              disabled={queue.length === 0}
              className="px-8 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none flex items-center gap-2"
            >
              <Images className="w-5 h-5" />
              <span>Convert to PDF</span>
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
