'use client';
import { useState, useCallback } from 'react';

interface UploadResult {
  rawText: string;
  fileName: string;
  fileType: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('resume', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      });

      xhr.addEventListener('load', () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const uploadResult: UploadResult = {
              rawText: data.rawText,
              fileName: data.fileName,
              fileType: data.fileType,
            };
            setResult(uploadResult);
            setProgress(100);
            resolve(uploadResult);
          } catch {
            setError('Failed to parse upload response');
            resolve(null);
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            setError(errData.error || 'Upload failed');
          } catch {
            setError('Upload failed');
          }
          resolve(null);
        }
      });

      xhr.addEventListener('error', () => {
        setIsUploading(false);
        setError('Network error during upload');
        resolve(null);
      });

      xhr.addEventListener('abort', () => {
        setIsUploading(false);
        setError('Upload cancelled');
        resolve(null);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return { upload, isUploading, progress, error, result, reset };
}
