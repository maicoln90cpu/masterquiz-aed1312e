import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ABTest {
  id: string;
  name: string;
  description: string | null;
  target_element: string | null;
  variant_a_content: Record<string, any>;
  variant_b_content: Record<string, any>;
  traffic_split: number;
  is_active: boolean;
  created_at: string;
}

interface ABSession {
  id: string;
  test_id: string;
  variant: 'A' | 'B';
  session_id: string;
  converted: boolean;
  conversion_type: string | null;
  created_at: string;
}

const STORAGE_KEY = 'mq_ab_sessions';

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('mq_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('mq_session_id', sessionId);
  }
  return sessionId;
};

// Get stored variant assignments from localStorage
const getStoredAssignments = (): Record<string, 'A' | 'B'> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Store variant assignment
const storeAssignment = (testId: string, variant: 'A' | 'B') => {
  if (typeof window === 'undefined') return;
  const assignments = getStoredAssignments();
  assignments[testId] = variant;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  // M09: também guarda a última variante vista para gravar em profiles após signup
  try {
    localStorage.setItem('mq_landing_variant_seen', variant);
  } catch {
    /* noop */
  }
};

export const useLandingABTest = (targetElement?: string) => {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const [assignedVariants, setAssignedVariants] = useState<Record<string, 'A' | 'B'>>({});

  // Fetch active A/B tests
  const { data: tests, isLoading } = useQuery({
    queryKey: ['landing-ab-tests', targetElement],
    queryFn: async () => {
      let query = supabase
        .from('landing_ab_tests')
        .select('*')
        .eq('is_active', true);

      if (targetElement) {
        query = query.eq('target_element', targetElement);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ABTest[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Assign variant for a test
  const assignVariant = useCallback(async (test: ABTest): Promise<'A' | 'B'> => {
    // Check if already assigned
    const stored = getStoredAssignments();
    if (stored[test.id]) {
      return stored[test.id];
    }

    // Randomly assign based on traffic split
    const random = Math.random() * 100;
    const variant: 'A' | 'B' = random < test.traffic_split ? 'A' : 'B';

    // Store locally
    storeAssignment(test.id, variant);

    // Record session in database (fire and forget)
    try {
      await supabase
        .from('landing_ab_sessions')
        .insert({
          test_id: test.id,
          variant,
          session_id: sessionId,
        });
    } catch (e) {
      console.error('Failed to record A/B session:', e);
    }

    return variant;
  }, [sessionId]);

  // Initialize variants on mount
  useEffect(() => {
    if (!tests?.length) return;

    const initVariants = async () => {
      const variants: Record<string, 'A' | 'B'> = {};
      
      for (const test of tests) {
        variants[test.id] = await assignVariant(test);
      }
      
      setAssignedVariants(variants);
    };

    initVariants();
  }, [tests, assignVariant]);

  // Track conversion
  const trackConversion = useMutation({
    mutationFn: async ({ testId, conversionType }: { testId: string; conversionType: string }) => {
      const { error } = await supabase
        .from('landing_ab_sessions')
        .update({ 
          converted: true, 
          conversion_type: conversionType,
          converted_at: new Date().toISOString()
        })
        .eq('test_id', testId)
        .eq('session_id', sessionId);

      if (error) throw error;
    },
  });

  // Get content for a specific test
  const getVariantContent = (testId: string): Record<string, any> | null => {
    const test = tests?.find(t => t.id === testId);
    if (!test) return null;

    const variant = assignedVariants[testId];
    if (!variant) return test.variant_a_content; // Default to A

    return variant === 'A' ? test.variant_a_content : test.variant_b_content;
  };

  // Get test by target element
  const getTestByElement = (element: string): ABTest | undefined => {
    return tests?.find(t => t.target_element === element);
  };

  // Get variant for element
  const getVariantForElement = (element: string): 'A' | 'B' | null => {
    const test = getTestByElement(element);
    if (!test) return null;
    return assignedVariants[test.id] || null;
  };

  // Get content for element
  const getContentForElement = (element: string): Record<string, any> | null => {
    const test = getTestByElement(element);
    if (!test) return null;
    return getVariantContent(test.id);
  };

  return {
    tests,
    isLoading,
    assignedVariants,
    getVariantContent,
    getTestByElement,
    getVariantForElement,
    getContentForElement,
    trackConversion: trackConversion.mutate,
    sessionId,
  };
};

// Admin hook for managing A/B tests
export const useLandingABTestAdmin = () => {
  const queryClient = useQueryClient();

  // Fetch all tests (including inactive)
  const { data: tests, isLoading } = useQuery({
    queryKey: ['landing-ab-tests-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ABTest[];
    },
  });

  // Fetch test results/stats
  const { data: stats } = useQuery({
    queryKey: ['landing-ab-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_ab_sessions')
        .select('test_id, variant, converted, conversion_type');

      if (error) throw error;

      // Aggregate stats per test
      const testStats: Record<string, {
        variantA: { sessions: number; conversions: number };
        variantB: { sessions: number; conversions: number };
      }> = {};

      (data as ABSession[])?.forEach(session => {
        if (!testStats[session.test_id]) {
          testStats[session.test_id] = {
            variantA: { sessions: 0, conversions: 0 },
            variantB: { sessions: 0, conversions: 0 },
          };
        }

        const variant = session.variant === 'A' ? 'variantA' : 'variantB';
        testStats[session.test_id][variant].sessions++;
        if (session.converted) {
          testStats[session.test_id][variant].conversions++;
        }
      });

      return testStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create test
  const createTest = useMutation({
    mutationFn: async (test: Partial<ABTest>) => {
      const { error } = await supabase
        .from('landing_ab_tests')
        .insert([{
          name: test.name!,
          description: test.description,
          target_element: test.target_element,
          variant_a_content: test.variant_a_content,
          variant_b_content: test.variant_b_content,
          traffic_split: test.traffic_split,
          is_active: test.is_active,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-ab-tests-admin'] });
    },
  });

  // Update test
  const updateTest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ABTest> & { id: string }) => {
      const { error } = await supabase
        .from('landing_ab_tests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-ab-tests-admin'] });
      queryClient.invalidateQueries({ queryKey: ['landing-ab-tests'] });
    },
  });

  // Delete test
  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_ab_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-ab-tests-admin'] });
    },
  });

  return {
    tests,
    stats,
    isLoading,
    createTest,
    updateTest,
    deleteTest,
  };
};
