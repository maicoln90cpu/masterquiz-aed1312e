import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PreviewLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
}

export const PreviewLinkDialog = ({ open, onOpenChange, quizId }: PreviewLinkDialogProps) => {
  const [copied, setCopied] = useState(false);
  
  // ✅ CORREÇÃO: Garantir que a URL está correta usando o origin da página atual
  const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
  const previewUrl = `${origin}/preview/${quizId}`;
  
  // Debug log para verificar URL gerada
  logger.log('[PreviewLinkDialog] Quiz ID:', quizId);
  logger.log('[PreviewLinkDialog] Generated URL:', previewUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPreview = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link de Preview</DialogTitle>
          <DialogDescription>
            Compartilhe este link para visualizar o quiz sem publicá-lo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="preview-url">URL de Preview</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="preview-url"
                value={previewUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
            <p className="text-sm text-warning-foreground">
              <strong>⚠️ Importante:</strong> Este link permite visualizar o quiz mesmo em rascunho. 
              Compartilhe apenas com pessoas autorizadas.
            </p>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleOpenPreview}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
