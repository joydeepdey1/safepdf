import { PDFDocument } from 'pdf-lib';
import type { WorkerInMessage } from '../../../shared/workers/workerDispatcher';

export interface ImagesToPdfWorkerPayload {
  images: { name: string; buffer: ArrayBuffer; mimeType: string }[];
  pageSize: 'fit' | 'a4-portrait' | 'a4-landscape';
  margin: number; // in points (e.g. 0, 20, 36)
}

// A4 dimensions in points (72 points per inch)
const A4_PORTRAIT = { width: 595.28, height: 841.89 };
const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

async function convertToPngArrayBuffer(buffer: ArrayBuffer, mimeType: string): Promise<ArrayBuffer> {
  const blob = new Blob([buffer], { type: mimeType });
  const imageBitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for image conversion.');
  }
  ctx.drawImage(imageBitmap, 0, 0);
  const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
  return await pngBlob.arrayBuffer();
}

self.onmessage = async (e: MessageEvent<WorkerInMessage<ImagesToPdfWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { images, pageSize, margin } = message.payload;

    if (!images || images.length === 0) {
      throw new Error('At least one image is required to generate a PDF.');
    }

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    const pdfDoc = await PDFDocument.create();
    const total = images.length;

    for (let i = 0; i < total; i++) {
      const item = images[i];
      let embeddedImage;

      try {
        const isJpg = item.mimeType === 'image/jpeg' || item.name.toLowerCase().endsWith('.jpg') || item.name.toLowerCase().endsWith('.jpeg');
        const isPng = item.mimeType === 'image/png' || item.name.toLowerCase().endsWith('.png');

        if (isJpg) {
          try {
            embeddedImage = await pdfDoc.embedJpg(item.buffer);
          } catch {
            // Fallback converting through canvas
            const converted = await convertToPngArrayBuffer(item.buffer, item.mimeType);
            embeddedImage = await pdfDoc.embedPng(converted);
          }
        } else if (isPng) {
          try {
            embeddedImage = await pdfDoc.embedPng(item.buffer);
          } catch {
            const converted = await convertToPngArrayBuffer(item.buffer, item.mimeType);
            embeddedImage = await pdfDoc.embedPng(converted);
          }
        } else {
          // WebP, AVIF, GIF, etc.
          const converted = await convertToPngArrayBuffer(item.buffer, item.mimeType);
          embeddedImage = await pdfDoc.embedPng(converted);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid or corrupted image format.';
        throw new Error(`Failed to process image "${item.name}": ${msg}`, { cause: err });
      }

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      let targetPageWidth = 0;
      let targetPageHeight = 0;
      let drawWidth = 0;
      let drawHeight = 0;
      let drawX = 0;
      let drawY = 0;

      if (pageSize === 'fit') {
        targetPageWidth = imgWidth + margin * 2;
        targetPageHeight = imgHeight + margin * 2;
        drawWidth = imgWidth;
        drawHeight = imgHeight;
        drawX = margin;
        drawY = margin;
      } else {
        const standard = pageSize === 'a4-portrait' ? A4_PORTRAIT : A4_LANDSCAPE;
        targetPageWidth = standard.width;
        targetPageHeight = standard.height;

        const availWidth = Math.max(10, targetPageWidth - margin * 2);
        const availHeight = Math.max(10, targetPageHeight - margin * 2);

        const widthRatio = availWidth / imgWidth;
        const heightRatio = availHeight / imgHeight;
        const scale = Math.min(widthRatio, heightRatio);

        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;

        // Center within available content area
        drawX = margin + (availWidth - drawWidth) / 2;
        drawY = margin + (availHeight - drawHeight) / 2;
      }

      const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });

      // Stream progress (10% -> 85%)
      const progress = 10 + Math.floor(((i + 1) / total) * 75);
      self.postMessage({ type: 'PROGRESS', payload: progress });
    }

    self.postMessage({ type: 'PROGRESS', payload: 90 });

    const pdfBytes = await pdfDoc.save();

    self.postMessage({ type: 'PROGRESS', payload: 100 });
    self.postMessage({ type: 'COMPLETE', payload: pdfBytes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while converting images to PDF.';
    self.postMessage({
      type: 'ERROR',
      payload: errorMessage,
    });
  }
};
