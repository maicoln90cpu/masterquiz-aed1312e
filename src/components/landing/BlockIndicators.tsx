import { motion, AnimatePresence } from "framer-motion";
import { 
  Type, 
  ListChecks, 
  ToggleLeft, 
  Image, 
  MousePointerClick,
  Smile,
  Trophy,
  Heading,
  Loader2,
  BarChart3,
  DollarSign,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface BlockIndicatorsProps {
  blocks: string[];
}

// Map translated block names to icons - covers PT, EN, ES
const getBlockIcon = (block: string): React.ReactNode => {
  const lowerBlock = block.toLowerCase();
  
  // Text/Texto
  if (lowerBlock === "text" || lowerBlock === "texto") {
    return <Type className="h-3.5 w-3.5" />;
  }
  // Title/Título
  if (lowerBlock === "title" || lowerBlock === "título" || lowerBlock === "titulo") {
    return <Heading className="h-3.5 w-3.5" />;
  }
  // Question/Pergunta/Pregunta
  if (lowerBlock === "question" || lowerBlock === "pergunta" || lowerBlock === "pregunta") {
    return <HelpCircle className="h-3.5 w-3.5" />;
  }
  // Single Choice / Escolha Única / Elección Única
  if (lowerBlock.includes("single") || lowerBlock.includes("única") || lowerBlock.includes("unica")) {
    return <ListChecks className="h-3.5 w-3.5" />;
  }
  // Multiple Choice / Múltipla Escolha / Elección Múltiple
  if (lowerBlock.includes("multiple") || lowerBlock.includes("múltipla") || lowerBlock.includes("multipla")) {
    return <ListChecks className="h-3.5 w-3.5" />;
  }
  // Yes/No / Sim/Não / Sí/No
  if (lowerBlock.includes("yes") || lowerBlock.includes("sim") || lowerBlock.includes("sí")) {
    return <ToggleLeft className="h-3.5 w-3.5" />;
  }
  // Image / Imagem / Imagen
  if (lowerBlock === "image" || lowerBlock === "imagem" || lowerBlock === "imagen") {
    return <Image className="h-3.5 w-3.5" />;
  }
  // Button / Botão / Botón
  if (lowerBlock === "button" || lowerBlock === "botão" || lowerBlock === "botao" || lowerBlock === "botón" || lowerBlock === "boton") {
    return <MousePointerClick className="h-3.5 w-3.5" />;
  }
  // CTA
  if (lowerBlock === "cta") {
    return <MousePointerClick className="h-3.5 w-3.5" />;
  }
  // Emojis
  if (lowerBlock === "emojis") {
    return <Smile className="h-3.5 w-3.5" />;
  }
  // Icons / Ícones / Iconos
  if (lowerBlock === "icons" || lowerBlock === "ícones" || lowerBlock === "icones" || lowerBlock === "iconos") {
    return <Smile className="h-3.5 w-3.5" />;
  }
  // Result / Resultado
  if (lowerBlock === "result" || lowerBlock === "resultado") {
    return <Trophy className="h-3.5 w-3.5" />;
  }
  // Loading / Cargando
  if (lowerBlock === "loading" || lowerBlock === "cargando") {
    return <Loader2 className="h-3.5 w-3.5" />;
  }
  // Animation / Animação / Animación
  if (lowerBlock === "animation" || lowerBlock === "animação" || lowerBlock === "animacao" || lowerBlock === "animación" || lowerBlock === "animacion") {
    return <Sparkles className="h-3.5 w-3.5" />;
  }
  // Metrics / Métricas
  if (lowerBlock === "metrics" || lowerBlock === "métricas" || lowerBlock === "metricas") {
    return <BarChart3 className="h-3.5 w-3.5" />;
  }
  // Chart / Gráfico
  if (lowerBlock === "chart" || lowerBlock === "gráfico" || lowerBlock === "grafico") {
    return <BarChart3 className="h-3.5 w-3.5" />;
  }
  // Price / Preço / Precio
  if (lowerBlock === "price" || lowerBlock === "preço" || lowerBlock === "preco" || lowerBlock === "precio") {
    return <DollarSign className="h-3.5 w-3.5" />;
  }
  // Achievement / Conquista / Logro
  if (lowerBlock === "achievement" || lowerBlock === "conquista" || lowerBlock === "logro") {
    return <Trophy className="h-3.5 w-3.5" />;
  }
  
  // Default
  return <Type className="h-3.5 w-3.5" />;
};

export const BlockIndicators = ({ blocks }: BlockIndicatorsProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {t('landingDemo.blocksUsed')}
      </p>
      <AnimatePresence mode="popLayout">
        {blocks.map((block, index) => (
          <motion.div
            key={block}
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
          >
            {getBlockIcon(block)}
            <span>{block}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
