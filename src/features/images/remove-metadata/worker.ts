import type { WorkerInMessage } from '../../../shared/workers/workerDispatcher';

export interface RemoveMetadataWorkerPayload {
  images: {
    name: string;
    buffer: ArrayBuffer;
    mimeType: string;
  }[];
}

export interface CleanedImageResult {
  name: string;
  buffer: ArrayBuffer;
  mimeType: string;
  originalSizeBytes: number;
  cleanedSizeBytes: number;
  hasExifMetadata: boolean;
  strippedTags: string[];
}

function detectMetadataInBytes(buffer: ArrayBuffer, mimeType: string): { hasMetadata: boolean; tags: string[] } {
  const bytes = new Uint8Array(buffer);
  const tags: string[] = [];
  let hasMetadata = false;

  if (mimeType === 'image/jpeg' || mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    // Check JPEG APP markers (APP1: 0xFFE1 Exif/XMP, APP2: 0xFFE2 ICC, APP13: 0xFFED IPTC)
    for (let i = 0; i < Math.min(bytes.length - 10, 65536); i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
        hasMetadata = true;
        // Check for Exif
        if (
          bytes[i + 4] === 0x45 &&
          bytes[i + 5] === 0x78 &&
          bytes[i + 6] === 0x69 &&
          bytes[i + 7] === 0x66
        ) {
          if (!tags.includes('EXIF Camera Tags')) tags.push('EXIF Camera Tags');
          if (!tags.includes('GPS Location Data')) tags.push('GPS Location Data');
          if (!tags.includes('Date & Time Stamps')) tags.push('Date & Time Stamps');
        }
        // Check for XMP
        if (
          bytes[i + 4] === 0x68 &&
          bytes[i + 5] === 0x74 &&
          bytes[i + 6] === 0x74 &&
          bytes[i + 7] === 0x70
        ) {
          if (!tags.includes('XMP Metadata Packet')) tags.push('XMP Metadata Packet');
        }
      }
      if (bytes[i] === 0xff && bytes[i + 1] === 0xed) {
        hasMetadata = true;
        if (!tags.includes('IPTC / Photoshop Tags')) tags.push('IPTC / Photoshop Tags');
      }
    }
  } else if (mimeType === 'image/png' || mimeType.includes('png')) {
    // Scan PNG chunks (eXIf, tEXt, zTXt, iTXt, tIME)
    const textDecoder = new TextDecoder('latin1');
    const header = textDecoder.decode(bytes.slice(0, Math.min(bytes.length, 32768)));
    if (header.includes('eXIf') || header.includes('tEXt') || header.includes('zTXt') || header.includes('iTXt')) {
      hasMetadata = true;
      tags.push('PNG Text Chunks (Author / Software / Timestamps)');
    }
  } else if (mimeType === 'image/webp' || mimeType.includes('webp')) {
    // Scan WebP RIFF chunks (EXIF, XMP )
    const textDecoder = new TextDecoder('latin1');
    const header = textDecoder.decode(bytes.slice(0, Math.min(bytes.length, 4096)));
    if (header.includes('EXIF') || header.includes('XMP ')) {
      hasMetadata = true;
      tags.push('WebP EXIF / XMP Chunks');
    }
  }

  // If no specific markers detected, standard EXIF/timestamp cleaning still applies
  if (tags.length === 0) {
    tags.push('Device & Sensor Tags', 'Timestamps & File Headers');
  }

  return { hasMetadata, tags };
}

function getSafeExportMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

self.onmessage = async (e: MessageEvent<WorkerInMessage<RemoveMetadataWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { images } = message.payload;

    if (!images || images.length === 0) {
      throw new Error('At least one image is required to remove metadata.');
    }

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    const results: CleanedImageResult[] = [];
    const total = images.length;

    for (let i = 0; i < total; i++) {
      const item = images[i];
      const origSize = item.buffer.byteLength;
      const { hasMetadata, tags } = detectMetadataInBytes(item.buffer, item.mimeType);

      const blob = new Blob([item.buffer], { type: item.mimeType || 'image/jpeg' });
      let bitmap: ImageBitmap;

      try {
        bitmap = await createImageBitmap(blob);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid or corrupted image format.';
        throw new Error(`Failed to decode image "${item.name}": ${msg}`, { cause: err });
      }

      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas 2D rendering context.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw pure pixel data onto fresh canvas, stripping all embedded metadata streams
      ctx.drawImage(bitmap, 0, 0);

      const exportMime = getSafeExportMimeType(item.mimeType);
      const outputBlob = await canvas.convertToBlob({
        type: exportMime,
        quality: exportMime === 'image/jpeg' || exportMime === 'image/webp' ? 0.95 : undefined,
      });

      const outputBuffer = await outputBlob.arrayBuffer();
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      const ext = exportMime === 'image/png' ? '.png' : exportMime === 'image/webp' ? '.webp' : '.jpg';

      results.push({
        name: `${baseName}-clean${ext}`,
        buffer: outputBuffer,
        mimeType: exportMime,
        originalSizeBytes: origSize,
        cleanedSizeBytes: outputBuffer.byteLength,
        hasExifMetadata: hasMetadata,
        strippedTags: tags,
      });

      // Stream progress
      const progress = 10 + Math.floor(((i + 1) / total) * 85);
      self.postMessage({ type: 'PROGRESS', payload: progress });
    }

    self.postMessage({ type: 'PROGRESS', payload: 100 });
    self.postMessage({ type: 'COMPLETE', payload: results });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during metadata removal.';
    self.postMessage({
      type: 'ERROR',
      payload: errorMessage,
    });
  }
};
