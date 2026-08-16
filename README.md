# PaperVault

PaperVault is a professional, privacy-first, client-side PDF and Image toolkit. It is designed as a secure alternative to cloud-based processing tools.

Every supported operation executes entirely on your device. No files leave your browser.

## Core Philosophy
1. **Privacy First**: Never upload user files, filenames, or metadata.
2. **Functionality Over Appearance**: Prioritize functionality and performance over flashy UI.
3. **Local Processing**: Utilize modern WebAssembly and Canvas APIs for desktop-class performance in the browser.

## Tech Stack
- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **PDF Manipulation**: pdf-lib, pdfjs-dist
- **Image Processing**: Canvas API, createImageBitmap, Pica

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Documentation
- [Architecture](ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)
