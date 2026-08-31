import type { WorkerMessage } from '../../../shared/workers/workerDispatcher';

export interface ConvertWorkerPayload {
  images: { name: string; buffer: ArrayBuffer; mimeType: string }[];
  targetFormat: 'png' | 'jpeg' | 'webp';
  quality?: number; // for jpeg/webp (e.g. 0.92)
}

export interface ConvertedImageResult {
  name: string;
  buffer: ArrayBuffer;
  mimeType: string;
}

function getMimeForFormat(format: 'png' | 'jpeg' | 'webp'): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
  }
}

function getExtensionForFormat(format: 'png' | 'jpeg' | 'webp'): string {
  switch (format) {
    case 'png':
      return '.png';
    case 'jpeg':
      return '.jpg';
    case 'webp':
      return '.webp';
  }
}

self.onmessage = async (e: MessageEvent<WorkerMessage<ConvertWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { images, targetFormat, quality = 0.92 } = message.payload;

    if (!images || images.length === 0) {
      throw new Error('At least one image is required to convert.');
    }

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    const results: ConvertedImageResult[] = [];
    const total = images.length;
    const targetMime = getMimeForFormat(targetFormat);
    const targetExt = getExtensionForFormat(targetFormat);

    for (let i = 0; i < total; i++) {
      const item = images[i];

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
        throw new Error('Failed to obtain 2D canvas context.');
      }

      // If converting to JPEG, fill canvas with white background to handle transparency cleanly
      if (targetFormat === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, bitmap.width, bitmap.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0);

      const convertedBlob = await canvas.convertToBlob({
        type: targetMime,
        quality: targetFormat === 'png' ? undefined : quality,
      });

      const convertedBuffer = await convertedBlob.arrayBuffer();

      const dotIdx = item.name.lastIndexOf('.');
      const baseName = dotIdx > 0 ? item.name.slice(0, dotIdx) : item.name;
      const newFileName = `${baseName}${targetExt}`;

      results.push({
        name: newFileName,
        buffer: convertedBuffer,
        mimeType: targetMime,
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
      payload: error.message || 'An unknown error occurred during image conversion.',
    });
  }
};
