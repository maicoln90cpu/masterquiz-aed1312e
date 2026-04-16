import { lazy, Suspense, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const HealthPanel = lazy(() => import('./HealthPanel'));
const TrendsPanel = lazy(() => import('./TrendsPanel'));
const FeatureUsagePanel = lazy(() => import('./FeatureUsagePanel'));
const AuditLogPanel = lazy(() => import('./AuditLogPanel'));

interface Section {
  id: string;
  title: string;
  emoji: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}

const sections: Section[] = [
  { id: 'health', title: 'Saúde do Sistema', emoji: '🩺', component: HealthPanel },
  { id: 'trends', title: 'Tendência de Score', emoji: '📈', component: TrendsPanel },
  { id: 'errors', title: 'Erros do Frontend', emoji: '🐛', component: HealthPanel }, // placeholder — Etapa 2
  { id: 'performance', title: 'Performance de Operações', emoji: '⚡', component: HealthPanel }, // placeholder — Etapa 2
  { id: 'activity', title: 'Atividade Recente', emoji: '📊', component: HealthPanel }, // placeholder — Etapa 2
  { id: 'integrations', title: 'Integrações Externas', emoji: '🔗', component: HealthPanel }, // placeholder — Etapa 2
  { id: 'cron', title: 'Automações (Cron)', emoji: '⏰', component: HealthPanel }, // placeholder — Etapa 2
  { id: 'queue', title: 'Monitor de Filas', emoji: '📬', component: HealthPanel }, // placeholder — Etapa 2
  { id: 'features', title: 'Uso de Funcionalidades', emoji: '🎯', component: FeatureUsagePanel },
  { id: 'audit', title: 'Log de Atividades', emoji: '📋', component: AuditLogPanel },
];

export const SystemMonitorTab = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['health']));

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {sections.map(({ id, title, emoji, component: Component }) => {
        const isOpen = openSections.has(id);
        // Etapa 2 placeholders
        const isPlaceholder = ['errors', 'performance', 'activity', 'integrations', 'cron', 'queue'].includes(id);

        return (
          <Collapsible key={id} open={isOpen} onOpenChange={() => toggle(id)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span>{emoji}</span> {title}
                {isPlaceholder && <span className="text-xs text-muted-foreground font-normal">(em breve)</span>}
              </h3>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {isPlaceholder ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Este painel será implementado na Etapa 2.
                </div>
              ) : (
                <Suspense fallback={<Skeleton className="h-48 w-full m-4" />}>
                  <Component />
                </Suspense>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default SystemMonitorTab;
