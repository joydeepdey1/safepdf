# Roadmap

## Phase 1: Foundation (Completed)
- [x] Project initialization (React 19, Vite, TypeScript, Tailwind v4).
- [x] Tooling setup (ESLint, Prettier, Husky, Vitest, Playwright).
- [x] Core folder structure & path aliases.
- [x] Routing & Global Layout shell.
- [x] Homepage & core documentation.

## Phase 2: Shared File System (Completed)
- [x] Drag & drop interface (`Dropzone.tsx`).
- [x] File validation (`Zod`, mime detection, size limits).
- [x] Upload queue and preview generation (`FileQueue.tsx`).
- [x] Memory lifecycle & Web Worker dispatcher (`workerDispatcher.ts`).

## Phase 3: Core PDF & Image Tools (Completed)
- [x] Merge PDF (`/pdf/merge`)
- [x] Split PDF (`/pdf/split`)
- [x] Rotate PDF (`/pdf/rotate`)
- [x] Delete Pages (`/pdf/delete-pages`)
- [x] Images to PDF (`/pdf/images-to-pdf`)
- [x] Resize Image (`/image/resize`)
- [x] Compress Image (`/image/compress`)
- [x] Convert Image (`/image/convert`)

## Phase 4: Production Foundation & Code Splitting (Completed)
- [x] Route-level lazy loading (`React.lazy` + `Suspense`).
- [x] Comprehensive 8-tool directory on Homepage with category filters.
- [x] Global layout polish, accessible keyboard dropzone, and SEO metadata.
- [x] Automated unit test suite with Vitest (`src/tests/fileUtils.test.ts`).
- [x] Zero ESLint errors & zero TypeScript compiler warnings.
- [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`).

## Phase 5: Final Tools Scope (Completed)
- [x] **PDF to Images** (`/pdf/pdf-to-images`): Render PDF pages to PNG/JPEG via `pdfjs-dist` in Web Worker.
- [x] **Compress PDF** (`/pdf/compress`): Client-side PDF stream downsampling and optimization.
- [x] **Crop Image** (`/image/crop`): Canvas-based interactive image cropping with aspect ratio presets.
- [x] **Remove Metadata** (`/image/remove-metadata`): Clean EXIF, GPS, and camera metadata scrubbing.

## Phase 6: Final Deployment (Ready)
- [x] Production build verification & quality audit (0 vulnerabilities, 0 lint errors, 11/11 tests passing).
- [ ] Static deployment to Vercel / Cloudflare Pages.
