import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface TestLeadResult {
  success: boolean;
  leadId?: string;
  error?: string;
}

/**
 * Hook para gerar leads de teste
 * Permite ao usuário simular um lead para testar CRM/Analytics
 * sem precisar de tráfego real
 */
export function useTestLead() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTestLead = async (quizId: string): Promise<TestLeadResult> => {
    if (!quizId) {
      toast.error(t('testLead.noQuizSelected', 'Selecione um quiz'));
      return { success: false, error: 'No quiz selected' };
    }

    setIsGenerating(true);

    try {
      // Buscar um result_id do quiz para associar
      const { data: results } = await supabase
        .from('quiz_results')
        .select('id, result_text')
        .eq('quiz_id', quizId)
        .limit(1);

      const resultId = results?.[0]?.id || null;
      const resultText = results?.[0]?.result_text || 'Resultado de Teste';

      // Gerar dados fictícios
      const testNames = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima'];
      const randomName = testNames[Math.floor(Math.random() * testNames.length)];
      const randomEmail = `teste.${Date.now()}@exemplo.com`;
      const randomWhatsapp = `+5511${Math.floor(900000000 + Math.random() * 99999999)}`;

      // Usar Edge Function para garantir que milestone events disparam
      const sessionId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { data: fnData, error } = await supabase.functions.invoke('save-quiz-response', {
        body: {
          quiz_id: quizId,
          session_id: sessionId,
          respondent_name: `🧪 ${randomName}`,
          respondent_email: randomEmail,
          respondent_whatsapp: randomWhatsapp,
          result_id: resultId,
          answers: { 
            _is_test_lead: true,
            _generated_at: new Date().toISOString(),
            _test_metadata: {
              source: 'dashboard_simulation',
              version: '1.0'
            }
          },
          custom_field_data: {},
          is_final: true,
        },
      });

      if (error) throw error;
      const lead = fnData as { id?: string };

      if (error) throw error;

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['responses'] });

      toast.success(
        t('testLead.success', 'Lead de teste criado!'),
        {
          description: t('testLead.viewInCRM', 'Visualize no CRM'),
          action: {
            label: t('testLead.goToCRM', 'Ver CRM'),
            onClick: () => navigate('/crm')
          }
        }
      );

      return { success: true, leadId: lead.id };
    } catch (error) {
      console.error('Error generating test lead:', error);
      toast.error(t('testLead.error', 'Erro ao gerar lead de teste'));
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateTestLead,
    isGenerating
  };
}
