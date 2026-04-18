import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnFilterProps {
  /** Todos os valores únicos da coluna em todo o dataset (não só na página). */
  allValues: string[];
  /** Conjunto de valores selecionados. Vazio = nenhum filtro aplicado. */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  label: string;
}

export function ColumnFilter({ allValues, selected, onChange, label }: ColumnFilterProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const isActive = selected.size > 0;

  const sorted = useMemo(() => {
    const list = Array.from(new Set(allValues.map(v => v ?? '—')));
    list.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return list;
  }, [allValues]);

  const filtered = useMemo(() => {
    if (!search) return sorted;
    const s = search.toLowerCase();
    return sorted.filter(v => v.toLowerCase().includes(s));
  }, [sorted, search]);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v); else next.add(v);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(filtered));
  const clear = () => onChange(new Set());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filtrar ${label}`}
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted transition-colors',
            isActive && 'text-primary'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className={cn('h-3.5 w-3.5', isActive ? 'fill-primary' : 'text-muted-foreground')} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Filtrar {label}</span>
          {isActive && (
            <button onClick={clear} className="text-xs text-primary hover:underline flex items-center gap-1">
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <Input
          placeholder="Buscar valor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 mb-2 text-xs"
        />
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" className="h-6 text-xs flex-1" onClick={selectAll}>
            Todos
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-xs flex-1" onClick={clear}>
            Nenhum
          </Button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Sem valores</p>
          ) : filtered.map(v => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-xs hover:bg-muted/50 rounded px-1 py-0.5">
              <Checkbox
                checked={selected.has(v)}
                onCheckedChange={() => toggle(v)}
              />
              <span className="truncate">{v || '(vazio)'}</span>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          {selected.size > 0 ? `${selected.size} selecionado(s)` : `${sorted.length} valores únicos`}
        </p>
      </PopoverContent>
    </Popover>
  );
}
