import { PDFDocument } from 'pdf-lib';
import type { WorkerMessage } from '../../../shared/workers/workerDispatcher';

// Input payload matches the ArrayBuffers of the files in queue
export interface MergeWorkerPayload {
  files: { name: string; buffer: ArrayBuffer }[];
}

self.onmessage = async (e: MessageEvent<WorkerMessage<MergeWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { files } = message.payload;

    if (files.length < 2) {
      throw new Error('At least two PDF files are required to merge.');
    }

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    // Create a new empty document
    const mergedPdf = await PDFDocument.create();

    // Load and copy pages from each document
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let pdf: PDFDocument;

      try {
        pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: false });
      } catch (err: any) {
        throw new Error(`Failed to read "${file.name}". The file may be corrupted, password-protected, or not a valid PDF.`);
      }

      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));

      // Coarse progress: 10% -> 90%
      const progress = 10 + Math.floor(((i + 1) / files.length) * 80);
      self.postMessage({ type: 'PROGRESS', payload: progress });
    }

    self.postMessage({ type: 'PROGRESS', payload: 95 });

    // Save the merged document
    const pdfBytes = await mergedPdf.save();

    self.postMessage({ type: 'PROGRESS', payload: 100 });

    // Send back the raw bytes
    self.postMessage({ type: 'COMPLETE', payload: pdfBytes });

  } catch (error: any) {
    self.postMessage({ type: 'ERROR', payload: error.message || 'An unknown error occurred during merging.' });
  }
};
