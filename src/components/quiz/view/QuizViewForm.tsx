import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import type { QuizFormConfig, CustomField } from "@/types/quiz";

interface QuizViewFormProps {
  formConfig: QuizFormConfig | null;
  customFields: CustomField[];
  formData: Record<string, string>;
  setFormData: (data: Record<string, string>) => void;
  onSubmit: () => void;
  isBeforeQuiz: boolean;
}

export function QuizViewForm({
  formConfig,
  customFields,
  formData,
  setFormData,
  onSubmit,
  isBeforeQuiz
}: QuizViewFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('quizView.form.title')}</h3>
      
      {formConfig?.collect_name && (
        <div>
          <Label className="text-base md:text-sm">{t('quizView.name')}</Label>
          <Input
            className="h-12 md:h-10 text-base md:text-sm w-full"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      )}
      
      {formConfig?.collect_email && (
        <div>
          <Label className="text-base md:text-sm">{t('quizView.email')}</Label>
          <Input
            type="email"
            className="h-12 md:h-10 text-base md:text-sm w-full"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      )}
      
      {formConfig?.collect_whatsapp && (
        <div>
          <Label className="text-base md:text-sm">{t('quizView.whatsapp')}</Label>
          <Input
            className="h-12 md:h-10 text-base md:text-sm w-full"
            value={formData.whatsapp || ''}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
          />
        </div>
      )}
      
      {customFields.map((field) => (
        <div key={field.id}>
          <Label className="text-base md:text-sm">
            {field.field_name}{field.is_required && ' *'}
          </Label>
          {field.field_type === 'textarea' ? (
            <Textarea
              className="min-h-[120px] text-base md:text-sm w-full"
              value={formData[field.field_name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
            />
          ) : (
            <Input
              type={field.field_type}
              className="h-12 md:h-10 text-base md:text-sm w-full"
              value={formData[field.field_name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.field_name]: e.target.value })}
            />
          )}
        </div>
      ))}
      
      <Button onClick={onSubmit} className="w-full h-12 md:h-10 text-base md:text-sm btn-touch btn-primary">
        {isBeforeQuiz ? t('quizView.next') : t('quizView.finish')}
        <ArrowRight className="ml-2 h-5 w-5 md:h-4 md:w-4" />
      </Button>
    </div>
  );
}
