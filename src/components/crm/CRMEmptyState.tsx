import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TestLeadDialog } from './TestLeadDialog';

interface EmptyStateProps {
  quizzes: { id: string; title: string }[];
}

export const CRMEmptyState = ({ quizzes }: EmptyStateProps) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card className="p-8 text-center border-dashed">
      <div className="flex flex-col items-center gap-4">
        <Users className="h-16 w-16 text-muted-foreground/50" />
        <div>
          <h3 className="text-lg font-semibold">{t('crm.emptyState.title', 'Nenhum lead ainda')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('crm.emptyState.description', 'Quando seus quizzes receberem respostas, os leads aparecerão aqui.')}
          </p>
        </div>
        {quizzes.length > 0 && (
          <>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <FlaskConical className="h-4 w-4" />
              {t('crm.generateTestLead', 'Gerar Lead de Teste')}
            </Button>
            <TestLeadDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              quizzes={quizzes}
              defaultQuizId={quizzes[0]?.id}
            />
          </>
        )}
      </div>
    </Card>
  );
};
