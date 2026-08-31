import type { WorkerMessage } from '../../../shared/workers/workerDispatcher';

export interface CompressWorkerPayload {
  images: { name: string; buffer: ArrayBuffer; mimeType: string }[];
  quality: number; // 0.1 to 1.0 (e.g. 0.7 for 70%)
  outputFormat?: 'original' | 'jpeg' | 'webp';
}

export interface CompressedImageResult {
  name: string;
  buffer: ArrayBuffer;
  mimeType: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

function resolveMimeType(originalMime: string, requestedFormat?: 'original' | 'jpeg' | 'webp'): string {
  if (requestedFormat === 'jpeg') return 'image/jpeg';
  if (requestedFormat === 'webp') return 'image/webp';
  if (originalMime === 'image/png') {
    // Standard PNG does not support lossy compression in basic canvas convertToBlob, so we convert to WebP or JPEG for actual compression
    return 'image/webp';
  }
  if (originalMime === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

self.onmessage = async (e: MessageEvent<WorkerMessage<CompressWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { images, quality, outputFormat = 'original' } = message.payload;

    if (!images || images.length === 0) {
      throw new Error('At least one image is required to compress.');
    }

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    const results: CompressedImageResult[] = [];
    const total = images.length;
    const clampedQuality = Math.max(0.1, Math.min(1.0, quality));

    for (let i = 0; i < total; i++) {
      const item = images[i];
      const origSize = item.buffer.byteLength;

      const blob = new Blob([item.buffer], { type: item.mimeType || 'image/jpeg' });
      let bitmap: ImageBitmap;

      try {
        bitmap = await createImageBitmap(blob);
      } catch (err: any) {
        throw new Error(`Failed to decode image "${item.name}": ${err.message || 'Invalid or corrupted image file.'}`);
      }

      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to obtain canvas 2D rendering context.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0);

      const targetMime = resolveMimeType(item.mimeType, outputFormat);
      const compressedBlob = await canvas.convertToBlob({
        type: targetMime,
        quality: clampedQuality,
      });

      const compressedBuffer = await compressedBlob.arrayBuffer();

      // Determine output file name with matching extension
      let outputName = item.name;
      const dotIdx = item.name.lastIndexOf('.');
      const baseName = dotIdx > 0 ? item.name.slice(0, dotIdx) : item.name;
      if (targetMime === 'image/webp') {
        outputName = `${baseName}.webp`;
      } else if (targetMime === 'image/jpeg') {
        outputName = `${baseName}.jpg`;
      }

      results.push({
        name: outputName,
        buffer: compressedBuffer,
        mimeType: targetMime,
        originalSizeBytes: origSize,
        compressedSizeBytes: compressedBuffer.byteLength,
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
      payload: error.message || 'An unknown error occurred during image compression.',
    });
  }
};
