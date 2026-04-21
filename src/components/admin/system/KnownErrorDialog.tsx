import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchErrorOccurrences,
  upsertKnownError,
  deleteKnownError,
  type TopErrorRow,
  type KnownErrorSeverity,
} from '@/services/topErrorsService';

interface KnownErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorRow: TopErrorRow | null;
}

export function KnownErrorDialog({ open, onOpenChange, errorRow }: KnownErrorDialogProps) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resolution, setResolution] = useState('');
  const [severity, setSeverity] = useState<KnownErrorSeverity>('medium');
  const [isIgnored, setIsIgnored] = useState(false);

  useEffect(() => {
    if (errorRow) {
      setTitle(errorRow.known_title ?? '');
      setDescription('');
      setResolution(errorRow.known_resolution ?? '');
      setSeverity((errorRow.known_severity as KnownErrorSeverity) ?? 'medium');
      setIsIgnored(errorRow.is_ignored ?? false);
    }
  }, [errorRow]);

  const { data: occurrences, isLoading: loadingOcc } = useQuery({
    queryKey: ['error-occurrences', errorRow?.fingerprint],
    queryFn: () => fetchErrorOccurrences(errorRow!.fingerprint, 10),
    enabled: open && !!errorRow,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!errorRow) return;
      if (!title.trim()) throw new Error('Título obrigatório');
      await upsertKnownError({
        fingerprint: errorRow.fingerprint,
        title: title.trim(),
        description: description.trim() || null,
        resolution: resolution.trim() || null,
        severity,
        is_ignored: isIgnored,
      });
    },
    onSuccess: () => {
      toast.success('Erro documentado com sucesso');
      qc.invalidateQueries({ queryKey: ['top-errors'] });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Erro ao salvar');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!errorRow) return;
      await deleteKnownError(errorRow.fingerprint);
    },
    onSuccess: () => {
      toast.success('Documentação removida');
      qc.invalidateQueries({ queryKey: ['top-errors'] });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Erro ao remover');
    },
  });

  if (!errorRow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Documentar erro</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {errorRow.component_name} · {errorRow.fingerprint.slice(0, 12)}…
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Mensagem-exemplo</p>
              <p className="text-xs font-mono break-all">{errorRow.sample_message}</p>
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <span>Total: <strong>{errorRow.total_count}</strong></span>
                <span>· No período: <strong>{errorRow.count_period}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ke-title">Título *</Label>
              <Input
                id="ke-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Falha ao carregar chunk dinâmico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ke-desc">Descrição (causa)</Label>
              <Textarea
                id="ke-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que está causando este erro?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ke-res">Resolução aplicada</Label>
              <Textarea
                id="ke-res"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Como foi (ou será) resolvido?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ke-sev">Severidade</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as KnownErrorSeverity)}>
                  <SelectTrigger id="ke-sev"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={isIgnored}
                    onCheckedChange={(c) => setIsIgnored(c === true)}
                  />
                  Ignorar (esconder do painel)
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Últimas ocorrências</Label>
              {loadingOcc ? (
                <Skeleton className="h-24 w-full" />
              ) : !occurrences || occurrences.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma ocorrência encontrada.</p>
              ) : (
                <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                  {occurrences.map((o) => (
                    <div key={o.id} className="p-2 text-xs space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">
                          {new Date(o.created_at).toLocaleString('pt-BR')}
                        </span>
                        {o.user_id && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {o.user_id.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      {o.url && (
                        <p className="text-[11px] text-muted-foreground truncate font-mono" title={o.url}>
                          {o.url}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          {errorRow.is_documented && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="mr-auto"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-2">Remover</span>
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title.trim()}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}