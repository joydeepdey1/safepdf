import { useState, useCallback, useRef } from 'react';
import { RotateCw, RotateCcw, ArrowDownUp } from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validatePDFs } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { RotateWorkerPayload } from './worker';

type RotationAngle = 90 | 180 | 270;

export function RotateTool() {
  const { queue, addFiles, removeFile, clearQueue, updateItemStatus } = useFileQueue();
  const [rotationAngle, setRotationAngle] = useState<RotationAngle>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Keep track of the active worker cancellation function
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

  const handleRotate = async () => {
    if (queue.length !== 1) {
      setGlobalError('Please add exactly one PDF file to rotate.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);

    const fileItem = queue[0];

    try {
      // Validate again before processing (defense in depth)
      const { valid, errors } = validatePDFs([fileItem.file]);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors[0]}`);
      }

      // Read file into ArrayBuffer
      const buffer = await valid[0].arrayBuffer();

      updateItemStatus(fileItem.id, { status: 'processing', progress: 0 });

      const workerFactory = () =>
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<RotateWorkerPayload, Uint8Array>({
        workerFactory,
        payload: {
          file: { name: fileItem.file.name, buffer },
          rotationAngle,
        },
        onProgress: (progress) => {
          updateItemStatus(fileItem.id, { progress });
        },
        onComplete: (resultBytes) => {
          setIsProcessing(false);
          updateItemStatus(fileItem.id, { status: 'complete', progress: 100 });

          // Download the result
          const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' });
          const date = new Date().toISOString().split('T')[0];
          downloadBlob(blob, `rotated-${date}.pdf`);

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
      const message = err instanceof Error ? err.message : 'Failed to prepare file for rotation.';
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
      title="Rotate PDF"
      description="Rotate your PDF pages permanently by 90°, 180°, or 270°."
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
          <label className="block text-sm font-semibold text-neutral-300 mb-4">
            Select Rotation Angle
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setRotationAngle(90)}
              disabled={isProcessing}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                rotationAngle === 90
                  ? 'border-blue-500 bg-blue-600/15 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <RotateCw className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">90° Right</span>
              <span className="text-xs text-neutral-500 mt-0.5">Clockwise</span>
            </button>

            <button
              type="button"
              onClick={() => setRotationAngle(180)}
              disabled={isProcessing}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                rotationAngle === 180
                  ? 'border-blue-500 bg-blue-600/15 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <ArrowDownUp className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">180°</span>
              <span className="text-xs text-neutral-500 mt-0.5">Flip Upside-Down</span>
            </button>

            <button
              type="button"
              onClick={() => setRotationAngle(270)}
              disabled={isProcessing}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                rotationAngle === 270
                  ? 'border-blue-500 bg-blue-600/15 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <RotateCcw className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">90° Left</span>
              <span className="text-xs text-neutral-500 mt-0.5">Counter-Clockwise (270°)</span>
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
              onClick={handleRotate}
              disabled={queue.length !== 1}
              className="px-8 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none"
            >
              Rotate PDF
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
