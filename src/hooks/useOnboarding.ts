import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStatus {
  id?: string;
  welcome_completed: boolean;
  dashboard_tour_completed: boolean;
  settings_tour_completed: boolean;
  analytics_tour_completed: boolean;
  crm_tour_completed: boolean;
  integrations_tour_completed: boolean;
  quiz_editor_tour_completed: boolean;
  first_quiz_created: boolean;
  first_lead_captured: boolean;
  completed_at: string | null;
}

const defaultStatus: OnboardingStatus = {
  welcome_completed: false,
  dashboard_tour_completed: false,
  settings_tour_completed: false,
  analytics_tour_completed: false,
  crm_tour_completed: false,
  integrations_tour_completed: false,
  quiz_editor_tour_completed: false,
  first_quiz_created: false,
  first_lead_captured: false,
  completed_at: null,
};

export const useOnboarding = () => {
  const [status, setStatus] = useState<OnboardingStatus>(defaultStatus);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading onboarding status:', error);
        }

        if (data) {
          setStatus({
            id: data.id,
            welcome_completed: data.welcome_completed ?? false,
            dashboard_tour_completed: data.dashboard_tour_completed ?? false,
            settings_tour_completed: data.settings_tour_completed ?? false,
            analytics_tour_completed: data.analytics_tour_completed ?? false,
            crm_tour_completed: data.crm_tour_completed ?? false,
            integrations_tour_completed: data.integrations_tour_completed ?? false,
            quiz_editor_tour_completed: data.quiz_editor_tour_completed ?? false,
            first_quiz_created: data.first_quiz_created ?? false,
            first_lead_captured: data.first_lead_captured ?? false,
            completed_at: data.completed_at,
          });
        }
      } catch (error) {
        console.error('Error in loadOnboardingStatus:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingStatus();
  }, []);

  const updateOnboardingStep = useCallback(async (
    step: keyof Omit<OnboardingStatus, 'id' | 'completed_at'>,
    completed: boolean = true
  ) => {
    if (!userId) return;

    try {
      const updateData = {
        [step]: completed,
        updated_at: new Date().toISOString(),
      };

      // Check if all steps are completed
      const newStatus = { ...status, [step]: completed };
      const allCompleted = 
        newStatus.welcome_completed &&
        newStatus.dashboard_tour_completed &&
        newStatus.settings_tour_completed &&
        newStatus.analytics_tour_completed &&
        newStatus.crm_tour_completed;

      if (allCompleted) {
        (updateData as any).completed_at = new Date().toISOString();
      }

      if (status.id) {
        // Update existing record
        const { error } = await supabase
          .from('user_onboarding')
          .update(updateData)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('user_onboarding')
          .insert({
            user_id: userId,
            ...updateData,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setStatus(prev => ({ ...prev, id: data.id }));
        }
      }

      setStatus(prev => ({
        ...prev,
        [step]: completed,
        ...(allCompleted ? { completed_at: new Date().toISOString() } : {}),
      }));
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  }, [userId, status]);

  const resetOnboarding = useCallback(async () => {
    if (!userId) return;

    try {
      if (status.id) {
        await supabase
          .from('user_onboarding')
          .update({
            welcome_completed: false,
            dashboard_tour_completed: false,
            settings_tour_completed: false,
            analytics_tour_completed: false,
            crm_tour_completed: false,
            integrations_tour_completed: false,
            quiz_editor_tour_completed: false,
            first_quiz_created: false,
            first_lead_captured: false,
            completed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      setStatus(defaultStatus);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }, [userId, status.id]);

  const shouldShowWelcome = !loading && !status.welcome_completed;
  const shouldShowDashboardTour = !loading && status.welcome_completed && !status.dashboard_tour_completed && localStorage.getItem('mq_dashboard_tour_completed') !== 'true';

  return {
    status,
    loading,
    updateOnboardingStep,
    resetOnboarding,
    shouldShowWelcome,
    shouldShowDashboardTour,
    isFullyCompleted: !!status.completed_at,
  };
};
