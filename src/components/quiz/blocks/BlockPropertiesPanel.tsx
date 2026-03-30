import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageUploader } from "@/components/ImageUploader";
import {
  Type, Minus, Image, Film, Music, LayoutGrid, Code, MousePointer,
  DollarSign, BarChart3, Loader2, TrendingUp, Timer, Quote, SlidersHorizontal,
  TextCursorInput, Star, ChevronDown, Columns, Users, Hash, Settings2,
  AlertTriangle, List, Award, Flag, X, HelpCircle
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
  currentQuestionIndex?: number;
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
  rating: <Star className="h-4 w-4" />,
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
  rating: 'Avaliação (Estrelas)',
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
      <PropertySection title="Formato de Resposta" tooltip="Define como o usuário responde: escolha única, múltipla, sim/não ou texto livre">
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

      <PropertySection title="Subtítulo" tooltip="Texto complementar exibido abaixo da pergunta principal">
        <Input
          placeholder="Texto complementar..."
          value={block.subtitle || ''}
          onChange={(e) => onChange(update(block, { subtitle: e.target.value }))}
        />
      </PropertySection>

      <PropertySection title="Dica/Tooltip" tooltip="Texto de ajuda exibido ao passar o mouse sobre a pergunta">
        <Input
          placeholder="Ajuda para o usuário..."
          value={block.hint || ''}
          onChange={(e) => onChange(update(block, { hint: e.target.value }))}
        />
      </PropertySection>

      <PropertySection title="Texto do Botão Próxima" tooltip="Personaliza o texto do botão de avançar nesta pergunta">
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
        {/* ✅ Etapa 2C: Randomizar opções */}
        {block.answerFormat !== 'short_text' && (
          <SwitchRow
            label="Randomizar opções"
            checked={block.randomizeOptions || false}
            onChange={(v) => onChange(update(block, { randomizeOptions: v }))}
          />
        )}
      </div>

      {/* ✅ Etapa 2E: Imagens por opção — Upload ou URL */}
      {(block.answerFormat === 'single_choice' || block.answerFormat === 'multiple_choice') && (
        <>
          <Separator />
          <PropertySection title="🖼️ Imagens por Opção" tooltip="Adicione imagens para transformar opções em cards visuais">
            <p className="text-[10px] text-muted-foreground mb-2">
              Faça upload ou cole URL de imagens para criar cards visuais. Deixe em branco para opções normais.
            </p>
            {(block.options || []).map((opt, idx) => {
              const optText = typeof opt === 'string' ? opt : (opt as any)?.text || `Opção ${idx + 1}`;
              const currentUrl = (block.optionImages || [])[idx] || '';
              const updateOptionImage = (url: string) => {
                const imgs = [...(block.optionImages || [])];
                while (imgs.length <= idx) imgs.push('');
                imgs[idx] = url;
                onChange(update(block, { optionImages: imgs }));
              };
              return (
                <div key={idx} className="mb-3 border rounded-lg p-2 space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">{optText}</span>
                  {currentUrl ? (
                    <div className="relative group">
                      <img src={currentUrl} alt={optText} className="w-full max-h-24 object-contain rounded border bg-muted/20" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => updateOptionImage('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <ImageUploader
                      value=""
                      onChange={(url) => updateOptionImage(url)}
                      className="[&_div]:p-3 [&_svg]:h-6 [&_svg]:w-6"
                    />
                  )}
                </div>
              );
            })}
          </PropertySection>

          {/* Layout e Tamanho das imagens de opção */}
          {(block.optionImages || []).some(img => img && img.trim() !== '') && (
            <>
              <PropertySection title="Layout das Opções" tooltip="Como as opções com imagem são dispostas: vertical (1×4), grade (2×2) ou horizontal (4×1)">
                <Select value={block.optionImageLayout || '2x2'} onValueChange={(v) => onChange(update(block, { optionImageLayout: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x4">1×4 Vertical (uma abaixo da outra)</SelectItem>
                    <SelectItem value="2x2">2×2 Grade</SelectItem>
                    <SelectItem value="4x1">4×1 Horizontal (lado a lado)</SelectItem>
                  </SelectContent>
                </Select>
              </PropertySection>

              <PropertySection title="Tamanho da Imagem" tooltip="Controla a altura/aspecto das imagens nos cards de opção">
                <Select value={block.optionImageSize || 'medium'} onValueChange={(v) => onChange(update(block, { optionImageSize: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiny">Mini</SelectItem>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </PropertySection>
            </>
          )}
        </>
      )}
    </div>
  );
};

const TextProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'text') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Alinhamento" tooltip="Alinhamento horizontal do conteúdo no bloco">
        <Select value={block.alignment || 'left'} onValueChange={(v) => onChange(update(block, { alignment: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">⬅ Esquerda</SelectItem>
            <SelectItem value="center">↔ Centro</SelectItem>
            <SelectItem value="right">➡ Direita</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>

      <PropertySection title="Tamanho da Fonte" tooltip="Controla o tamanho do texto exibido">
        <Select value={block.fontSize || 'medium'} onValueChange={(v) => onChange(update(block, { fontSize: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>

      <PropertySection title="Cor do Texto" tooltip="Cor personalizada para o texto deste bloco">
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            value={(block as any).textColor || '#000000'}
            onChange={(e) => onChange(update(block, { textColor: e.target.value }))}
            className="w-12 h-8 p-1 cursor-pointer"
          />
          <Input
            value={(block as any).textColor || ''}
            placeholder="Padrão do tema"
            onChange={(e) => onChange(update(block, { textColor: e.target.value }))}
            className="flex-1"
          />
          {(block as any).textColor && (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onChange(update(block, { textColor: undefined }))}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </PropertySection>
    </div>
  );
};

const SeparatorProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'separator') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Estilo" tooltip="Formato visual do componente">
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
          <PropertySection title="Espessura" tooltip="Grossura da linha do separador">
            <Select value={block.thickness || 'medium'} onValueChange={(v) => onChange(update(block, { thickness: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thin">Fina</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="thick">Grossa</SelectItem>
              </SelectContent>
            </Select>
          </PropertySection>

          <PropertySection title="Cor" tooltip="Cor principal do elemento">
            <Input
              type="color"
              value={block.color || '#cccccc'}
              onChange={(e) => onChange(update(block, { color: e.target.value }))}
            />
          </PropertySection>
        </>
      )}
      {/* ✅ Etapa 2F: Animação fade-in */}
      <SwitchRow label="Animação fade-in" tooltip="Aplica efeito de surgimento suave quando o bloco aparece" checked={(block as any).animateFade || false} onChange={(v) => onChange(update(block, { animateFade: v }))} />
    </div>
  );
};

const ImageProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'image') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Texto Alt" tooltip="Texto alternativo para acessibilidade e SEO. Descreva a imagem para leitores de tela">
        <Input value={block.alt || ''} placeholder="Descrição da imagem" onChange={(e) => onChange(update(block, { alt: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Legenda" tooltip="Texto descritivo exibido abaixo do conteúdo">
        <Input value={block.caption || ''} placeholder="Legenda opcional" onChange={(e) => onChange(update(block, { caption: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Tamanho" tooltip="Dimensão visual do componente no quiz">
        <Select value={block.size || 'medium'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tiny">Mini</SelectItem>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="full">Largura Total</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Borda Arredondada" tooltip="Controla o arredondamento dos cantos da imagem">
        <Select value={(block as any).borderRadius || 'medium'} onValueChange={(v) => onChange(update(block, { borderRadius: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="small">Pequena</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="full">Circular</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Sombra" tooltip="Sombra aplicada na imagem para efeito de profundidade">
        <Select value={(block as any).shadow || 'none'} onValueChange={(v) => onChange(update(block, { shadow: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="small">Leve</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="large">Forte</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Expandir ao clicar (Lightbox)" tooltip="Permite ampliar a imagem em tela cheia ao clicar sobre ela" checked={(block as any).enableLightbox || false} onChange={(v) => onChange(update(block, { enableLightbox: v }))} />
    </div>
  );
};

const VideoProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'video') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Provider" tooltip="Plataforma ou formato de origem do conteúdo">
        <Select value={block.provider || 'youtube'} onValueChange={(v) => onChange(update(block, { provider: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="loom">Loom</SelectItem>
            <SelectItem value="direct">Direto</SelectItem>
            <SelectItem value="uploaded">Upload</SelectItem>
            <SelectItem value="bunny_stream">Bunny Stream</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Tamanho" tooltip="Dimensão visual do componente no quiz">
        <Select value={block.size || 'medium'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tiny">Mini</SelectItem>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="full">Largura Total</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Proporção" tooltip="Proporção de aspecto do player (largura:altura)">
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
        <SwitchRow label="Autoplay" tooltip="Inicia a reprodução automaticamente. Em vídeos, requer Mutado ativado nos navegadores" checked={block.autoplay || false} onChange={(v) => onChange(update(block, { autoplay: v }))} />
        <SwitchRow label="Mutado" tooltip="Inicia sem som. Necessário para autoplay funcionar nos navegadores modernos" checked={block.muted || false} onChange={(v) => onChange(update(block, { muted: v }))} />
        <SwitchRow label="Loop" tooltip="Repete o conteúdo continuamente em loop" checked={block.loop || false} onChange={(v) => onChange(update(block, { loop: v }))} />
        <SwitchRow label="Ocultar controles" tooltip="Remove os controles visíveis do player (play, volume, barra de tempo)" checked={block.hideControls || false} onChange={(v) => onChange(update(block, { hideControls: v }))} />
        <SwitchRow label="Ocultar botão play" tooltip="Remove o botão de play central sobreposto ao vídeo" checked={block.hidePlayButton || false} onChange={(v) => onChange(update(block, { hidePlayButton: v }))} />
        <SwitchRow label="Legendas" tooltip="Exibe legendas/closed captions quando disponíveis no vídeo" checked={block.showCaptions || false} onChange={(v) => onChange(update(block, { showCaptions: v }))} />
      </div>
      <PropertySection title="Velocidade" tooltip="Velocidade de reprodução do conteúdo">
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
      <PropertySection title="Legenda" tooltip="Texto descritivo exibido abaixo do conteúdo">
        <Input value={block.caption || ''} placeholder="Legenda opcional" onChange={(e) => onChange(update(block, { caption: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Autoplay" tooltip="Inicia a reprodução automaticamente. Em vídeos, requer Mutado ativado nos navegadores" checked={block.autoplay || false} onChange={(v) => onChange(update(block, { autoplay: v }))} />
    </div>
  );
};

const GalleryProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'gallery') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Layout" tooltip="Disposição visual dos elementos no bloco">
        <Select value={block.layout || 'grid'} onValueChange={(v) => onChange(update(block, { layout: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carrossel</SelectItem>
            <SelectItem value="masonry">Masonry</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      {/* ✅ Etapa 2F: Lightbox ao clicar */}
      <SwitchRow label="Lightbox ao clicar" tooltip="Permite ampliar cada imagem em tela cheia ao clicar" checked={(block as any).enableLightbox || false} onChange={(v) => onChange(update(block, { enableLightbox: v }))} />
    </div>
  );
};

const ButtonProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'button') return null;
  const dynConditions = (block as any).conditions || [];
  return (
    <div className="space-y-4">
      <PropertySection title="Ação" tooltip="O que acontece quando o usuário clica no botão">
        <Select value={block.action || 'link'} onValueChange={(v) => onChange(update(block, { action: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Abrir Link</SelectItem>
            <SelectItem value="next_question">Próxima Pergunta</SelectItem>
            <SelectItem value="go_to_question">Ir para Pergunta</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Variante" tooltip="Estilo visual do componente">
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
      <PropertySection title="Tamanho" tooltip="Dimensão visual do componente no quiz">
        <Select value={block.size || 'default'} onValueChange={(v) => onChange(update(block, { size: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="default">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Cor de Fundo" tooltip="Cor de fundo personalizada do botão (sobrescreve a variante)">
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            value={(block as any).backgroundColor || '#3b82f6'}
            onChange={(e) => onChange(update(block, { backgroundColor: e.target.value }))}
            className="w-12 h-8 p-1 cursor-pointer"
          />
          <Input
            value={(block as any).backgroundColor || ''}
            placeholder="Padrão da variante"
            onChange={(e) => onChange(update(block, { backgroundColor: e.target.value }))}
            className="flex-1"
          />
          {(block as any).backgroundColor && (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onChange(update(block, { backgroundColor: undefined }))}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </PropertySection>
      <SwitchRow label="Abrir em nova aba" tooltip="Abre o link de destino em uma nova aba do navegador" checked={block.openInNewTab || false} onChange={(v) => onChange(update(block, { openInNewTab: v }))} />
      
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
      <PropertySection title="Template do texto" tooltip="Texto dinâmico — use {resposta} para inserir a resposta do usuário automaticamente">
        <Input
          value={(block as any).textTemplate || ''}
          onChange={(e) => onChange(update(block, { textTemplate: e.target.value }))}
          placeholder="Ver plano para {resposta}"
        />
      </PropertySection>
      <PropertySection title="Texto fallback" tooltip="Texto exibido quando não há resposta ou condição correspondente">
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
  const messages = block.loadingMessages || [];
  return (
    <div className="space-y-4">
      <PropertySection title="Duração (segundos)" tooltip="Tempo em segundos da animação ou exibição">
        <Input type="number" value={block.duration} min={1} max={30} onChange={(e) => onChange(update(block, { duration: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Tipo de Spinner" tooltip="Estilo visual da animação de carregamento">
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
      <SwitchRow label="Avançar automaticamente" tooltip="Avança para a próxima etapa após o tempo definido" checked={block.autoAdvance || false} onChange={(v) => onChange(update(block, { autoAdvance: v }))} />
      <SwitchRow label="Mostrar barra de progresso" tooltip="Exibe uma barra visual de progresso durante o carregamento" checked={block.showProgress || false} onChange={(v) => onChange(update(block, { showProgress: v }))} />
      {block.showProgress && (
        <PropertySection title="Cor da barra" tooltip="Cor da barra de progresso durante o carregamento">
          <Input type="color" value={block.progressColor || '#3b82f6'} onChange={(e) => onChange(update(block, { progressColor: e.target.value }))} />
        </PropertySection>
      )}
      <SwitchRow label="Mensagens rotativas (fade)" tooltip="Alterna entre diferentes mensagens com efeito fade durante o loading" checked={block.rotateMessages || false} onChange={(v) => onChange(update(block, { rotateMessages: v }))} />

      <Separator />
      {/* Lista dinâmica de mensagens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Mensagens durante loading</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onChange(update(block, { loadingMessages: [...messages, ''] }))}
          >
            <span className="mr-1">+</span> Adicionar
          </Button>
        </div>
        {messages.length === 0 && (
          <p className="text-[10px] text-muted-foreground">Nenhuma mensagem. Adicione mensagens para exibir durante o loading.</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              className="h-8 text-xs"
              placeholder={`Mensagem ${idx + 1}`}
              value={msg}
              onChange={(e) => {
                const newMsgs = [...messages];
                newMsgs[idx] = e.target.value;
                onChange(update(block, { loadingMessages: newMsgs }));
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onChange(update(block, { loadingMessages: messages.filter((_, i) => i !== idx) }))}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Mensagem após conclusão (quando autoAdvance desabilitado) */}
      {!block.autoAdvance && (
        <>
          <Separator />
          <PropertySection title="Mensagem após conclusão" tooltip="Texto exibido quando o loading termina e o botão Próxima aparece">
            <Input
              value={block.completionMessage || ''}
              placeholder="Tudo pronto! Clique em próxima para continuar."
              onChange={(e) => onChange(update(block, { completionMessage: e.target.value }))}
            />
          </PropertySection>
        </>
      )}

      <Separator />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onChange(update(block, { _previewKey: ((block as any)._previewKey || 0) + 1 }))}
      >
        🔄 Reiniciar Preview
      </Button>
    </div>
  );
};

const ProgressProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'progress') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Texto/Frase" tooltip="Texto exibido junto à barra de progresso">
        <Input
          value={block.label || ''}
          placeholder="Ex: Continue para ver seu resultado!"
          onChange={(e) => onChange(update(block, { label: e.target.value }))}
        />
      </PropertySection>
      <PropertySection title="Estilo" tooltip="Formato visual do componente">
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
      <PropertySection title="Altura" tooltip="Espessura visual da barra de progresso">
        <Select value={block.height || 'medium'} onValueChange={(v) => onChange(update(block, { height: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="thin">Fina</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="thick">Grossa</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Cor" tooltip="Cor principal do elemento">
        <Input type="color" value={block.color || '#3b82f6'} onChange={(e) => onChange(update(block, { color: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Mostrar percentual" tooltip="Exibe o percentual numérico de conclusão do quiz" checked={block.showPercentage || false} onChange={(v) => onChange(update(block, { showPercentage: v }))} />
        <SwitchRow label="Mostrar contador" tooltip="Exibe o número total de pessoas junto ao grupo de avatares" checked={block.showCounter || false} onChange={(v) => onChange(update(block, { showCounter: v }))} />
        <SwitchRow label="Animado" tooltip="Aplica animação de preenchimento suave na barra de progresso" checked={block.animated || false} onChange={(v) => onChange(update(block, { animated: v }))} />
        {/* ✅ Etapa 2C: Cor por faixa + ícone de conclusão */}
        <SwitchRow label="Cor por faixa (🔴→🟡→🟢)" tooltip="Muda a cor automaticamente conforme o progresso: vermelho → amarelo → verde" checked={block.colorByRange || false} onChange={(v) => onChange(update(block, { colorByRange: v }))} />
        <SwitchRow label="Ícone de conclusão ✅" tooltip="Exibe ícone de conclusão ✅ quando o progresso atinge 100%" checked={block.showCompletionIcon || false} onChange={(v) => onChange(update(block, { showCompletionIcon: v }))} />
      </div>
    </div>
  );
};

const CountdownProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'countdown') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Modo" tooltip="Duração fixa ou contagem regressiva até uma data específica">
        <Select value={block.mode || 'duration'} onValueChange={(v) => onChange(update(block, { mode: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="duration">Duração</SelectItem>
            <SelectItem value="date">Data alvo</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      {block.mode === 'duration' && (
        <PropertySection title="Duração (segundos)" tooltip="Tempo em segundos da animação ou exibição">
          <Input type="number" value={block.duration || 300} min={1} onChange={(e) => onChange(update(block, { duration: Number(e.target.value) }))} />
        </PropertySection>
      )}
      <PropertySection title="Estilo" tooltip="Formato visual do componente">
        <Select value={block.style || 'default'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="flip">🔄 Flip Clock</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Texto durante contagem" tooltip="Texto exibido acima do timer enquanto a contagem está ativa">
        <Input value={(block as any).activeMessage || ''} placeholder="Condição especial por tempo limitado!" onChange={(e) => onChange(update(block, { activeMessage: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Mensagem ao expirar" tooltip="Texto exibido quando o tempo chega a zero">
        <Input value={block.expiryMessage || ''} onChange={(e) => onChange(update(block, { expiryMessage: e.target.value }))} />
      </PropertySection>
      {/* ✅ Etapa 2E: Ação ao expirar */}
      <PropertySection title="Ação ao expirar" tooltip="O que acontece quando a contagem regressiva termina">
        <Select value={block.expiryAction || 'none'} onValueChange={(v) => onChange(update(block, { expiryAction: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Apenas mensagem</SelectItem>
            <SelectItem value="hide">Esconder bloco</SelectItem>
            <SelectItem value="redirect">Redirecionar para URL</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      {block.expiryAction === 'redirect' && (
        <PropertySection title="URL de redirecionamento" tooltip="Página para onde o usuário é direcionado">
          <Input value={block.redirectUrl || ''} placeholder="https://..." onChange={(e) => onChange(update(block, { redirectUrl: e.target.value }))} />
        </PropertySection>
      )}
      <PropertySection title="Cor Principal" tooltip="Cor de destaque principal do componente">
        <Input type="color" value={block.primaryColor || '#ef4444'} onChange={(e) => onChange(update(block, { primaryColor: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Dias" tooltip="Exibe a unidade de dias no contador regressivo" checked={block.showDays || false} onChange={(v) => onChange(update(block, { showDays: v }))} />
        <SwitchRow label="Horas" tooltip="Exibe a unidade de horas no contador regressivo" checked={block.showHours !== false} onChange={(v) => onChange(update(block, { showHours: v }))} />
        <SwitchRow label="Minutos" tooltip="Exibe a unidade de minutos no contador regressivo" checked={block.showMinutes !== false} onChange={(v) => onChange(update(block, { showMinutes: v }))} />
        <SwitchRow label="Segundos" tooltip="Exibe a unidade de segundos no contador regressivo" checked={block.showSeconds !== false} onChange={(v) => onChange(update(block, { showSeconds: v }))} />
      </div>
    </div>
  );
};

const TestimonialProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'testimonial') return null;
  const additional = (block as any).additionalTestimonials || [];
  return (
    <div className="space-y-4">
      <PropertySection title="Nome do Autor" tooltip="Nome de quem deu o depoimento ou citação">
        <Input value={block.authorName} onChange={(e) => onChange(update(block, { authorName: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Cargo" tooltip="Função ou cargo profissional do autor">
        <Input value={block.authorRole || ''} placeholder="CEO, Gerente..." onChange={(e) => onChange(update(block, { authorRole: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Empresa" tooltip="Empresa ou organização do autor">
        <Input value={block.authorCompany || ''} onChange={(e) => onChange(update(block, { authorCompany: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Avaliação (1-5)" tooltip="Nota em estrelas do depoimento (1 a 5)">
        <Input type="number" min={1} max={5} value={block.rating || 5} onChange={(e) => onChange(update(block, { rating: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Estilo" tooltip="Formato visual do componente">
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
      <PropertySection title="Cor Principal" tooltip="Cor de destaque principal do componente">
        <Input type="color" value={block.primaryColor || '#3b82f6'} onChange={(e) => onChange(update(block, { primaryColor: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Mostrar avaliação" tooltip="Exibe estrelas de avaliação no depoimento" checked={block.showRating || false} onChange={(v) => onChange(update(block, { showRating: v }))} />

      {/* ✅ Etapa 2F: Carrossel de depoimentos */}
      <Separator />
      <div className="p-2 rounded-md bg-muted/50 text-[10px] text-muted-foreground">
        <p className="font-medium text-foreground text-xs mb-1">📋 Depoimentos adicionais (carrossel)</p>
        <p>Adicione mais depoimentos para criar um carrossel com auto-slide e dots de navegação.</p>
      </div>
      {additional.map((t: any, idx: number) => (
        <div key={idx} className="border rounded-md p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Depoimento {idx + 2}</span>
            <button type="button" className="text-xs text-destructive" onClick={() => {
              const newList = additional.filter((_: any, i: number) => i !== idx);
              onChange(update(block, { additionalTestimonials: newList }));
            }}>✕</button>
          </div>
          <textarea
            className="w-full min-h-[60px] px-2 py-1 border rounded text-xs bg-background resize-none"
            placeholder="Citação..."
            value={t.quote || ''}
            onChange={(e) => {
              const newList = [...additional];
              newList[idx] = { ...t, quote: e.target.value };
              onChange(update(block, { additionalTestimonials: newList }));
            }}
          />
          <Input className="h-7 text-xs" placeholder="Nome do autor" value={t.authorName || ''} onChange={(e) => {
            const newList = [...additional];
            newList[idx] = { ...t, authorName: e.target.value };
            onChange(update(block, { additionalTestimonials: newList }));
          }} />
          <Input className="h-7 text-xs" placeholder="Cargo (opcional)" value={t.authorRole || ''} onChange={(e) => {
            const newList = [...additional];
            newList[idx] = { ...t, authorRole: e.target.value };
            onChange(update(block, { additionalTestimonials: newList }));
          }} />
        </div>
      ))}
      <button type="button" className="text-xs text-primary underline" onClick={() => {
        onChange(update(block, { additionalTestimonials: [...additional, { quote: '', authorName: '' }] }));
      }}>+ Adicionar depoimento</button>
      {additional.length > 0 && (
        <>
          <SwitchRow label="Auto-slide" tooltip="Alterna automaticamente entre depoimentos no carrossel" checked={(block as any).autoSlide || false} onChange={(v) => onChange(update(block, { autoSlide: v }))} />
          {(block as any).autoSlide && (
            <PropertySection title="Intervalo (segundos)" tooltip="Tempo entre transições automáticas do carrossel">
              <Input type="number" min={2} max={15} value={(block as any).slideInterval || 5} onChange={(e) => onChange(update(block, { slideInterval: Number(e.target.value) }))} />
            </PropertySection>
          )}
        </>
      )}
    </div>
  );
};

const SliderProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'slider') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Label" tooltip="Texto descritivo exibido junto ao componente">
        <Input value={block.label} onChange={(e) => onChange(update(block, { label: e.target.value }))} />
      </PropertySection>
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Min" tooltip="Valor mínimo permitido no slider">
          <Input type="number" value={block.min} onChange={(e) => onChange(update(block, { min: Number(e.target.value) }))} />
        </PropertySection>
        <PropertySection title="Max" tooltip="Valor máximo permitido no slider">
          <Input type="number" value={block.max} onChange={(e) => onChange(update(block, { max: Number(e.target.value) }))} />
        </PropertySection>
      </div>
      <PropertySection title="Passo" tooltip="Incremento entre valores adjacentes no slider">
        <Input type="number" value={block.step} min={1} onChange={(e) => onChange(update(block, { step: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Unidade" tooltip="Unidade exibida junto ao valor (%, R$, kg, etc.)">
        <Input value={block.unit || ''} placeholder="%, R$, kg..." onChange={(e) => onChange(update(block, { unit: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Mostrar valor" tooltip="Exibe o valor selecionado em tempo real ao lado do slider" checked={block.showValue || false} onChange={(v) => onChange(update(block, { showValue: v }))} />
        <SwitchRow label="Obrigatório" tooltip="Exige interação do usuário antes de avançar" checked={block.required || false} onChange={(v) => onChange(update(block, { required: v }))} />
        <SwitchRow label="Steps com dots" tooltip="Exibe pontos visuais nos intervalos do slider" checked={block.showDots || false} onChange={(v) => onChange(update(block, { showDots: v }))} />
      </div>
      <Separator />
      <PropertySection title="Label Mínimo" tooltip="Texto descritivo na extremidade esquerda do slider">
        <Input value={block.minLabel || ''} placeholder="Ex: Nada" onChange={(e) => onChange(update(block, { minLabel: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Label Máximo" tooltip="Texto descritivo na extremidade direita do slider">
        <Input value={block.maxLabel || ''} placeholder="Ex: Muito" onChange={(e) => onChange(update(block, { maxLabel: e.target.value }))} />
      </PropertySection>
      <Separator />
      <Label className="text-xs font-medium text-muted-foreground">Cores do Slider</Label>
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Cor da Track" tooltip="Cor da barra preenchida do slider">
          <div className="flex gap-1 items-center">
            <Input type="color" value={(block as any).trackColor || '#3b82f6'} onChange={(e) => onChange(update(block, { trackColor: e.target.value }))} className="w-10 h-8 p-1 cursor-pointer" />
            {(block as any).trackColor && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(update(block, { trackColor: undefined }))}><X className="h-3 w-3" /></Button>}
          </div>
        </PropertySection>
        <PropertySection title="Cor do Thumb" tooltip="Cor do indicador arrastável do slider">
          <div className="flex gap-1 items-center">
            <Input type="color" value={(block as any).thumbColor || '#3b82f6'} onChange={(e) => onChange(update(block, { thumbColor: e.target.value }))} className="w-10 h-8 p-1 cursor-pointer" />
            {(block as any).thumbColor && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(update(block, { thumbColor: undefined }))}><X className="h-3 w-3" /></Button>}
          </div>
        </PropertySection>
      </div>
      {/* ✅ Etapa 4: Webhook por campo */}
      <Separator />
      <SwitchRow label="🔗 Webhook ao submeter" tooltip="Envia os dados deste campo para uma URL externa (Zapier, n8n, Make) em tempo real" checked={(block as any).webhookOnSubmit || false} onChange={(v) => onChange(update(block, { webhookOnSubmit: v }))} />
      {(block as any).webhookOnSubmit && (
        <PropertySection title="URL do Webhook" tooltip="Endereço que receberá os dados via POST (ex: Zapier, n8n, Make)">
          <Input
            value={(block as any).webhookUrl || ''}
            placeholder="https://seu-servidor.com/webhook"
            onChange={(e) => onChange(update(block, { webhookUrl: e.target.value }))}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            POST com valor do slider ao avançar de etapa.
          </p>
        </PropertySection>
      )}
    </div>
  );
};

const TextInputProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'textInput') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Label" tooltip="Texto descritivo exibido junto ao componente">
        <Input value={block.label} onChange={(e) => onChange(update(block, { label: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Placeholder" tooltip="Texto-exemplo exibido dentro do campo quando vazio">
        <Input value={block.placeholder || ''} onChange={(e) => onChange(update(block, { placeholder: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Validação" tooltip="Tipo de validação aplicada ao conteúdo digitado">
        <Select value={block.validation || 'none'} onValueChange={(v) => onChange(update(block, { validation: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Telefone</SelectItem>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Máx. caracteres" tooltip="Limite máximo de caracteres que o usuário pode digitar">
        <Input type="number" value={block.maxLength || ''} onChange={(e) => onChange(update(block, { maxLength: Number(e.target.value) || undefined }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Multilinha" tooltip="Permite quebra de linha transformando o campo em textarea" checked={block.multiline || false} onChange={(v) => onChange(update(block, { multiline: v }))} />
        <SwitchRow label="Obrigatório" tooltip="Exige interação do usuário antes de avançar" checked={block.required || false} onChange={(v) => onChange(update(block, { required: v }))} />
        {block.validation && block.validation !== 'none' && (
          <SwitchRow label="Feedback visual de validação" tooltip="Mostra indicador verde/vermelho em tempo real conforme a validação" checked={block.showValidationFeedback || false} onChange={(v) => onChange(update(block, { showValidationFeedback: v }))} />
        )}
        {(block.validation === 'cpf' || block.validation === 'cnpj' || block.validation === 'phone') && (
          <SwitchRow label="Máscara automática" tooltip="Formata automaticamente o valor digitado (ex: 000.000.000-00 para CPF)" checked={(block as any).useMask || false} onChange={(v) => onChange(update(block, { useMask: v }))} />
        )}
      </div>
      {/* ✅ Etapa 4: Webhook por campo */}
      <Separator />
      <SwitchRow label="🔗 Webhook ao submeter" tooltip="Envia os dados deste campo para uma URL externa (Zapier, n8n, Make) em tempo real" checked={(block as any).webhookOnSubmit || false} onChange={(v) => onChange(update(block, { webhookOnSubmit: v }))} />
      {(block as any).webhookOnSubmit && (
        <PropertySection title="URL do Webhook" tooltip="Endereço que receberá os dados via POST (ex: Zapier, n8n, Make)">
          <Input
            value={(block as any).webhookUrl || ''}
            placeholder="https://seu-servidor.com/webhook"
            onChange={(e) => onChange(update(block, { webhookUrl: e.target.value }))}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            POST com valor do campo ao sair (blur) ou submeter. Ideal para captura de email em tempo real.
          </p>
        </PropertySection>
      )}
    </div>
  );
};

const NPSProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'nps') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Label Baixo" tooltip="Texto na extremidade esquerda da escala NPS (ex: Nada provável)">
        <Input value={block.lowLabel || ''} placeholder="Nada provável" onChange={(e) => onChange(update(block, { lowLabel: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Label Alto" tooltip="Texto na extremidade direita da escala NPS (ex: Muito provável)">
        <Input value={block.highLabel || ''} placeholder="Muito provável" onChange={(e) => onChange(update(block, { highLabel: e.target.value }))} />
      </PropertySection>
      <div className="space-y-3">
        <SwitchRow label="Mostrar labels" tooltip="Exibe os textos descritivos nas extremidades da escala NPS" checked={block.showLabels || false} onChange={(v) => onChange(update(block, { showLabels: v }))} />
        <SwitchRow label="Obrigatório" tooltip="Exige interação do usuário antes de avançar" checked={block.required || false} onChange={(v) => onChange(update(block, { required: v }))} />
        <SwitchRow label="Campo de comentário" tooltip="Adiciona campo de texto livre para o usuário justificar a nota" checked={block.showComment || false} onChange={(v) => onChange(update(block, { showComment: v }))} />
      </div>
      {block.showComment && (
        <PropertySection title="Placeholder do comentário" tooltip="Texto-exemplo no campo de comentário opcional">
          <Input value={block.commentPlaceholder || ''} placeholder="Conte-nos mais sobre sua nota..." onChange={(e) => onChange(update(block, { commentPlaceholder: e.target.value }))} />
        </PropertySection>
      )}
      {/* ✅ Etapa 4: Webhook por campo */}
      <Separator />
      <SwitchRow label="🔗 Webhook ao submeter" tooltip="Envia os dados deste campo para uma URL externa (Zapier, n8n, Make) em tempo real" checked={(block as any).webhookOnSubmit || false} onChange={(v) => onChange(update(block, { webhookOnSubmit: v }))} />
      {(block as any).webhookOnSubmit && (
        <PropertySection title="URL do Webhook" tooltip="Endereço que receberá os dados via POST (ex: Zapier, n8n, Make)">
          <Input
            value={(block as any).webhookUrl || ''}
            placeholder="https://seu-servidor.com/webhook"
            onChange={(e) => onChange(update(block, { webhookUrl: e.target.value }))}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            POST com nota NPS ao selecionar valor.
          </p>
        </PropertySection>
      )}
      <Separator />
      <Label className="text-xs font-medium text-muted-foreground">Cores por Faixa</Label>
      <div className="grid grid-cols-3 gap-2">
        <PropertySection title="Detrator (0-6)" tooltip="Cor dos botões na faixa de detratores">
          <div className="flex gap-1 items-center">
            <Input type="color" value={block.detractorColor || '#ef4444'} onChange={(e) => onChange(update(block, { detractorColor: e.target.value }))} className="w-10 h-8 p-1 cursor-pointer" />
            {block.detractorColor && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(update(block, { detractorColor: undefined }))}><X className="h-3 w-3" /></Button>}
          </div>
        </PropertySection>
        <PropertySection title="Neutro (7-8)" tooltip="Cor dos botões na faixa neutra">
          <div className="flex gap-1 items-center">
            <Input type="color" value={block.passiveColor || '#eab308'} onChange={(e) => onChange(update(block, { passiveColor: e.target.value }))} className="w-10 h-8 p-1 cursor-pointer" />
            {block.passiveColor && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(update(block, { passiveColor: undefined }))}><X className="h-3 w-3" /></Button>}
          </div>
        </PropertySection>
        <PropertySection title="Promotor (9-10)" tooltip="Cor dos botões na faixa de promotores">
          <div className="flex gap-1 items-center">
            <Input type="color" value={block.promoterColor || '#22c55e'} onChange={(e) => onChange(update(block, { promoterColor: e.target.value }))} className="w-10 h-8 p-1 cursor-pointer" />
            {block.promoterColor && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(update(block, { promoterColor: undefined }))}><X className="h-3 w-3" /></Button>}
          </div>
        </PropertySection>
      </div>
      <div className="p-2 rounded-md bg-muted/50 text-[10px] text-muted-foreground space-y-1">
        <p>🔴 0-6 = Detrator | 🟡 7-8 = Neutro | 🟢 9-10 = Promotor</p>
      </div>
    </div>
  );
};

const AccordionProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'accordion') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Estilo" tooltip="Formato visual do componente">
        <Select value={block.style || 'default'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bordered">Bordas</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      {/* ✅ Etapa 2C: Ícone customizável */}
      <PropertySection title="Ícone" tooltip="Tipo de ícone visual para indicar expansão/colapso">
        <Select value={block.iconType || 'chevron'} onValueChange={(v) => onChange(update(block, { iconType: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="chevron">▼ Seta</SelectItem>
            <SelectItem value="plus">＋/－ Plus/Minus</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Permitir múltiplos abertos" tooltip="Permite expandir vários itens do accordion simultaneamente" checked={block.allowMultiple || false} onChange={(v) => onChange(update(block, { allowMultiple: v }))} />
    </div>
  );
};

const ComparisonProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'comparison') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Título Esquerda" tooltip="Cabeçalho da coluna esquerda na comparação">
        <Input value={block.leftTitle} onChange={(e) => onChange(update(block, { leftTitle: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Título Direita" tooltip="Cabeçalho da coluna direita na comparação">
        <Input value={block.rightTitle} onChange={(e) => onChange(update(block, { rightTitle: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Estilo Esquerda" tooltip="Estilo visual (positivo/negativo/neutro) da coluna esquerda">
        <Select value={block.leftStyle || 'negative'} onValueChange={(v) => onChange(update(block, { leftStyle: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="negative">Negativo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Estilo Direita" tooltip="Estilo visual (positivo/negativo/neutro) da coluna direita">
        <Select value={block.rightStyle || 'positive'} onValueChange={(v) => onChange(update(block, { rightStyle: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="positive">Positivo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <SwitchRow label="Mostrar ícones" tooltip="Exibe ícones visuais ao lado de cada item no resumo" checked={block.showIcons || false} onChange={(v) => onChange(update(block, { showIcons: v }))} />
      <PropertySection title="Destacar coluna" tooltip="Aplica destaque visual à coluna selecionada como vencedora">
        <Select value={(block as any).highlightWinner || 'none'} onValueChange={(v) => onChange(update(block, { highlightWinner: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      {block.showIcons && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <PropertySection title="Ícone Esquerda" tooltip="Emoji ou ícone personalizado da coluna esquerda">
              <Input value={(block as any).itemIcons?.left || ''} placeholder="✗" onChange={(e) => onChange(update(block, { itemIcons: { ...((block as any).itemIcons || {}), left: e.target.value } }))} />
            </PropertySection>
            <PropertySection title="Ícone Direita" tooltip="Emoji ou ícone personalizado da coluna direita">
              <Input value={(block as any).itemIcons?.right || ''} placeholder="✓" onChange={(e) => onChange(update(block, { itemIcons: { ...((block as any).itemIcons || {}), right: e.target.value } }))} />
            </PropertySection>
          </div>
        </>
      )}

      <Separator />
      <Label className="text-xs font-medium text-muted-foreground">Imagens (Antes/Depois)</Label>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Imagem Esquerda</Label>
          {(block as any).leftImage ? (
            <div className="relative">
              <img src={(block as any).leftImage} alt="Esquerda" className="w-full h-20 object-cover rounded-md" />
              <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => onChange(update(block, { leftImage: undefined }))}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <ImageUploader value="" onChange={(url) => onChange(update(block, { leftImage: url }))} />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Imagem Direita</Label>
          {(block as any).rightImage ? (
            <div className="relative">
              <img src={(block as any).rightImage} alt="Direita" className="w-full h-20 object-cover rounded-md" />
              <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => onChange(update(block, { rightImage: undefined }))}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <ImageUploader value="" onChange={(url) => onChange(update(block, { rightImage: url }))} />
          )}
        </div>
      </div>
    </div>
  );
};

const SocialProofProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'socialProof') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Intervalo (ms)" tooltip="Tempo em milissegundos entre cada notificação de prova social">
        <Input type="number" value={block.interval} min={1000} step={500} onChange={(e) => onChange(update(block, { interval: Number(e.target.value) }))} />
      </PropertySection>
      <PropertySection title="Estilo" tooltip="Formato visual do componente">
        <Select value={block.style || 'toast'} onValueChange={(v) => onChange(update(block, { style: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="toast">Toast</SelectItem>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="floating">Flutuante</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Posição" tooltip="Canto da tela onde a notificação aparece">
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
      <SwitchRow label="Mostrar avatar" tooltip="Exibe foto ou avatar junto à notificação de prova social" checked={block.showAvatar || false} onChange={(v) => onChange(update(block, { showAvatar: v }))} />
      <Separator />
      <Label className="text-xs font-medium text-muted-foreground">Cores</Label>
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Cor de Fundo" tooltip="Cor de fundo da notificação">
          <div className="flex gap-1 items-center">
            <Input type="color" value={(block as any).bgColor || '#ffffff'} onChange={(e) => onChange(update(block, { bgColor: e.target.value }))} className="w-10 h-8 p-1 cursor-pointer" />
            {(block as any).bgColor && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(update(block, { bgColor: undefined }))}><X className="h-3 w-3" /></Button>}
          </div>
        </PropertySection>
        <PropertySection title="Cor da Borda" tooltip="Cor da borda da notificação">
          <div className="flex gap-1 items-center">
            <Input type="color" value={(block as any).borderColor || '#e5e7eb'} onChange={(e) => onChange(update(block, { borderColor: e.target.value }))} className="w-10 h-8 p-1 cursor-pointer" />
            {(block as any).borderColor && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(update(block, { borderColor: undefined }))}><X className="h-3 w-3" /></Button>}
          </div>
        </PropertySection>
      </div>
    </div>
  );
};

const AnimatedCounterProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'animatedCounter') return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Valor Inicial" tooltip="Número onde a contagem animada começa">
          <Input type="number" value={block.startValue} onChange={(e) => onChange(update(block, { startValue: Number(e.target.value) }))} />
        </PropertySection>
        <PropertySection title="Valor Final" tooltip="Número onde a contagem animada termina">
          <Input type="number" value={block.endValue} onChange={(e) => onChange(update(block, { endValue: Number(e.target.value) }))} />
        </PropertySection>
      </div>
      <PropertySection title="Duração (segundos)" tooltip="Tempo em segundos da animação ou exibição">
        <Input type="number" value={block.duration} min={0.5} step={0.5} onChange={(e) => onChange(update(block, { duration: Number(e.target.value) }))} />
      </PropertySection>
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Prefixo" tooltip="Texto exibido antes do número (ex: R$)">
          <Input value={block.prefix || ''} placeholder="R$" onChange={(e) => onChange(update(block, { prefix: e.target.value }))} />
        </PropertySection>
        <PropertySection title="Sufixo" tooltip="Texto exibido depois do número (ex: %)">
          <Input value={block.suffix || ''} placeholder="%" onChange={(e) => onChange(update(block, { suffix: e.target.value }))} />
        </PropertySection>
      </div>
      <PropertySection title="Label" tooltip="Texto descritivo exibido junto ao componente">
        <Input value={block.label || ''} onChange={(e) => onChange(update(block, { label: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Tamanho" tooltip="Dimensão visual do componente no quiz">
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
      <PropertySection title="Easing" tooltip="Tipo de aceleração da animação (suave, linear, etc.)">
        <Select value={block.easing || 'easeOut'} onValueChange={(v) => onChange(update(block, { easing: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="easeOut">Ease Out</SelectItem>
            <SelectItem value="easeInOut">Ease In Out</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
      <PropertySection title="Cor" tooltip="Cor principal do elemento">
        <Input type="color" value={block.color || '#3b82f6'} onChange={(e) => onChange(update(block, { color: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Separador de milhar" tooltip="Adiciona pontos entre milhares para melhor leitura (ex: 1.000.000)" checked={block.separator || false} onChange={(v) => onChange(update(block, { separator: v }))} />
      <SwitchRow label="Formato moeda (R$)" tooltip="Formata o número como valor monetário brasileiro com vírgula decimal" checked={(block as any).currencyFormat || false} onChange={(v) => onChange(update(block, { currencyFormat: v }))} />
      {(block as any).currencyFormat && (
        <PropertySection title="Casas decimais" tooltip="Quantidade de casas após a vírgula">
          <Input type="number" min={0} max={4} value={(block as any).decimalPlaces || 2} onChange={(e) => onChange(update(block, { decimalPlaces: Number(e.target.value) }))} />
        </PropertySection>
      )}
      <Separator />
      <PropertySection title="Fonte" tooltip="Família tipográfica do número animado">
        <Select value={(block as any).fontFamily || 'sans'} onValueChange={(v) => onChange(update(block, { fontFamily: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sans">Sans-serif (padrão)</SelectItem>
            <SelectItem value="mono">Monospace (timer)</SelectItem>
            <SelectItem value="serif">Serif (elegante)</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>
    </div>
  );
};

const PriceProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'price') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Preço Atual" tooltip="Valor que o usuário paga (exibido em destaque)">
        <Input value={block.price || ''} placeholder="99,90" onChange={(e) => onChange(update(block, { price: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Moeda" tooltip="Símbolo monetário exibido (R$, $, €)">
        <Input value={block.currency || 'R$'} onChange={(e) => onChange(update(block, { currency: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Período" tooltip="Frequência de cobrança exibida (/mês, /ano, etc.)">
        <Input value={block.period || '/mês'} onChange={(e) => onChange(update(block, { period: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Preço Original" tooltip="Valor original riscado para mostrar desconto">
        <Input value={block.originalPrice || ''} placeholder="De R$ 199,90" onChange={(e) => onChange(update(block, { originalPrice: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Desconto" tooltip="Texto de desconto exibido (ex: 20% OFF)">
        <Input value={block.discount || ''} placeholder="20% OFF" onChange={(e) => onChange(update(block, { discount: e.target.value }))} />
      </PropertySection>
      <PropertySection title="Texto do Botão" tooltip="Texto exibido dentro do botão de ação">
        <Input value={block.buttonText || ''} onChange={(e) => onChange(update(block, { buttonText: e.target.value }))} />
      </PropertySection>
      <PropertySection title="URL do Botão" tooltip="Link de destino ao clicar no botão">
        <Input value={block.buttonUrl || ''} placeholder="https://..." onChange={(e) => onChange(update(block, { buttonUrl: e.target.value }))} />
      </PropertySection>
      <SwitchRow label="Destacado" tooltip="Aplica borda e destaque visual ao card de preço, chamando atenção" checked={block.highlighted || false} onChange={(v) => onChange(update(block, { highlighted: v }))} />
    </div>
  );
};

const MetricsProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'metrics') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Tipo de Gráfico" tooltip="Formato visual dos dados (barras, pizza, linha, donut)">
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
        <SwitchRow label="Mostrar legenda" tooltip="Exibe legenda identificando cada série de dados no gráfico" checked={block.showLegend || false} onChange={(v) => onChange(update(block, { showLegend: v }))} />
        <SwitchRow label="Mostrar valores" tooltip="Exibe valores numéricos diretamente no gráfico" checked={block.showValues || false} onChange={(v) => onChange(update(block, { showValues: v }))} />
      </div>
    </div>
  );
};

const EmbedProperties = ({ block, onChange }: BlockPropertiesPanelProps) => {
  if (block.type !== 'embed') return null;
  return (
    <div className="space-y-4">
      <PropertySection title="Provider" tooltip="Plataforma ou formato de origem do conteúdo">
        <Input value={block.provider || ''} placeholder="Detectado automaticamente" onChange={(e) => onChange(update(block, { provider: e.target.value }))} />
      </PropertySection>
      {/* ✅ Etapa 2F: Whitelist de domínios */}
      <PropertySection title="Domínios permitidos" tooltip="Restringe quais domínios podem ser embarcados por segurança. Vazio = todos permitidos">
        <Input
          value={((block as any).allowedDomains || []).join(', ')}
          placeholder="google.com, youtube.com (vazio = todos)"
          onChange={(e) => onChange(update(block, { allowedDomains: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [] }))}
        />
        <p className="text-[10px] text-muted-foreground mt-1">Separe domínios por vírgula. Vazio = aceitar todos.</p>
      </PropertySection>
    </div>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

const PropertySection = ({ title, children, tooltip }: { title: string; children: React.ReactNode; tooltip?: string }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1">
      <Label className="text-xs font-medium text-muted-foreground">{title}</Label>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px] text-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    {children}
  </div>
);

const SwitchRow = ({ label, checked, onChange, tooltip }: { label: string; checked: boolean; onChange: (v: boolean) => void; tooltip?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1">
      <Label className="text-sm cursor-pointer">{label}</Label>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px] text-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
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
      <SwitchRow label="Título em negrito" tooltip="Define se o título do callout aparece em negrito" checked={(block as any).titleBold !== false} onChange={(v) => onChange(update(block, { titleBold: v }))} />
      <div className="space-y-2">
        <Label>Itens (um por linha)</Label>
        <Textarea
          className="min-h-[100px]"
          value={(block.items || []).join('\n')}
          onChange={(e) => onChange(update(block, { items: e.target.value.split('\n').filter(Boolean) }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Nota de rodapé</Label>
        <Input value={block.footnote || ''} onChange={(e) => onChange(update(block, { footnote: e.target.value }))} />
      </div>
      <SwitchRow label="Dispensável (botão X)" tooltip="Permite que o usuário feche/dispense o alerta clicando no X" checked={(block as any).dismissible || false} onChange={(v) => onChange(update(block, { dismissible: v }))} />
      <SwitchRow label="Ocultar bloco" tooltip="Mantém o bloco configurado mas não o exibe no quiz publicado" checked={(block as any).hidden || false} onChange={(v) => onChange(update(block, { hidden: v }))} />
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
        <Label>Cor padrão dos ícones</Label>
        <Input type="color" value={block.iconColor || '#10b981'} onChange={(e) => onChange(update(block, { iconColor: e.target.value }))} />
      </div>
      <Separator />
      <Label>Itens</Label>
      {items.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex gap-2 items-center">
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
            {/* ✅ Etapa 2D: Cor individual por item */}
            <Input className="w-12" type="color" value={(item as any).color || block.iconColor || '#10b981'} onChange={(e) => {
              const newItems = [...items];
              newItems[idx] = { ...item, color: e.target.value };
              onChange(update(block, { items: newItems }));
            }} />
          </div>
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
      {/* ✅ Etapa 2D: Imagem de fundo opcional */}
      <div className="space-y-2">
        <Label>Imagem de fundo (URL)</Label>
        <Input value={(block as any).backgroundImageUrl || ''} placeholder="https://..." onChange={(e) => onChange(update(block, { backgroundImageUrl: e.target.value }))} />
        <p className="text-[10px] text-muted-foreground">Opcional. Aplica overlay escuro sobre a imagem.</p>
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
        <div key={idx} className="space-y-1">
          <div className="flex gap-2 items-center">
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
          {/* ✅ Etapa 2C: Tooltip + cor individual */}
          <div className="flex gap-2 items-center ml-1">
            <Input className="flex-1" value={badge.tooltip || ''} onChange={(e) => {
              const newBadges = [...badges];
              newBadges[idx] = { ...badge, tooltip: e.target.value };
              onChange(update(block, { badges: newBadges }));
            }} placeholder="Tooltip (hover)" />
            <Input className="w-12" type="color" value={badge.color || '#000000'} onChange={(e) => {
              const newBadges = [...badges];
              newBadges[idx] = { ...badge, color: e.target.value };
              onChange(update(block, { badges: newBadges }));
            }} />
          </div>
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
      <SwitchRow label="Dispensável" tooltip="Permite que o usuário feche/dispense o banner" checked={block.dismissible || false} onChange={(v) => onChange(update(block, { dismissible: v }))} />
      {/* ✅ Etapa 2D: Link clicável */}
      <Separator />
      <div className="space-y-2">
        <Label>URL do link (opcional)</Label>
        <Input value={(block as any).linkUrl || ''} placeholder="https://..." onChange={(e) => onChange(update(block, { linkUrl: e.target.value }))} />
      </div>
      {(block as any).linkUrl && (
        <div className="space-y-2">
          <Label>Abrir em</Label>
          <Select value={(block as any).linkTarget || '_blank'} onValueChange={(v) => onChange(update(block, { linkTarget: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_blank">Nova aba</SelectItem>
              <SelectItem value="_self">Mesma aba</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

// ---- ANSWER SUMMARY ----
const AnswerSummaryProperties = ({ block, onChange, questions, currentQuestionIndex }: BlockPropertiesPanelProps) => {
  if (block.type !== 'answerSummary') return null;
  
  // Filter: only questions BEFORE current position AND with a 'question' block
  const filteredQuestions = (questions || []).filter((q, idx) => {
    if (currentQuestionIndex !== undefined && idx >= currentQuestionIndex) return false;
    const hasQuestionBlock = q.blocks?.some((b: any) => b.type === 'question');
    return hasQuestionBlock;
  });

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
      {filteredQuestions.length === 0 ? (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            ⚠️ Nenhuma pergunta anterior disponível. Coloque este bloco após perguntas respondíveis.
          </p>
        </div>
      ) : (
        <QuestionMultiSelector
          selectedIds={(block as any).selectedQuestionIds || []}
          onChange={(ids) => onChange(update(block, { selectedQuestionIds: ids }))}
          questions={filteredQuestions}
          label="Perguntas a exibir"
        />
      )}
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
      {/* ✅ Etapa 2E: Botão copiar respostas */}
      <SwitchRow label="Botão 'Copiar respostas'" tooltip="Adiciona botão para copiar todas as respostas para a área de transferência" checked={block.showCopyButton || false} onChange={(v) => onChange(update(block, { showCopyButton: v }))} />
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
      {/* ✅ Etapa 2D: Animação fade */}
      <SwitchRow label="Animar transições (fade)" tooltip="Aplica efeito de transição suave ao mudar de mensagem" checked={(block as any).animateFade !== false} onChange={(v) => onChange(update(block, { animateFade: v }))} />
      <Separator />
      <Label>Mensagens por % de progresso</Label>
      {messages.map((msg: any, idx: number) => (
        <div key={idx} className="space-y-1">
          <div className="flex gap-2 items-center">
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
          {/* ✅ Etapa 2D: Ícone por faixa */}
          <Input className="w-24 ml-[72px]" value={msg.icon || ''} placeholder="🔥 ícone" onChange={(e) => {
            const newMsgs = [...messages];
            newMsgs[idx] = { ...msg, icon: e.target.value };
            onChange(update(block, { messages: newMsgs }));
          }} />
        </div>
      ))}
      <button className="text-xs text-primary underline" onClick={() => onChange(update(block, { messages: [...messages, { threshold: 50, text: '', icon: '' }] }))}>+ Adicionar mensagem</button>
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
      <SwitchRow label="Mostrar contador" tooltip="Exibe o número total de pessoas junto ao grupo de avatares" checked={(block as any).showCount !== false} onChange={(v) => onChange(update(block, { showCount: v }))} />
      {/* ✅ Etapa 2D: Link para perfil ao clicar */}
      <Separator />
      <div className="space-y-2">
        <Label>URL do perfil (opcional)</Label>
        <Input value={(block as any).profileUrl || ''} placeholder="https://..." onChange={(e) => onChange(update(block, { profileUrl: e.target.value }))} />
        <p className="text-[10px] text-muted-foreground">Se preenchido, clicar no grupo redireciona para esta URL.</p>
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
      {/* ✅ Etapa 2D: Cores e ícones personalizados */}
      <Separator />
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Cor 'Antes'" tooltip="Cor da coluna de problemas (padrão: vermelho)">
          <Input type="color" value={(block as any).beforeColor || '#ef4444'} onChange={(e) => onChange(update(block, { beforeColor: e.target.value }))} />
        </PropertySection>
        <PropertySection title="Cor 'Depois'" tooltip="Cor da coluna de soluções (padrão: verde)">
          <Input type="color" value={(block as any).afterColor || '#22c55e'} onChange={(e) => onChange(update(block, { afterColor: e.target.value }))} />
        </PropertySection>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Ícone 'Antes'" tooltip="Emoji ou ícone para itens da coluna de problemas">
          <Input value={(block as any).beforeIcon || ''} placeholder="❌" onChange={(e) => onChange(update(block, { beforeIcon: e.target.value }))} />
        </PropertySection>
        <PropertySection title="Ícone 'Depois'" tooltip="Emoji ou ícone para itens da coluna de soluções">
          <Input value={(block as any).afterIcon || ''} placeholder="✅" onChange={(e) => onChange(update(block, { afterIcon: e.target.value }))} />
        </PropertySection>
      </div>
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
      {/* ✅ Etapa 2D: Limite máximo de exibição */}
      <PropertySection title="Máximo de resultados (0 = sem limite)" tooltip="Limita quantas recomendações são exibidas ao usuário">
        <Input type="number" min={0} value={(block as any).maxDisplay || 0} onChange={(e) => onChange(update(block, { maxDisplay: Number(e.target.value) }))} />
      </PropertySection>
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

// ---- Calculator Properties ----
const CalculatorProperties = ({ block, onChange, questions }: BlockPropertiesPanelProps) => {
  if (block.type !== 'calculator') return null;
  
  const addVariable = () => {
    const vars = [...(block.variables || [])];
    vars.push({ id: `var-${Date.now()}`, name: `var${vars.length + 1}`, defaultValue: 0 });
    onChange(update(block, { variables: vars }));
  };

  const updateVariable = (idx: number, field: string, value: any) => {
    const vars = [...(block.variables || [])];
    vars[idx] = { ...vars[idx], [field]: value };
    onChange(update(block, { variables: vars }));
  };

  const removeVariable = (idx: number) => {
    const vars = (block.variables || []).filter((_: any, i: number) => i !== idx);
    onChange(update(block, { variables: vars }));
  };

  const addRange = () => {
    const ranges = [...(block.ranges || [])];
    ranges.push({ min: 0, max: 100, label: 'Faixa', color: '#3b82f6' });
    onChange(update(block, { ranges: ranges }));
  };

  const updateRange = (idx: number, field: string, value: any) => {
    const ranges = [...(block.ranges || [])];
    ranges[idx] = { ...ranges[idx], [field]: value };
    onChange(update(block, { ranges: ranges }));
  };

  const removeRange = (idx: number) => {
    const ranges = (block.ranges || []).filter((_: any, i: number) => i !== idx);
    onChange(update(block, { ranges: ranges }));
  };

  return (
    <div className="space-y-4">
      {/* ✅ Etapa 2F: Templates de fórmula prontos */}
      <PropertySection title="Template de fórmula" tooltip="Escolha um modelo pronto ou crie sua fórmula personalizada">
        <Select value={(block as any).formulaTemplate || '_custom'} onValueChange={(v) => {
          const templates: Record<string, { formula: string; vars: any[]; unit: string; label: string }> = {
            imc: { formula: 'peso / (altura * altura)', vars: [{ id: 'v-peso', name: 'peso', defaultValue: 70 }, { id: 'v-altura', name: 'altura', defaultValue: 1.75 }], unit: 'kg/m²', label: 'IMC' },
            roi: { formula: '((ganho - investimento) / investimento) * 100', vars: [{ id: 'v-ganho', name: 'ganho', defaultValue: 10000 }, { id: 'v-investimento', name: 'investimento', defaultValue: 5000 }], unit: '%', label: 'ROI' },
            economia: { formula: '(valorAtual - valorNovo) * 12', vars: [{ id: 'v-atual', name: 'valorAtual', defaultValue: 500 }, { id: 'v-novo', name: 'valorNovo', defaultValue: 300 }], unit: 'R$/ano', label: 'Economia Anual' },
            retorno: { formula: 'investimento / economiaMensal', vars: [{ id: 'v-invest', name: 'investimento', defaultValue: 10000 }, { id: 'v-econ', name: 'economiaMensal', defaultValue: 2000 }], unit: 'meses', label: 'Tempo de Retorno' },
          };
          if (v !== '_custom' && templates[v]) {
            const t = templates[v];
            onChange(update(block, { formulaTemplate: v, formula: t.formula, variables: t.vars, resultUnit: t.unit, resultLabel: t.label }));
          } else {
            onChange(update(block, { formulaTemplate: v }));
          }
        }}>
          <SelectTrigger><SelectValue placeholder="Personalizada" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_custom">Personalizada</SelectItem>
            <SelectItem value="imc">📊 IMC (peso/altura²)</SelectItem>
            <SelectItem value="roi">💰 ROI (%)</SelectItem>
            <SelectItem value="economia">💵 Economia Anual</SelectItem>
            <SelectItem value="retorno">⏱️ Tempo de Retorno</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>

      <PropertySection title="Fórmula" tooltip="Expressão matemática usando os nomes das variáveis definidas abaixo">
        <Input
          value={block.formula || ''}
          placeholder="Ex: (var1 * var2) / 100"
          onChange={(e) => onChange(update(block, { formula: e.target.value }))}
        />
        <p className="text-[10px] text-muted-foreground mt-1">Use nomes das variáveis definidas abaixo</p>
      </PropertySection>

      <PropertySection title="Label do Resultado" tooltip="Título exibido acima do valor calculado">
        <Input
          value={block.resultLabel || ''}
          placeholder="Resultado"
          onChange={(e) => onChange(update(block, { resultLabel: e.target.value }))}
        />
      </PropertySection>

      <div className="grid grid-cols-2 gap-2">
        <PropertySection title="Prefixo" tooltip="Texto exibido antes do número (ex: R$)">
          <Input
            value={block.resultPrefix || ''}
            placeholder="R$"
            onChange={(e) => onChange(update(block, { resultPrefix: e.target.value }))}
          />
        </PropertySection>
        <PropertySection title="Unidade" tooltip="Unidade exibida junto ao valor (%, R$, kg, etc.)">
          <Input
            value={block.resultUnit || ''}
            placeholder="kg, %, etc."
            onChange={(e) => onChange(update(block, { resultUnit: e.target.value }))}
          />
        </PropertySection>
      </div>

      <PropertySection title="Casas Decimais" tooltip="Precisão numérica do resultado da calculadora">
        <Select value={String(block.decimalPlaces ?? 2)} onValueChange={(v) => onChange(update(block, { decimalPlaces: Number(v) }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
          </SelectContent>
        </Select>
      </PropertySection>

      <Separator />

      {/* Variables */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Variáveis</Label>
          <button type="button" className="text-xs text-primary underline" onClick={addVariable}>+ Adicionar</button>
        </div>
        {(block.variables || []).map((v: any, idx: number) => (
          <div key={v.id} className="border rounded-md p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Var {idx + 1}</span>
              <button type="button" className="text-xs text-destructive" onClick={() => removeVariable(idx)}>✕</button>
            </div>
            <Input
              placeholder="Nome (ex: peso)"
              value={v.name || ''}
              onChange={(e) => updateVariable(idx, 'name', e.target.value)}
              className="h-7 text-xs"
            />
            <QuestionSelector
              value={v.sourceQuestionId || ''}
              onChange={(id) => updateVariable(idx, 'sourceQuestionId', id)}
              questions={questions}
              label="Pergunta-Fonte"
              placeholder="Opcional"
            />
            <Input
              type="number"
              placeholder="Valor padrão"
              value={v.defaultValue ?? ''}
              onChange={(e) => updateVariable(idx, 'defaultValue', Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Ranges */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Faixas de Resultado</Label>
          <button type="button" className="text-xs text-primary underline" onClick={addRange}>+ Adicionar</button>
        </div>
        {(block.ranges || []).map((r: any, idx: number) => (
          <div key={idx} className="border rounded-md p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Faixa {idx + 1}</span>
              <button type="button" className="text-xs text-destructive" onClick={() => removeRange(idx)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Input type="number" placeholder="Mín" value={r.min ?? ''} onChange={(e) => updateRange(idx, 'min', Number(e.target.value))} className="h-7 text-xs" />
              <Input type="number" placeholder="Máx" value={r.max ?? ''} onChange={(e) => updateRange(idx, 'max', Number(e.target.value))} className="h-7 text-xs" />
            </div>
            <Input placeholder="Label (ex: Baixo)" value={r.label || ''} onChange={(e) => updateRange(idx, 'label', e.target.value)} className="h-7 text-xs" />
            <Input type="color" value={r.color || '#3b82f6'} onChange={(e) => updateRange(idx, 'color', e.target.value)} className="h-7" />
          </div>
        ))}
      </div>
    </div>
  );
};



export const BlockPropertiesPanel = ({ block: rawBlock, onChange, questions, currentQuestionIndex }: BlockPropertiesPanelProps) => {
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
      case 'answerSummary': return <AnswerSummaryProperties block={block} onChange={onChange} questions={questions} currentQuestionIndex={currentQuestionIndex} />;
      case 'progressMessage': return <ProgressMessageProperties block={block} onChange={onChange} />;
      case 'avatarGroup': return <AvatarGroupProperties block={block} onChange={onChange} />;
      case 'conditionalText': return <ConditionalTextProperties block={block} onChange={onChange} questions={questions} />;
      case 'comparisonResult': return <ComparisonResultProperties block={block} onChange={onChange} questions={questions} />;
      case 'personalizedCTA': return <PersonalizedCTAProperties block={block} onChange={onChange} questions={questions} />;
      case 'recommendation': return <RecommendationProperties block={block} onChange={onChange} questions={questions} />;
      case 'calculator': return <CalculatorProperties block={block} onChange={onChange} questions={questions} />;
      default: return <p className="text-sm text-muted-foreground">Sem propriedades configuráveis</p>;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
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
    </TooltipProvider>
  );
};
