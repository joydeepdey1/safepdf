import { PDFDocument, degrees } from 'pdf-lib';
import type { WorkerMessage } from '../../../shared/workers/workerDispatcher';

export interface RotateWorkerPayload {
  file: { name: string; buffer: ArrayBuffer };
  rotationAngle: 90 | 180 | 270;
}

self.onmessage = async (e: MessageEvent<WorkerMessage<RotateWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { file, rotationAngle } = message.payload;

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    let pdfDoc: PDFDocument;

    try {
      pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: false });
    } catch (err: any) {
      throw new Error(
        `Failed to read "${file.name}". The file may be corrupted, password-protected, or not a valid PDF.`
      );
    }

    self.postMessage({ type: 'PROGRESS', payload: 30 });

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    if (totalPages === 0) {
      throw new Error(`The PDF file "${file.name}" has no pages to rotate.`);
    }

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + rotationAngle) % 360;
      page.setRotation(degrees(newRotation));

      // Coarse progress: 30% -> 80%
      const progress = 30 + Math.floor(((i + 1) / totalPages) * 50);
      self.postMessage({ type: 'PROGRESS', payload: progress });
    }

    self.postMessage({ type: 'PROGRESS', payload: 85 });

    // Save the rotated document
    const pdfBytes = await pdfDoc.save();

    self.postMessage({ type: 'PROGRESS', payload: 100 });

    // Send back the raw bytes
    self.postMessage({ type: 'COMPLETE', payload: pdfBytes });
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      payload: error.message || 'An unknown error occurred during rotation.',
    });
  }
};
