import { useState, useCallback, useEffect } from 'react';

export interface QueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'idle' | 'processing' | 'complete' | 'error';
  error?: string;
  // Lazy-loaded preview URL
  previewUrl?: string;
}

export function useFileQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  // Cleanup Object URLs when items are removed from queue
  useEffect(() => {
    return () => {
      // Run cleanup on unmount
      queue.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newItems: QueueItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'idle',
    }));
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setQueue(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove?.previewUrl) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(prev => {
      prev.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  }, []);

  const updateItemStatus = useCallback((id: string, updates: Partial<Omit<QueueItem, 'id' | 'file'>>) => {
    setQueue(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const generatePreview = useCallback((id: string) => {
    setQueue(prev => {
      return prev.map(item => {
        if (item.id === id && !item.previewUrl) {
          return { ...item, previewUrl: URL.createObjectURL(item.file) };
        }
        return item;
      });
    });
  }, []);

  return {
    queue,
    addFiles,
    removeFile,
    clearQueue,
    updateItemStatus,
    generatePreview,
  };
}
