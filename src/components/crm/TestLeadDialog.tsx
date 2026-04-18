import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTestLead } from '@/hooks/useTestLead';

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(20).optional().or(z.literal('')),
  quizId: z.string().min(1, 'Selecione um quiz'),
}).refine((d) => !!d.email || !!d.whatsapp, {
  message: 'Informe email ou WhatsApp para encontrar o lead no CRM',
  path: ['email'],
});

interface TestLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizzes: { id: string; title: string }[];
  defaultQuizId?: string;
}

export const TestLeadDialog = ({ open, onOpenChange, quizzes, defaultQuizId }: TestLeadDialogProps) => {
  const { t } = useTranslation();
  const { generateTestLead, isGenerating } = useTestLead();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [quizId, setQuizId] = useState(defaultQuizId || quizzes[0]?.id || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setWhatsapp('');
      setQuizId(defaultQuizId || quizzes[0]?.id || '');
      setErrors({});
    }
  }, [open, defaultQuizId, quizzes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, whatsapp, quizId });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const k = String(i.path[0] || 'form');
        if (!errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    const res = await generateTestLead(parsed.data);
    if (res.success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            {t('testLead.dialogTitle', 'Gerar lead de teste')}
          </DialogTitle>
          <DialogDescription>
            {t('testLead.dialogDescription', 'Simule um lead para visualizar como ele aparece no CRM e Analytics. Informe seus próprios dados de contato para encontrá-lo no Kanban depois.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {quizzes.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="test-lead-quiz">{t('testLead.quiz', 'Quiz')}</Label>
              <Select value={quizId} onValueChange={setQuizId}>
                <SelectTrigger id="test-lead-quiz">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((q) => (
                    <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.quizId && <p className="text-xs text-destructive">{errors.quizId}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="test-lead-name">
              {t('testLead.name', 'Nome')} <span className="text-muted-foreground text-xs">({t('common.optional', 'opcional')})</span>
            </Label>
            <Input
              id="test-lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('testLead.namePlaceholder', 'Seu nome ou um nome fictício') as string}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-lead-email">
              {t('testLead.email', 'E-mail')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="test-lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              maxLength={255}
              aria-invalid={!!errors.email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-lead-whatsapp">
              {t('testLead.whatsapp', 'WhatsApp')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="test-lead-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+55 11 99999-9999"
              maxLength={20}
              aria-invalid={!!errors.whatsapp}
            />
          </div>

          {errors.email && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{errors.email}</AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-muted-foreground">
            {t('testLead.contactHint', '* Preencha pelo menos um dos dois (email ou WhatsApp) para conseguir encontrar o lead no Kanban depois.')}
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button type="submit" disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading', 'Carregando...')}</>
              ) : (
                <><FlaskConical className="h-4 w-4" /> {t('testLead.generate', 'Gerar lead')}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
