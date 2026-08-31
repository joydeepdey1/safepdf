import { useState, useCallback, useRef } from 'react';
import { Scaling, Percent, Lock, Unlock, Check } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validateImages } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { ResizeWorkerPayload, ResizedImageResult } from './worker';

type ResizeMode = 'percentage' | 'dimensions';

export function ResizeTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [mode, setMode] = useState<ResizeMode>('percentage');
  const [percentage, setPercentage] = useState<number>(50);
  const [targetWidth, setTargetWidth] = useState<string>('1200');
  const [targetHeight, setTargetHeight] = useState<string>('800');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [processedSummary, setProcessedSummary] = useState<string | null>(null);

  // Active worker cancellation
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setProcessedSummary(null);
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

  const handleResize = async () => {
    if (queue.length === 0) {
      setGlobalError('Please add at least one image to resize.');
      return;
    }

    if (mode === 'dimensions') {
      const parsedW = parseInt(targetWidth, 10);
      const parsedH = parseInt(targetHeight, 10);
      if ((!parsedW || parsedW <= 0) && (!parsedH || parsedH <= 0)) {
        setGlobalError('Please enter a valid positive width or height in pixels.');
        return;
      }
    }

    setIsProcessing(true);
    setGlobalError(null);
    setProcessedSummary(null);

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

      cancelWorkerRef.current = dispatchWorkerJob<ResizeWorkerPayload, ResizedImageResult[]>({
        workerFactory,
        payload: {
          images,
          mode,
          percentage: mode === 'percentage' ? percentage : undefined,
          targetWidth: mode === 'dimensions' && targetWidth ? parseInt(targetWidth, 10) : undefined,
          targetHeight: mode === 'dimensions' && targetHeight ? parseInt(targetHeight, 10) : undefined,
          maintainAspectRatio,
        },
        onProgress: (progress) => {
          queue.forEach((item) => updateItemStatus(item.id, { progress }));
        },
        onComplete: (results) => {
          setIsProcessing(false);
          queue.forEach((item) => updateItemStatus(item.id, { status: 'complete', progress: 100 }));

          // Trigger downloads for each resized image
          results.forEach((res, idx) => {
            const blob = new Blob([res.buffer], { type: res.mimeType });
            const dotIndex = res.name.lastIndexOf('.');
            const base = dotIndex > 0 ? res.name.slice(0, dotIndex) : res.name;
            const ext = dotIndex > 0 ? res.name.slice(dotIndex) : '.jpg';
            const filename = `resized-${base}${ext}`;

            // Stagger slightly if multiple to avoid browser download block
            setTimeout(() => {
              downloadBlob(blob, filename);
            }, idx * 150);
          });

          setProcessedSummary(
            `Successfully resized ${results.length} image${results.length > 1 ? 's' : ''}. Download has started!`
          );
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
      setGlobalError(err.message || 'Failed to prepare images for resizing.');
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
      title="Resize Image"
      description="Scale your images by percentage or exact pixel dimensions with high quality."
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

      {processedSummary && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{processedSummary}</span>
        </div>
      )}

      {queue.length > 0 && (
        <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          {/* Mode Switcher */}
          <div className="flex gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 mb-6 max-w-sm">
            <button
              type="button"
              onClick={() => setMode('percentage')}
              disabled={isProcessing}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'percentage'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>By Percentage</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('dimensions')}
              disabled={isProcessing}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'dimensions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Scaling className="w-3.5 h-3.5" />
              <span>By Dimensions</span>
            </button>
          </div>

          {/* Mode 1: Percentage */}
          {mode === 'percentage' ? (
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-3">
                Scale Percentage
              </label>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPercentage(pct)}
                    disabled={isProcessing}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all text-center ${
                      percentage === pct
                        ? 'border-blue-500 bg-blue-600/15 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                        : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  disabled={isProcessing}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm font-mono text-neutral-300 w-12 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          ) : (
            /* Mode 2: Dimensions */
            <div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Target Width (px)
                  </label>
                  <input
                    type="number"
                    min="10"
                    placeholder="e.g. 1920"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Target Height (px)
                  </label>
                  <input
                    type="number"
                    min="10"
                    placeholder="e.g. 1080"
                    value={targetHeight}
                    onChange={(e) => setTargetHeight(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
              >
                {maintainAspectRatio ? (
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-neutral-500" />
                )}
                <span>Maintain aspect ratio (recommended)</span>
              </button>
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
              onClick={handleResize}
              disabled={queue.length === 0}
              className="px-8 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none"
            >
              Resize {queue.length > 1 ? `${queue.length} Images` : 'Image'}
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
