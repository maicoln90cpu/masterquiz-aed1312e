import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FormConfig, FormData } from '@/hooks/useQuizPreviewState';

interface PreviewFormScreenProps {
  formConfig: FormConfig;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit: () => void;
}

export const PreviewFormScreen = ({
  formConfig,
  formData,
  onFormDataChange,
  onSubmit
}: PreviewFormScreenProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          {t('preview.yourData', 'Seus Dados')}
        </h2>
        <p className="text-muted-foreground">
          {t('preview.fillToSeeResult', 'Preencha para ver seu resultado')}
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {formConfig.collect_name && (
          <div>
            <Label htmlFor="preview-name">{t('form.name', 'Nome')}</Label>
            <Input 
              id="preview-name" 
              placeholder={t('form.namePlaceholder', 'Digite seu nome')}
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            />
          </div>
        )}
        {formConfig.collect_email && (
          <div>
            <Label htmlFor="preview-email">{t('form.email', 'E-mail')}</Label>
            <Input 
              id="preview-email" 
              type="email"
              placeholder={t('form.emailPlaceholder', 'seu@email.com')}
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            />
          </div>
        )}
        {formConfig.collect_whatsapp && (
          <div>
            <Label htmlFor="preview-whatsapp">{t('form.whatsapp', 'WhatsApp')}</Label>
            <Input 
              id="preview-whatsapp" 
              placeholder={t('form.whatsappPlaceholder', '(00) 00000-0000')}
              value={formData.whatsapp}
              onChange={(e) => onFormDataChange({ ...formData, whatsapp: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onSubmit} size="lg">
          {t('preview.seeResult', 'Ver Resultado')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
