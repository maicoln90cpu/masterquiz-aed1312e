import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Phone } from "lucide-react";
import { CustomFieldBuilder, CustomField } from "@/components/CustomFieldBuilder";

interface VisitorFormConfigStepProps {
  collectionTiming: string;
  collectName: boolean;
  collectEmail: boolean;
  collectWhatsapp: boolean;
  onCollectionTimingChange: (value: string) => void;
  onCollectNameChange: (value: boolean) => void;
  onCollectEmailChange: (value: boolean) => void;
  onCollectWhatsappChange: (value: boolean) => void;
  quizId?: string;
}

export const VisitorFormConfigStep = ({
  collectionTiming,
  collectName,
  collectEmail,
  collectWhatsapp,
  onCollectionTimingChange,
  onCollectNameChange,
  onCollectEmailChange,
  onCollectWhatsappChange,
  quizId
}: VisitorFormConfigStepProps) => {
  const { t } = useTranslation();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Load existing form config
  useEffect(() => {
    if (quizId) {
      loadFormConfig();
    }
  }, [quizId]);

  const loadFormConfig = async () => {
    if (!quizId) return;
    
    const { data: configData } = await supabase
      .from('quiz_form_config')
      .select('*')
      .eq('quiz_id', quizId)
      .maybeSingle();

    if (configData) {
      onCollectionTimingChange(configData.collection_timing);
      onCollectNameChange(configData.collect_name);
      onCollectEmailChange(configData.collect_email);
      onCollectWhatsappChange(configData.collect_whatsapp);
    }

    const { data: fieldsData } = await supabase
      .from('custom_form_fields')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_number');

    if (fieldsData) {
      const loadedFields = fieldsData.map((f, idx) => ({
        id: f.id,
        field_name: f.field_name,
        field_type: f.field_type as CustomField['field_type'],
        is_required: f.is_required,
        field_options: f.field_options as string[] | undefined,
        order_number: idx
      }));
      setCustomFields(loadedFields);
    }
  };

  const saveFormConfig = async () => {
    if (!quizId) return;
    
    const configPayload = {
      quiz_id: quizId,
      collection_timing: collectionTiming as 'none' | 'before' | 'after' | 'both',
      collect_name: collectName,
      collect_email: collectEmail,
      collect_whatsapp: collectWhatsapp
    };

    logger.form('Salvando configuração do formulário:', { quizId });
    
    const { error } = await supabase
      .from('quiz_form_config')
      .upsert(configPayload, { onConflict: 'quiz_id' });
    
    if (error) {
      logger.error('Erro ao salvar configuração do formulário:', error.message);
      toast.error(`${t('createQuiz.visitorForm.errorSaving')}: ${error.message}`);
      return;
    }

    logger.form('Configuração do formulário salva com sucesso');

    // Save custom fields
    if (customFields.length > 0) {
      logger.form('Salvando campos personalizados:', { count: customFields.length });

      // Delete existing fields
      await supabase
        .from('custom_form_fields')
        .delete()
        .eq('quiz_id', quizId);
      
      // Insert new fields
      const fieldInserts = customFields.map((field, idx) => ({
        quiz_id: quizId,
        field_name: field.field_name,
        field_type: field.field_type,
        field_options: field.field_options,
        is_required: field.is_required,
        order_number: idx
      }));
      
      const { error: fieldsError } = await supabase
        .from('custom_form_fields')
        .insert(fieldInserts);
      
      if (fieldsError) {
        logger.error('Erro ao salvar campos personalizados:', fieldsError.message);
        toast.error(`Erro ao salvar campos personalizados: ${fieldsError.message}`);
        return;
      }

      logger.form('Campos personalizados salvos com sucesso');
    }
  };

  // Auto-save on changes
  useEffect(() => {
    if (quizId) {
      const timer = setTimeout(() => saveFormConfig(), 500);
      return () => clearTimeout(timer);
    }
  }, [collectionTiming, collectName, collectEmail, collectWhatsapp, customFields, quizId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('createQuiz.visitorForm.title')}</CardTitle>
        <CardDescription>{t('createQuiz.visitorForm.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Collection Timing */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">{t('createQuiz.visitorForm.whenCollect')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('createQuiz.visitorForm.whenCollectDesc')}
            </p>
          </div>

          <RadioGroup value={collectionTiming} onValueChange={onCollectionTimingChange}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="timing-none" />
                <Label htmlFor="timing-none" className="font-normal cursor-pointer">
                  {t('createQuiz.visitorForm.noCollect')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="before" id="timing-before" />
                <Label htmlFor="timing-before" className="font-normal cursor-pointer">
                  {t('createQuiz.visitorForm.beforeQuiz')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after" id="timing-after" />
                <Label htmlFor="timing-after" className="font-normal cursor-pointer">
                  {t('createQuiz.visitorForm.afterQuiz')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="timing-both" />
                <Label htmlFor="timing-both" className="font-normal cursor-pointer">
                  {t('createQuiz.visitorForm.both')}
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Standard Fields */}
        {collectionTiming !== 'none' && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">{t('createQuiz.visitorForm.standardFields')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('createQuiz.visitorForm.standardFieldsDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name Field */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <Label className="font-semibold">{t('createQuiz.visitorForm.name')}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t('createQuiz.visitorForm.nameDesc')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={collectName} onCheckedChange={onCollectNameChange} />
                        <span className="text-sm font-medium">
                          {collectName ? t('createQuiz.visitorForm.active') : t('createQuiz.visitorForm.inactive')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Field */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <Label className="font-semibold">{t('createQuiz.visitorForm.email')}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t('createQuiz.visitorForm.emailDesc')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={collectEmail} onCheckedChange={onCollectEmailChange} />
                        <span className="text-sm font-medium">
                          {collectEmail ? t('createQuiz.visitorForm.active') : t('createQuiz.visitorForm.inactive')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp Field */}
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <Label className="font-semibold">{t('createQuiz.visitorForm.whatsapp')}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t('createQuiz.visitorForm.whatsappDesc')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={collectWhatsapp} onCheckedChange={onCollectWhatsappChange} />
                        <span className="text-sm font-medium">
                          {collectWhatsapp ? t('createQuiz.visitorForm.active') : t('createQuiz.visitorForm.inactive')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {collectionTiming !== 'none' && (
          <CustomFieldBuilder fields={customFields} onChange={setCustomFields} />
        )}
      </CardContent>
    </Card>
  );
};
