import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { pushGTMEvent } from '@/lib/gtmLogger';

describe('gtmLogger.pushGTMEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).dataLayer = [];
  });

  it('faz push no window.dataLayer com event + metadata', () => {
    pushGTMEvent('quiz_published', { quiz_id: '123' }, { persist: false });
    expect((window as any).dataLayer).toHaveLength(1);
    expect((window as any).dataLayer[0]).toEqual({
      event: 'quiz_published',
      quiz_id: '123',
    });
  });

  it('inicializa dataLayer se não existir', () => {
    delete (window as any).dataLayer;
    pushGTMEvent('test_event', {}, { persist: false });
    expect(Array.isArray((window as any).dataLayer)).toBe(true);
  });

  it('persiste em gtm_event_logs por padrão', async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertSpy });
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-abc' } },
    });

    pushGTMEvent('lead_captured', { quiz_id: 'q1' });
    await new Promise((r) => setTimeout(r, 10));

    expect(supabase.from).toHaveBeenCalledWith('gtm_event_logs');
    expect(insertSpy).toHaveBeenCalledWith({
      event_name: 'lead_captured',
      user_id: 'user-abc',
      metadata: { quiz_id: 'q1' },
    });
  });

  it('NÃO persiste quando persist=false', async () => {
    pushGTMEvent('view_only', { foo: 1 }, { persist: false });
    await new Promise((r) => setTimeout(r, 10));
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('falha silenciosa quando insert dá erro', async () => {
    const insertSpy = vi.fn().mockRejectedValue(new Error('db down'));
    (supabase.from as any).mockReturnValue({ insert: insertSpy });
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    expect(() => pushGTMEvent('safe_event', {})).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
  });
});