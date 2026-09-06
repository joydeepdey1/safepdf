# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-06

### Added
- **Complete PDF Suite**:
  - **Merge PDF (`/pdf/merge`)**: Combine multiple PDFs into a single file with custom ordering and progress streaming.
  - **Split PDF (`/pdf/split`)**: Extract single pages or custom ranges (e.g., `1-5`) into a new PDF.
  - **Rotate PDF (`/pdf/rotate`)**: Permanently rotate PDF pages by 90°, 180°, or 270°.
  - **Delete Pages (`/pdf/delete-pages`)**: Remove unwanted pages or ranges using intuitive range syntax.
  - **Images to PDF (`/pdf/images-to-pdf`)**: Convert PNG, JPEG, and WebP images into a formatted PDF document with customizable page sizes and margins.
- **Complete Image Suite**:
  - **Compress Image (`/image/compress`)**: Client-side canvas compression with quality presets and live byte savings feedback.
  - **Resize Image (`/image/resize`)**: Scale image dimensions by percentage or target width/height with aspect ratio preservation.
  - **Convert Image (`/image/convert`)**: Convert images between PNG, JPEG, and WebP formats entirely offline.
- **Core Architecture & Performance**:
  - Worker dispatcher with explicit cancellation and error propagation.
  - Route-level code splitting using `React.lazy()` and `Suspense`.
  - Memory-safe Object URL revocation and ArrayBuffer cleanup.
  - Fully accessible Dropzone with keyboard navigation (`Enter`, `Space`) and ARIA roles.
- **Testing & CI/CD**:
  - Automated unit test suite using Vitest covering file utilities, MIME identification, and Zod validation.
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`) for automated linting, testing, and production builds.
  - Strict ESLint configuration compliance (zero lint errors).
- **SEO & Layout**:
  - Enhanced `index.html` with Open Graph, Twitter card tags, and search engine metadata.
  - Unified Homepage directory with category filter tabs and smooth anchor navigation.
