import { PDFDocument } from 'pdf-lib';
import type { WorkerInMessage } from '../../../shared/workers/workerDispatcher';

// Input payload matches the ArrayBuffer of the file in queue + requested page range
export interface SplitWorkerPayload {
  file: { name: string; buffer: ArrayBuffer };
  startPage: number; // 1-indexed
  endPage: number;   // 1-indexed
}

self.onmessage = async (e: MessageEvent<WorkerInMessage<SplitWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { file, startPage, endPage } = message.payload;

    self.postMessage({ type: 'PROGRESS', payload: 10 });

    let originalPdf: PDFDocument;

    try {
      originalPdf = await PDFDocument.load(file.buffer, { ignoreEncryption: false });
    } catch (err) {
      throw new Error(
        `Failed to read "${file.name}". The file may be corrupted, password-protected, or not a valid PDF.`,
        { cause: err }
      );
    }

    const totalPages = originalPdf.getPageCount();

    // Validate range against actual document length
    if (startPage < 1 || startPage > totalPages) {
      throw new Error(`Start page (${startPage}) is out of bounds. Document has ${totalPages} pages.`);
    }
    if (endPage < 1 || endPage > totalPages) {
      throw new Error(`End page (${endPage}) is out of bounds. Document has ${totalPages} pages.`);
    }
    if (startPage > endPage) {
      throw new Error(`Start page (${startPage}) cannot be greater than end page (${endPage}).`);
    }

    self.postMessage({ type: 'PROGRESS', payload: 30 });

    // Create a new empty document
    const splitPdf = await PDFDocument.create();

    // Convert 1-indexed to 0-indexed for pdf-lib
    const pageIndices = [];
    for (let i = startPage - 1; i <= endPage - 1; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await splitPdf.copyPages(originalPdf, pageIndices);
    copiedPages.forEach((page) => splitPdf.addPage(page));

    self.postMessage({ type: 'PROGRESS', payload: 80 });

    // Save the split document
    const pdfBytes = await splitPdf.save();

    self.postMessage({ type: 'PROGRESS', payload: 100 });

    // Send back the raw bytes
    self.postMessage({ type: 'COMPLETE', payload: pdfBytes });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during splitting.';
    self.postMessage({ type: 'ERROR', payload: errorMessage });
  }
};
