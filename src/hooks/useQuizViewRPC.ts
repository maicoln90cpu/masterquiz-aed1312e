import { supabase } from "@/integrations/supabase/client";
import type { 
  Quiz, 
  QuizQuestion, 
  QuizResult, 
  QuizFormConfig, 
  CustomField, 
  Profile
} from "@/types/quiz";

// Feature flag para habilitar/desabilitar RPC
// Pode ser controlado via env var ou forçado para testes
const USE_RPC = import.meta.env.VITE_USE_QUIZ_RPC !== 'false';

export interface QuizDisplayData {
  quiz: Quiz;
  questions: QuizQuestion[];
  results: QuizResult[];
  formConfig: QuizFormConfig | null;
  customFields: CustomField[];
  ownerProfile: Pick<Profile, 'facebook_pixel_id' | 'gtm_container_id'> | null;
  translations: string[];
}

interface LoadQuizResult {
  success: boolean;
  data?: QuizDisplayData;
  error?: 'company_not_found' | 'quiz_not_found' | 'slug_required' | 'unknown';
}

interface RPCQuizResponse {
  quiz?: Record<string, unknown>;
  questions?: unknown[];
  results?: unknown[];
  formConfig?: Record<string, unknown> | null;
  customFields?: unknown[];
  ownerProfile?: { facebook_pixel_id?: string; gtm_container_id?: string } | null;
  translations?: string[];
  error?: string;
}

/**
 * Carrega quiz via RPC (função consolidada no banco)
 * Mais rápido que múltiplas queries separadas
 */
async function loadQuizViaRPC(
  slug: string, 
  company?: string
): Promise<LoadQuizResult> {
  try {
    const { data, error } = await supabase.rpc('get_quiz_for_display', {
      p_company_slug: company || null,
      p_quiz_slug: slug
    });

    if (error) {
      console.error('[RPC] Error calling get_quiz_for_display:', error);
      throw error;
    }

    if (!data) {
      return { success: false, error: 'quiz_not_found' };
    }

    // Cast para o tipo esperado
    const rpcData = data as unknown as RPCQuizResponse;

    // Verificar erros retornados pela função
    if (rpcData.error) {
      return { success: false, error: rpcData.error as LoadQuizResult['error'] };
    }

    if (!rpcData.quiz) {
      return { success: false, error: 'quiz_not_found' };
    }

    return {
      success: true,
      data: {
        quiz: rpcData.quiz as unknown as Quiz,
        questions: (rpcData.questions || []) as unknown as QuizQuestion[],
        results: (rpcData.results || []) as unknown as QuizResult[],
        formConfig: rpcData.formConfig as unknown as QuizFormConfig | null,
        customFields: (rpcData.customFields || []) as unknown as CustomField[],
        ownerProfile: rpcData.ownerProfile as unknown as Pick<Profile, 'facebook_pixel_id' | 'gtm_container_id'> | null,
        translations: (rpcData.translations || []) as string[]
      }
    };
  } catch (error) {
    console.error('[RPC] Failed to load quiz via RPC:', error);
    throw error; // Re-throw para o fallback capturar
  }
}

/**
 * Carrega quiz via queries separadas (método legado)
 * Usado como fallback se RPC falhar
 */
async function loadQuizLegacy(
  slug: string, 
  company?: string
): Promise<LoadQuizResult> {
  try {
    let quizUserId: string | null = null;

    // Resolver company slug se fornecido
    if (company) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_slug', company)
        .maybeSingle();

      if (profileError || !profileData) {
        return { success: false, error: 'company_not_found' };
      }
      quizUserId = profileData.id;
    }

    // Buscar quiz
    let quizQuery = supabase
      .from('quizzes')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .eq('status', 'active');

    if (quizUserId) {
      quizQuery = quizQuery.eq('user_id', quizUserId);
    }

    const { data: quizData, error: quizError } = await quizQuery.single();

    if (quizError || !quizData) {
      return { success: false, error: 'quiz_not_found' };
    }

    // Buscar dados relacionados em paralelo
    const [
      questionsResult,
      resultsResult,
      formConfigResult,
      customFieldsResult,
      ownerProfileResult,
      translationsResult
    ] = await Promise.all([
      supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('order_number'),
      supabase
        .from('quiz_results')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('order_number'),
      supabase
        .from('quiz_form_config')
        .select('*')
        .eq('quiz_id', quizData.id)
        .single(),
      supabase
        .from('custom_form_fields')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('order_number'),
      supabase
        .from('profiles')
        .select('facebook_pixel_id, gtm_container_id')
        .eq('id', quizData.user_id)
        .single(),
      supabase
        .from('quiz_translations')
        .select('language_code')
        .eq('quiz_id', quizData.id)
    ]);

    return {
      success: true,
      data: {
        quiz: quizData as Quiz,
        questions: (questionsResult.data || []) as unknown as QuizQuestion[],
        results: (resultsResult.data || []) as unknown as QuizResult[],
        formConfig: formConfigResult.data as unknown as QuizFormConfig | null,
        customFields: (customFieldsResult.data || []) as unknown as CustomField[],
        ownerProfile: ownerProfileResult.data as Pick<Profile, 'facebook_pixel_id' | 'gtm_container_id'> | null,
        translations: (translationsResult.data || []).map(t => t.language_code)
      }
    };
  } catch (error) {
    console.error('[Legacy] Failed to load quiz:', error);
    return { success: false, error: 'unknown' };
  }
}

/**
 * Função principal que tenta RPC primeiro e faz fallback para legado
 * @param slug - Slug do quiz
 * @param company - Company slug (opcional)
 * @returns Dados do quiz ou erro
 */
export async function loadQuizForDisplay(
  slug: string,
  company?: string
): Promise<LoadQuizResult> {
  if (!slug) {
    return { success: false, error: 'slug_required' };
  }

  // Se RPC está habilitado, tentar primeiro
  if (USE_RPC) {
    try {
      console.log('[QuizLoader] Trying RPC method...');
      const rpcResult = await loadQuizViaRPC(slug, company);
      console.log('[QuizLoader] RPC succeeded');
      return rpcResult;
    } catch (rpcError) {
      // RPC falhou, tentar fallback
      console.warn('[QuizLoader] RPC failed, falling back to legacy method:', rpcError);
    }
  }

  // Fallback para método legado
  console.log('[QuizLoader] Using legacy method...');
  return loadQuizLegacy(slug, company);
}

/**
 * Hook info para debugging
 */
export function getQuizLoaderInfo() {
  return {
    rpcEnabled: USE_RPC,
    method: USE_RPC ? 'rpc_with_fallback' : 'legacy_only'
  };
}
