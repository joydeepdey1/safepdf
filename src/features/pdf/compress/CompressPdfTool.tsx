import { useState, useCallback, useRef } from 'react';
import { Minimize2, Settings, AlertCircle, CheckCircle2, Download, ArrowRight } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validatePDFs } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { formatFileSize, downloadBlob } from '../../../shared/utils/file';
import type { CompressPdfWorkerPayload, CompressedPdfResult, CompressionPreset } from './worker';

export function CompressPdfTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [preset, setPreset] = useState<CompressionPreset>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressedPdfResult | null>(null);

  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setResult(null);
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

  const handleCompress = async () => {
    if (queue.length === 0) {
      setGlobalError('Please upload a PDF document to compress.');
      return;
    }

    const fileItem = queue[0];
    setIsProcessing(true);
    setGlobalError(null);
    setResult(null);

    try {
      const buffer = await fileItem.file.arrayBuffer();
      updateItemStatus(fileItem.id, { status: 'processing', progress: 5 });

      const workerFactory = () =>
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<CompressPdfWorkerPayload, CompressedPdfResult>({
        workerFactory,
        payload: {
          file: { name: fileItem.file.name, buffer },
          preset,
        },
        onProgress: (progress) => {
          updateItemStatus(fileItem.id, { progress });
        },
        onComplete: (res) => {
          setIsProcessing(false);
          updateItemStatus(fileItem.id, { status: 'complete', progress: 100 });
          setResult(res);

          // Automated download
          const blob = new Blob([res.buffer as unknown as BlobPart], { type: 'application/pdf' });
          downloadBlob(blob, res.name);

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
      const message = err instanceof Error ? err.message : 'Failed to prepare PDF for compression.';
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
      title="Compress PDF"
      description="Reduce PDF file size entirely on your device with customizable quality presets."
    >
      <div className="flex flex-col gap-8">
        {globalError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        {/* Compression Result Banner */}
        {result && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">PDF Compressed Successfully!</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    -{result.savingsPercent}%
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {formatFileSize(result.originalSizeBytes)} <ArrowRight className="inline w-3 h-3 mx-1" /> {formatFileSize(result.compressedSizeBytes)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const blob = new Blob([result.buffer as unknown as BlobPart], { type: 'application/pdf' });
                downloadBlob(blob, result.name);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Download Again</span>
            </button>
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
                setResult(null);
                setGlobalError(null);
              }}
            />

            {/* Presets Panel */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-white font-semibold text-sm">
                <Settings className="w-4 h-4 text-blue-400" />
                <span>Compression Level</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'extreme',
                    title: 'Extreme',
                    desc: 'Smallest file size',
                    sub: 'Lower DPI, standard quality',
                  },
                  {
                    id: 'recommended',
                    title: 'Recommended',
                    desc: 'Balanced size & quality',
                    sub: 'Good DPI, crisp clarity',
                  },
                  {
                    id: 'light',
                    title: 'Less',
                    desc: 'Highest quality',
                    sub: 'Modest reduction, near lossless',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id as CompressionPreset)}
                    disabled={isProcessing}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      preset === item.id
                        ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm'
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{item.title}</span>
                      {item.id === 'recommended' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 font-medium border border-blue-800/40">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-300 mb-1">{item.desc}</div>
                    <div className="text-[11px] text-neutral-500">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  clearQueue();
                  setResult(null);
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
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Compressing PDF...' : 'Compress PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
