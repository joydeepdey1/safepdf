import { z } from 'zod';
import { FILE_LIMITS } from '../constants/fileLimits';
import { isPdf, isImage } from '../utils/file';

const BaseFileSchema = z.instanceof(File)
  .refine((file) => file.size > 0, "File cannot be empty (0 bytes).");

export const PDFFileSchema = BaseFileSchema
  .refine(
    (file) => file.size <= FILE_LIMITS.PDF.MAX_SIZE_BYTES,
    `File exceeds the maximum allowed size of ${FILE_LIMITS.PDF.MAX_SIZE_BYTES / 1024 / 1024}MB.`
  )
  .refine(
    (file) => isPdf(file),
    "Invalid file format. Only PDF files are accepted."
  );

export const ImageFileSchema = BaseFileSchema
  .refine(
    (file) => file.size <= FILE_LIMITS.IMAGE.MAX_SIZE_BYTES,
    `File exceeds the maximum allowed size of ${FILE_LIMITS.IMAGE.MAX_SIZE_BYTES / 1024 / 1024}MB.`
  )
  .refine(
    (file) => isImage(file),
    "Invalid image format. Supported formats: JPEG, PNG, WebP, AVIF, GIF."
  );

export function validatePDFs(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];

  if (files.length > FILE_LIMITS.QUEUE.MAX_FILES) {
    errors.push(`You can only upload up to ${FILE_LIMITS.QUEUE.MAX_FILES} files at once.`);
    files = files.slice(0, FILE_LIMITS.QUEUE.MAX_FILES);
  }

  files.forEach((file) => {
    const result = PDFFileSchema.safeParse(file);
    if (result.success) {
      valid.push(file);
    } else {
      errors.push(`${file.name}: ${result.error.issues[0].message}`);
    }
  });

  return { valid, errors };
}

export function validateImages(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];

  if (files.length > FILE_LIMITS.QUEUE.MAX_FILES) {
    errors.push(`You can only upload up to ${FILE_LIMITS.QUEUE.MAX_FILES} files at once.`);
    files = files.slice(0, FILE_LIMITS.QUEUE.MAX_FILES);
  }

  files.forEach((file) => {
    const result = ImageFileSchema.safeParse(file);
    if (result.success) {
      valid.push(file);
    } else {
      errors.push(`${file.name}: ${result.error.issues[0].message}`);
    }
  });

  return { valid, errors };
}
