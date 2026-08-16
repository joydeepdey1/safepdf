export const FILE_LIMITS = {
  PDF: {
    MAX_SIZE_BYTES: 500 * 1024 * 1024, // 500MB
    ACCEPTED_MIME_TYPES: ['application/pdf'],
  },
  IMAGE: {
    MAX_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
    ACCEPTED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  },
  QUEUE: {
    MAX_FILES: 100, // Maximum number of files in the queue at once
  },
} as const;
