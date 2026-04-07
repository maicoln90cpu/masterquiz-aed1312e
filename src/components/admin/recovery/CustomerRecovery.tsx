import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Settings, MessageSquare, Megaphone, ListOrdered, History, BarChart3, Ban, Bot, MessageCircle, Mail, MailOpen, MailCheck, Phone, Zap, DollarSign } from "lucide-react";
import { AdminSubTabs } from "@/components/admin/AdminSubTabs";
import { WhatsAppConnection } from "./WhatsAppConnection";
import { RecoverySettings } from "./RecoverySettings";
import { RecoveryTemplates } from "./RecoveryTemplates";
import { RecoveryCampaigns } from "./RecoveryCampaigns";
import { RecoveryQueue } from "./RecoveryQueue";
import { RecoveryHistory } from "./RecoveryHistory";
import { RecoveryReports } from "./RecoveryReports";
import { RecoveryBlacklist } from "./RecoveryBlacklist";
import { WhatsAppAISettings } from "./WhatsAppAISettings";
import { WhatsAppAIConversations } from "./WhatsAppAIConversations";
import { EmailRecoverySettings } from "./EmailRecoverySettings";
import { EmailRecoveryTemplates } from "./EmailRecoveryTemplates";
import { EmailRecoveryQueue } from "./EmailRecoveryQueue";
import { EmailRecoveryReports } from "./EmailRecoveryReports";
import { EmailAutomations } from "./EmailAutomations";
import { EmailRecoveryCosts } from "./EmailRecoveryCosts";

export function CustomerRecovery() {
  return (
    <Tabs defaultValue="whatsapp" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="whatsapp" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          WhatsApp
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </TabsTrigger>
      </TabsList>

      <TabsContent value="whatsapp">
        <AdminSubTabs
          tabs={[
            { id: 'connection', label: 'Conexão', icon: <Smartphone className="h-4 w-4" />, color: 'green' },
            { id: 'settings', label: 'Configurações', icon: <Settings className="h-4 w-4" />, color: 'blue' },
            { id: 'templates', label: 'Templates', icon: <MessageSquare className="h-4 w-4" />, color: 'purple' },
            { id: 'campaigns', label: 'Campanhas', icon: <Megaphone className="h-4 w-4" />, color: 'yellow' },
            { id: 'queue', label: 'Fila de Envio', icon: <ListOrdered className="h-4 w-4" />, color: 'orange' },
            { id: 'history', label: 'Histórico', icon: <History className="h-4 w-4" />, color: 'cyan' },
            { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="h-4 w-4" />, color: 'pink' },
            { id: 'blacklist', label: 'Blacklist', icon: <Ban className="h-4 w-4" />, color: 'red' },
            { id: 'ai-settings', label: 'Bot IA', icon: <Bot className="h-4 w-4" />, color: 'purple' },
            { id: 'ai-conversations', label: 'Conversas IA', icon: <MessageCircle className="h-4 w-4" />, color: 'emerald' },
          ]}
          defaultTab="connection"
        >
          {(activeTab) => (
            <>
              {activeTab === 'connection' && <WhatsAppConnection />}
              {activeTab === 'settings' && <RecoverySettings />}
              {activeTab === 'templates' && <RecoveryTemplates />}
              {activeTab === 'campaigns' && <RecoveryCampaigns />}
              {activeTab === 'queue' && <RecoveryQueue />}
              {activeTab === 'history' && <RecoveryHistory />}
              {activeTab === 'reports' && <RecoveryReports />}
              {activeTab === 'blacklist' && <RecoveryBlacklist />}
              {activeTab === 'ai-settings' && <WhatsAppAISettings />}
              {activeTab === 'ai-conversations' && <WhatsAppAIConversations />}
            </>
          )}
        </AdminSubTabs>
      </TabsContent>

      <TabsContent value="email">
        <AdminSubTabs
          tabs={[
            { id: 'email-settings', label: 'Configurações', icon: <Settings className="h-4 w-4" />, color: 'blue' },
            { id: 'email-templates', label: 'Templates', icon: <MailOpen className="h-4 w-4" />, color: 'purple' },
            { id: 'email-queue', label: 'Fila de Envio', icon: <MailCheck className="h-4 w-4" />, color: 'green' },
            { id: 'email-automations', label: 'Automações', icon: <Zap className="h-4 w-4" />, color: 'amber' },
            { id: 'email-reports', label: 'Relatórios', icon: <BarChart3 className="h-4 w-4" />, color: 'pink' },
            { id: 'email-costs', label: 'Custos', icon: <DollarSign className="h-4 w-4" />, color: 'emerald' },
          ]}
          defaultTab="email-settings"
        >
          {(activeTab) => (
            <>
              {activeTab === 'email-settings' && <EmailRecoverySettings />}
              {activeTab === 'email-templates' && <EmailRecoveryTemplates />}
              {activeTab === 'email-queue' && <EmailRecoveryQueue />}
              {activeTab === 'email-automations' && <EmailAutomations />}
              {activeTab === 'email-reports' && <EmailRecoveryReports />}
              {activeTab === 'email-costs' && <EmailRecoveryCosts />}
            </>
          )}
        </AdminSubTabs>
      </TabsContent>
    </Tabs>
  );
}
