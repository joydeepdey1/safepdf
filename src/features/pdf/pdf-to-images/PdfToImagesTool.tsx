import { useState, useCallback, useRef } from 'react';
import { FileImage, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validatePDFs } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { PdfToImagesWorkerPayload, RenderedPageImage } from './worker';

type FormatOption = 'png' | 'jpeg';
type ScaleOption = 1.0 | 1.5 | 2.0;

export function PdfToImagesTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [format, setFormat] = useState<FormatOption>('png');
  const [scale, setScale] = useState<ScaleOption>(1.5);
  const [quality, setQuality] = useState<number>(0.92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setCompletedCount(null);
      const { valid, errors } = validatePDFs(files);

      if (errors.length > 0) {
        setGlobalError(errors[0]);
      }

      if (valid.length > 0) {
        // Enforce single active PDF file
        clearQueue();
        addFiles([valid[0]]);
      }
    },
    [addFiles, clearQueue]
  );

  const handleConvert = async () => {
    if (queue.length === 0) {
      setGlobalError('Please upload a PDF document.');
      return;
    }

    const fileItem = queue[0];
    setIsProcessing(true);
    setGlobalError(null);
    setCompletedCount(null);

    try {
      const buffer = await fileItem.file.arrayBuffer();
      updateItemStatus(fileItem.id, { status: 'processing', progress: 5 });

      const workerFactory = () =>
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<PdfToImagesWorkerPayload, RenderedPageImage[]>({
        workerFactory,
        payload: {
          file: { name: fileItem.file.name, buffer },
          format,
          scale,
          quality,
        },
        onProgress: (progress) => {
          updateItemStatus(fileItem.id, { progress });
        },
        onComplete: (results) => {
          setIsProcessing(false);
          updateItemStatus(fileItem.id, { status: 'complete', progress: 100 });
          setCompletedCount(results.length);

          // Download all extracted pages sequentially
          results.forEach((item, index) => {
            setTimeout(() => {
              const blob = new Blob([item.buffer as unknown as BlobPart], { type: item.mimeType });
              downloadBlob(blob, item.name);
            }, index * 200);
          });

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
      const message = err instanceof Error ? err.message : 'Failed to prepare PDF for conversion.';
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
      title="PDF to Images"
      description="Render each page of your PDF document into crisp PNG or JPEG images client-side."
    >
      <div className="flex flex-col gap-8">
        {globalError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        {completedCount !== null && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>
              Successfully converted <strong>{completedCount}</strong> page
              {completedCount === 1 ? '' : 's'} to {format.toUpperCase()} images! Downloads started.
            </p>
          </div>
        )}

        {queue.length === 0 ? (
          <Dropzone
            onFilesSelected={handleFilesSelected}
            accept=".pdf,application/pdf"
            multiple={false}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <FileQueue
              items={queue}
              onRemove={removeFile}
              onClear={() => {
                clearQueue();
                setCompletedCount(null);
                setGlobalError(null);
              }}
            />

            {/* Options Panel */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-6">
              <div className="flex items-center gap-2 pb-4 border-b border-neutral-800 text-white font-semibold text-sm">
                <Settings className="w-4 h-4 text-blue-400" />
                <span>Rendering Options</span>
              </div>

              {/* Format selection */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Image Format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    disabled={isProcessing}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      format === 'png'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-sm text-white mb-1">PNG</div>
                    <div className="text-xs text-neutral-400">
                      Lossless, crisp text & graphics
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    disabled={isProcessing}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      format === 'jpeg'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-sm text-white mb-1">JPEG</div>
                    <div className="text-xs text-neutral-400">
                      Smaller size, ideal for photos
                    </div>
                  </button>
                </div>
              </div>

              {/* Scale / Resolution Selection */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Resolution / Quality
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 1.0, label: 'Standard (72 DPI)', desc: 'Fast & small' },
                    { value: 1.5, label: 'High (108 DPI)', desc: 'Recommended' },
                    { value: 2.0, label: 'Ultra (144 DPI)', desc: 'Print quality' },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setScale(preset.value as ScaleOption)}
                      disabled={isProcessing}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        scale === preset.value
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white mb-0.5">
                        {preset.label}
                      </div>
                      <div className="text-[10px] text-neutral-400">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* JPEG Quality Slider (if JPEG) */}
              {format === 'jpeg' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">JPEG Quality</span>
                    <span className="text-white font-bold">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    disabled={isProcessing}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  clearQueue();
                  setCompletedCount(null);
                  setGlobalError(null);
                }}
                disabled={isProcessing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors disabled:opacity-50"
              >
                Clear PDF
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isProcessing && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-700 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <FileImage className="w-4 h-4" />
                  <span>{isProcessing ? 'Converting Pages...' : 'Convert to Images'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
