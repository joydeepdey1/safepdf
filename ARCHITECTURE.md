# Architecture

This document describes the high-level architecture of PaperVault.

## Core Principles

1. **Strict Separation of Concerns**
   - **pdf-lib**: Strictly for PDF manipulation.
   - **pdfjs-dist**: Strictly for rendering and preview.
   - **Web Workers**: Strictly for heavy computations (PDF/Canvas processing).
   - **React**: Strictly for UI, routing, and state.

2. **Feature Isolation**
   Features are located in `src/features/`. Each feature (e.g., Merge PDF) is completely self-contained and owns its logic, types, workers, and tests. Features must never depend on each other.

3. **Shared Core Layer**
   Reusable logic resides in `src/shared/`.
   - `components/`: UI primitives (Buttons, Modals).
   - `hooks/`: Generic state/lifecycle logic.
   - `workers/`: Generic worker dispatcher interface.
   - `validation/`: Zod schemas.

## Processing Pipelines

All tools utilize standard processing pipelines to avoid reinventing the wheel.

**Generic Flow:**
`File Input → Validation → Queue Management → Worker Dispatch → Progress Updates → Result Generation → Download/Preview → Cleanup`

**PDF Processing:**
`Validate → Load → Execute (Worker) → Generate → Preview → Download`

**Image Processing:**
`Decode → ImageBitmap → Canvas (Worker) → Stack → Encode → Download`

## Memory Management
- `Blob` and `File` objects are captured via the Dropzone.
- `Object URLs` are created only when necessary (rendering previews, downloading).
- Cleanup (`URL.revokeObjectURL`) is strictly enforced via React `useEffect` when components unmount or files are removed.
