import { useState, useCallback, useRef } from 'react';
import { RefreshCw, Check, FileCode, FileImage, Image as ImageIcon } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validateImages } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { ConvertWorkerPayload, ConvertedImageResult } from './worker';

type TargetFormat = 'png' | 'jpeg' | 'webp';

export function ConvertTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Active worker cancellation
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setSuccessCount(null);
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
      setGlobalError('Please add at least one image to convert.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);
    setSuccessCount(null);

    try {
      const { valid, errors } = validateImages(queue.map((q) => q.file));
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors[0]}`);
      }

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

      cancelWorkerRef.current = dispatchWorkerJob<ConvertWorkerPayload, ConvertedImageResult[]>({
        workerFactory,
        payload: {
          images,
          targetFormat,
        },
        onProgress: (progress) => {
          queue.forEach((item) => updateItemStatus(item.id, { progress }));
        },
        onComplete: (results) => {
          setIsProcessing(false);
          queue.forEach((item) => updateItemStatus(item.id, { status: 'complete', progress: 100 }));

          // Download all converted files
          results.forEach((res, idx) => {
            const blob = new Blob([res.buffer], { type: res.mimeType });
            setTimeout(() => {
              downloadBlob(blob, res.name);
            }, idx * 150);
          });

          setSuccessCount(results.length);
          cancelWorkerRef.current = null;
        },
        onError: (error) => {
          setIsProcessing(false);
          setGlobalError(error);
          queue.forEach((item) => updateItemStatus(item.id, { status: 'error', error }));
          cancelWorkerRef.current = null;
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare images for conversion.';
      setIsProcessing(false);
      setGlobalError(message);
      queue.forEach((item) => updateItemStatus(item.id, { status: 'error', error: message }));
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
      title="Convert Image"
      description="Convert PNG, JPEG, WebP, or AVIF images instantly in your browser."
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

      {successCount !== null && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>
            Successfully converted {successCount} image{successCount > 1 ? 's' : ''} to {targetFormat.toUpperCase()}! Download started.
          </span>
        </div>
      )}

      {queue.length > 0 && (
        <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Select Target Format</span>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTargetFormat('png')}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all ${
                targetFormat === 'png'
                  ? 'border-blue-500 bg-blue-600/15 text-white shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-white">PNG</span>
              </div>
              <p className="text-xs text-neutral-400 leading-snug">Lossless quality with full transparency support.</p>
            </button>

            <button
              type="button"
              onClick={() => setTargetFormat('jpeg')}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all ${
                targetFormat === 'jpeg'
                  ? 'border-blue-500 bg-blue-600/15 text-white shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileImage className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">JPEG</span>
              </div>
              <p className="text-xs text-neutral-400 leading-snug">Universal compatibility and lightweight size.</p>
            </button>

            <button
              type="button"
              onClick={() => setTargetFormat('webp')}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all ${
                targetFormat === 'webp'
                  ? 'border-blue-500 bg-blue-600/15 text-white shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">WebP</span>
              </div>
              <p className="text-xs text-neutral-400 leading-snug">Modern web format with superior compression.</p>
            </button>
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
              <RefreshCw className="w-4 h-4" />
              <span>Convert to {targetFormat.toUpperCase()}</span>
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
