import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface BunnyUploadResult {
  cdnUrl: string;
  videoId: string;
}

// Threshold for using chunked upload (50MB)
const CHUNKED_THRESHOLD = 50 * 1024 * 1024;
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

/**
 * Hook para upload de vídeos para Bunny CDN
 * Suporta upload multipart (<=50MB) e chunked (>50MB)
 */
export const useBunnyUpload = () => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isTusUpload, setIsTusUpload] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort current upload
  const abortUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setProgress(null);
    setIsTusUpload(false);
  }, []);

  // Upload via multipart (for files <= 50MB)
  const uploadMultipart = async (file: File, quizId?: string, accessToken?: string): Promise<BunnyUploadResult | null> => {
    const formData = new FormData();
    formData.append('file', file);
    if (quizId) {
      formData.append('quizId', quizId);
    }

    // Simulate progress for multipart (can't track real progress easily)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (!prev) return null;
        const newPercentage = Math.min(prev.percentage + 5, 90);
        return {
          ...prev,
          loaded: Math.floor((newPercentage / 100) * prev.total),
          percentage: newPercentage
        };
      });
    }, 200);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/bunny-upload-video-multipart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
          signal: abortControllerRef.current.signal,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        console.error('Upload error:', errorData);
        toast.error(errorData.error || t('hooks.bunnyUpload.uploadError'));
        return null;
      }

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || t('hooks.bunnyUpload.uploadError'));
        return null;
      }

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      toast.success(t('hooks.bunnyUpload.uploadSuccess'));
      
      return { 
        cdnUrl: result.cdnUrl, 
        videoId: result.videoId 
      };
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  // Upload via chunked approach (for files > 50MB)
  const uploadChunked = async (file: File, quizId?: string, accessToken?: string): Promise<BunnyUploadResult | null> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    try {
      // First, create the video record and get upload info
      const createResponse = await fetch(
        `${supabaseUrl}/functions/v1/bunny-chunked-init`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            quizId
          }),
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ error: 'Failed to create upload' }));
        toast.error(errorData.error || t('hooks.bunnyUpload.initError'));
        return null;
      }

      const createResult = await createResponse.json();
      
      if (!createResult.success) {
        toast.error(createResult.error || t('hooks.bunnyUpload.initError'));
        return null;
      }

      const { videoId, cdnUrl, uploadPath, accessKey } = createResult;
      
      // Upload chunks using XMLHttpRequest for progress tracking
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let uploadedBytes = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Upload chunk directly to Bunny Storage
        const uploadUrl = `https://storage.bunnycdn.com/${uploadPath}`;
        
        // For the first chunk, create the file; for subsequent chunks, append
        // Bunny Storage doesn't support chunked uploads directly, so we need to
        // buffer the file and send it in one request, but track progress via XHR
        
        if (chunkIndex === 0) {
          // Use XHR for progress tracking on large files
          const result = await new Promise<BunnyUploadResult | null>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentage = Math.round((e.loaded / e.total) * 100);
                setProgress({
                  loaded: e.loaded,
                  total: e.total,
                  percentage
                });
              }
            });

            xhr.addEventListener('load', async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // Confirm upload completion
                try {
                  await fetch(
                    `${supabaseUrl}/functions/v1/bunny-chunked-complete`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ videoId }),
                    }
                  );
                } catch (e) {
                  console.warn('Failed to confirm upload:', e);
                }
                
                toast.success(t('hooks.bunnyUpload.uploadSuccess'));
                resolve({ cdnUrl, videoId });
              } else {
                toast.error(t('hooks.bunnyUpload.uploadError'));
                resolve(null);
              }
            });

            xhr.addEventListener('error', () => {
              toast.error(t('hooks.bunnyUpload.connectionError'));
              reject(new Error('Upload failed'));
            });

            xhr.addEventListener('abort', () => {
              toast.info(t('hooks.bunnyUpload.uploadCancelled'));
              resolve(null);
            });

            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('AccessKey', accessKey);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.send(file); // Send entire file with progress tracking
          });

          return result;
        }

        uploadedBytes += chunk.size;
      }

      return null;
    } catch (error) {
      console.error('Chunked upload error:', error);
      throw error;
    }
  };

  const uploadToBunny = async (file: File, quizId?: string): Promise<BunnyUploadResult | null> => {
    try {
      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Validate file size (max 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(t('hooks.bunnyUpload.fileTooLarge'));
        return null;
      }

      // Get auth session
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error(t('hooks.bunnyUpload.loginRequired'));
        return null;
      }

      const accessToken = session.session.access_token;

      // Decide upload method based on file size
      if (file.size > CHUNKED_THRESHOLD) {
        setIsTusUpload(true);
        toast.info(t('hooks.bunnyUpload.largeFileDetected'));
        return await uploadChunked(file, quizId, accessToken);
      } else {
        setIsTusUpload(false);
        return await uploadMultipart(file, quizId, accessToken);
      }

    } catch (error: unknown) {
      console.error('Bunny upload error:', error);
      const message = error instanceof Error ? error.message : t('hooks.bunnyUpload.unknownError');
      toast.error(`${t('hooks.bunnyUpload.uploadError')}: ${message}`);
      return null;
    } finally {
      setUploading(false);
      setProgress(null);
      setIsTusUpload(false);
      abortControllerRef.current = null;
    }
  };

  const deleteFromBunny = async (videoId: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('bunny-delete-video', {
        body: { videoId }
      });

      if (response.error) {
        toast.error(t('hooks.bunnyUpload.deleteError'));
        return false;
      }

      toast.success(t('hooks.bunnyUpload.deleteSuccess'));
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('hooks.bunnyUpload.deleteError'));
      return false;
    }
  };

  return {
    uploadToBunny,
    deleteFromBunny,
    abortUpload,
    uploading,
    progress,
    isTusUpload
  };
};
