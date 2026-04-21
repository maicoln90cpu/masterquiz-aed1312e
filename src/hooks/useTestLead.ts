import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { invokeResilient } from '@/lib/resilientFetch';

interface TestLeadInput {
  quizId: string;
  name?: string;
  email?: string;
  whatsapp?: string;
}

interface TestLeadResult {
  success: boolean;
  leadId?: string;
  error?: string;
}

const TEST_NAMES = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima'];

/**
 * Hook para gerar leads de teste.
 * Permite ao usuário simular um lead para testar CRM/Analytics
 * sem precisar de tráfego real.
 *
 * IMPORTANTE: a partir da Fase G, é OBRIGATÓRIO informar email OU WhatsApp
 * (validação acontece no <TestLeadDialog />, este hook apenas executa).
 */
export function useTestLead() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTestLead = async (input: TestLeadInput): Promise<TestLeadResult> => {
    const { quizId, name, email, whatsapp } = input;

    if (!quizId) {
      toast.error(t('testLead.noQuizSelected', 'Selecione um quiz'));
      return { success: false, error: 'No quiz selected' };
    }

    // 🔒 Defesa em profundidade: além da validação do <TestLeadDialog />,
    // o hook também recusa qualquer tentativa sem email ou WhatsApp.
    const hasEmail = !!email?.trim();
    const hasWhatsapp = !!whatsapp?.trim();
    if (!hasEmail && !hasWhatsapp) {
      toast.error(t('testLead.contactRequired', 'Informe email ou WhatsApp'));
      return { success: false, error: 'Email or WhatsApp required' };
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

      const finalName = name?.trim() || TEST_NAMES[Math.floor(Math.random() * TEST_NAMES.length)];

      // Usar Edge Function para garantir que milestone events disparam
      const sessionId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // 🛡️ P15: invokeResilient — perda de lead = perda de receita, retry obrigatório
      const { data: fnData, error } = await invokeResilient<unknown>(
        'save-quiz-response',
        {
          quiz_id: quizId,
          session_id: sessionId,
          respondent_name: `🧪 ${finalName}`,
          respondent_email: email || null,
          respondent_whatsapp: whatsapp || null,
          result_id: resultId,
          answers: {
            _is_test_lead: true,
            _generated_at: new Date().toISOString(),
            _test_metadata: {
              source: 'dashboard_simulation',
              version: '2.0',
            },
          },
          custom_field_data: {},
          is_final: true,
        },
      );

      if (error) throw error;
      // 🔒 P11 envelope: save-quiz-response devolve { ok, data: { action, id }, traceId }
      const lead = (fnData && typeof fnData === 'object' && 'data' in fnData
        ? (fnData as { data?: { id?: string } }).data
        : (fnData as { id?: string })) || {};

      // 🎯 GTM: test_lead_generated
      const { pushGTMEvent } = await import('@/lib/gtmLogger');
      pushGTMEvent('test_lead_generated', {
        quiz_id: quizId,
        lead_id: lead?.id || null,
        has_email: !!email,
        has_whatsapp: !!whatsapp,
      });

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
            onClick: () => navigate('/crm'),
          },
        },
      );

      return { success: true, leadId: lead?.id };
    } catch (error) {
      logger.error('Error generating test lead:', error);
      toast.error(t('testLead.error', 'Erro ao gerar lead de teste'));
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateTestLead,
    isGenerating,
  };
}
