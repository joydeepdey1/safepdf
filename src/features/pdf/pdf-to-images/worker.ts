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

export interface PdfToImagesWorkerPayload {
  file: { name: string; buffer: ArrayBuffer };
  format: 'png' | 'jpeg';
  scale: number; // 1.0 (72 dpi), 1.5 (108 dpi), 2.0 (144 dpi)
  quality?: number; // 0.8 to 1.0 for jpeg
}

export interface RenderedPageImage {
  pageNumber: number;
  name: string;
  buffer: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
}

self.onmessage = async (e: MessageEvent<WorkerInMessage<PdfToImagesWorkerPayload>>) => {
  const message = e.data;

  if (message.type !== 'START_JOB') return;

  try {
    const { file, format, scale, quality = 0.92 } = message.payload;

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
        disableFontFace: true, // Crucial: draws font glyphs as direct vector paths on OffscreenCanvas, avoiding missing @font-face tofu boxes
        useSystemFonts: false,
        enableXfa: true,
        useWorkerFetch: true,
        CanvasFactory: OffscreenCanvasFactory,
        FilterFactory: OffscreenFilterFactory,
      });
      pdfDocument = await loadingTask.promise;
    } catch (err) {
      throw new Error(
        `Failed to open "${file.name}". The file may be password-protected or corrupted.`,
        { cause: err }
      );
    }

    const totalPages = pdfDocument.numPages;
    if (totalPages === 0) {
      throw new Error(`The PDF "${file.name}" does not contain any renderable pages.`);
    }

    const results: RenderedPageImage[] = [];
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? '.jpg' : '.png';
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = new OffscreenCanvas(Math.round(viewport.width), Math.round(viewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas rendering context for PDF page.');
      }

      // If exporting to JPEG, fill white background to prevent black transparent areas
      if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render the page with path-drawn font glyphs
      const renderTask = page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      });
      await renderTask.promise;

      // Convert to blob and buffer
      const blob = await canvas.convertToBlob({
        type: mimeType,
        quality: format === 'jpeg' ? quality : undefined,
      });
      const pageBuffer = await blob.arrayBuffer();

      results.push({
        pageNumber: pageNum,
        name: `${baseName}-page-${pageNum}${ext}`,
        buffer: pageBuffer,
        mimeType,
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
      });

      // Stream progress
      const progress = 5 + Math.floor((pageNum / totalPages) * 90);
      self.postMessage({ type: 'PROGRESS', payload: progress });
    }

    self.postMessage({ type: 'PROGRESS', payload: 100 });
    self.postMessage({ type: 'COMPLETE', payload: results });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while converting PDF to images.';
    self.postMessage({
      type: 'ERROR',
      payload: errorMessage,
    });
  }
};
