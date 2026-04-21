import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchTopErrors,
  fetchErrorOccurrences,
  upsertKnownError,
  deleteKnownError,
} from '@/services/topErrorsService';

describe('topErrorsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTopErrors chama RPC get_top_errors com parâmetros default', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: [], error: null });
    await fetchTopErrors();
    expect(supabase.rpc).toHaveBeenCalledWith('get_top_errors', {
      p_days: 7,
      p_limit: 50,
    });
  });

  it('fetchTopErrors propaga erro da RPC', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'rpc fail' },
    });
    await expect(fetchTopErrors(30, 10)).rejects.toMatchObject({
      message: 'rpc fail',
    });
  });

  it('fetchErrorOccurrences encaminha fingerprint + limit', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: [], error: null });
    await fetchErrorOccurrences('abc123', 5);
    expect(supabase.rpc).toHaveBeenCalledWith('get_error_occurrences', {
      p_fingerprint: 'abc123',
      p_limit: 5,
    });
  });

  it('upsertKnownError envia payload completo com onConflict fingerprint', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ upsert: upsertSpy });

    await upsertKnownError({
      fingerprint: 'fp1',
      title: 'Erro X',
      description: 'desc',
      resolution: 'reload',
      severity: 'high',
      is_ignored: false,
    });

    expect(supabase.from).toHaveBeenCalledWith('known_errors');
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: 'fp1',
        title: 'Erro X',
        severity: 'high',
        is_ignored: false,
      }),
      { onConflict: 'fingerprint' }
    );
  });

  it('deleteKnownError chama .delete().eq(fingerprint)', async () => {
    const eqSpy = vi.fn().mockResolvedValue({ error: null });
    const deleteSpy = vi.fn().mockReturnValue({ eq: eqSpy });
    (supabase.from as any).mockReturnValue({ delete: deleteSpy });

    await deleteKnownError('fp-del');

    expect(deleteSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith('fingerprint', 'fp-del');
  });

  it('upsertKnownError lança quando supabase devolve erro', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: { message: 'boom' } });
    (supabase.from as any).mockReturnValue({ upsert: upsertSpy });

    await expect(
      upsertKnownError({
        fingerprint: 'fp1',
        title: 't',
        severity: 'low',
        is_ignored: false,
      })
    ).rejects.toMatchObject({ message: 'boom' });
  });
});