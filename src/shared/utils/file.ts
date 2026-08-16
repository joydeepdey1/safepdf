import { FILE_LIMITS } from '../constants/fileLimits';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()?.toLowerCase() || '';
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || getExtension(file.name) === 'pdf';
}

export function isImage(file: File): boolean {
  return file.type.startsWith('image/') ||
         (FILE_LIMITS.IMAGE.ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type);
}

export function humanMimeName(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf': return 'PDF';
    case 'image/jpeg': return 'JPEG';
    case 'image/png': return 'PNG';
    case 'image/webp': return 'WebP';
    case 'image/avif': return 'AVIF';
    case 'image/gif': return 'GIF';
    default: return mimeType.split('/')[1]?.toUpperCase() || 'Unknown';
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
