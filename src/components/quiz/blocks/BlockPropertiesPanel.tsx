import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Type, Minus, Image, Film, Music, LayoutGrid, Code, MousePointer,
  DollarSign, BarChart3, Loader2, TrendingUp, Timer, Quote, SlidersHorizontal,
  TextCursorInput, Star, ChevronDown, Columns, Users, Hash, Settings2
} from "lucide-react";
import type { QuizBlock, BlockType } from "@/types/blocks";

interface BlockPropertiesPanelProps {
  block: QuizBlock;
  onChange: (block: QuizBlock) => void;
}

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  question: <Settings2 className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  separator: <Minus className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  video: <Film className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  gallery: <LayoutGrid className="h-4 w-4" />,
  embed: <Code className="h-4 w-4" />,
  button: <MousePointer className="h-4 w-4" />,
  price: <DollarSign className="h-4 w-4" />,
  metrics: <BarChart3 className="h-4 w-4" />,
  loading: <Loader2 className="h-4 w-4" />,
  progress: <TrendingUp className="h-4 w-4" />,
  countdown: <Timer className="h-4 w-4" />,
  testimonial: <Quote className="h-4 w-4" />,
  slider: <SlidersHorizontal className="h-4 w-4" />,
  textInput: <TextCursorInput className="h-4 w-4" />,
  nps: <Star className="h-4 w-4" />,
  accordion: <ChevronDown className="h-4 w-4" />,
  comparison: <Columns className="h-4 w-4" />,
  socialProof: <Users className="h-4 w-4" />,
  animatedCounter: <Hash className="h-4 w-4" />,
};

const BLOCK_NAMES: Record<BlockType, string> = {
  question: 'Pergunta',
  text: 'Texto',
  separator: 'Separador',
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  gallery: 'Galeria',
  embed: 'Embed',
  button: 'Botão',
  price: 'Preço',
  metrics: 'Métricas',
  loading: 'Loading',
  progress: 'Progresso',
  countdown: 'Countdown',
  testimonial: 'Depoimento',
  slider: 'Slider',
  textInput: 'Campo de Texto',
  nps: 'NPS',
  accordion: 'Accordion',
  comparison: 'Comparação',
  socialProof: 'Prova Social',
  animatedCounter: 'Contador Animado',
};

// Helper to update block with type safety
const update = (block: QuizBlock, updates: Record<string, unknown>): QuizBlock => {
  return { ...block, ...updates } as QuizBlock;
};

// ============================================
// PROPERTY SECTIONS PER BLOCK TYPE
// ============================================

const QuestionProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'question') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Formato de Resposta">
        <Select value={block.answerFormat} onValueChange={(v) => onChange(update(block, { answerFormat: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes_no">Sim ou Não</SelectItem>
            <SelectItem value="single_choice">Escolha Única</SelectItem>
            <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
            <SelectItem value="short_text">Texto Curto</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>

      <PropertySection title="Subtítulo">
        <Input
          placeholder="Texto complementar..."
          value={block.subtitle || ''}
          onChange={(e) => onChange(update(block, { subtitle: e.target.value }))}
        />
      </PropertySection>

      <PropertySection title="Dica/Tooltip">
        <Input
          placeholder="Ajuda para o usuário..."
          value={block.hint || ''}
          onChange={(e) => onChange(update(block, { hint: e.target.value }))}
        />
      </PropertySection>

      <PropertySection title="Texto do Botão Próxima">
        <Input
          placeholder="Próxima Pergunta"
          value={block.nextButtonText || ''}
          onChange={(e) => onChange(update(block, { nextButtonText: e.target.value }))}
        />
      </PropertySection>

      <Separator />

      <div className="space-y-3">
        <SwitchRow
          label="Resposta obrigatória"
          checked={block.required !== false}
          onChange={(v) => onChange(update(block, { required: v }))}
        />
        {(block.answerFormat === 'single_choice' || block.answerFormat === 'yes_no') && (
          <SwitchRow
            label="Avançar automaticamente"
            checked={block.autoAdvance || false}
            onChange={(v) => onChange(update(block, { autoAdvance: v }))}
          />
        )}
      </div>
    </div>
  );
};

const TextProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'text') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Alinhamento">
        <Select value={block.alignment || 'left'} onValueChange={(v) => onChange(update(block, { alignment: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">⬅ Esquerda</SelectItem>
            <SelectItem value="center">↔ Centro</SelectItem>
            <SelectItem value="right">➡ Direita</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>

      <PropertySection title="Tamanho da Fonte">
        <Select value={block.fontSize || 'medium'} onValueChange={(v) => onChange(update(block, { fontSize: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
    </div>
  );
};

const SeparatorProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'separator') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Estilo">
        <Select value={block.style || 'line'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Linha Contínua</SelectItem>
            <SelectItem value="dots">Pontilhado</SelectItem>
            <SelectItem value="dashes">Tracejado</SelectItem>
            <SelectItem value="space">Espaço em Branco</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>

      {block.style !== 'space' && (
        <>
          <PropertySection title="Espessura">
            <Select value={block.thickness || 'medium'} onValueChange={(v) => onChange(update(block, { thickness: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thin">Fina</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="thick">Grossa</SelectItem>
              </SelectContent>
            </Select>
          </PropertySection>

          <PropertySection title="Cor">
            <Input
              type="color"
              value={block.color || '#cccccc'}
              onChange={(e) => onChange(update(block, { color: e.target.value }))}
            />
          </PropertySection>
        </>
      )}
    </div>
  );
};

const ImageProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'image') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Texto Alt">
        <Input value={block.alt || ''} placeholder="Descrição da imagem" onChange={(e) => onChange(update(block, { alt: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Legenda">
        <Input value={block.caption || ''} placeholder="Legenda opcional" onChange={(e) => onChange(update(block, { caption: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Tamanho">
        <Select value={block.size || 'medium'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="full">Largura Total</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
    </div>
  );
};

const VideoProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'video') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Provider">
        <Select value={block.provider || 'youtube'} onValueChange={(v) => onChange(update(block, { provider: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="direct">Direto</SelectItem>
            <SelectItem value="uploaded">Upload</SelectItem>
            <SelectItem value="bunny_stream">Bunny Stream</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Tamanho">
        <Select value={block.size || 'medium'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="full">Largura Total</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Proporção">
        <Select value={block.aspectRatio || '16:9'} onValueChange={(v) => onChange(update(block, { aspectRatio: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9</SelectItem>
            <SelectItem value="4:3">4:3</SelectItem>
            <SelectItem value="1:1">1:1</SelectItem>
            <SelectItem value="9:16">9:16</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <Separator />
      <div className="space-y-3">
        <SwitchRow label="Autoplay" checked={block.autoplay || false} onChange={(v) => onChange(update(block, { autoplay: v }))} />
        <SwitchRow label="Mutado" checked={block.muted || false} onChange={(v) => onChange(update(block, { muted: v }))} />
        <SwitchRow label="Loop" checked={block.loop || false} onChange={(v) => onChange(update(block, { loop: v }))} />
        <SwitchRow label="Ocultar controles" checked={block.hideControls || false} onChange={(v) => onChange(update(block, { hideControls: v }))} />
        <SwitchRow label="Ocultar botão play" checked={block.hidePlayButton || false} onChange={(v) => onChange(update(block, { hidePlayButton: v }))} />
        <SwitchRow label="Legendas" checked={block.showCaptions || false} onChange={(v) => onChange(update(block, { showCaptions: v }))} />
      </div>
      <PropertySection title="Velocidade">
        <Select value={String(block.playbackSpeed || 1)} onValueChange={(v) => onChange(update(block, { playbackSpeed: Number(v) }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="0.75">0.75x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
    </div>
  );
};

const AudioProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'audio') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Legenda">
        <Input value={block.caption || ''} placeholder="Legenda opcional" onChange={(e) => onChange(update(block, { caption: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Autoplay" checked={block.autoplay || false} onChange={(v) => onChange(update(block, { autoplay: v }))} />
    </div>
  );
};

const GalleryProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'gallery') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Layout">
        <Select value={block.layout || 'grid'} onValueChange={(v) => onChange(update(block, { layout: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carrossel</SelectItem>
            <SelectItem value="masonry">Masonry</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
    </div>
  );
};

const ButtonProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'button') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Ação">
        <Select value={block.action || 'link'} onValueChange={(v) => onChange(update(block, { action: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Abrir Link</SelectItem>
            <SelectItem value="next_question">Próxima Pergunta</SelectItem>
            <SelectItem value="go_to_question">Ir para Pergunta</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Variante">
        <Select value={block.variant || 'default'} onValueChange={(v) => onChange(update(block, { variant: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="secondary">Secundário</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Tamanho">
        <Select value={block.size || 'default'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="default">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Abrir em nova aba" checked={block.openInNewTab || false} onChange={(v) => onChange(update(block, { openInNewTab: v }))} />
    </div>
  );
};

const LoadingProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'loading') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Duração (segundos)">
        <Input type="number" value={block.duration} min={1} max={30} onChange={(e) => onChange(update(block, { duration: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Mensagem">
        <Input value={block.message || ''} onChange={(e) => onChange(update(block, { message: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Tipo de Spinner">
        <Select value={block.spinnerType || 'spinner'} onValueChange={(v) => onChange(update(block, { spinnerType: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="spinner">Spinner</SelectItem>
            <SelectItem value="dots">Pontos</SelectItem>
            <SelectItem value="pulse">Pulso</SelectItem>
            <SelectItem value="bars">Barras</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Avançar automaticamente" checked={block.autoAdvance || false} onChange={(v) => onChange(update(block, { autoAdvance: v }))} />
    </div>
  );
};

const ProgressProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'progress') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Estilo">
        <Select value={block.style || 'bar'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Barra</SelectItem>
            <SelectItem value="steps">Passos</SelectItem>
            <SelectItem value="circle">Círculo</SelectItem>
            <SelectItem value="percentage">Percentual</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Altura">
        <Select value={block.height || 'medium'} onValueChange={(v) => onChange(update(block, { height: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="thin">Fina</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="thick">Grossa</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Cor">
        <Input type="color" value={block.color || '#3b82f6'} onChange={(e) => onChange(update(block, { color: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Mostrar percentual" checked={block.showPercentage || false} onChange={(v) => onChange(update(block, { showPercentage: v }))} />
        <SwitchRow label="Mostrar contador" checked={block.showCounter || false} onChange={(v) => onChange(update(block, { showCounter: v }))} />
        <SwitchRow label="Animado" checked={block.animated || false} onChange={(v) => onChange(update(block, { animated: v }))} />
      </div>
    </div>
  );
};

const CountdownProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'countdown') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Modo">
        <Select value={block.mode || 'duration'} onValueChange={(v) => onChange(update(block, { mode: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="duration">Duração</SelectItem>
            <SelectItem value="date">Data alvo</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      {block.mode === 'duration' && (
        <PropertySection title="Duração (segundos)">
          <Input type="number" value={block.duration || 300} min={1} onChange={(e) => onChange(update(block, { duration: Number(e.target.value) }))} />
        </PropertySection>
      )}
      <PropertySection title="Estilo">
        <Select value={block.style || 'default'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Mensagem ao expirar">
        <Input value={block.expiryMessage || ''} onChange={(e) => onChange(update(block, { expiryMessage: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Cor Principal">
        <Input type="color" value={block.primaryColor || '#ef4444'} onChange={(e) => onChange(update(block, { primaryColor: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Dias" checked={block.showDays || false} onChange={(v) => onChange(update(block, { showDays: v }))} />
        <SwitchRow label="Horas" checked={block.showHours !== false} onChange={(v) => onChange(update(block, { showHours: v }))} />
        <SwitchRow label="Minutos" checked={block.showMinutes !== false} onChange={(v) => onChange(update(block, { showMinutes: v }))} />
        <SwitchRow label="Segundos" checked={block.showSeconds !== false} onChange={(v) => onChange(update(block, { showSeconds: v }))} />
      </div>
    </div>
  );
};

const TestimonialProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'testimonial') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Nome do Autor">
        <Input value={block.authorName} onChange={(e) => onChange(update(block, { authorName: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Cargo">
        <Input value={block.authorRole || ''} placeholder="CEO, Gerente..." onChange={(e) => onChange(update(block, { authorRole: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Empresa">
        <Input value={block.authorCompany || ''} onChange={(e) => onChange(update(block, { authorCompany: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Avaliação (1-5)">
        <Input type="number" min={1} max={5} value={block.rating || 5} onChange={(e) => onChange(update(block, { rating: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Estilo">
        <Select value={block.style || 'default'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="quote">Citação</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Cor Principal">
        <Input type="color" value={block.primaryColor || '#3b82f6'} onChange={(e) => onChange(update(block, { primaryColor: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Mostrar avaliação" checked={block.showRating || false} onChange={(v) => onChange(update(block, { showRating: v }))} />
    </div>
  );
};

const SliderProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'slider') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Label">
        <Input value={block.label} onChange={(e) => onChange(update(block, { label: e.target.value }))} />
      </PropertySection>
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Min">
          <Input type="number" value={block.min} onChange={(e) => onChange(update(block, { min: Number(e.target.value) }))} />
        </PropertySection>
        <PropertySection title="Max">
          <Input type="number" value={block.max} onChange={(e) => onChange(update(block, { max: Number(e.target.value) }))} />
        </PropertySection>
      </div>
      <PropertySection title="Passo">
        <Input type="number" value={block.step} min={1} onChange={(e) => onChange(update(block, { step: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Unidade">
        <Input value={block.unit || ''} placeholder="%, R$, kg..." onChange={(e) => onChange(update(block, { unit: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Mostrar valor" checked={block.showValue || false} onChange={(v) => onChange(update(block, { showValue: v }))} />
        <SwitchRow label="Obrigatório" checked={block.required || false} onChange={(v) => onChange(update(block, { required: v }))} />
      </div>
    </div>
  );
};

const TextInputProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'textInput') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Label">
        <Input value={block.label} onChange={(e) => onChange(update(block, { label: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Placeholder">
        <Input value={block.placeholder || ''} onChange={(e) => onChange(update(block, { placeholder: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Validação">
        <Select value={block.validation || 'none'} onValueChange={(v) => onChange(update(block, { validation: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Telefone</SelectItem>
            <SelectItem value="number">Número</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Máx. caracteres">
        <Input type="number" value={block.maxLength || ''} onChange={(e) => onChange(update(block, { maxLength: Number(e.target.value) || undefined }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Multilinha" checked={block.multiline || false} onChange={(v) => onChange(update(block, { multiline: v }))} />
        <SwitchRow label="Obrigatório" checked={block.required || false} onChange={(v) => onChange(update(block, { required: v }))} />
      </div>
    </div>
  );
};

const NPSProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'nps') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Label Baixo">
        <Input value={block.lowLabel || ''} placeholder="Nada provável" onChange={(e) => onChange(update(block, { lowLabel: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Label Alto">
        <Input value={block.highLabel || ''} placeholder="Muito provável" onChange={(e) => onChange(update(block, { highLabel: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Mostrar labels" checked={block.showLabels || false} onChange={(v) => onChange(update(block, { showLabels: v }))} />
        <SwitchRow label="Obrigatório" checked={block.required || false} onChange={(v) => onChange(update(block, { required: v }))} />
      </div>
    </div>
  );
};

const AccordionProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'accordion') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Estilo">
        <Select value={block.style || 'default'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bordered">Bordas</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Permitir múltiplos abertos" checked={block.allowMultiple || false} onChange={(v) => onChange(update(block, { allowMultiple: v }))} />
    </div>
  );
};

const ComparisonProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'comparison') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Título Esquerda">
        <Input value={block.leftTitle} onChange={(e) => onChange(update(block, { leftTitle: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Título Direita">
        <Input value={block.rightTitle} onChange={(e) => onChange(update(block, { rightTitle: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Estilo Esquerda">
        <Select value={block.leftStyle || 'negative'} onValueChange={(v) => onChange(update(block, { leftStyle: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="negative">Negativo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Estilo Direita">
        <Select value={block.rightStyle || 'positive'} onValueChange={(v) => onChange(update(block, { rightStyle: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="positive">Positivo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Mostrar ícones" checked={block.showIcons || false} onChange={(v) => onChange(update(block, { showIcons: v }))} />
    </div>
  );
};

const SocialProofProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'socialProof') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Intervalo (ms)">
        <Input type="number" value={block.interval} min={1000} step={500} onChange={(e) => onChange(update(block, { interval: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Estilo">
        <Select value={block.style || 'toast'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="toast">Toast</SelectItem>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="floating">Flutuante</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Posição">
        <Select value={block.position || 'bottom-left'} onValueChange={(v) => onChange(update(block, { position: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
            <SelectItem value="bottom-right">Inferior Direita</SelectItem>
            <SelectItem value="top-left">Superior Esquerda</SelectItem>
            <SelectItem value="top-right">Superior Direita</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Mostrar avatar" checked={block.showAvatar || false} onChange={(v) => onChange(update(block, { showAvatar: v }))} />
    </div>
  );
};

const AnimatedCounterProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'animatedCounter') return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Valor Inicial">
          <Input type="number" value={block.startValue} onChange={(e) => onChange(update(block, { startValue: Number(e.target.value) }))} />
        </PropertySection>
        <PropertySection title="Valor Final">
          <Input type="number" value={block.endValue} onChange={(e) => onChange(update(block, { endValue: Number(e.target.value) }))} />
        </PropertySection>
      </div>
      <PropertySection title="Duração (segundos)">
        <Input type="number" value={block.duration} min={0.5} step={0.5} onChange={(e) => onChange(update(block, { duration: Number(e.target.value) }))} />
      </PropertySection>
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Prefixo">
          <Input value={block.prefix || ''} placeholder="R$" onChange={(e) => onChange(update(block, { prefix: e.target.value }))} />
        </PropertySection>
        <PropertySection title="Sufixo">
          <Input value={block.suffix || ''} placeholder="%" onChange={(e) => onChange(update(block, { suffix: e.target.value }))} />
        </PropertySection>
      </div>
      <PropertySection title="Label">
        <Input value={block.label || ''} onChange={(e) => onChange(update(block, { label: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Tamanho">
        <Select value={block.fontSize || 'large'} onValueChange={(v) => onChange(update(block, { fontSize: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="xlarge">Extra Grande</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Easing">
        <Select value={block.easing || 'easeOut'} onValueChange={(v) => onChange(update(block, { easing: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="easeOut">Ease Out</SelectItem>
            <SelectItem value="easeInOut">Ease In Out</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Cor">
        <Input type="color" value={block.color || '#3b82f6'} onChange={(e) => onChange(update(block, { color: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Separador de milhar" checked={block.separator || false} onChange={(v) => onChange(update(block, { separator: v }))} />
    </div>
  );
};

const PriceProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'price') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Moeda">
        <Input value={block.currency || 'R$'} onChange={(e) => onChange(update(block, { currency: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Período">
        <Input value={block.period || '/mês'} onChange={(e) => onChange(update(block, { period: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Preço Original">
        <Input value={block.originalPrice || ''} placeholder="De R$ 199,90" onChange={(e) => onChange(update(block, { originalPrice: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Desconto">
        <Input value={block.discount || ''} placeholder="20% OFF" onChange={(e) => onChange(update(block, { discount: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Texto do Botão">
        <Input value={block.buttonText || ''} onChange={(e) => onChange(update(block, { buttonText: e.target.value }))} />
      </PropertySection>
      <PropertySection title="URL do Botão">
        <Input value={block.buttonUrl || ''} placeholder="https://..." onChange={(e) => onChange(update(block, { buttonUrl: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Destacado" checked={block.highlighted || false} onChange={(v) => onChange(update(block, { highlighted: v }))} />
    </div>
  );
};

const MetricsProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'metrics') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Tipo de Gráfico">
        <Select value={block.chartType} onValueChange={(v) => onChange(update(block, { chartType: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Barras</SelectItem>
            <SelectItem value="pie">Pizza</SelectItem>
            <SelectItem value="line">Linha</SelectItem>
            <SelectItem value="donut">Donut</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Mostrar legenda" checked={block.showLegend || false} onChange={(v) => onChange(update(block, { showLegend: v }))} />
        <SwitchRow label="Mostrar valores" checked={block.showValues || false} onChange={(v) => onChange(update(block, { showValues: v }))} />
      </div>
    </div>
  );
};

const EmbedProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'embed') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Provider">
        <Input value={block.provider || ''} placeholder="Detectado automaticamente" onChange={(e) => onChange(update(block, { provider: e.target.value }))} />
      </PropertySection>
    </div>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

const PropertySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-muted-foreground">{title}</Label>
    {children}
  </div>
);

const SwitchRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <Label className="text-sm cursor-pointer">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

// ============================================
// MAIN PANEL COMPONENT
// ============================================

export const BlockPropertiesPanel = ({ block, onChange }: BlockPropertiesPanelProps) => {
  const icon = BLOCK_ICONS[block.type];
  const name = BLOCK_NAMES[block.type];

  const renderProperties = () => {
    switch (block.type) {
      case 'question': return <QuestionProperties block={block} onChange={onChange} />;
      case 'text': return <TextProperties block={block} onChange={onChange} />;
      case 'separator': return <SeparatorProperties block={block} onChange={onChange} />;
      case 'image': return <ImageProperties block={block} onChange={onChange} />;
      case 'video': return <VideoProperties block={block} onChange={onChange} />;
      case 'audio': return <AudioProperties block={block} onChange={onChange} />;
      case 'gallery': return <GalleryProperties block={block} onChange={onChange} />;
      case 'embed': return <EmbedProperties block={block} onChange={onChange} />;
      case 'button': return <ButtonProperties block={block} onChange={onChange} />;
      case 'price': return <PriceProperties block={block} onChange={onChange} />;
      case 'metrics': return <MetricsProperties block={block} onChange={onChange} />;
      case 'loading': return <LoadingProperties block={block} onChange={onChange} />;
      case 'progress': return <ProgressProperties block={block} onChange={onChange} />;
      case 'countdown': return <CountdownProperties block={block} onChange={onChange} />;
      case 'testimonial': return <TestimonialProperties block={block} onChange={onChange} />;
      case 'slider': return <SliderProperties block={block} onChange={onChange} />;
      case 'textInput': return <TextInputProperties block={block} onChange={onChange} />;
      case 'nps': return <NPSProperties block={block} onChange={onChange} />;
      case 'accordion': return <AccordionProperties block={block} onChange={onChange} />;
      case 'comparison': return <ComparisonProperties block={block} onChange={onChange} />;
      case 'socialProof': return <SocialProofProperties block={block} onChange={onChange} />;
      case 'animatedCounter': return <AnimatedCounterProperties block={block} onChange={onChange} />;
      default: return <p className="text-sm text-muted-foreground">Sem propriedades configuráveis</p>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">Propriedades</p>
        </div>
      </div>

      {/* Properties */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {renderProperties()}
        </div>
      </ScrollArea>
    </div>
  );
};
