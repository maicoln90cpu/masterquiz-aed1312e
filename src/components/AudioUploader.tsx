import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Music, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

// 🎵 Audio Player Robusto
const AudioPlayer = ({ url }: { url: string }) => {
  const { t } = useTranslation();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    
    const loadAudio = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err: any) {
        console.error('Erro ao carregar áudio:', err);
        setError(t('components.uploaders.audio.couldNotLoad'));
      } finally {
        setLoading(false);
      }
    };
    
    loadAudio();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [url, t]);

  if (loading) return <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!blobUrl) return null;
  
  return <audio controls className="w-full" preload="auto" src={blobUrl} />;
};

interface AudioUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export const AudioUploader = ({ value, onChange, onRemove, className = "" }: AudioUploaderProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const uploadAudio = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        toast.error(t('components.uploaders.audio.formatNotSupported'));
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(t('components.uploaders.audio.fileTooLarge'));
        return;
      }

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('components.uploaders.audio.needLogin'));
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('quiz-media')
        .upload(fileName, file);

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('quiz-media')
        .getPublicUrl(data.path);

      setUploadProgress(100);

      // Update video usage statistics (audio shares video storage)
      const sizeMb = file.size / (1024 * 1024);
      await updateVideoUsage(user.id, sizeMb);

      onChange(publicUrl);
      toast.success(t('components.uploaders.audio.uploadSuccess'));
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      toast.error(t('components.uploaders.audio.uploadError', { error: error.message || 'Unknown error' }));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateVideoUsage = async (userId: string, sizeMb: number) => {
    try {
      const { data: existing } = await supabase
        .from('video_usage')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // ✅ Não lança erro se registro não existir

      if (existing) {
        await supabase
          .from('video_usage')
          .update({
            total_size_mb: existing.total_size_mb + sizeMb,
            video_count: existing.video_count + 1
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('video_usage')
          .insert({
            user_id: userId,
            total_size_mb: sizeMb,
            video_count: 1
          });
      }
    } catch (error) {
      console.error('Error updating audio usage:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadAudio(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAudio(e.target.files[0]);
    }
  };

  if (value) {
    return (
      <div className={`relative ${className}`}>
        <AudioPlayer url={value} />
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted'
      } ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="space-y-4">
          <Music className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('components.uploaders.audio.sendingAudio')}</p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        </div>
      ) : (
        <>
          <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('components.uploaders.audio.dragOrClick')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('components.uploaders.audio.formats')}
            </p>
          </div>
          <input
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/m4a"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
        </>
      )}
    </div>
  );
};
