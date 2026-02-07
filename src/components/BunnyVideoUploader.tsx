import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Video, X, Loader2, Cloud, Zap, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useBunnyUpload } from "@/hooks/useBunnyUpload";
import { toast } from "sonner";

interface BunnyVideoUploaderProps {
  value?: string;
  videoId?: string;
  onChange: (url: string, videoId: string) => void;
  onRemove?: () => void;
  quizId?: string;
  className?: string;
}

// Auto-retry configuration
const AUTO_RETRY_DELAY_MS = 2000;
const MAX_AUTO_RETRIES = 3;

export const BunnyVideoUploader = ({ 
  value, 
  videoId,
  onChange, 
  onRemove,
  quizId,
  className 
}: BunnyVideoUploaderProps) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetrying, setAutoRetrying] = useState(false);
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { uploadToBunny, deleteFromBunny, uploading, progress, isTusUpload } = useBunnyUpload();

  // Cleanup auto-retry timeout on unmount
  useEffect(() => {
    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when value changes
  useEffect(() => {
    if (value) {
      setVideoError(false);
      setRetryCount(0);
      setAutoRetrying(false);
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    }
  }, [value]);

  const handleUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('components.bunnyVideoUploader.invalidFormat'));
      return;
    }

    // Max size for TUS is 2GB, for multipart is 50MB
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      toast.error(t('components.bunnyVideoUploader.fileTooLarge', { size: 2 }));
      return;
    }

    setVideoError(false);
    setRetryCount(0);
    setAutoRetrying(false);
    
    const result = await uploadToBunny(file, quizId);
    if (result) {
      onChange(result.cdnUrl, result.videoId);
    }
  };

  const handleRemove = async () => {
    if (videoId) {
      await deleteFromBunny(videoId);
    }
    setVideoError(false);
    setRetryCount(0);
    setAutoRetrying(false);
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
    }
    onRemove?.();
  };

  const handleVideoError = useCallback(() => {
    setVideoError(true);
    console.error("Video failed to load:", value, "retry count:", retryCount);
    
    // Auto-retry if under limit
    if (retryCount < MAX_AUTO_RETRIES) {
      setAutoRetrying(true);
      autoRetryTimeoutRef.current = setTimeout(() => {
        setAutoRetrying(false);
        setVideoError(false);
        setRetryCount(prev => prev + 1);
      }, AUTO_RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff
    }
  }, [value, retryCount]);

  const handleRetry = useCallback(() => {
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
    }
    setAutoRetrying(false);
    setVideoError(false);
    setRetryCount(prev => prev + 1);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  if (value) {
    // Add cache buster on retry
    const videoSrc = retryCount > 0 ? `${value}?retry=${retryCount}` : value;

    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="relative">
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                <Cloud className="h-3 w-3 mr-1" />
                Bunny CDN
              </Badge>
            </div>
            
            {videoError ? (
              <div className="w-full rounded-lg bg-muted/50 border-2 border-dashed border-destructive/50 p-8 text-center">
                {autoRetrying ? (
                  <>
                    <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('components.bunnyVideoUploader.waitingCdn')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('components.bunnyVideoUploader.attemptOf', { current: retryCount + 1, total: MAX_AUTO_RETRIES + 1 })}
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {retryCount >= MAX_AUTO_RETRIES 
                        ? t('components.bunnyVideoUploader.loadErrorMultiple')
                        : t('components.bunnyVideoUploader.loadErrorProcessing')}
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('components.bunnyVideoUploader.tryAgain')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(value, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('components.bunnyVideoUploader.testUrl')}
                      </Button>
                    </div>
                    {retryCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-3">
                        {t('components.bunnyVideoUploader.attempts', { count: retryCount })}
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <video 
                key={videoSrc}
                controls 
                className="w-full rounded-lg" 
                preload="metadata"
                src={videoSrc}
                playsInline
                onError={handleVideoError}
                onLoadedData={() => setVideoError(false)}
              />
            )}
            
            {onRemove && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="bunny-video-upload"
            className="hidden"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleChange}
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <Progress value={progress?.percentage || 0} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {isTusUpload ? (
                    <>{t('components.bunnyVideoUploader.uploadingTus', { progress: progress?.percentage || 0 })}</>
                  ) : (
                    <>{t('components.bunnyVideoUploader.uploadingCdn', { progress: progress?.percentage || 0 })}</>
                  )}
                </p>
                {progress && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(progress.loaded / (1024 * 1024))}MB / {Math.round(progress.total / (1024 * 1024))}MB
                  </p>
                )}
                {isTusUpload && (
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs">
                      {t('components.bunnyVideoUploader.resumableActive')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Video className="h-10 w-10 text-muted-foreground" />
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <Label
                htmlFor="bunny-video-upload"
                className="cursor-pointer text-sm font-medium"
              >
                <span className="text-primary hover:text-primary/80">
                  {t('components.bunnyVideoUploader.clickToUpload')}
                </span>
                {" "}{t('components.bunnyVideoUploader.dragHere')}
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                {t('components.bunnyVideoUploader.supportedFormats', { size: 2 })}
              </p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <Badge variant="outline" className="text-xs">
                  <Cloud className="h-3 w-3 mr-1" />
                  Powered by Bunny CDN
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
