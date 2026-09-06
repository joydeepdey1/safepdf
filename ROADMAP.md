# Roadmap

## Phase 1: Foundation
- [x] Project initialization (React 19, Vite, TypeScript, Tailwind v4).
- [x] Tooling setup (ESLint, Prettier, Husky, Vitest, Playwright).
- [x] Core folder structure & path aliases.
- [x] Routing & Global Layout shell.
- [x] Homepage & core documentation.

## Phase 2: Shared File System
- [x] Drag & drop interface (`Dropzone.tsx`).
- [x] File validation (`Zod`, mime detection, size limits).
- [x] Upload queue and preview generation (`FileQueue.tsx`).
- [x] Memory lifecycle & Web Worker dispatcher (`workerDispatcher.ts`).

## Phase 3: MVP Tool - Merge PDF
- [x] Client-side PDF merging with worker-isolated `pdf-lib`.
- [x] Progress streaming and error propagation.
- [x] Memory-safe processing and garbage collection.

## Phase 4: Remaining PDF Tools
- [x] Split PDF (range & single-page extraction).
- [x] Rotate PDF (90°, 180°, 270° orientation adjustments).
- [x] Delete Pages (interval & comma-separated page removal).
- [x] Images to PDF (format conversion, margins, page sizing).

## Phase 5: Image Tools Suite
- [x] Resize Image (percentage and explicit pixel dimensions).
- [x] Compress Image (quality presets and live byte savings feedback).
- [x] Convert Image (PNG, JPEG, and WebP client-side conversion).
- [x] Multi-file batch queue processing.

## Phase 6: Polish & Deploy
- [x] Route-level code splitting & lazy loading (`React.lazy`, `Suspense`).
- [x] Comprehensive 8-tool directory on Homepage with category filters.
- [x] Global layout polish, accessible keyboard dropzone, and SEO metadata.
- [x] Automated unit test suite with Vitest.
- [x] Zero ESLint errors & zero TypeScript compiler warnings.
- [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`).

## Stretch Goals (Post-MVP)
- [ ] OCR (Optical Character Recognition via Tesseract.js / WebAssembly)
- [ ] Watermarks & Annotations
- [ ] PDF Protection & Decryption
- [ ] Client-side PDF Redaction
- [ ] Digital Signatures
