import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { getLeadScore } from '@/lib/leadTemperature';
import { LeadTemperatureBadge } from '@/components/crm/LeadTemperatureBadge';

interface DraggableLeadCardProps {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  quizTitle: string;
  bgColor: string;
  onClick: () => void;
  isTestLead?: boolean;
  /** Respostas do lead — usadas para calcular score combinado. */
  answers?: Record<string, unknown> | null;
  /** Perguntas do quiz (com blocks/options/points) para cálculo de score. */
  questions?: Array<{ id?: string; blocks?: any[] }> | null;
}

export const DraggableLeadCard = ({
  id,
  name,
  email,
  whatsapp,
  quizTitle,
  bgColor,
  onClick,
  isTestLead,
  answers,
  questions,
}: DraggableLeadCardProps) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id });

  const { temperature, score0to100, hasPoints } = useMemo(
    () =>
      getLeadScore({
        respondent_name: name,
        respondent_email: email,
        respondent_whatsapp: whatsapp,
        answers: answers ?? null,
        questions: questions ?? null,
      }),
    [name, email, whatsapp, answers, questions]
  );

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 hover:shadow-lg transition-smooth hover-scale ${bgColor} btn-touch`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium text-sm truncate flex-1">{name}</p>
        {isTestLead && (
          <Badge variant="outline" className="text-xs shrink-0 gap-1">
            <FlaskConical className="h-3 w-3" />
            {t('crm.testLead', 'Teste')}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate mb-2">{quizTitle}</p>
      <div className="flex gap-1 items-center flex-wrap">
        <LeadTemperatureBadge
          temperature={temperature}
          compact
          score={hasPoints ? score0to100 : null}
        />
        {email && (
          <Badge variant="outline" className="text-xs">
            <Mail className="h-3 w-3" />
          </Badge>
        )}
        {whatsapp && (
          <Badge variant="outline" className="text-xs">
            <Phone className="h-3 w-3" />
          </Badge>
        )}
      </div>
    </Card>
  );
};
