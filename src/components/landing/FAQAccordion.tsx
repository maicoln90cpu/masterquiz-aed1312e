import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

export const FAQAccordion = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('landing.faq.q1.question'),
      answer: t('landing.faq.q1.answer'),
    },
    {
      question: t('landing.faq.q2.question'),
      answer: t('landing.faq.q2.answer'),
    },
    {
      question: t('landing.faq.q3.question'),
      answer: t('landing.faq.q3.answer'),
    },
    {
      question: t('landing.faq.q4.question'),
      answer: t('landing.faq.q4.answer'),
    },
    {
      question: t('landing.faq.q5.question'),
      answer: t('landing.faq.q5.answer'),
    },
    {
      question: t('landing.faq.q6.question'),
      answer: t('landing.faq.q6.answer'),
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground leading-relaxed">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
