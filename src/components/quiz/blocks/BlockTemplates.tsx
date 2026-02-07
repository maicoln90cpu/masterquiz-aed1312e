import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ImageIcon, 
  VideoIcon, 
  FileTextIcon, 
  ListIcon,
  ImagePlusIcon,
  MessageSquareIcon
} from "lucide-react";
import type { QuizBlock } from "@/types/blocks";
import { createBlock } from "@/types/blocks";

interface BlockTemplatesProps {
  onSelectTemplate: (blocks: QuizBlock[]) => void;
  currentOrder: number;
}

export const BlockTemplates = ({ onSelectTemplate, currentOrder }: BlockTemplatesProps) => {
  const templates = [
    {
      id: "question-image",
      name: "Pergunta com Imagem",
      description: "Imagem + Pergunta", // Corrigido: ordem real dos blocos
      icon: ImageIcon,
      blocks: () => {
        const image = createBlock("image", currentOrder);
        const question = createBlock("question", currentOrder + 1);
        return [image, question];
      },
    },
    {
      id: "question-video",
      name: "Pergunta com Vídeo",
      description: "Vídeo + Pergunta",
      icon: VideoIcon,
      blocks: () => {
        const video = createBlock("video", currentOrder);
        const question = createBlock("question", currentOrder + 1);
        return [video, question];
      },
    },
    {
      id: "intro-question",
      name: "Introdução + Pergunta",
      description: "Texto introdutório + Pergunta",
      icon: FileTextIcon,
      blocks: () => {
        const text = createBlock("text", currentOrder);
        const separator = createBlock("separator", currentOrder + 1);
        const question = createBlock("question", currentOrder + 2);
        return [text, separator, question];
      },
    },
    {
      id: "gallery-description",
      name: "Galeria com Descrição",
      description: "Texto + Galeria de imagens + Pergunta",
      icon: ImagePlusIcon,
      blocks: () => {
        const text = createBlock("text", currentOrder);
        const gallery = createBlock("gallery", currentOrder + 1);
        const question = createBlock("question", currentOrder + 2);
        return [text, gallery, question];
      },
    },
    {
      id: "multi-media",
      name: "Multi-mídia Completa",
      description: "Texto + Imagem + Vídeo + Pergunta",
      icon: ListIcon,
      blocks: () => {
        const text = createBlock("text", currentOrder);
        const image = createBlock("image", currentOrder + 1);
        const video = createBlock("video", currentOrder + 2);
        const separator = createBlock("separator", currentOrder + 3);
        const question = createBlock("question", currentOrder + 4);
        return [text, image, video, separator, question];
      },
    },
    {
      id: "question-explanation",
      name: "Pergunta com Explicação",
      description: "Pergunta + Texto explicativo + Separador",
      icon: MessageSquareIcon,
      blocks: () => {
        const question = createBlock("question", currentOrder);
        const text = createBlock("text", currentOrder + 1);
        const separator = createBlock("separator", currentOrder + 2);
        return [question, text, separator];
      },
    },
    {
      id: "testimonial-question",
      name: "Pergunta com Depoimento",
      description: "Depoimento + Separador + Pergunta",
      icon: MessageSquareIcon,
      blocks: () => {
        const testimonial = createBlock("testimonial", currentOrder);
        const separator = createBlock("separator", currentOrder + 1);
        const question = createBlock("question", currentOrder + 2);
        return [testimonial, separator, question];
      },
    },
    {
      id: "offer-urgency",
      name: "Oferta com Urgência",
      description: "Texto + Countdown + Preço + Botão",
      icon: FileTextIcon,
      blocks: () => {
        const text = createBlock("text", currentOrder);
        const countdown = createBlock("countdown", currentOrder + 1);
        const price = createBlock("price", currentOrder + 2);
        const button = createBlock("button", currentOrder + 3);
        return [text, countdown, price, button];
      },
    },
    {
      id: "progress-question",
      name: "Quiz com Progresso",
      description: "Progresso + Pergunta",
      icon: ListIcon,
      blocks: () => {
        const progress = createBlock("progress", currentOrder);
        const question = createBlock("question", currentOrder + 1);
        return [progress, question];
      },
    },
    {
      id: "social-proof",
      name: "Prova Social Completa",
      description: "Texto + 2 Depoimentos + Separador + Pergunta",
      icon: ImagePlusIcon,
      blocks: () => {
        const text = createBlock("text", currentOrder);
        const testimonial1 = createBlock("testimonial", currentOrder + 1);
        const testimonial2 = createBlock("testimonial", currentOrder + 2);
        const separator = createBlock("separator", currentOrder + 3);
        const question = createBlock("question", currentOrder + 4);
        return [text, testimonial1, testimonial2, separator, question];
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Templates de Blocos</CardTitle>
        <CardDescription>
          Adicione rapidamente conjuntos de blocos pré-configurados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-start gap-2"
              onClick={() => onSelectTemplate(template.blocks())}
            >
              <div className="flex items-center gap-2 w-full">
                <template.icon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">{template.name}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {template.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
