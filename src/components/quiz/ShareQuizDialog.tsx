import { QRCodeSVG } from 'qrcode.react';
import { Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { pushGTMEvent } from '@/lib/gtmLogger';

interface ShareQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizUrl: string;
  quizId?: string | null;
  onGoToDashboard: () => void;
  showQRCode?: boolean;
}

/**
 * Modal pós-publicação de quiz REAL (não Express).
 * Inclui CTAs de compartilhamento (copiar link + WhatsApp) e textos
 * educativos para incentivar divulgação — combate ao gargalo B1
 * (29/33 quizzes reais com quiz_shared_count = 0).
 */
export const ShareQuizDialog = ({
  open,
  onOpenChange,
  quizUrl,
  quizId,
  onGoToDashboard,
  showQRCode = true,
}: ShareQuizDialogProps) => {
  const { t } = useTranslation();

  const trackShare = (method: 'copy_link' | 'whatsapp' | 'open') => {
    pushGTMEvent('QuizShared', { method, quiz_id: quizId });
    if (method !== 'open') {
      import('@/lib/icpTracking').then((m) =>
        m.incrementProfileCounter('quiz_shared_count'),
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(quizUrl);
    toast.success(t('createQuiz.linkCopied'));
    trackShare('copy_link');
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Responde esse quiz rápido — leva menos de 2 minutos! 👇\n${quizUrl}`,
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
    trackShare('whatsapp');
  };

  const handleOpen = () => {
    window.open(quizUrl, '_blank', 'noopener,noreferrer');
    trackShare('open');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🎉 {t('createQuiz.quizPublished')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('createQuiz.shareYourQuiz')}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center mb-2 px-2">
          Seu quiz está no ar — agora ele precisa de visitantes para gerar
          resultados. Compartilhe o link abaixo com sua audiência.
        </p>

        <div className="space-y-4">
          {showQRCode && (
            <div className="flex justify-center">
              <QRCodeSVG value={quizUrl} size={150} level="H" includeMargin />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Input readOnly value={quizUrl} className="flex-1" />
            <Button size="icon" onClick={handleCopy} aria-label="Copiar link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleWhatsApp}
            variant="outline"
            className="w-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Compartilhar no WhatsApp
          </Button>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleOpen} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('createQuiz.openQuiz')}
            </Button>
            <Button onClick={onGoToDashboard} className="w-full">
              {t('createQuiz.goToDashboard')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Dica: quanto mais pessoas responderem, mais dados você terá no seu CRM.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareQuizDialog;