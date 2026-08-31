import type { WorkerMessage } from '../../../shared/workers/workerDispatcher';

export interface ResizeWorkerPayload {
  images: { name: string; buffer: ArrayBuffer; mimeType: string }[];
  mode: 'percentage' | 'dimensions';
  percentage?: number; // e.g. 50 (50%)
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio?: boolean;
}

export interface ResizedImageResult {
  name: string;
  buffer: ArrayBuffer;
  mimeType: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
}

function getSafeExportMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

self.onmessage = async (e: MessageEvent<WorkerMessage<ResizeWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { images, mode, percentage = 50, targetWidth, targetHeight, maintainAspectRatio = true } = message.payload;

    if (!images || images.length === 0) {
      throw new Error('At least one image is required to resize.');
    }

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    const results: ResizedImageResult[] = [];
    const total = images.length;

    for (let i = 0; i < total; i++) {
      const item = images[i];

      const blob = new Blob([item.buffer], { type: item.mimeType || 'image/jpeg' });
      let bitmap: ImageBitmap;

      try {
        bitmap = await createImageBitmap(blob);
      } catch (err: any) {
        throw new Error(`Failed to decode image "${item.name}": ${err.message || 'Invalid or corrupted image file.'}`);
      }

      const origW = bitmap.width;
      const origH = bitmap.height;

      let newW = origW;
      let newH = origH;

      if (mode === 'percentage') {
        const factor = Math.max(1, Math.min(500, percentage)) / 100;
        newW = Math.max(1, Math.round(origW * factor));
        newH = Math.max(1, Math.round(origH * factor));
      } else {
        const reqW = targetWidth && targetWidth > 0 ? targetWidth : origW;
        const reqH = targetHeight && targetHeight > 0 ? targetHeight : origH;

        if (maintainAspectRatio) {
          if (targetWidth && !targetHeight) {
            newW = reqW;
            newH = Math.max(1, Math.round((origH / origW) * reqW));
          } else if (targetHeight && !targetWidth) {
            newH = reqH;
            newW = Math.max(1, Math.round((origW / origH) * reqH));
          } else {
            const scale = Math.min(reqW / origW, reqH / origH);
            newW = Math.max(1, Math.round(origW * scale));
            newH = Math.max(1, Math.round(origH * scale));
          }
        } else {
          newW = reqW;
          newH = reqH;
        }
      }

      const canvas = new OffscreenCanvas(newW, newH);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to obtain canvas 2D rendering context.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, newW, newH);

      const exportMime = getSafeExportMimeType(item.mimeType);
      const outputBlob = await canvas.convertToBlob({
        type: exportMime,
        quality: exportMime === 'image/jpeg' || exportMime === 'image/webp' ? 0.92 : undefined,
      });

      const outputBuffer = await outputBlob.arrayBuffer();

      results.push({
        name: item.name,
        buffer: outputBuffer,
        mimeType: exportMime,
        originalWidth: origW,
        originalHeight: origH,
        newWidth: newW,
        newHeight: newH,
      });

      // Stream progress
      const progress = 10 + Math.floor(((i + 1) / total) * 85);
      self.postMessage({ type: 'PROGRESS', payload: progress });
    }

    self.postMessage({ type: 'PROGRESS', payload: 100 });
    self.postMessage({ type: 'COMPLETE', payload: results });
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      payload: error.message || 'An unknown error occurred during image resizing.',
    });
  }
};
