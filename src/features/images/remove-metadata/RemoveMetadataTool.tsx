import { useState, useCallback, useRef } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  MapPinOff, 
  Camera, 
  Clock, 
  UserX,
  FileCheck2
} from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validateImages } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { formatFileSize, downloadBlob } from '../../../shared/utils/file';
import type { RemoveMetadataWorkerPayload, CleanedImageResult } from './worker';

export function RemoveMetadataTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [results, setResults] = useState<CleanedImageResult[] | null>(null);

  const cancelWorkerRef = useRef<(() => void) | null>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setResults(null);
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

  const handleRemoveMetadata = async () => {
    if (queue.length === 0) {
      setGlobalError('Please select at least one image.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);
    setResults(null);

    try {
      const images = await Promise.all(
        queue.map(async (item) => {
          const buffer = await item.file.arrayBuffer();
          return {
            name: item.file.name,
            buffer,
            mimeType: item.file.type || 'image/jpeg',
          };
        })
      );

      queue.forEach((item) => updateItemStatus(item.id, { status: 'processing', progress: 5 }));

      const workerFactory = () =>
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<RemoveMetadataWorkerPayload, CleanedImageResult[]>({
        workerFactory,
        payload: { images },
        onProgress: (progress) => {
          queue.forEach((item) => updateItemStatus(item.id, { progress }));
        },
        onComplete: (cleanedResults) => {
          setIsProcessing(false);
          queue.forEach((item) => updateItemStatus(item.id, { status: 'complete', progress: 100 }));
          setResults(cleanedResults);

          // Automated staggered downloads
          cleanedResults.forEach((res, idx) => {
            const blob = new Blob([res.buffer], { type: res.mimeType });
            setTimeout(() => {
              downloadBlob(blob, res.name);
            }, idx * 150);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sanitize image metadata.';
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

  const handleDownloadAllAgain = () => {
    if (!results) return;
    results.forEach((res, idx) => {
      const blob = new Blob([res.buffer], { type: res.mimeType });
      setTimeout(() => {
        downloadBlob(blob, res.name);
      }, idx * 150);
    });
  };

  return (
    <ToolLayout
      title="Remove Metadata"
      description="Scrub EXIF data, GPS location coordinates, camera properties, and timestamps before sharing."
    >
      <div className="flex flex-col gap-8">
        {globalError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        {/* Success Banner */}
        {results && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Metadata Scrubbed Successfully!</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    {results.length} Cleaned
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  All GPS coordinates, EXIF tags, device serials, and timestamps have been permanently stripped.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadAllAgain}
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
            accept="image/*,.png,.jpg,.jpeg,.webp,.avif"
            multiple={true}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <FileQueue
              items={queue}
              onRemove={removeFile}
              onClear={() => {
                clearQueue();
                setResults(null);
                setGlobalError(null);
              }}
            />

            {/* Privacy Protection Summary Card */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-white font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>What Will Be Removed</span>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: <MapPinOff className="w-5 h-5 text-rose-400" />,
                    title: 'GPS Coordinates',
                    desc: 'Latitude, longitude, altitude, and location name tags.',
                  },
                  {
                    icon: <Camera className="w-5 h-5 text-amber-400" />,
                    title: 'Device & Camera',
                    desc: 'Phone/camera model, lens serial, ISO, exposure, f-number.',
                  },
                  {
                    icon: <Clock className="w-5 h-5 text-cyan-400" />,
                    title: 'Timestamps',
                    desc: 'Exact capture timestamp, timezone, and modification dates.',
                  },
                  {
                    icon: <UserX className="w-5 h-5 text-purple-400" />,
                    title: 'Creator & Software',
                    desc: 'Author copyright, Photoshop/Lightroom history, IPTC tags.',
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/40 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      {feature.icon}
                      <span className="text-sm font-semibold text-white">{feature.title}</span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
                <FileCheck2 className="w-4 h-4 text-neutral-400" />
                <span>100% Client-Side Processing: Image pixel data remains untouched and pixel-perfect.</span>
              </div>
            </div>

            {/* Results Inspection List (if completed) */}
            {results && results.length > 0 && (
              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-white">Cleaned Images Overview</h4>
                <div className="divide-y divide-neutral-800">
                  {results.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white font-medium">{item.name}</span>
                        <div className="text-neutral-500 mt-0.5">
                          {formatFileSize(item.originalSizeBytes)} &rarr; {formatFileSize(item.cleanedSizeBytes)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Stripped</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  clearQueue();
                  setResults(null);
                  setGlobalError(null);
                }}
                disabled={isProcessing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors disabled:opacity-50"
              >
                Clear Images
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
                  onClick={handleRemoveMetadata}
                  disabled={isProcessing || queue.length === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isProcessing ? 'Removing Metadata...' : 'Remove Metadata'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
