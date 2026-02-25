import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, LayoutDashboard, PartyPopper } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

interface ExpressCelebrationProps {
  quizUrl: string;
  quizTitle: string;
  onGoToDashboard: () => void;
}

export const ExpressCelebration = ({ quizUrl, quizTitle, onGoToDashboard }: ExpressCelebrationProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confettiFired = useRef(false);

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

    // Fire confetti burst
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(quizUrl);
    toast.success(t('createQuiz.linkCopied', 'Link copiado!'));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
        >
          <PartyPopper className="h-10 w-10 text-green-500" />
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t('express.celebration.title', 'Seu quiz está no ar! 🎉')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('express.celebration.subtitle', '"{{title}}" foi publicado com sucesso.', { title: quizTitle })}
          </p>
        </div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <QRCodeSVG value={quizUrl} size={140} level="H" includeMargin />
          </div>
        </motion.div>

        {/* Link + Copy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
            <code className="flex-1 text-sm text-foreground truncate text-left px-2">
              {quizUrl}
            </code>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(quizUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('express.celebration.openQuiz', 'Ver meu quiz')}
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onGoToDashboard}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {t('express.celebration.goDashboard', 'Ir para o Dashboard')}
            </Button>
          </div>
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-muted-foreground"
        >
          {t('express.celebration.tip', 'Dica: No dashboard você pode acompanhar respostas, configurar integrações e muito mais.')}
        </motion.p>
      </motion.div>
    </div>
  );
};
