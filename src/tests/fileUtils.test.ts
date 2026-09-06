import { describe, it, expect } from 'vitest';
import { formatFileSize, getExtension, isPdf, isImage, humanMimeName } from '../shared/utils/file';
import { validatePDFs, validateImages } from '../shared/validation/fileValidation';

describe('File Utility Functions', () => {
  describe('formatFileSize', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats bytes, kilobytes, and megabytes accurately', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1.75)).toBe('1.75 GB');
    });
  });

  describe('getExtension', () => {
    it('extracts lowercased extensions reliably', () => {
      expect(getExtension('document.pdf')).toBe('pdf');
      expect(getExtension('PHOTO.JPG')).toBe('jpg');
      expect(getExtension('archive.tar.gz')).toBe('gz');
      expect(getExtension('noextension')).toBe('');
    });
  });

  describe('isPdf', () => {
    it('detects PDF by mime type or file extension', () => {
      const pdfByMime = new File(['content'], 'test.bin', { type: 'application/pdf' });
      const pdfByName = new File(['content'], 'test.pdf', { type: '' });
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      expect(isPdf(pdfByMime)).toBe(true);
      expect(isPdf(pdfByName)).toBe(true);
      expect(isPdf(txtFile)).toBe(false);
    });
  });

  describe('isImage', () => {
    it('identifies accepted image types correctly', () => {
      const jpeg = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const png = new File(['img'], 'graphic.png', { type: 'image/png' });
      const webp = new File(['img'], 'banner.webp', { type: 'image/webp' });
      const pdf = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });

      expect(isImage(jpeg)).toBe(true);
      expect(isImage(png)).toBe(true);
      expect(isImage(webp)).toBe(true);
      expect(isImage(pdf)).toBe(false);
    });
  });

  describe('humanMimeName', () => {
    it('converts technical MIME types to user-friendly labels', () => {
      expect(humanMimeName('application/pdf')).toBe('PDF');
      expect(humanMimeName('image/jpeg')).toBe('JPEG');
      expect(humanMimeName('image/png')).toBe('PNG');
      expect(humanMimeName('image/webp')).toBe('WebP');
    });
  });
});

describe('File Validation Pipelines', () => {
  describe('validatePDFs', () => {
    it('accepts valid non-empty PDF files', () => {
      const validPdf = new File(['%PDF-1.4 dummy'], 'doc.pdf', { type: 'application/pdf' });
      const { valid, errors } = validatePDFs([validPdf]);

      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('rejects empty files (0 bytes)', () => {
      const emptyPdf = new File([], 'empty.pdf', { type: 'application/pdf' });
      const { valid, errors } = validatePDFs([emptyPdf]);

      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('File cannot be empty');
    });

    it('rejects non-PDF files', () => {
      const invalidFile = new File(['dummy content'], 'report.txt', { type: 'text/plain' });
      const { valid, errors } = validatePDFs([invalidFile]);

      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Only PDF files are accepted');
    });
  });

  describe('validateImages', () => {
    it('accepts valid non-empty images', () => {
      const validImg = new File(['dummy image data'], 'photo.jpg', { type: 'image/jpeg' });
      const { valid, errors } = validateImages([validImg]);

      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('rejects non-image files with clear error message', () => {
      const nonImg = new File(['text data'], 'notes.txt', { type: 'text/plain' });
      const { valid, errors } = validateImages([nonImg]);

      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Supported formats');
    });
  });
});
