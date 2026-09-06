import type { WorkerInMessage } from '../../../shared/workers/workerDispatcher';

export interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropWorkerPayload {
  file: {
    name: string;
    buffer: ArrayBuffer;
    mimeType: string;
  };
  crop: CropCoordinates;
}

export interface CroppedImageResult {
  name: string;
  buffer: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

function getSafeExportMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

self.onmessage = async (e: MessageEvent<WorkerInMessage<CropWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { file, crop } = message.payload;

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    const blob = new Blob([file.buffer], { type: file.mimeType || 'image/jpeg' });
    let bitmap: ImageBitmap;

    try {
      bitmap = await createImageBitmap(blob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or corrupted image format.';
      throw new Error(`Failed to decode image "${file.name}": ${msg}`, { cause: err });
    }

    self.postMessage({ type: 'PROGRESS', payload: 35 });

    const origW = bitmap.width;
    const origH = bitmap.height;

    // Constrain crop coordinates safely within image bounds
    const safeX = Math.max(0, Math.min(origW - 1, Math.round(crop.x)));
    const safeY = Math.max(0, Math.min(origH - 1, Math.round(crop.y)));
    const safeW = Math.max(1, Math.min(origW - safeX, Math.round(crop.width)));
    const safeH = Math.max(1, Math.min(origH - safeY, Math.round(crop.height)));

    const canvas = new OffscreenCanvas(safeW, safeH);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create canvas 2D rendering context for cropping.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw only the cropped bounding box from the source image
    ctx.drawImage(bitmap, safeX, safeY, safeW, safeH, 0, 0, safeW, safeH);

    self.postMessage({ type: 'PROGRESS', payload: 70 });

    const exportMime = getSafeExportMimeType(file.mimeType);
    const outputBlob = await canvas.convertToBlob({
      type: exportMime,
      quality: exportMime === 'image/jpeg' || exportMime === 'image/webp' ? 0.95 : undefined,
    });

    const outputBuffer = await outputBlob.arrayBuffer();

    self.postMessage({ type: 'PROGRESS', payload: 95 });

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const extension = exportMime === 'image/png' ? '.png' : exportMime === 'image/webp' ? '.webp' : '.jpg';

    const result: CroppedImageResult = {
      name: `${baseName}-cropped${extension}`,
      buffer: outputBuffer,
      mimeType: exportMime,
      width: safeW,
      height: safeH,
      originalWidth: origW,
      originalHeight: origH,
    };

    self.postMessage({ type: 'PROGRESS', payload: 100 });
    self.postMessage({ type: 'COMPLETE', payload: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during image cropping.';
    self.postMessage({
      type: 'ERROR',
      payload: errorMessage,
    });
  }
};
