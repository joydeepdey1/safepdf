import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Crop as CropIcon, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Maximize2, 
  Square
} from 'lucide-react';
import { ToolLayout } from '../../../shared/components/ToolLayout';
import { Dropzone } from '../../../shared/components/Dropzone';
import { FileQueue } from '../../../shared/components/FileQueue';
import { useFileQueue } from '../../../shared/hooks/useFileQueue';
import { validateImages } from '../../../shared/validation/fileValidation';
import { dispatchWorkerJob } from '../../../shared/workers/workerDispatcher';
import { downloadBlob } from '../../../shared/utils/file';
import type { CropWorkerPayload, CroppedImageResult } from './worker';

type AspectRatioPreset = 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:2';

const ASPECT_RATIOS: { id: AspectRatioPreset; label: string; ratio: number | null }[] = [
  { id: 'free', label: 'Freeform', ratio: null },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '16:9', label: '16:9 Landscape', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: '3:2', label: '3:2 Photo', ratio: 3 / 2 },
];

export function CropTool() {
  const { queue, addFiles, clearQueue, updateItemStatus } = useFileQueue();
  const [selectedPreset, setSelectedPreset] = useState<AspectRatioPreset>('free');
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [result, setResult] = useState<CroppedImageResult | null>(null);

  // Image & Display geometry
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Crop box in display pixels relative to the image element
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cancelWorkerRef = useRef<(() => void) | null>(null);

  // Drag interaction state
  const dragRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
    startX: number;
    startY: number;
    initialBox: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setResult(null);
      const { valid, errors } = validateImages(files);

      if (errors.length > 0) {
        setGlobalError(errors[0]);
      }

      if (valid.length > 0) {
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
        clearQueue();
        const firstFile = valid[0];
        addFiles([firstFile]);
        const url = URL.createObjectURL(firstFile);
        setImageUrl(url);
      }
    },
    [addFiles, clearQueue, imageUrl]
  );

  // When image loads, compute display scale and initialize crop box
  const handleImageLoaded = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setNaturalSize({ width: natW, height: natH });

    const dispW = img.clientWidth;
    const dispH = img.clientHeight;
    setDisplaySize({ width: dispW, height: dispH });

    // Center an initial 80% crop box
    const initW = Math.round(dispW * 0.8);
    const initH = Math.round(dispH * 0.8);
    const initX = Math.round((dispW - initW) / 2);
    const initY = Math.round((dispH - initH) / 2);

    setCropBox({
      x: initX,
      y: initY,
      width: initW,
      height: initH,
    });
  };

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!imageRef.current || !naturalSize) return;
      const img = imageRef.current;
      const newDispW = img.clientWidth;
      const newDispH = img.clientHeight;

      if (displaySize.width > 0 && displaySize.height > 0) {
        const scaleX = newDispW / displaySize.width;
        const scaleY = newDispH / displaySize.height;

        setCropBox((prev) => ({
          x: Math.round(prev.x * scaleX),
          y: Math.round(prev.y * scaleY),
          width: Math.round(prev.width * scaleX),
          height: Math.round(prev.height * scaleY),
        }));
      }
      setDisplaySize({ width: newDispW, height: newDispH });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displaySize, naturalSize]);

  // Apply aspect ratio preset
  const applyAspectRatio = (presetId: AspectRatioPreset) => {
    setSelectedPreset(presetId);
    const target = ASPECT_RATIOS.find((p) => p.id === presetId);
    if (!target || target.ratio === null || displaySize.width === 0 || displaySize.height === 0) return;

    const ratio = target.ratio;
    setCropBox((prev) => {
      let newW = prev.width;
      let newH = Math.round(newW / ratio);

      if (newH > displaySize.height) {
        newH = displaySize.height;
        newW = Math.round(newH * ratio);
      }
      if (newW > displaySize.width) {
        newW = displaySize.width;
        newH = Math.round(newW / ratio);
      }

      const newX = Math.max(0, Math.min(displaySize.width - newW, Math.round((displaySize.width - newW) / 2)));
      const newY = Math.max(0, Math.min(displaySize.height - newH, Math.round((displaySize.height - newH) / 2)));

      return {
        x: newX,
        y: newY,
        width: Math.max(20, newW),
        height: Math.max(20, newH),
      };
    });
  };

  // Select all (full image bounds)
  const handleSelectAll = () => {
    setSelectedPreset('free');
    setCropBox({
      x: 0,
      y: 0,
      width: displaySize.width,
      height: displaySize.height,
    });
  };

  // Pointer drag listeners for moving and resizing
  const startDrag = (
    e: React.PointerEvent,
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialBox: { ...cropBox },
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      const { type: handleType, startX, startY, initialBox } = dragRef.current;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setCropBox(() => {
        let { x, y, width, height } = initialBox;
        const currentPreset = ASPECT_RATIOS.find((p) => p.id === selectedPreset);
        const ratio = currentPreset?.ratio ?? null;

        if (handleType === 'move') {
          x = Math.max(0, Math.min(displaySize.width - width, x + dx));
          y = Math.max(0, Math.min(displaySize.height - height, y + dy));
          return { x, y, width, height };
        }

        if (handleType.includes('e')) {
          width = Math.max(20, Math.min(displaySize.width - x, initialBox.width + dx));
          if (ratio) height = Math.round(width / ratio);
        }
        if (handleType.includes('s')) {
          height = Math.max(20, Math.min(displaySize.height - y, initialBox.height + dy));
          if (ratio) width = Math.round(height * ratio);
        }
        if (handleType.includes('w')) {
          const maxDx = initialBox.width - 20;
          const clampedDx = Math.min(maxDx, Math.max(-initialBox.x, dx));
          x = initialBox.x + clampedDx;
          width = initialBox.width - clampedDx;
          if (ratio) height = Math.round(width / ratio);
        }
        if (handleType.includes('n')) {
          const maxDy = initialBox.height - 20;
          const clampedDy = Math.min(maxDy, Math.max(-initialBox.y, dy));
          y = initialBox.y + clampedDy;
          height = initialBox.height - clampedDy;
          if (ratio) width = Math.round(height * ratio);
        }

        // Clamp inside container bounds
        if (x + width > displaySize.width) width = displaySize.width - x;
        if (y + height > displaySize.height) height = displaySize.height - y;

        return {
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.max(20, width),
          height: Math.max(20, height),
        };
      });
    };

    const onPointerUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Convert crop box to actual original pixel dimensions
  const getNaturalCrop = () => {
    if (!naturalSize || displaySize.width === 0 || displaySize.height === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const scaleX = naturalSize.width / displaySize.width;
    const scaleY = naturalSize.height / displaySize.height;

    return {
      x: Math.round(cropBox.x * scaleX),
      y: Math.round(cropBox.y * scaleY),
      width: Math.round(cropBox.width * scaleX),
      height: Math.round(cropBox.height * scaleY),
    };
  };

  const naturalCrop = getNaturalCrop();

  const handleCrop = async () => {
    if (queue.length === 0 || !naturalSize) {
      setGlobalError('Please select an image to crop.');
      return;
    }

    const fileItem = queue[0];
    setIsProcessing(true);
    setGlobalError(null);
    setResult(null);

    try {
      const buffer = await fileItem.file.arrayBuffer();
      updateItemStatus(fileItem.id, { status: 'processing', progress: 10 });

      const workerFactory = () =>
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      cancelWorkerRef.current = dispatchWorkerJob<CropWorkerPayload, CroppedImageResult>({
        workerFactory,
        payload: {
          file: {
            name: fileItem.file.name,
            buffer,
            mimeType: fileItem.file.type,
          },
          crop: naturalCrop,
        },
        onProgress: (progress) => {
          updateItemStatus(fileItem.id, { progress });
        },
        onComplete: (res) => {
          setIsProcessing(false);
          updateItemStatus(fileItem.id, { status: 'complete', progress: 100 });
          setResult(res);

          // Automated download
          const blob = new Blob([res.buffer as unknown as BlobPart], { type: res.mimeType });
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
      const message = err instanceof Error ? err.message : 'Failed to crop image.';
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

  const handleClear = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setNaturalSize(null);
    setDisplaySize({ width: 0, height: 0 });
    clearQueue();
    setResult(null);
    setGlobalError(null);
  };

  return (
    <ToolLayout
      title="Crop Image"
      description="Trim photos and graphics with aspect ratio presets or custom freeform selections."
    >
      <div className="flex flex-col gap-8">
        {globalError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{globalError}</p>
          </div>
        )}

        {/* Success Banner */}
        {result && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Image Cropped Successfully!</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  New size: <span className="text-emerald-300 font-semibold">{result.width} × {result.height} px</span> (from {result.originalWidth} × {result.originalHeight} px)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const blob = new Blob([result.buffer as unknown as BlobPart], { type: result.mimeType });
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
            accept="image/*,.png,.jpg,.jpeg,.webp"
            multiple={false}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <FileQueue
              items={queue}
              onRemove={handleClear}
              onClear={handleClear}
            />

            {/* Interactive Cropper Canvas Workspace */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <CropIcon className="w-4 h-4 text-cyan-400" />
                  <span>Crop Area Selection</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Select All</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAspectRatio('1:1')}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Square (1:1)</span>
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Presets */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-medium text-neutral-400">Aspect Ratio Presets:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ASPECT_RATIOS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyAspectRatio(preset.id)}
                      disabled={isProcessing}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        selectedPreset === preset.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-sm'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cropper Container */}
              <div
                ref={containerRef}
                className="relative select-none overflow-hidden rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-center min-h-[320px] max-h-[580px] p-2"
              >
                {imageUrl && (
                  <div className="relative inline-block leading-none">
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt="Crop Source"
                      onLoad={handleImageLoaded}
                      className="max-h-[540px] max-w-full w-auto h-auto block select-none pointer-events-none rounded-lg"
                      draggable={false}
                    />

                    {/* Dark Backdrop Mask with Cutout Hole */}
                    {displaySize.width > 0 && cropBox.width > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'rgba(0, 0, 0, 0.55)',
                          clipPath: `polygon(
                            0% 0%, 0% 100%, 100% 100%, 100% 0%,
                            ${cropBox.x}px 0%,
                            ${cropBox.x}px ${cropBox.y + cropBox.height}px,
                            ${cropBox.x + cropBox.width}px ${cropBox.y + cropBox.height}px,
                            ${cropBox.x + cropBox.width}px ${cropBox.y}px,
                            ${cropBox.x}px ${cropBox.y}px,
                            ${cropBox.x}px 0%
                          )`,
                        }}
                      />
                    )}

                    {/* Interactive Crop Box */}
                    {displaySize.width > 0 && cropBox.width > 0 && (
                      <div
                        className="absolute cursor-move border-2 border-cyan-400 shadow-2xl rounded-sm"
                        style={{
                          left: `${cropBox.x}px`,
                          top: `${cropBox.y}px`,
                          width: `${cropBox.width}px`,
                          height: `${cropBox.height}px`,
                        }}
                        onPointerDown={(e) => startDrag(e, 'move')}
                      >
                        {/* 3x3 Rule-of-thirds grid */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                          <div className="border-r border-b border-white" />
                          <div className="border-r border-b border-white" />
                          <div className="border-b border-white" />
                          <div className="border-r border-b border-white" />
                          <div className="border-r border-b border-white" />
                          <div className="border-b border-white" />
                          <div className="border-r border-white" />
                          <div className="border-r border-white" />
                          <div />
                        </div>

                        {/* Corner Handles */}
                        <div
                          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow-md"
                          onPointerDown={(e) => startDrag(e, 'nw')}
                        />
                        <div
                          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow-md"
                          onPointerDown={(e) => startDrag(e, 'ne')}
                        />
                        <div
                          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow-md"
                          onPointerDown={(e) => startDrag(e, 'sw')}
                        />
                        <div
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow-md"
                          onPointerDown={(e) => startDrag(e, 'se')}
                        />

                        {/* Edge Handles */}
                        <div
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white/90 border border-cyan-600 rounded-full cursor-ns-resize shadow-sm"
                          onPointerDown={(e) => startDrag(e, 'n')}
                        />
                        <div
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white/90 border border-cyan-600 rounded-full cursor-ns-resize shadow-sm"
                          onPointerDown={(e) => startDrag(e, 's')}
                        />
                        <div
                          className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-6 bg-white/90 border border-cyan-600 rounded-full cursor-ew-resize shadow-sm"
                          onPointerDown={(e) => startDrag(e, 'w')}
                        />
                        <div
                          className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-6 bg-white/90 border border-cyan-600 rounded-full cursor-ew-resize shadow-sm"
                          onPointerDown={(e) => startDrag(e, 'e')}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Crop Stats Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 px-1">
                <div>
                  Cropped Dimensions:{' '}
                  <span className="font-semibold text-white">
                    {naturalCrop.width} × {naturalCrop.height} px
                  </span>
                </div>
                {naturalSize && (
                  <div>
                    Original Resolution:{' '}
                    <span className="text-neutral-300">
                      {naturalSize.width} × {naturalSize.height} px
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleClear}
                disabled={isProcessing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-800 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors disabled:opacity-50"
              >
                Clear Image
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
                  onClick={handleCrop}
                  disabled={isProcessing || !naturalSize || cropBox.width <= 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/20 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <CropIcon className="w-4 h-4" />
                  <span>{isProcessing ? 'Cropping...' : 'Crop Image'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
