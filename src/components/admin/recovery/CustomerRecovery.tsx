import { Smartphone, Settings, MessageSquare, Megaphone, ListOrdered, History, BarChart3, Ban, Bot, MessageCircle, Mail, MailOpen, MailCheck } from "lucide-react";
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

export function CustomerRecovery() {
  return (
    <AdminSubTabs
      tabs={[
        { id: 'connection', label: 'Conexão WhatsApp', icon: <Smartphone className="h-4 w-4" />, color: 'green' },
        { id: 'settings', label: 'Configurações', icon: <Settings className="h-4 w-4" />, color: 'blue' },
        { id: 'templates', label: 'Templates', icon: <MessageSquare className="h-4 w-4" />, color: 'purple' },
        { id: 'campaigns', label: 'Campanhas', icon: <Megaphone className="h-4 w-4" />, color: 'yellow' },
        { id: 'queue', label: 'Fila de Envio', icon: <ListOrdered className="h-4 w-4" />, color: 'orange' },
        { id: 'history', label: 'Histórico', icon: <History className="h-4 w-4" />, color: 'cyan' },
        { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="h-4 w-4" />, color: 'pink' },
        { id: 'blacklist', label: 'Blacklist', icon: <Ban className="h-4 w-4" />, color: 'red' },
        { id: 'ai-settings', label: 'Bot IA', icon: <Bot className="h-4 w-4" />, color: 'violet' },
        { id: 'ai-conversations', label: 'Conversas IA', icon: <MessageCircle className="h-4 w-4" />, color: 'emerald' },
        { id: 'email-settings', label: 'Email Config', icon: <Mail className="h-4 w-4" />, color: 'sky' },
        { id: 'email-templates', label: 'Email Templates', icon: <MailOpen className="h-4 w-4" />, color: 'indigo' },
        { id: 'email-queue', label: 'Email Fila', icon: <MailCheck className="h-4 w-4" />, color: 'teal' },
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
          {activeTab === 'email-settings' && <EmailRecoverySettings />}
          {activeTab === 'email-templates' && <EmailRecoveryTemplates />}
          {activeTab === 'email-queue' && <EmailRecoveryQueue />}
        </>
      )}
    </AdminSubTabs>
  );
}
