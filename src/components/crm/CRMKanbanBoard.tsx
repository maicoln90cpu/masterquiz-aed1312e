import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DraggableLeadCard } from '@/components/crm/DraggableLeadCard';
import { DroppableColumn } from '@/components/crm/DroppableColumn';

type LeadStatus = 'new' | 'checkout' | 'negotiation' | 'converted' | 'relationship' | 'lost';

interface Lead {
  id: string;
  respondent_name: string;
  respondent_email: string;
  respondent_whatsapp: string;
  quiz_title: string;
  result_text: string;
  completed_at: string;
  status: LeadStatus;
  answers: any;
  custom_field_data: any;
  quiz_questions?: Array<{ id: string; question_text: string; order_number: number; blocks?: any[] }>;
}

interface CRMKanbanBoardProps {
  leads: Lead[];
  columns: Array<{ id: LeadStatus; title: string; color: string; bgColor: string; borderColor: string }>;
  onLeadClick: (lead: Lead) => void;
  onMoveLeadToStatus: (leadId: string, newStatus: LeadStatus) => void;
  selectedLeadsForComparison: string[];
  onToggleLeadSelection: (leadId: string) => void;
}

export const CRMKanbanBoard = ({
  leads,
  columns,
  onLeadClick,
  onMoveLeadToStatus,
  selectedLeadsForComparison,
  onToggleLeadSelection,
}: CRMKanbanBoardProps) => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const lead = leads.find(l => l.id === active.id);
    if (lead) setDraggedLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      setDraggedLead(null);
      return;
    }
    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status !== newStatus) {
      onMoveLeadToStatus(leadId, newStatus);
    }
    setActiveId(null);
    setDraggedLead(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Mobile Version with Tabs */}
      <div className="md:hidden">
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="new" className="text-xs">
              {t('crm.columns.new')} ({getLeadsByStatus('new').length})
            </TabsTrigger>
            <TabsTrigger value="checkout" className="text-xs">
              {t('crm.columns.checkout')} ({getLeadsByStatus('checkout').length})
            </TabsTrigger>
            <TabsTrigger value="negotiation" className="text-xs">
              {t('crm.columns.negotiation')} ({getLeadsByStatus('negotiation').length})
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="converted" className="text-xs">
              {t('crm.columns.converted')} ({getLeadsByStatus('converted').length})
            </TabsTrigger>
            <TabsTrigger value="relationship" className="text-xs">
              {t('crm.columns.relationship')} ({getLeadsByStatus('relationship').length})
            </TabsTrigger>
            <TabsTrigger value="lost" className="text-xs">
              {t('crm.columns.lost')} ({getLeadsByStatus('lost').length})
            </TabsTrigger>
          </TabsList>
          
          {columns.map((column) => {
            const columnLeads = getLeadsByStatus(column.id);
            return (
              <TabsContent key={column.id} value={column.id} className="mt-0">
                <DroppableColumn id={column.id}>
                  <Card className={`border-t-4 ${column.borderColor} w-full`} style={{ borderTopColor: column.color }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center justify-between">
                        <span>{column.title}</span>
                        <Badge variant="secondary" style={{ backgroundColor: column.color, color: 'white' }}>
                          {columnLeads.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin">
                      {columnLeads.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {t('crm.noLeads')}
                        </div>
                      ) : (
                        columnLeads.map(lead => (
                          <div key={lead.id} className="relative">
                            <input
                              type="checkbox"
                              checked={selectedLeadsForComparison.includes(lead.id)}
                              onChange={() => onToggleLeadSelection(lead.id)}
                              className="absolute top-2 right-2 z-10 h-5 w-5 rounded border-border cursor-pointer"
                            />
                            <DraggableLeadCard
                              id={lead.id}
                              name={lead.respondent_name}
                              email={lead.respondent_email}
                              whatsapp={lead.respondent_whatsapp}
                              quizTitle={lead.quiz_title}
                              bgColor={column.bgColor}
                              onClick={() => onLeadClick(lead)}
                              isTestLead={lead.answers?._is_test_lead === true}
                            />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </DroppableColumn>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Desktop Version - Kanban Board */}
      <div id="crm-kanban" className="hidden md:block overflow-x-auto pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-w-[800px]">
          {columns.map((column) => {
            const columnLeads = getLeadsByStatus(column.id);
            return (
              <DroppableColumn key={column.id} id={column.id}>
                <Card className={`border-t-4 ${column.borderColor} w-full h-full`} style={{ borderTopColor: column.color }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate min-w-0 flex-1">{column.title}</span>
                      <Badge variant="secondary" style={{ backgroundColor: column.color, color: 'white' }}>
                        {columnLeads.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
                    {columnLeads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {t('crm.noLeads')}
                      </div>
                    ) : (
                      columnLeads.map(lead => (
                        <div key={lead.id} className="relative">
                          <input
                            type="checkbox"
                            checked={selectedLeadsForComparison.includes(lead.id)}
                            onChange={() => onToggleLeadSelection(lead.id)}
                            className="absolute top-2 right-2 z-10 h-4 w-4 rounded border-border cursor-pointer"
                          />
                          <DraggableLeadCard
                            id={lead.id}
                            name={lead.respondent_name}
                            email={lead.respondent_email}
                            whatsapp={lead.respondent_whatsapp}
                            quizTitle={lead.quiz_title}
                            bgColor={column.bgColor}
                            onClick={() => onLeadClick(lead)}
                            isTestLead={lead.answers?._is_test_lead === true}
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeId && draggedLead ? (
          <Card className="p-3 opacity-90 rotate-2 shadow-xl">
            <p className="font-medium text-sm">{draggedLead.respondent_name}</p>
            <p className="text-xs text-muted-foreground">{draggedLead.quiz_title}</p>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
