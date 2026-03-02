import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { pushGTMEvent } from "@/lib/gtmLogger";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizSlug: string;
  companySlug?: string | null;
}

export const EmbedDialog = ({ open, onOpenChange, quizSlug, companySlug }: EmbedDialogProps) => {
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("600px");
  const [copied, setCopied] = useState(false);

  // ✅ Padronizado: sempre usar company_slug quando disponível
  const quizUrl = companySlug 
    ? `${window.location.origin}/${companySlug}/${quizSlug}`
    : `${window.location.origin}/quiz/${quizSlug}`;

  const embedCode = `<iframe 
  src="${quizUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allowfullscreen
  style="border: none; border-radius: 8px;"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Código copiado!");
    pushGTMEvent('QuizShared', { method: 'embed', quiz_slug: quizSlug });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Incorporar Quiz no seu Site</DialogTitle>
          <DialogDescription>
            Cole este código HTML na sua página para exibir o quiz
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Largura</Label>
              <Input
                id="width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="100%"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: 100%, 800px
              </p>
            </div>
            
            <div>
              <Label htmlFor="height">Altura</Label>
              <Input
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="600px"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: 600px, 100vh
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="embed-code">Código de Incorporação</Label>
            <div className="relative">
              <Textarea
                id="embed-code"
                value={embedCode}
                readOnly
                className="font-mono text-sm min-h-[150px] pr-12"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Como usar:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Copie o código acima</li>
              <li>Cole no HTML da sua página onde deseja que o quiz apareça</li>
              <li>Ajuste largura e altura conforme necessário</li>
              <li>Salve e publique sua página</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
