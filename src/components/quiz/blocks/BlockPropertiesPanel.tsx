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
  TextCursorInput, Star, ChevronDown, Columns, Users, Hash, Settings2,
  AlertTriangle, List, Award, Flag
} from "lucide-react";
import type { QuizBlock, BlockType } from "@/types/blocks";
import { normalizeBlock } from "@/types/blocks";

interface QuestionInfo {
  id: string;
  question_text?: string;
  custom_label?: string;
  blocks?: any[];
}

interface BlockPropertiesPanelProps {
  block: QuizBlock;
  onChange: (block: QuizBlock) => void;
  questions?: QuestionInfo[];
}

// ---- Reusable Question Selector (dropdown) ----
const QuestionSelector = ({ value, onChange, questions, label = 'Pergunta-Fonte', placeholder = 'Selecione uma pergunta' }: {
  value: string;
  onChange: (id: string) => void;
  questions?: QuestionInfo[];
  label?: string;
  placeholder?: string;
}) => {
  const getQuestionLabel = (q: QuestionInfo, idx: number) => {
    const qBlock = q.blocks?.find((b: any) => b.type === 'question');
    const text = q.custom_label || qBlock?.questionText || q.question_text || '';
    const clean = text.replace(/<[^>]*>/g, '').trim();
    return `P${idx + 1}: ${clean.substring(0, 40)}${clean.length > 40 ? '...' : ''}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Cole o ID da pergunta" />
        <p className="text-[10px] text-muted-foreground">Copie o ID na lista de perguntas à esquerda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || '_none'} onValueChange={(v) => onChange(v === '_none' ? '' : v)}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">{placeholder}</SelectItem>
          {questions.map((q, idx) => (
            <SelectItem key={q.id} value={q.id}>
              {getQuestionLabel(q, idx)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// ---- Multi-select for filtering questions (checkboxes) ----
const QuestionMultiSelector = ({ selectedIds, onChange, questions, label = 'Filtrar perguntas' }: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  questions?: QuestionInfo[];
  label?: string;
}) => {
  const getQuestionLabel = (q: QuestionInfo, idx: number) => {
    const qBlock = q.blocks?.find((b: any) => b.type === 'question');
    const text = q.custom_label || qBlock?.questionText || q.question_text || '';
    const clean = text.replace(/<[^>]*>/g, '').trim();
    return `P${idx + 1}: ${clean.substring(0, 35)}${clean.length > 35 ? '...' : ''}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          placeholder="IDs separados por vírgula"
          value={selectedIds.join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        />
      </div>
    );
  }

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {selectedIds.length > 0 && (
          <button className="text-[10px] text-primary underline" onClick={() => onChange([])}>Limpar</button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {selectedIds.length === 0 ? 'Todas as perguntas serão exibidas' : `${selectedIds.length} pergunta(s) selecionada(s)`}
      </p>
      <div className="max-h-40 overflow-y-auto border rounded-md p-1 space-y-0.5">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            type="button"
            onClick={() => toggleId(q.id)}
            className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
              selectedIds.includes(q.id) ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
              selectedIds.includes(q.id) ? 'bg-primary border-primary' : 'border-border'
            }`}>
              {selectedIds.includes(q.id) && <span className="text-[8px] text-primary-foreground">✓</span>}
            </div>
            <span className="truncate">{getQuestionLabel(q, idx)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

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
  callout: <AlertTriangle className="h-4 w-4" />,
  iconList: <List className="h-4 w-4" />,
  quote: <Quote className="h-4 w-4" />,
  badgeRow: <Award className="h-4 w-4" />,
  banner: <Flag className="h-4 w-4" />,
  answerSummary: <List className="h-4 w-4" />,
  progressMessage: <TrendingUp className="h-4 w-4" />,
  avatarGroup: <Users className="h-4 w-4" />,
  conditionalText: <Type className="h-4 w-4" />,
  comparisonResult: <Columns className="h-4 w-4" />,
  personalizedCTA: <MousePointer className="h-4 w-4" />,
  recommendation: <Star className="h-4 w-4" />,
  calculator: <BarChart3 className="h-4 w-4" />,
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
  callout: 'Callout/Alerta',
  iconList: 'Lista com Ícones',
  quote: 'Citação',
  badgeRow: 'Selos/Badges',
  banner: 'Banner/Faixa',
  answerSummary: 'Resumo de Respostas',
  progressMessage: 'Mensagem de Progresso',
  avatarGroup: 'Grupo de Avatares',
  conditionalText: 'Texto Condicional',
  comparisonResult: 'Comparação Dinâmica',
  personalizedCTA: 'CTA Personalizado',
  recommendation: 'Recomendação',
  calculator: 'Calculadora',
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

const ButtonProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'button') return null;
  const dynConditions = (block as any).conditions || [];
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
      
      <Separator />
      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
        <p className="text-xs text-purple-800 dark:text-purple-200 font-medium mb-1">🎯 Personalização Dinâmica (opcional)</p>
        <p className="text-[10px] text-purple-700 dark:text-purple-300">
          Personalize o texto e URL do botão baseado em respostas do usuário. Use {'{resposta}'} no template.
        </p>
      </div>
      <QuestionSelector
        value={(block as any).sourceQuestionId || ''}
        onChange={(id) => onChange(update(block, { sourceQuestionId: id }))}
        questions={questions}
        label="Pergunta-Fonte (opcional)"
        placeholder="Selecione uma pergunta"
      />
      <PropertySection title="Template do texto">
        <Input
          value={(block as any).textTemplate || ''}
          onChange={(e) => onChange(update(block, { textTemplate: e.target.value }))}
          placeholder="Ver plano para {resposta}"
        />
      </PropertySection>
      <PropertySection title="Texto fallback">
        <Input
          value={(block as any).fallbackText || ''}
          onChange={(e) => onChange(update(block, { fallbackText: e.target.value }))}
          placeholder="Ver plano personalizado"
        />
      </PropertySection>
      <Label className="text-xs">Condições avançadas</Label>
      {dynConditions.map((c: any, idx: number) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input className="w-1/3" value={c.answer} placeholder="Resposta" onChange={(e) => {
            const newConds = [...dynConditions];
            newConds[idx] = { ...c, answer: e.target.value };
            onChange(update(block, { conditions: newConds }));
          }} />
          <Input className="flex-1" value={c.text} placeholder="Texto do botão" onChange={(e) => {
            const newConds = [...dynConditions];
            newConds[idx] = { ...c, text: e.target.value };
            onChange(update(block, { conditions: newConds }));
          }} />
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { conditions: [...dynConditions, { answer: '', text: '' }] }))}>+ Adicionar condição</button>
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

// ---- CALLOUT ----
const CalloutProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'callout') return null;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Variante</Label>
        <Select value={block.variant} onValueChange={(v) => onChange(update(block, { variant: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="warning">⚠️ Aviso</SelectItem>
            <SelectItem value="info">ℹ️ Informação</SelectItem>
            <SelectItem value="success">✅ Sucesso</SelectItem>
            <SelectItem value="error">❌ Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input value={block.title} onChange={(e) => onChange(update(block, { title: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Itens (um por linha)</Label>
        <textarea
          className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-sm"
          value={(block.items || []).join('\n')}
          onChange={(e) => onChange(update(block, { items: e.target.value.split('\n').filter(Boolean) }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Nota de rodapé</Label>
        <Input value={block.footnote || ''} onChange={(e) => onChange(update(block, { footnote: e.target.value }))} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>Cor de fundo</Label>
        <Input type="color" value={block.backgroundColor || '#fef3c7'} onChange={(e) => onChange(update(block, { backgroundColor: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Cor da borda</Label>
        <Input type="color" value={block.borderColor || '#f59e0b'} onChange={(e) => onChange(update(block, { borderColor: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Cor do texto</Label>
        <Input type="color" value={block.textColor || '#92400e'} onChange={(e) => onChange(update(block, { textColor: e.target.value }))} />
      </div>
    </div>
  );
};

// ---- ICON LIST ----
const IconListProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'iconList') return null;
  const items = block.items || [];
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select value={block.layout || 'vertical'} onValueChange={(v) => onChange(update(block, { layout: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="horizontal">Horizontal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Cor dos ícones</Label>
        <Input type="color" value={block.iconColor || '#10b981'} onChange={(e) => onChange(update(block, { iconColor: e.target.value }))} />
      </div>
      <Separator />
      <Label>Itens</Label>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input className="w-16" value={item.icon} onChange={(e) => {
            const newItems = [...items];
            newItems[idx] = { ...item, icon: e.target.value };
            onChange(update(block, { items: newItems }));
          }} placeholder="✅" />
          <Input className="flex-1" value={item.text} onChange={(e) => {
            const newItems = [...items];
            newItems[idx] = { ...item, text: e.target.value };
            onChange(update(block, { items: newItems }));
          }} placeholder="Texto do item" />
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { items: [...items, { icon: '✅', text: '' }] }))}>+ Adicionar item</button>
    </div>
  );
};

// ---- QUOTE ----
const QuoteProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'quote') return null;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Texto da citação</Label>
        <textarea className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background text-sm" value={block.text} onChange={(e) => onChange(update(block, { text: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Autor (opcional)</Label>
        <Input value={block.author || ''} onChange={(e) => onChange(update(block, { author: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Estilo</Label>
        <Select value={block.style || 'default'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="minimal">Minimalista</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Cor da borda</Label>
        <Input type="color" value={block.borderColor || '#3b82f6'} onChange={(e) => onChange(update(block, { borderColor: e.target.value }))} />
      </div>
    </div>
  );
};

// ---- BADGE ROW ----
const BadgeRowProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'badgeRow') return null;
  const badges = block.badges || [];
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Variante</Label>
        <Select value={block.variant || 'outline'} onValueChange={(v) => onChange(update(block, { variant: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Contorno</SelectItem>
            <SelectItem value="filled">Preenchido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tamanho</Label>
        <Select value={block.size || 'md'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="md">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <Label>Badges</Label>
      {badges.map((badge, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input className="w-16" value={badge.icon} onChange={(e) => {
            const newBadges = [...badges];
            newBadges[idx] = { ...badge, icon: e.target.value };
            onChange(update(block, { badges: newBadges }));
          }} placeholder="🔒" />
          <Input className="flex-1" value={badge.text} onChange={(e) => {
            const newBadges = [...badges];
            newBadges[idx] = { ...badge, text: e.target.value };
            onChange(update(block, { badges: newBadges }));
          }} placeholder="Texto" />
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { badges: [...badges, { icon: '✅', text: '' }] }))}>+ Adicionar badge</button>
    </div>
  );
};

// ---- BANNER ----
const BannerProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'banner') return null;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Texto</Label>
        <Input value={block.text} onChange={(e) => onChange(update(block, { text: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Variante</Label>
        <Select value={block.variant || 'promo'} onValueChange={(v) => onChange(update(block, { variant: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="promo">🔥 Promoção</SelectItem>
            <SelectItem value="warning">⚠️ Aviso</SelectItem>
            <SelectItem value="success">✅ Sucesso</SelectItem>
            <SelectItem value="info">ℹ️ Informação</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Dispensável</Label>
        <Switch checked={block.dismissible || false} onCheckedChange={(v) => onChange(update(block, { dismissible: v }))} />
      </div>
    </div>
  );
};

// ---- ANSWER SUMMARY ----
const AnswerSummaryProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'answerSummary') return null;
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          📋 Exibe um resumo das respostas do usuário. Selecione quais perguntas mostrar abaixo.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input value={block.title || ''} onChange={(e) => onChange(update(block, { title: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <Input value={block.subtitle || ''} onChange={(e) => onChange(update(block, { subtitle: e.target.value }))} />
      </div>
      <Separator />
      <QuestionMultiSelector
        selectedIds={(block as any).selectedQuestionIds || []}
        onChange={(ids) => onChange(update(block, { selectedQuestionIds: ids }))}
        questions={questions}
        label="Perguntas a exibir"
      />
      <Separator />
      <div className="space-y-2">
        <Label>Estilo</Label>
        <Select value={block.style || 'card'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="list">Lista</SelectItem>
            <SelectItem value="minimal">Minimalista</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Mostrar texto da pergunta</Label>
        <Switch checked={block.showQuestionText !== false} onCheckedChange={(v) => onChange(update(block, { showQuestionText: v }))} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Mostrar ícones</Label>
        <Switch checked={block.showIcon !== false} onCheckedChange={(v) => onChange(update(block, { showIcon: v }))} />
      </div>
    </div>
  );
};

// ---- PROGRESS MESSAGE ----
const ProgressMessageProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'progressMessage') return null;
  const messages = (block as any).messages || [];
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Estilo</Label>
        <Select value={(block as any).style || 'card'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="inline">Inline</SelectItem>
            <SelectItem value="toast">Toast/Pill</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <Label>Mensagens por % de progresso</Label>
      {messages.map((msg: any, idx: number) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input className="w-16" type="number" min={0} max={100} value={msg.threshold} onChange={(e) => {
            const newMsgs = [...messages];
            newMsgs[idx] = { ...msg, threshold: Number(e.target.value) };
            onChange(update(block, { messages: newMsgs }));
          }} />
          <span className="text-xs text-muted-foreground">%</span>
          <Input className="flex-1" value={msg.text} onChange={(e) => {
            const newMsgs = [...messages];
            newMsgs[idx] = { ...msg, text: e.target.value };
            onChange(update(block, { messages: newMsgs }));
          }} />
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { messages: [...messages, { threshold: 50, text: '' }] }))}>+ Adicionar mensagem</button>
    </div>
  );
};

// ---- AVATAR GROUP ----
const AvatarGroupProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'avatarGroup') return null;
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          👥 <strong>Prova Social Visual</strong> — Mostra um grupo de avatares com contador para criar credibilidade (ex: "+1.234 pessoas já fizeram este quiz"). Use para aumentar conversão.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Número de pessoas</Label>
        <Input type="number" value={(block as any).count || 1234} onChange={(e) => onChange(update(block, { count: Number(e.target.value) }))} />
      </div>
      <div className="space-y-2">
        <Label>Texto/Label</Label>
        <Input value={(block as any).label || ''} placeholder="pessoas já responderam" onChange={(e) => onChange(update(block, { label: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Avatares visíveis</Label>
        <Input type="number" min={1} max={8} value={(block as any).maxVisible || 5} onChange={(e) => onChange(update(block, { maxVisible: Number(e.target.value) }))} />
      </div>
      <div className="space-y-2">
        <Label>Formato</Label>
        <Select value={(block as any).avatarStyle || 'circle'} onValueChange={(v) => onChange(update(block, { avatarStyle: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circular</SelectItem>
            <SelectItem value="square">Quadrado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Mostrar contador</Label>
        <Switch checked={(block as any).showCount !== false} onCheckedChange={(v) => onChange(update(block, { showCount: v }))} />
      </div>
    </div>
  );
};

// ---- CONDITIONAL TEXT ----
const ConditionalTextProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'conditionalText') return null;
  const conditions = (block as any).conditions || [];
  return (
    <div className="space-y-4">
      <QuestionSelector
        value={(block as any).sourceQuestionId || ''}
        onChange={(id) => onChange(update(block, { sourceQuestionId: id }))}
        questions={questions}
        label="Pergunta-Fonte"
        placeholder="Selecione a pergunta"
      />
      <div className="space-y-2">
        <Label>Estilo</Label>
        <Select value={(block as any).style || 'default'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Texto simples</SelectItem>
            <SelectItem value="highlighted">Destacado</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <Label>Condições (resposta → texto)</Label>
      {conditions.map((c: any, idx: number) => (
        <div key={idx} className="space-y-1">
          <div className="flex gap-2 items-center">
            <Input className="w-1/3" value={c.answer} placeholder="Se resposta contém..." onChange={(e) => {
              const newConds = [...conditions];
              newConds[idx] = { ...c, answer: e.target.value };
              onChange(update(block, { conditions: newConds }));
            }} />
            <span className="text-xs text-muted-foreground">→</span>
            <Input className="flex-1" value={c.text} placeholder="Exibir este texto" onChange={(e) => {
              const newConds = [...conditions];
              newConds[idx] = { ...c, text: e.target.value };
              onChange(update(block, { conditions: newConds }));
            }} />
          </div>
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { conditions: [...conditions, { answer: '', text: '' }] }))}>+ Adicionar condição</button>
      <Separator />
      <div className="space-y-2">
        <Label>Texto padrão (fallback)</Label>
        <Input value={(block as any).fallbackText || ''} onChange={(e) => onChange(update(block, { fallbackText: e.target.value }))} placeholder="Texto quando nenhuma condição corresponder" />
      </div>
    </div>
  );
};

// ---- COMPARISON RESULT ----
const ComparisonResultProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'comparisonResult') return null;
  const beforeItems = (block as any).beforeItems || [];
  const afterItems = (block as any).afterItems || [];
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          ⚖️ <strong>Comparação Dinâmica</strong> — Exibe uma tabela "Antes vs Depois" personalizada. Use {'{resposta1}'}, {'{resposta2}'} nos textos dos itens para substituir automaticamente pelas respostas do usuário. Copie os IDs das perguntas na lista à esquerda.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Título "Antes"</Label>
        <Input value={(block as any).beforeTitle || ''} onChange={(e) => onChange(update(block, { beforeTitle: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Título "Depois"</Label>
        <Input value={(block as any).afterTitle || ''} onChange={(e) => onChange(update(block, { afterTitle: e.target.value }))} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Mostrar ícones</Label>
        <Switch checked={(block as any).showIcons !== false} onCheckedChange={(v) => onChange(update(block, { showIcons: v }))} />
      </div>
      <Separator />
      <Label>Itens "Antes" (❌)</Label>
      {beforeItems.map((item: string, idx: number) => (
        <Input key={idx} value={item} onChange={(e) => {
          const newItems = [...beforeItems];
          newItems[idx] = e.target.value;
          onChange(update(block, { beforeItems: newItems }));
        }} placeholder={`Problema ${idx + 1}`} />
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { beforeItems: [...beforeItems, ''] }))}>+ Adicionar item</button>
      <Separator />
      <Label>Itens "Depois" (✅)</Label>
      {afterItems.map((item: string, idx: number) => (
        <Input key={idx} value={item} onChange={(e) => {
          const newItems = [...afterItems];
          newItems[idx] = e.target.value;
          onChange(update(block, { afterItems: newItems }));
        }} placeholder={`Solução ${idx + 1}`} />
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { afterItems: [...afterItems, ''] }))}>+ Adicionar item</button>
      <Separator />
      <QuestionMultiSelector
        selectedIds={(block as any).sourceQuestionIds || []}
        onChange={(ids) => onChange(update(block, { sourceQuestionIds: ids }))}
        questions={questions}
        label="Perguntas-fonte (para placeholders)"
      />
      <p className="text-[10px] text-muted-foreground">Use {'{resposta1}'}, {'{resposta2}'} nos itens para substituir com respostas</p>
    </div>
  );
};

// ---- PERSONALIZED CTA ----
const PersonalizedCTAProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'personalizedCTA') return null;
  const conditions = (block as any).conditions || [];
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Template do texto</Label>
        <Input
          value={(block as any).textTemplate || ''}
          onChange={(e) => onChange(update(block, { textTemplate: e.target.value }))}
          placeholder="Ver plano para {resposta}"
        />
        <p className="text-xs text-muted-foreground">Use {'{resposta}'} para inserir a resposta do usuário</p>
      </div>
      <QuestionSelector
        value={(block as any).sourceQuestionId || ''}
        onChange={(id) => onChange(update(block, { sourceQuestionId: id }))}
        questions={questions}
        label="Pergunta-Fonte"
        placeholder="Selecione a pergunta"
      />
      <div className="space-y-2">
        <Label>URL do botão</Label>
        <Input value={(block as any).url || ''} onChange={(e) => onChange(update(block, { url: e.target.value }))} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label>Variante</Label>
        <Select value={(block as any).variant || 'default'} onValueChange={(v) => onChange(update(block, { variant: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Primário</SelectItem>
            <SelectItem value="outline">Contorno</SelectItem>
            <SelectItem value="secondary">Secundário</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tamanho</Label>
        <Select value={(block as any).size || 'lg'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="default">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Abrir em nova aba</Label>
        <Switch checked={(block as any).openInNewTab || false} onCheckedChange={(v) => onChange(update(block, { openInNewTab: v }))} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>Texto fallback</Label>
        <Input value={(block as any).fallbackText || ''} onChange={(e) => onChange(update(block, { fallbackText: e.target.value }))} placeholder="Ver plano personalizado" />
      </div>
      <Separator />
      <Label>Condições avançadas (opcional)</Label>
      {conditions.map((c: any, idx: number) => (
        <div key={idx} className="space-y-1">
          <div className="flex gap-2 items-center">
            <Input className="w-1/3" value={c.answer} placeholder="Resposta" onChange={(e) => {
              const newConds = [...conditions];
              newConds[idx] = { ...c, answer: e.target.value };
              onChange(update(block, { conditions: newConds }));
            }} />
            <Input className="flex-1" value={c.text} placeholder="Texto do botão" onChange={(e) => {
              const newConds = [...conditions];
              newConds[idx] = { ...c, text: e.target.value };
              onChange(update(block, { conditions: newConds }));
            }} />
          </div>
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { conditions: [...conditions, { answer: '', text: '' }] }))}>+ Adicionar condição</button>
    </div>
  );
};

// ---- RECOMMENDATION ----
const RecommendationProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'recommendation') return null;
  const recommendations = (block as any).recommendations || [];
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          🎯 <strong>Motor de Recomendação</strong> — Configure produtos/serviços com regras baseadas em respostas. O sistema calcula automaticamente qual recomendar usando pesos. Copie os IDs das perguntas na lista à esquerda para usar nas regras.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input value={(block as any).title || ''} onChange={(e) => onChange(update(block, { title: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <Input value={(block as any).subtitle || ''} onChange={(e) => onChange(update(block, { subtitle: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Modo de exibição</Label>
        <Select value={(block as any).displayMode || 'best_match'} onValueChange={(v) => onChange(update(block, { displayMode: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="best_match">Melhor match (1 resultado)</SelectItem>
            <SelectItem value="top_3">Top 3 resultados</SelectItem>
            <SelectItem value="all_scored">Todos com pontuação</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Estilo visual</Label>
        <Select value={(block as any).style || 'card'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Cards</SelectItem>
            <SelectItem value="list">Lista</SelectItem>
            <SelectItem value="grid">Grid (2 colunas)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Mostrar pontuação</Label>
        <Switch checked={(block as any).showScore || false} onCheckedChange={(v) => onChange(update(block, { showScore: v }))} />
      </div>
      <div className="space-y-2">
        <Label>Texto fallback (sem match)</Label>
        <Input value={(block as any).fallbackText || ''} onChange={(e) => onChange(update(block, { fallbackText: e.target.value }))} />
      </div>
      <Separator />
      <Label className="font-semibold">Recomendações ({recommendations.length})</Label>
      {recommendations.map((rec: any, idx: number) => (
        <div key={rec.id || idx} className="p-3 border rounded-lg space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px]">#{idx + 1}</Badge>
            <button className="text-xs text-destructive hover:underline" onClick={() => {
              const newRecs = recommendations.filter((_: any, i: number) => i !== idx);
              onChange(update(block, { recommendations: newRecs }));
            }}>Remover</button>
          </div>
          <Input value={rec.name} placeholder="Nome do produto" onChange={(e) => {
            const newRecs = [...recommendations];
            newRecs[idx] = { ...rec, name: e.target.value };
            onChange(update(block, { recommendations: newRecs }));
          }} />
          <Input value={rec.description || ''} placeholder="Descrição curta" onChange={(e) => {
            const newRecs = [...recommendations];
            newRecs[idx] = { ...rec, description: e.target.value };
            onChange(update(block, { recommendations: newRecs }));
          }} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={rec.buttonText || ''} placeholder="Texto do botão" onChange={(e) => {
              const newRecs = [...recommendations];
              newRecs[idx] = { ...rec, buttonText: e.target.value };
              onChange(update(block, { recommendations: newRecs }));
            }} />
            <Input value={rec.buttonUrl || ''} placeholder="URL" onChange={(e) => {
              const newRecs = [...recommendations];
              newRecs[idx] = { ...rec, buttonUrl: e.target.value };
              onChange(update(block, { recommendations: newRecs }));
            }} />
          </div>
          <Input value={rec.badge || ''} placeholder="Badge (ex: ⭐ Top Pick)" onChange={(e) => {
            const newRecs = [...recommendations];
            newRecs[idx] = { ...rec, badge: e.target.value };
            onChange(update(block, { recommendations: newRecs }));
          }} />
          <Separator />
          <Label className="text-xs">Regras de match</Label>
          {(rec.rules || []).map((rule: any, rIdx: number) => (
            <div key={rIdx} className="space-y-1">
              <div className="flex gap-1 items-center text-xs">
                {questions && questions.length > 0 ? (
                  <Select value={rule.questionId || '_none'} onValueChange={(v) => {
                    const newRecs = [...recommendations];
                    const newRules = [...(rec.rules || [])];
                    newRules[rIdx] = { ...rule, questionId: v === '_none' ? '' : v };
                    newRecs[idx] = { ...rec, rules: newRules };
                    onChange(update(block, { recommendations: newRecs }));
                  }}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue placeholder="Pergunta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Selecione</SelectItem>
                      {questions.map((q, qIdx) => {
                        const qBlock = q.blocks?.find((b: any) => b.type === 'question');
                        const text = q.custom_label || qBlock?.questionText || q.question_text || '';
                        const clean = text.replace(/<[^>]*>/g, '').trim();
                        return (
                          <SelectItem key={q.id} value={q.id}>
                            P{qIdx + 1}: {clean.substring(0, 25)}{clean.length > 25 ? '...' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input className="w-24 text-xs h-7" value={rule.questionId} placeholder="ID pergunta" onChange={(e) => {
                    const newRecs = [...recommendations];
                    const newRules = [...(rec.rules || [])];
                    newRules[rIdx] = { ...rule, questionId: e.target.value };
                    newRecs[idx] = { ...rec, rules: newRules };
                    onChange(update(block, { recommendations: newRecs }));
                  }} />
                )}
                <Input className="flex-1 text-xs h-7" value={(rule.answers || []).join(', ')} placeholder="Respostas (separadas por vírgula)" onChange={(e) => {
                  const newRecs = [...recommendations];
                  const newRules = [...(rec.rules || [])];
                  newRules[rIdx] = { ...rule, answers: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) };
                  newRecs[idx] = { ...rec, rules: newRules };
                  onChange(update(block, { recommendations: newRecs }));
                }} />
                <Input className="w-14 text-xs h-7" type="number" value={rule.weight} placeholder="Peso" onChange={(e) => {
                  const newRecs = [...recommendations];
                  const newRules = [...(rec.rules || [])];
                  newRules[rIdx] = { ...rule, weight: Number(e.target.value) };
                  newRecs[idx] = { ...rec, rules: newRules };
                  onChange(update(block, { recommendations: newRecs }));
                }} />
              </div>
            </div>
          ))}
          <button className="text-[10px] text-primary underline" onClick={() => {
            const newRecs = [...recommendations];
            const newRules = [...(rec.rules || []), { questionId: '', answers: [], weight: 1 }];
            newRecs[idx] = { ...rec, rules: newRules };
            onChange(update(block, { recommendations: newRecs }));
          }}>+ Regra</button>
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => {
        const newRec = { id: `rec-${Date.now()}`, name: '', description: '', buttonText: '', buttonUrl: '', badge: '', rules: [] };
        onChange(update(block, { recommendations: [...recommendations, newRec] }));
      }}>+ Adicionar recomendação</button>
    </div>
  );
};

// ============================================
// MAIN PANEL COMPONENT
// ============================================

export const BlockPropertiesPanel = ({ block: rawBlock, onChange, questions }: BlockPropertiesPanelProps) => {
  const block = normalizeBlock(rawBlock);
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
      case 'button': return <ButtonProperties block={block} onChange={onChange} questions={questions} />;
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
      case 'callout': return <CalloutProperties block={block} onChange={onChange} />;
      case 'iconList': return <IconListProperties block={block} onChange={onChange} />;
      case 'quote': return <QuoteProperties block={block} onChange={onChange} />;
      case 'badgeRow': return <BadgeRowProperties block={block} onChange={onChange} />;
      case 'banner': return <BannerProperties block={block} onChange={onChange} />;
      case 'answerSummary': return <AnswerSummaryProperties block={block} onChange={onChange} questions={questions} />;
      case 'progressMessage': return <ProgressMessageProperties block={block} onChange={onChange} />;
      case 'avatarGroup': return <AvatarGroupProperties block={block} onChange={onChange} />;
      case 'conditionalText': return <ConditionalTextProperties block={block} onChange={onChange} questions={questions} />;
      case 'comparisonResult': return <ComparisonResultProperties block={block} onChange={onChange} questions={questions} />;
      case 'personalizedCTA': return <PersonalizedCTAProperties block={block} onChange={onChange} questions={questions} />;
      case 'recommendation': return <RecommendationProperties block={block} onChange={onChange} questions={questions} />;
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
