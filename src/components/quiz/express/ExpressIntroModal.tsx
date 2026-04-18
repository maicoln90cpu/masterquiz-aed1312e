import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, Sparkles, Layers, Brain, Globe2, FlaskConical, Bell, Target } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'mq_express_intro_seen_v1';

interface ExpressIntroModalProps {
  /** Quando true, força a exibição do modal mesmo se já visto (útil para reabrir via help). */
  forceOpen?: boolean;
}

/**
 * Modal informativo (1× por usuário/navegador) explicando que o Modo Express
 * é uma versão simplificada e que o editor completo tem muito mais recursos.
 *
 * Persistência: localStorage (chave STORAGE_KEY).
 */
export const ExpressIntroModal = ({ forceOpen = false }: ExpressIntroModalProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [forceOpen]);

  const handleClose = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  const features = [
    { icon: Layers, label: t('expressIntro.f1', '34 tipos de blocos (vídeo, calculadora, NPS, CTA…)') },
    { icon: Brain, label: t('expressIntro.f2', 'Lógica condicional — perguntas que mudam por resposta') },
    { icon: Globe2, label: t('expressIntro.f3', 'Multi-idiomas (PT/EN/ES) automáticos') },
    { icon: FlaskConical, label: t('expressIntro.f4', 'A/B testing entre versões do mesmo quiz') },
    { icon: Bell, label: t('expressIntro.f5', 'Recuperação de leads por WhatsApp e e-mail') },
    { icon: Target, label: t('expressIntro.f6', 'Pixel + GTM dedicados por quiz') },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {t('expressIntro.title', '🚀 Modo Express ativado')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t(
              'expressIntro.subtitle',
              'Você está num atalho turbinado: a IA monta um quiz funcional em ~60 segundos para você publicar agora e começar a captar leads.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm font-medium text-foreground">
            {t('expressIntro.beyond', 'Mas o MasterQuiz vai muito além disso. No editor completo você desbloqueia:')}
          </p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="pt-1 leading-snug">{f.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
            <strong>{t('expressIntro.tipTitle', '💡 Dica:')}</strong>{' '}
            {t(
              'expressIntro.tipBody',
              'Publique este quiz em modo Express. Depois, crie um novo quiz no editor completo e veja a diferença.',
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            {t('expressIntro.cta', 'Entendi, vamos lá')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
