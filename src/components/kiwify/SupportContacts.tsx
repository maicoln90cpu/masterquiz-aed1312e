import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, FileQuestion, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SupportContacts() {
  const { t } = useTranslation();

  const contacts = [
    {
      icon: Mail,
      title: t('kiwify.supportContacts.email'),
      value: t('kiwify.supportContacts.emailValue'),
      action: () => window.location.href = "mailto:suporte@masterquiz.com"
    },
    {
      icon: MessageCircle,
      title: t('kiwify.supportContacts.whatsapp'),
      value: t('kiwify.supportContacts.whatsappValue'),
      action: () => window.open("https://wa.me/5511999999999", "_blank")
    },
    {
      icon: FileQuestion,
      title: t('kiwify.supportContacts.helpCenter'),
      value: t('kiwify.supportContacts.helpCenterValue'),
      action: () => window.open("/faq", "_blank")
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('kiwify.supportContacts.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.map((contact, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-between h-auto py-3"
            onClick={contact.action}
          >
            <div className="flex items-center gap-3">
              <contact.icon className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="font-medium text-sm">{contact.title}</div>
                <div className="text-xs text-muted-foreground">{contact.value}</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
