import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Video, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 🎬 Video Player Robusto
const VideoPlayer = ({ url }: { url: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err: any) {
        console.error('Erro ao carregar vídeo:', err);
        setError('Não foi possível carregar o vídeo');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideo();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [url]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!blobUrl) return null;
  
  return <video controls className="w-full rounded-lg" preload="auto" src={blobUrl} playsInline />;
};

interface VideoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export const VideoUploader = ({ value, onChange, onRemove, className }: VideoUploaderProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = async (file: File) => {
    try {
      // Validar tipo de arquivo
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        toast.error(t('components.videoUploader.invalidType'));
        return;
      }

      // Validar tamanho (100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(t('components.videoUploader.fileTooLarge', { size: 100 }));
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('components.videoUploader.loginRequired'));
        return;
      }

      // Nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Simular progresso durante o upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('quiz-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('quiz-media')
        .getPublicUrl(data.path);

      // Atualizar uso de storage
      const fileSizeMb = file.size / (1024 * 1024);
      await updateVideoUsage(user.id, fileSizeMb);

      onChange(publicUrl);
      toast.success(t('components.videoUploader.uploadSuccess'));
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(t('components.videoUploader.uploadError') + ': ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateVideoUsage = async (userId: string, sizeMb: number) => {
    // Buscar uso atual (maybeSingle porque pode não existir no primeiro upload)
    const { data: usage, error: fetchError } = await supabase
      .from('video_usage')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao buscar video_usage:', fetchError);
    }

    if (usage) {
      // Atualizar uso existente
      await supabase
        .from('video_usage')
        .update({
          total_size_mb: usage.total_size_mb + sizeMb,
          video_count: usage.video_count + 1
        })
        .eq('user_id', userId);
    } else {
      // Criar registro inicial
      await supabase
        .from('video_usage')
        .insert({
          user_id: userId,
          total_size_mb: sizeMb,
          video_count: 1
        });
    }
  };

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
      uploadVideo(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadVideo(e.target.files[0]);
    }
  };

  if (value) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="relative">
            <VideoPlayer url={value} />
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
            id="video-upload"
            className="hidden"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleChange}
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {t('components.videoUploader.uploading', { progress: uploadProgress })}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label
                htmlFor="video-upload"
                className="cursor-pointer text-sm font-medium"
              >
                <span className="text-primary hover:text-primary/80">
                  {t('components.videoUploader.clickToUpload')}
                </span>
                {" "}{t('components.videoUploader.dragHere')}
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                {t('components.videoUploader.supportedFormats', { size: 100 })}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
