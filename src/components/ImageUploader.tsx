import { useState, useId } from "react";
import { Upload, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { optimizeImage, supportsWebP } from "@/lib/imageOptimizer";
import { useTranslation } from "react-i18next";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  /** Desabilitar conversão automática para WebP */
  disableWebPConversion?: boolean;
}

export const ImageUploader = ({ 
  value, 
  onChange, 
  onRemove, 
  className = "",
  disableWebPConversion = false 
}: ImageUploaderProps) => {
  const { t } = useTranslation();
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('components.uploaders.image.onlyImages'));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5242880) {
        toast.error(t('components.uploaders.image.maxSize'));
        return;
      }

      // Otimizar imagem para WebP
      let finalBlob: Blob = file;
      let fileExt = file.name.split('.').pop() || 'jpg';

      if (!disableWebPConversion) {
        setOptimizing(true);
        try {
          const optimized = await optimizeImage(file, {
            quality: 0.85,
            maxWidth: 1920,
            maxHeight: 1920,
            convertToWebP: true
          });
          finalBlob = optimized.blob;
          fileExt = optimized.extension;
          
          if (optimized.type === 'image/webp' && file.type !== 'image/webp') {
            const percent = ((file.size - finalBlob.size) / file.size * 100).toFixed(0);
            toast.success(t('components.uploaders.image.optimizedWebP'), {
              description: t('components.uploaders.image.sizeReduction', { percent })
            });
          }
        } catch (optError) {
          console.warn('Falha ao otimizar, usando original:', optError);
          // Continua com o arquivo original
        } finally {
          setOptimizing(false);
        }
      }

      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('quiz-media')
        .upload(filePath, finalBlob, {
          contentType: finalBlob.type || 'image/webp',
          cacheControl: '31536000' // 1 ano de cache
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quiz-media')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success(t('components.uploaders.image.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('components.uploaders.image.uploadError'));
    } finally {
      setUploading(false);
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
      uploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => {
              if (onRemove) onRemove();
              onChange('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id={inputId}
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
          />
          <label
            htmlFor={inputId}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                {optimizing ? (
                  <>
                    <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-sm font-medium text-primary">{t('components.uploaders.image.optimizingWebP')}</p>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                    <p className="text-sm font-medium">{t('components.uploaders.image.sending')}</p>
                  </>
                )}
              </div>
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
            {!uploading && (
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">
                  {t('components.uploaders.image.clickOrDrag')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('components.uploaders.image.formats')}
                </p>
                {supportsWebP() && !disableWebPConversion && (
                  <p className="text-xs text-primary flex items-center gap-1 justify-center">
                    <Sparkles className="h-3 w-3" />
                    {t('components.uploaders.image.autoConversion')}
                  </p>
                )}
              </div>
            )}
          </label>
        </div>
      )}
    </div>
  );
};
