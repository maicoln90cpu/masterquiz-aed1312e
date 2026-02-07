import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NewUserFAQ() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('kiwify.newUserFaq.q1'),
      answer: t('kiwify.newUserFaq.a1')
    },
    {
      question: t('kiwify.newUserFaq.q2'),
      answer: t('kiwify.newUserFaq.a2')
    },
    {
      question: t('kiwify.newUserFaq.q3'),
      answer: t('kiwify.newUserFaq.a3')
    },
    {
      question: t('kiwify.newUserFaq.q4'),
      answer: t('kiwify.newUserFaq.a4')
    },
    {
      question: t('kiwify.newUserFaq.q5'),
      answer: t('kiwify.newUserFaq.a5')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t('kiwify.newUserFaq.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-sm text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
