import { useState, useCallback, useRef } from 'react';
import { Sparkles, Sliders, Check } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validateImages } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob, formatFileSize } from '../../../shared/utils/file';
import type { CompressWorkerPayload, CompressedImageResult } from './worker';

type QualityPreset = 'high' | 'balanced' | 'max' | 'custom';

export function CompressTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [preset, setPreset] = useState<QualityPreset>('balanced');
  const [customQuality, setCustomQuality] = useState<number>(70);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [savingsReport, setSavingsReport] = useState<{
    originalTotal: number;
    compressedTotal: number;
    percent: number;
    count: number;
  } | null>(null);

  // Active worker cancellation
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setSavingsReport(null);
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

  const getEffectiveQuality = (): number => {
    switch (preset) {
      case 'high':
        return 0.85;
      case 'balanced':
        return 0.7;
      case 'max':
        return 0.5;
      case 'custom':
        return customQuality / 100;
    }
  };

  const handleCompress = async () => {
    if (queue.length === 0) {
      setGlobalError('Please add at least one image to compress.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);
    setSavingsReport(null);

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

      cancelWorkerRef.current = dispatchWorkerJob<CompressWorkerPayload, CompressedImageResult[]>({
        workerFactory,
        payload: {
          images,
          quality: getEffectiveQuality(),
        },
        onProgress: (progress) => {
          queue.forEach((item) => updateItemStatus(item.id, { progress }));
        },
        onComplete: (results) => {
          setIsProcessing(false);
          queue.forEach((item) => updateItemStatus(item.id, { status: 'complete', progress: 100 }));

          let totalOrig = 0;
          let totalComp = 0;

          results.forEach((res, idx) => {
            totalOrig += res.originalSizeBytes;
            totalComp += res.compressedSizeBytes;

            const blob = new Blob([res.buffer], { type: res.mimeType });
            const dotIndex = res.name.lastIndexOf('.');
            const base = dotIndex > 0 ? res.name.slice(0, dotIndex) : res.name;
            const ext = dotIndex > 0 ? res.name.slice(dotIndex) : '.jpg';
            const filename = `compressed-${base}${ext}`;

            setTimeout(() => {
              downloadBlob(blob, filename);
            }, idx * 150);
          });

          const diff = Math.max(0, totalOrig - totalComp);
          const savedPercent = totalOrig > 0 ? Math.round((diff / totalOrig) * 100) : 0;

          setSavingsReport({
            originalTotal: totalOrig,
            compressedTotal: totalComp,
            percent: savedPercent,
            count: results.length,
          });

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
      setGlobalError(err.message || 'Failed to prepare images for compression.');
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
      title="Compress Image"
      description="Reduce image file sizes instantly while maintaining excellent visual clarity."
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

      {savingsReport && (
        <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-base text-white">
                Saved {savingsReport.percent}% file size!
              </p>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                {formatFileSize(savingsReport.originalTotal)} → {formatFileSize(savingsReport.compressedTotal)} across {savingsReport.count} image{savingsReport.count > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className="text-xl font-extrabold text-emerald-400">
            -{savingsReport.percent}%
          </span>
        </div>
      )}

      {queue.length > 0 && (
        <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Compression Level</span>
          </label>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setPreset('balanced')}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all ${
                preset === 'balanced'
                  ? 'border-emerald-500 bg-emerald-600/15 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="font-bold text-sm text-emerald-400 mb-0.5">Balanced (Recommended)</div>
              <div className="text-xs text-neutral-400 leading-snug">Great balance of quality and size reduction (~70%).</div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('high')}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all ${
                preset === 'high'
                  ? 'border-emerald-500 bg-emerald-600/15 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="font-bold text-sm text-blue-400 mb-0.5">High Quality</div>
              <div className="text-xs text-neutral-400 leading-snug">Near-lossless clarity with mild compression (85%).</div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('max')}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all ${
                preset === 'max'
                  ? 'border-emerald-500 bg-emerald-600/15 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="font-bold text-sm text-amber-400 mb-0.5">Max Compression</div>
              <div className="text-xs text-neutral-400 leading-snug">Smallest possible file sizes (50% quality).</div>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset(preset === 'custom' ? 'balanced' : 'custom')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{preset === 'custom' ? 'Use preset options' : 'Custom quality slider'}</span>
            </button>

            {preset === 'custom' && (
              <div className="flex items-center gap-3 w-64">
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={customQuality}
                  onChange={(e) => setCustomQuality(Number(e.target.value))}
                  disabled={isProcessing}
                  className="flex-1 accent-emerald-500"
                />
                <span className="text-xs font-mono text-neutral-300 w-8 text-right">
                  {customQuality}%
                </span>
              </div>
            )}
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
              onClick={handleCompress}
              disabled={queue.length === 0}
              className="px-8 py-3 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none"
            >
              Compress {queue.length > 1 ? `${queue.length} Images` : 'Image'}
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
