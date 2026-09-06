import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { WorkerInMessage } from '../../../shared/workers/workerDispatcher';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Polyfill minimal document for Web Worker context if any third-party routine touches globalThis.document
if (typeof (globalThis as unknown as { document?: unknown }).document === 'undefined') {
  (globalThis as unknown as { document: unknown }).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return new OffscreenCanvas(1, 1);
      }
      return {
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
        append: () => {},
        appendChild: () => {},
      };
    },
    createElementNS: (_ns: string, tag: string) => {
      if (tag === 'canvas') {
        return new OffscreenCanvas(1, 1);
      }
      return {
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
        append: () => {},
        appendChild: () => {},
      };
    },
    body: {
      append: () => {},
      appendChild: () => {},
    },
    baseURI: self.location?.href || '',
  };
}

interface CanvasAndContext {
  canvas: OffscreenCanvas | null;
  context: CanvasRenderingContext2D | null;
}

class OffscreenCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const canvas = new OffscreenCanvas(w, h);
    return {
      canvas,
      context: canvas.getContext('2d', { willReadFrequently: true }) as unknown as CanvasRenderingContext2D,
    };
  }

  reset(canvasAndContext: CanvasAndContext, width: number, height: number): void {
    if (!canvasAndContext.canvas) return;
    canvasAndContext.canvas.width = Math.max(1, Math.round(width));
    canvasAndContext.canvas.height = Math.max(1, Math.round(height));
  }

  destroy(canvasAndContext: CanvasAndContext): void {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  }

  _createCanvas(width: number, height: number): OffscreenCanvas {
    return new OffscreenCanvas(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
  }
}

class OffscreenFilterFactory {
  addFilter() {
    return 'none';
  }
  addHCMFilter() {
    return 'none';
  }
  addAlphaFilter() {
    return 'none';
  }
  addLuminosityFilter() {
    return 'none';
  }
  addKnockoutFilter() {
    return 'none';
  }
  addHighlightHCMFilter() {
    return 'none';
  }
  addSelectionHCMFilter() {
    return 'none';
  }
  addSelectionFilter() {
    return 'none';
  }
  createSelectionStyle() {
    return null;
  }
  destroy() {}
}

export type CompressionPreset = 'extreme' | 'recommended' | 'light';

export interface CompressPdfWorkerPayload {
  file: { name: string; buffer: ArrayBuffer };
  preset: CompressionPreset;
}

export interface CompressedPdfResult {
  name: string;
  buffer: ArrayBuffer;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercent: number;
}

interface PresetConfig {
  scale: number;
  quality: number;
  maxDimension: number;
}

const PRESET_CONFIGS: Record<CompressionPreset, PresetConfig> = {
  extreme: { scale: 0.8, quality: 0.45, maxDimension: 1280 },     // ~58 DPI, 45% JPEG - aggressive size cut
  recommended: { scale: 1.0, quality: 0.58, maxDimension: 1600 }, // 72 DPI, 58% JPEG - optimal balance of clarity and size
  light: { scale: 1.15, quality: 0.68, maxDimension: 1920 },       // ~83 DPI, 68% JPEG - high fidelity, gentle reduction
};

self.onmessage = async (e: MessageEvent<WorkerInMessage<CompressPdfWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { file, preset } = message.payload;
    const { scale, quality, maxDimension } = PRESET_CONFIGS[preset] || PRESET_CONFIGS.recommended;

    // CRITICAL: Cache original size before file.buffer is neutered/transferred by pdfjsLib
    const origSize = file.buffer.byteLength;
    const originalBytesCopy = new Uint8Array(file.buffer).slice();

    self.postMessage({ type: 'PROGRESS', payload: 5 });

    const origin = typeof location !== 'undefined' ? location.origin : '';
    let pdfDocument;

    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(file.buffer),
        cMapUrl: `${origin}/pdfjs-dist/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${origin}/pdfjs-dist/standard_fonts/`,
        wasmUrl: `${origin}/pdfjs-dist/wasm/`,
        disableFontFace: true,
        useSystemFonts: false,
        enableXfa: true,
        useWorkerFetch: true,
        CanvasFactory: OffscreenCanvasFactory,
        FilterFactory: OffscreenFilterFactory,
      });
      pdfDocument = await loadingTask.promise;
    } catch (err) {
      throw new Error(
        `Failed to open "${file.name}". The document may be corrupted or password-protected.`,
        { cause: err }
      );
    }

    const totalPages = pdfDocument.numPages;
    if (totalPages === 0) {
      throw new Error(`The PDF "${file.name}" has no pages to compress.`);
    }

    // Create target PDF document
    const compressedPdfDoc = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1.0 });
      const maxDim = Math.max(baseViewport.width, baseViewport.height);

      let pageScale = scale;
      if (maxDim * pageScale > maxDimension) {
        pageScale = maxDimension / maxDim;
      }

      const viewport = page.getViewport({ scale: pageScale });

      const canvas = new OffscreenCanvas(Math.round(viewport.width), Math.round(viewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas context for page compression.');
      }

      // Fill white background to prevent dark artifacts
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render the page
      const renderTask = page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      });
      await renderTask.promise;

      // Convert to compressed JPEG blob
      const compressedBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality,
      });
      const pageBuffer = await compressedBlob.arrayBuffer();

      // Embed into output PDF with exact original point dimensions
      const embeddedJpg = await compressedPdfDoc.embedJpg(pageBuffer);
      const originalPageWidth = baseViewport.width;
      const originalPageHeight = baseViewport.height;

      const newPage = compressedPdfDoc.addPage([originalPageWidth, originalPageHeight]);
      newPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: originalPageWidth,
        height: originalPageHeight,
      });

      // Stream progress
      const progress = 5 + Math.floor((pageNum / totalPages) * 85);
      self.postMessage({ type: 'PROGRESS', payload: progress });
    }

    self.postMessage({ type: 'PROGRESS', payload: 95 });

    const outputPdfBytes = await compressedPdfDoc.save({ useObjectStreams: true });
    let finalBuffer = outputPdfBytes.buffer as ArrayBuffer;
    let finalSize = outputPdfBytes.byteLength;

    // Safeguard: Never return a file larger than the original
    if (finalSize >= origSize) {
      try {
        const losslessDoc = await PDFDocument.load(originalBytesCopy.buffer);
        const losslessBytes = await losslessDoc.save({ useObjectStreams: true });
        if (losslessBytes.byteLength < origSize) {
          finalBuffer = losslessBytes.buffer as ArrayBuffer;
          finalSize = losslessBytes.byteLength;
        } else {
          finalBuffer = originalBytesCopy.buffer as ArrayBuffer;
          finalSize = origSize;
        }
      } catch {
        finalBuffer = originalBytesCopy.buffer as ArrayBuffer;
        finalSize = origSize;
      }
    }

    const savings = origSize > finalSize
      ? Math.round(((origSize - finalSize) / origSize) * 100)
      : 0;

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const result: CompressedPdfResult = {
      name: `${baseName}-compressed.pdf`,
      buffer: finalBuffer,
      originalSizeBytes: origSize,
      compressedSizeBytes: finalSize,
      savingsPercent: savings,
    };

    self.postMessage({ type: 'PROGRESS', payload: 100 });
    self.postMessage({ type: 'COMPLETE', payload: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during PDF compression.';
    self.postMessage({
      type: 'ERROR',
      payload: errorMessage,
    });
  }
};
