import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  incrementProfileCounter,
  setProfileFirstText,
  setProfileFlagTrue,
  setProfileFirstTimestamp,
} from '@/lib/icpTracking';

describe('icpTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.rpc as any).mockResolvedValue({ error: null });
  });

  it('incrementProfileCounter chama RPC increment_profile_counter com coluna correta', async () => {
    incrementProfileCounter('paywall_hit_count');
    await Promise.resolve();
    expect(supabase.rpc).toHaveBeenCalledWith('increment_profile_counter', {
      _column: 'paywall_hit_count',
    });
  });

  it('setProfileFirstText chama set_profile_first_value com texto', async () => {
    setProfileFirstText('plan_limit_hit_type', 'leads');
    await Promise.resolve();
    expect(supabase.rpc).toHaveBeenCalledWith('set_profile_first_value', {
      _column: 'plan_limit_hit_type',
      _value: 'leads',
    });
  });

  it('setProfileFlagTrue envia _value="true"', async () => {
    setProfileFlagTrue('ai_used_on_real_quiz');
    await Promise.resolve();
    expect(supabase.rpc).toHaveBeenCalledWith('set_profile_first_value', {
      _column: 'ai_used_on_real_quiz',
      _value: 'true',
    });
  });

  it('setProfileFirstTimestamp envia _value="now"', async () => {
    setProfileFirstTimestamp('first_lead_received_at');
    await Promise.resolve();
    expect(supabase.rpc).toHaveBeenCalledWith('set_profile_first_value', {
      _column: 'first_lead_received_at',
      _value: 'now',
    });
  });

  it('nunca lança mesmo se RPC retornar erro (fire-and-forget)', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({ error: { message: 'boom' } });
    expect(() => incrementProfileCounter('quiz_shared_count')).not.toThrow();
    await Promise.resolve();
  });
});