import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, LayoutDashboard, PartyPopper, Share2, MessageCircle } from "lucide-react";
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
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

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

  const shareText = t('express.celebration.shareText', 'Faça meu quiz: {{title}}', { title: quizTitle });

  const shareLinks = [
    {
      label: "WhatsApp",
      icon: <MessageCircle className="h-5 w-5" />,
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + quizUrl)}`,
      className: "bg-[#25D366] hover:bg-[#1da851] text-white",
    },
    {
      label: "Facebook",
      icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}`,
      className: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
    },
    {
      label: "X / Twitter",
      icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(quizUrl)}&text=${encodeURIComponent(shareText)}`,
      className: "bg-[#000000] hover:bg-[#333333] text-white",
    },
    {
      label: "LinkedIn",
      icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}`,
      className: "bg-[#0A66C2] hover:bg-[#094d92] text-white",
    },
  ];

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

        {/* Share Social Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-muted/50 rounded-xl p-5 space-y-4"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowShare(!showShare)}
            className="w-full gap-2 font-semibold"
          >
            <Share2 className="h-5 w-5" />
            {t('express.celebration.shareQuiz', 'Divulgar meu Quiz')}
          </Button>

          {showShare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                {t('express.celebration.shareDesc', 'Compartilhe seu quiz nas redes sociais')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {shareLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant="ghost"
                    className={`gap-2 ${link.className}`}
                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer,width=600,height=400')}
                  >
                    {link.icon}
                    {link.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-xs text-muted-foreground"
        >
          {t('express.celebration.tip', 'Dica: No dashboard você pode acompanhar respostas, configurar integrações e muito mais.')}
        </motion.p>
      </motion.div>
    </div>
  );
};
