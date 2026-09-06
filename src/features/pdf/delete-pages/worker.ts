import { PDFDocument } from 'pdf-lib';
import type { WorkerInMessage } from '../../../shared/workers/workerDispatcher';

export interface DeletePagesWorkerPayload {
  file: { name: string; buffer: ArrayBuffer };
  pagesToDelete: number[]; // 1-indexed page numbers
}

self.onmessage = async (e: MessageEvent<WorkerInMessage<DeletePagesWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { file, pagesToDelete } = message.payload;

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
    const deleteSet = new Set(pagesToDelete);

    // Validate bounds
    for (const pageNum of deleteSet) {
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(
          `Page ${pageNum} is out of bounds. The document contains ${totalPages} pages.`
        );
      }
    }

    // Determine pages to keep (0-indexed)
    const keepIndices: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (!deleteSet.has(i)) {
        keepIndices.push(i - 1);
      }
    }

    if (keepIndices.length === 0) {
      throw new Error('Cannot delete all pages. The resulting document must have at least 1 page.');
    }

    self.postMessage({ type: 'PROGRESS', payload: 30 });

    // Create a new PDF with remaining pages
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(originalPdf, keepIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    self.postMessage({ type: 'PROGRESS', payload: 85 });

    // Save output
    const pdfBytes = await newPdf.save();

    self.postMessage({ type: 'PROGRESS', payload: 100 });

    // Return complete payload
    self.postMessage({ type: 'COMPLETE', payload: pdfBytes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while deleting pages.';
    self.postMessage({
      type: 'ERROR',
      payload: errorMessage,
    });
  }
};
