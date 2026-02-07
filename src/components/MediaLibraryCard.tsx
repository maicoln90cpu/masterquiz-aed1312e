import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Image as ImageIcon, Video, Music, Copy, Trash2, ExternalLink, Cloud, Play, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any>;
  publicUrl: string;
  source?: 'storage' | 'bunny';
  bunnyVideoId?: string;
  sizeMb?: number;
  thumbnailUrl?: string;
}

interface MediaLibraryCardProps {
  file: MediaFile;
  onDelete: (fileName: string) => void;
}

export const MediaLibraryCard = ({ file, onDelete }: MediaLibraryCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const getFileType = (mimetype?: string): "image" | "video" | "audio" | "other" => {
    if (!mimetype) return "other";
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype.startsWith("audio/")) return "audio";
    return "other";
  };

  const formatFileSize = (bytes?: number, sizeMb?: number) => {
    if (sizeMb) return `${sizeMb.toFixed(2)} MB`;
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyUrl = () => {
    if (!file.publicUrl) {
      toast.error("URL não disponível");
      return;
    }
    navigator.clipboard.writeText(file.publicUrl);
    toast.success("URL copiada para a área de transferência");
  };

  const fileType = file.source === 'bunny' ? 'video' : getFileType(file.metadata?.mimetype);
  const isBunnyVideo = file.source === 'bunny';
  const isProcessing = isBunnyVideo && file.metadata?.status === 'processing';
  const duration = file.metadata?.duration;
  const formattedDuration = formatDuration(duration);

  const renderPreview = () => {
    if (isBunnyVideo) {
      // Se tem thumbnail, mostra a imagem
      if (file.thumbnailUrl) {
        return (
          <div 
            className="relative aspect-video bg-muted rounded-t-lg overflow-hidden cursor-pointer group"
            onClick={() => file.publicUrl && !isProcessing && setShowPreview(true)}
          >
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback se thumbnail falhar
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-12 w-12 text-white" />
            </div>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
                <Cloud className="h-3 w-3 mr-1" />
                Bunny CDN
              </Badge>
            </div>
            {formattedDuration && (
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="bg-black/70 text-white text-xs font-mono">
                  <Clock className="h-3 w-3 mr-1" />
                  {formattedDuration}
                </Badge>
              </div>
            )}
          </div>
        );
      }
      
      // Sem thumbnail, mostra placeholder
      return (
        <div 
          className="relative aspect-video bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-t-lg overflow-hidden flex items-center justify-center cursor-pointer group"
          onClick={() => file.publicUrl && !isProcessing && setShowPreview(true)}
        >
          {isProcessing ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Processando...</p>
            </div>
          ) : (
            <>
              <Play className="h-12 w-12 text-orange-500 group-hover:scale-110 transition-transform" />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
                  <Cloud className="h-3 w-3 mr-1" />
                  Bunny CDN
                </Badge>
              </div>
              {formattedDuration && (
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary" className="bg-black/70 text-white text-xs font-mono">
                    <Clock className="h-3 w-3 mr-1" />
                    {formattedDuration}
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    switch (fileType) {
      case "image":
        return (
          <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden cursor-pointer" onClick={() => setShowPreview(true)}>
            <img
              src={file.publicUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        );
      case "video":
        return (
          <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        );
      case "audio":
        return (
          <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        );
      default:
        return (
          <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        );
    }
  };

  const getTypeIcon = () => {
    if (isBunnyVideo) return <Cloud className="h-3 w-3" />;
    switch (fileType) {
      case "image":
        return <ImageIcon className="h-3 w-3" />;
      case "video":
        return <Video className="h-3 w-3" />;
      case "audio":
        return <Music className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    if (isBunnyVideo) return "Vídeo CDN";
    switch (fileType) {
      case "image":
        return "Imagem";
      case "video":
        return "Vídeo";
      case "audio":
        return "Áudio";
      default:
        return "Arquivo";
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {renderPreview()}
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge 
                variant="secondary" 
                className={`flex items-center gap-1 ${isBunnyVideo ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300' : ''}`}
              >
                {getTypeIcon()}
                {getTypeLabel()}
              </Badge>
              {isProcessing && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Processando
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(file.metadata?.size, file.sizeMb)}</span>
              <span>{format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyUrl}
              className="flex-1"
              disabled={!file.publicUrl || isProcessing}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => file.publicUrl && window.open(file.publicUrl, "_blank")}
              disabled={!file.publicUrl || isProcessing}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{file.name}"? 
              {isBunnyVideo && " O vídeo será removido do Bunny CDN e o espaço será liberado."}
              {" "}Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(file.name);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Modal */}
      {showPreview && fileType === "image" && !isBunnyVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <img
            src={file.publicUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Video Preview Modal (Bunny CDN) */}
      {showPreview && isBunnyVideo && file.publicUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-10 right-0 text-white hover:bg-white/20"
              onClick={() => setShowPreview(false)}
            >
              Fechar
            </Button>
            {videoError ? (
              <div className="bg-muted rounded-lg p-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Erro ao carregar vídeo. O vídeo pode ainda estar sendo processado.
                </p>
              </div>
            ) : (
              <video
                src={file.publicUrl}
                controls
                autoPlay
                className="w-full rounded-lg"
                onError={() => setVideoError(true)}
              >
                Seu navegador não suporta reprodução de vídeo.
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
};
