# PaperVault

PaperVault is a professional, privacy-first, client-side PDF and Image toolkit. It is engineered as a secure, offline-capable alternative to online converter services like iLovePDF.

**Every single operation executes 100% on your local machine.** No files, filenames, previews, or metadata ever leave your browser.

---

## Key Features

### 📄 PDF Tools
- **Merge PDF (`/pdf/merge`)**: Combine multiple PDF documents into a single organized file with customizable order.
- **Split PDF (`/pdf/split`)**: Extract single pages or custom page ranges into a standalone PDF.
- **Rotate PDF (`/pdf/rotate`)**: Permanently adjust page orientation across 90°, 180°, or 270°.
- **Delete Pages (`/pdf/delete-pages`)**: Remove individual pages or page intervals from your PDF documents.
- **Images to PDF (`/pdf/images-to-pdf`)**: Convert collections of PNG, JPEG, and WebP images into a formatted PDF document with customizable margins and page layouts (Fit, A4 Portrait, A4 Landscape).

### 🖼️ Image Tools
- **Compress Image (`/image/compress`)**: Optimize image sizes with fine-tuned quality controls and instant byte-savings feedback.
- **Resize Image (`/image/resize`)**: Scale image dimensions by percentage or target width/height with aspect ratio preservation.
- **Convert Image (`/image/convert`)**: Convert images seamlessly between PNG, JPEG, and WebP formats entirely offline.

---

## Core Philosophy

1. **Privacy First**: Zero file uploads, zero telemetry, zero trackers, and zero server storage.
2. **Local Hardware Execution**: Heavy binary manipulation runs off the main thread inside dedicated Web Workers.
3. **Memory Safety**: Automatic lifecycle cleanup of Object URLs and ArrayBuffers prevents browser memory leaks.
4. **Accessible & Responsive**: Fully keyboard navigable, visible focus states, high contrast, and responsive layout across desktop and mobile.

---

## Tech Stack

- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **PDF Processing**: `pdf-lib` (Worker-isolated)
- **Image Processing**: Canvas API, `createImageBitmap`, `OffscreenCanvas`
- **Validation**: Zod
- **Testing & Quality**: Vitest, ESLint, Prettier, GitHub Actions CI

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Development

```bash
# Clone the repository
git clone https://github.com/joydeepdey1/safepdf.git
cd safepdf

# Install dependencies
npm install

# Start development server
npm run dev
```

### Verification & Testing

```bash
# Run Vitest unit tests
npm run test

# Run ESLint code quality checks
npm run lint

# Compile TypeScript and build for production
npm run build
```

---

## Architecture & Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Development Roadmap](ROADMAP.md)
- [Security & Privacy Guarantees](SECURITY.md)
- [Release Changelog](CHANGELOG.md)

---

## License
MIT License. Built for private, local-first document workflows.
