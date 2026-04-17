import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eye, Send, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  campaignId: string;
  campaignName: string;
  templateId: string | null;
  status: string;
  isAutomatic: boolean;
  onChanged: () => void;
}

interface QuizSemRespostaRow {
  email: string;
  full_name: string | null;
  whatsapp: string | null;
  enqueued: boolean;
}

interface ZombieRow {
  user_id: string;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
}

interface DryRunRecipient {
  user_id: string;
  full_name: string | null;
  whatsapp: string | null;
  days_inactive: number;
  plan_type: string;
  quiz_count: number;
  lead_count: number;
  user_stage: string | null;
}

const QUIZ_SEM_RESPOSTA_NAME = 'Abril 2026 — Quiz Sem Resposta';
const ZOMBIES_NAME = 'Abril 2026 — Reativação Zombies';

const TARGET_EMAILS = [
  'contato@borgesvideomaker.com.br',
  'karen.lyra.graduacaouerj@gmail.com',
  'pamella.alinne@hotmail.com',
];

function isValidWhatsapp(w: string | null | undefined): boolean {
  return !!w && w.trim().length >= 10;
}

export function CampaignRecipientsPanel({ campaignId, campaignName, templateId, status, isAutomatic, onChanged }: Props) {
  const isQuizSemResposta = campaignName === QUIZ_SEM_RESPOSTA_NAME;
  const isZombies = campaignName === ZOMBIES_NAME;
  const showZombieActions = isZombies && !isAutomatic && status === 'draft';
  const showGenericPreview = !isQuizSemResposta && !isZombies && status === 'draft';

  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targets, setTargets] = useState<QuizSemRespostaRow[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [zombieRows, setZombieRows] = useState<ZombieRow[]>([]);
  const [enqueueLoading, setEnqueueLoading] = useState(false);
  const [enqueued, setEnqueued] = useState(false);

  // Genérico (dryRun via edge function)
  const [genericOpen, setGenericOpen] = useState(false);
  const [genericLoading, setGenericLoading] = useState(false);
  const [genericRows, setGenericRows] = useState<DryRunRecipient[]>([]);
  const [genericTotal, setGenericTotal] = useState(0);

  useEffect(() => {
    if (isQuizSemResposta) loadQuizSemRespostaTargets();
  }, [isQuizSemResposta, campaignId]);

  const loadQuizSemRespostaTargets = async () => {
    setLoadingTargets(true);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, whatsapp')
        .in('email', TARGET_EMAILS);
      if (pErr) throw pErr;

      const ids = (profiles || []).map(p => p.id);
      const { data: contacts } = await supabase
        .from('recovery_contacts')
        .select('user_id, status')
        .eq('campaign_id', campaignId)
        .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

      const enqueuedSet = new Set(
        (contacts || [])
          .filter(c => ['pending', 'sent', 'delivered', 'read', 'responded'].includes(c.status))
          .map(c => c.user_id)
      );

      const rows: QuizSemRespostaRow[] = TARGET_EMAILS.map(email => {
        const p = (profiles || []).find(pp => pp.email === email);
        return {
          email,
          full_name: p?.full_name || null,
          whatsapp: p?.whatsapp || null,
          enqueued: p ? enqueuedSet.has(p.id) : false,
        };
      });
      setTargets(rows);
    } catch (e) {
      console.error('Error loading targets', e);
    } finally {
      setLoadingTargets(false);
    }
  };

  const handlePreview = async () => {
    setPreviewOpen(true);
    setLoadingPreview(true);
    try {
      const { data, error } = await supabase.rpc('preview_zombie_recipients');
      if (error) throw error;
      setZombieRows((data || []) as ZombieRow[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao buscar destinatários');
      setPreviewOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleEnqueue = async () => {
    if (!templateId) {
      toast.error('Campanha sem template vinculado');
      return;
    }
    setEnqueueLoading(true);
    try {
      const { data, error } = await supabase.rpc('enqueue_zombie_campaign', {
        p_campaign_id: campaignId,
        p_template_id: templateId,
      });
      if (error) throw error;
      const count = typeof data === 'number' ? data : 0;
      toast.success(`${count} usuário${count === 1 ? '' : 's'} enfileirado${count === 1 ? '' : 's'} com sucesso`);
      setEnqueued(true);

      await supabase
        .from('recovery_campaigns')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', campaignId);

      setPreviewOpen(false);
      onChanged();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao enfileirar destinatários');
    } finally {
      setEnqueueLoading(false);
    }
  };

  const handleGenericPreview = async () => {
    setGenericOpen(true);
    setGenericLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-inactive-users', {
        body: { campaignId, dryRun: true },
      });
      if (error) throw error;
      setGenericRows((data?.recipients || []) as DryRunRecipient[]);
      setGenericTotal(data?.total_eligible || 0);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao buscar destinatários');
      setGenericOpen(false);
    } finally {
      setGenericLoading(false);
    }
  };

  if (isQuizSemResposta) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Destinatários ({targets.length})
        </p>
        {loadingTargets ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
          </div>
        ) : (
          <ul className="space-y-1.5">
            {targets.map((t) => (
              <li key={t.email} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.full_name || t.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.email} {t.whatsapp ? `· ${t.whatsapp}` : ''}
                  </p>
                </div>
                {!isValidWhatsapp(t.whatsapp) ? (
                  <Badge variant="destructive" className="shrink-0">WhatsApp não cadastrado</Badge>
                ) : t.enqueued ? (
                  <Badge className="bg-green-600 hover:bg-green-600 shrink-0">Enfileirado</Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0">Não enfileirado</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (showZombieActions) {
    return (
      <>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handlePreview} disabled={loadingPreview}>
            <Eye className="h-4 w-4 mr-1" />
            {loadingPreview ? 'Buscando...' : 'Pré-visualizar destinatários'}
          </Button>
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Destinatários elegíveis — Reativação Zombies</DialogTitle>
              <DialogDescription>
                Usuários com 1 login ou menos, sem quiz real publicado, com WhatsApp válido,
                fora da blacklist e sem contato nos últimos 7 dias.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto border rounded-md">
              {loadingPreview ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : zombieRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p className="text-sm">Nenhum usuário elegível encontrado.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zombieRows.map((r) => (
                      <tr key={r.user_id} className="border-t">
                        <td className="p-2">{r.nome || '—'}</td>
                        <td className="p-2 text-muted-foreground">{r.email || '—'}</td>
                        <td className="p-2 font-mono text-xs">{r.whatsapp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="text-sm text-muted-foreground pt-2">
              Total: <span className="font-semibold text-foreground">{zombieRows.length}</span> usuário(s) elegível(is)
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
              <Button
                onClick={handleEnqueue}
                disabled={enqueueLoading || enqueued || zombieRows.length === 0}
              >
                {enqueueLoading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enfileirando...</>
                ) : enqueued ? (
                  <>✓ Enfileirado</>
                ) : (
                  <><Send className="h-4 w-4 mr-1" /> Confirmar e enfileirar</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (showGenericPreview) {
    return (
      <>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleGenericPreview} disabled={genericLoading}>
            <Eye className="h-4 w-4 mr-1" />
            {genericLoading ? 'Buscando...' : 'Pré-visualizar destinatários'}
          </Button>
        </div>

        <Dialog open={genericOpen} onOpenChange={setGenericOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Destinatários elegíveis — {campaignName}</DialogTitle>
              <DialogDescription>
                Lista simulada com base nos critérios atuais da campanha. Nenhuma mensagem é enfileirada nesta etapa.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto border rounded-md">
              {genericLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : genericRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p className="text-sm">Nenhum usuário elegível encontrado para os critérios atuais.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">WhatsApp</th>
                      <th className="text-left p-2">Plano</th>
                      <th className="text-right p-2">Quizzes</th>
                      <th className="text-right p-2">Leads</th>
                      <th className="text-right p-2">Inativo (dias)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genericRows.map((r) => (
                      <tr key={r.user_id} className="border-t">
                        <td className="p-2">{r.full_name || '—'}</td>
                        <td className="p-2 font-mono text-xs">{r.whatsapp || '—'}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">{r.plan_type}</Badge>
                        </td>
                        <td className="p-2 text-right">{r.quiz_count}</td>
                        <td className="p-2 text-right">{r.lead_count}</td>
                        <td className="p-2 text-right">{r.days_inactive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="text-sm text-muted-foreground pt-2">
              Total: <span className="font-semibold text-foreground">{genericTotal}</span> destinatário(s) elegível(is)
              {genericRows.length < genericTotal && (
                <span className="ml-1">(mostrando os primeiros {genericRows.length})</span>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGenericOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
