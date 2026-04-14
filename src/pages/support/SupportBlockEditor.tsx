import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Code, Plus, Trash2 } from 'lucide-react';

interface SupportBlockEditorProps {
  block: any;
  blockIndex: number;
  onBlockChange: (updatedBlock: any) => void;
}

// ── Field Renderers ──

const StringField = ({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    {multiline ? (
      <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-[50px] text-xs" />
    ) : (
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-xs" />
    )}
  </div>
);

const NumberField = ({ label, value, onChange, min, max, step }: {
  label: string; value: number | undefined; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Input type="number" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} className="h-8 text-xs" />
  </div>
);

const BoolField = ({ label, value, onChange }: {
  label: string; value: boolean | undefined; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center gap-2">
    <Switch checked={!!value} onCheckedChange={onChange} />
    <Label className="text-xs">{label}</Label>
  </div>
);

const SelectField = ({ label, value, onChange, options }: {
  label: string; value: string | undefined; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

// ── Block Type Editors ──

const QuestionEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Texto da Pergunta" value={block.questionText} onChange={(v) => onChange({ ...block, questionText: v })} multiline />
    <SelectField label="Formato" value={block.answerFormat} onChange={(v) => onChange({ ...block, answerFormat: v })}
      options={[
        { value: 'single_choice', label: 'Escolha Única' },
        { value: 'multiple_choice', label: 'Múltipla Escolha' },
        { value: 'yes_no', label: 'Sim/Não' },
        { value: 'short_text', label: 'Texto Curto' },
      ]}
    />
    <StringField label="Subtítulo" value={block.subtitle} onChange={(v) => onChange({ ...block, subtitle: v })} />
    <StringField label="Dica (hint)" value={block.hint} onChange={(v) => onChange({ ...block, hint: v })} />
    <StringField label="Texto botão próxima" value={block.nextButtonText} onChange={(v) => onChange({ ...block, nextButtonText: v })} placeholder="Próxima" />
    <div className="flex flex-wrap gap-4">
      <BoolField label="Obrigatória" value={block.required} onChange={(v) => onChange({ ...block, required: v })} />
      <BoolField label="Auto-avançar" value={block.autoAdvance} onChange={(v) => onChange({ ...block, autoAdvance: v })} />
      <BoolField label="Randomizar opções" value={block.randomizeOptions} onChange={(v) => onChange({ ...block, randomizeOptions: v })} />
    </div>
    {/* Options */}
    {Array.isArray(block.options) && (
      <div className="space-y-2">
        <Label className="text-xs font-medium">Opções ({block.options.length})</Label>
        {block.options.map((opt: string, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] w-5 h-5 flex items-center justify-center shrink-0">{i+1}</Badge>
            <Input className="h-7 text-xs flex-1" value={opt} onChange={(e) => {
              const opts = [...block.options]; opts[i] = e.target.value;
              const scores = [...(block.scores || [])];
              const emojis = [...(block.emojis || [])];
              onChange({ ...block, options: opts, scores, emojis });
            }} />
            <Input type="number" className="h-7 text-xs w-16" placeholder="Pts"
              value={block.scores?.[i] ?? ''}
              onChange={(e) => {
                const scores = [...(block.scores || new Array(block.options.length).fill(0))];
                scores[i] = Number(e.target.value);
                onChange({ ...block, scores });
              }}
            />
            <Input className="h-7 text-xs w-12" placeholder="😊"
              value={block.emojis?.[i] ?? ''}
              onChange={(e) => {
                const emojis = [...(block.emojis || new Array(block.options.length).fill(''))];
                emojis[i] = e.target.value;
                onChange({ ...block, emojis });
              }}
            />
          </div>
        ))}
      </div>
    )}
  </div>
);

const TextEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Conteúdo" value={block.content} onChange={(v) => onChange({ ...block, content: v })} multiline />
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Alinhamento" value={block.alignment} onChange={(v) => onChange({ ...block, alignment: v })}
        options={[{ value: 'left', label: 'Esquerda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Direita' }]} />
      <SelectField label="Tamanho fonte" value={block.fontSize} onChange={(v) => onChange({ ...block, fontSize: v })}
        options={[{ value: 'small', label: 'Pequeno' }, { value: 'medium', label: 'Médio' }, { value: 'large', label: 'Grande' }]} />
    </div>
    <StringField label="URL da Imagem" value={block.imageUrl} onChange={(v) => onChange({ ...block, imageUrl: v })} placeholder="https://..." />
  </div>
);

const ImageEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="URL" value={block.url} onChange={(v) => onChange({ ...block, url: v })} placeholder="https://..." />
    <StringField label="Alt text" value={block.alt} onChange={(v) => onChange({ ...block, alt: v })} />
    <StringField label="Legenda" value={block.caption} onChange={(v) => onChange({ ...block, caption: v })} />
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Tamanho" value={block.size} onChange={(v) => onChange({ ...block, size: v })}
        options={[{ value: 'tiny', label: 'Mínimo' }, { value: 'small', label: 'Pequeno' }, { value: 'medium', label: 'Médio' }, { value: 'large', label: 'Grande' }, { value: 'full', label: 'Cheio' }]} />
      <SelectField label="Borda" value={block.borderRadius} onChange={(v) => onChange({ ...block, borderRadius: v })}
        options={[{ value: 'none', label: 'Sem' }, { value: 'small', label: 'Suave' }, { value: 'medium', label: 'Média' }, { value: 'large', label: 'Grande' }, { value: 'full', label: 'Circular' }]} />
    </div>
    <BoolField label="Lightbox" value={block.enableLightbox} onChange={(v) => onChange({ ...block, enableLightbox: v })} />
  </div>
);

const VideoEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="URL" value={block.url} onChange={(v) => onChange({ ...block, url: v })} placeholder="https://youtube.com/..." />
    <StringField label="Legenda" value={block.caption} onChange={(v) => onChange({ ...block, caption: v })} />
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Provider" value={block.provider} onChange={(v) => onChange({ ...block, provider: v })}
        options={[{ value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }, { value: 'direct', label: 'Direto' }, { value: 'bunny_stream', label: 'Bunny' }, { value: 'loom', label: 'Loom' }]} />
      <SelectField label="Aspecto" value={block.aspectRatio} onChange={(v) => onChange({ ...block, aspectRatio: v })}
        options={[{ value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' }, { value: '9:16', label: '9:16 (Vertical)' }]} />
    </div>
    <div className="flex flex-wrap gap-4">
      <BoolField label="Autoplay" value={block.autoplay} onChange={(v) => onChange({ ...block, autoplay: v })} />
      <BoolField label="Mudo" value={block.muted} onChange={(v) => onChange({ ...block, muted: v })} />
      <BoolField label="Loop" value={block.loop} onChange={(v) => onChange({ ...block, loop: v })} />
    </div>
  </div>
);

const AudioEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="URL" value={block.url} onChange={(v) => onChange({ ...block, url: v })} placeholder="https://..." />
    <StringField label="Legenda" value={block.caption} onChange={(v) => onChange({ ...block, caption: v })} />
    <BoolField label="Autoplay" value={block.autoplay} onChange={(v) => onChange({ ...block, autoplay: v })} />
  </div>
);

const ButtonEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Texto" value={block.text} onChange={(v) => onChange({ ...block, text: v })} />
    <StringField label="URL" value={block.url} onChange={(v) => onChange({ ...block, url: v })} placeholder="https://..." />
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Ação" value={block.action} onChange={(v) => onChange({ ...block, action: v })}
        options={[{ value: 'link', label: 'Link' }, { value: 'next_question', label: 'Próxima pergunta' }, { value: 'go_to_question', label: 'Ir para pergunta' }]} />
      <SelectField label="Variante" value={block.variant} onChange={(v) => onChange({ ...block, variant: v })}
        options={[{ value: 'default', label: 'Padrão' }, { value: 'outline', label: 'Outline' }, { value: 'secondary', label: 'Secundário' }, { value: 'ghost', label: 'Ghost' }]} />
    </div>
    <BoolField label="Abrir em nova aba" value={block.openInNewTab} onChange={(v) => onChange({ ...block, openInNewTab: v })} />
    <StringField label="Template dinâmico" value={block.textTemplate} onChange={(v) => onChange({ ...block, textTemplate: v })} placeholder="Ex: {resposta}" />
    <StringField label="Texto fallback" value={block.fallbackText} onChange={(v) => onChange({ ...block, fallbackText: v })} />
  </div>
);

const LoadingEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <NumberField label="Duração (segundos)" value={block.duration} onChange={(v) => onChange({ ...block, duration: v })} min={1} max={60} />
    <StringField label="Mensagem" value={block.message} onChange={(v) => onChange({ ...block, message: v })} />
    <StringField label="Mensagem de conclusão" value={block.completionMessage} onChange={(v) => onChange({ ...block, completionMessage: v })} />
    <SelectField label="Tipo spinner" value={block.spinnerType} onChange={(v) => onChange({ ...block, spinnerType: v })}
      options={[{ value: 'spinner', label: 'Spinner' }, { value: 'dots', label: 'Pontos' }, { value: 'pulse', label: 'Pulso' }, { value: 'bars', label: 'Barras' }]} />
    <div className="flex flex-wrap gap-4">
      <BoolField label="Auto-avançar" value={block.autoAdvance} onChange={(v) => onChange({ ...block, autoAdvance: v })} />
      <BoolField label="Mostrar progresso" value={block.showProgress} onChange={(v) => onChange({ ...block, showProgress: v })} />
      <BoolField label="Rotacionar mensagens" value={block.rotateMessages} onChange={(v) => onChange({ ...block, rotateMessages: v })} />
    </div>
    {/* Loading messages */}
    {Array.isArray(block.loadingMessages) && (
      <div className="space-y-1">
        <Label className="text-xs">Mensagens rotativas</Label>
        {block.loadingMessages.map((msg: string, i: number) => (
          <Input key={i} className="h-7 text-xs" value={msg} onChange={(e) => {
            const msgs = [...block.loadingMessages]; msgs[i] = e.target.value;
            onChange({ ...block, loadingMessages: msgs });
          }} />
        ))}
      </div>
    )}
  </div>
);

const CountdownEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Modo" value={block.mode} onChange={(v) => onChange({ ...block, mode: v })}
        options={[{ value: 'duration', label: 'Duração' }, { value: 'date', label: 'Data alvo' }]} />
      <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
        options={[{ value: 'default', label: 'Padrão' }, { value: 'minimal', label: 'Minimal' }, { value: 'bold', label: 'Bold' }, { value: 'card', label: 'Card' }, { value: 'flip', label: 'Flip' }]} />
    </div>
    <NumberField label="Duração (segundos)" value={block.duration} onChange={(v) => onChange({ ...block, duration: v })} min={1} />
    <StringField label="Mensagem ativa" value={block.activeMessage} onChange={(v) => onChange({ ...block, activeMessage: v })} />
    <StringField label="Mensagem expiração" value={block.expiryMessage} onChange={(v) => onChange({ ...block, expiryMessage: v })} />
    <SelectField label="Ação expiração" value={block.expiryAction} onChange={(v) => onChange({ ...block, expiryAction: v })}
      options={[{ value: 'none', label: 'Nenhuma' }, { value: 'hide', label: 'Esconder' }, { value: 'redirect', label: 'Redirecionar' }]} />
    {block.expiryAction === 'redirect' && (
      <StringField label="URL redirecionamento" value={block.redirectUrl} onChange={(v) => onChange({ ...block, redirectUrl: v })} />
    )}
  </div>
);

const ProgressEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
        options={[{ value: 'bar', label: 'Barra' }, { value: 'steps', label: 'Passos' }, { value: 'circle', label: 'Círculo' }, { value: 'percentage', label: 'Porcentagem' }]} />
      <SelectField label="Altura" value={block.height} onChange={(v) => onChange({ ...block, height: v })}
        options={[{ value: 'thin', label: 'Fina' }, { value: 'medium', label: 'Média' }, { value: 'thick', label: 'Grossa' }]} />
    </div>
    <StringField label="Label" value={block.label} onChange={(v) => onChange({ ...block, label: v })} />
    <div className="flex flex-wrap gap-4">
      <BoolField label="Mostrar %" value={block.showPercentage} onChange={(v) => onChange({ ...block, showPercentage: v })} />
      <BoolField label="Animada" value={block.animated} onChange={(v) => onChange({ ...block, animated: v })} />
      <BoolField label="Cor por faixa" value={block.colorByRange} onChange={(v) => onChange({ ...block, colorByRange: v })} />
    </div>
  </div>
);

const TestimonialEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Citação" value={block.quote} onChange={(v) => onChange({ ...block, quote: v })} multiline />
    <div className="grid grid-cols-2 gap-3">
      <StringField label="Nome" value={block.authorName} onChange={(v) => onChange({ ...block, authorName: v })} />
      <StringField label="Cargo" value={block.authorRole} onChange={(v) => onChange({ ...block, authorRole: v })} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <StringField label="Empresa" value={block.authorCompany} onChange={(v) => onChange({ ...block, authorCompany: v })} />
      <StringField label="Imagem" value={block.authorImage} onChange={(v) => onChange({ ...block, authorImage: v })} placeholder="URL..." />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <NumberField label="Avaliação (1-5)" value={block.rating} onChange={(v) => onChange({ ...block, rating: v })} min={1} max={5} />
      <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
        options={[{ value: 'default', label: 'Padrão' }, { value: 'minimal', label: 'Minimal' }, { value: 'card', label: 'Card' }, { value: 'quote', label: 'Citação' }]} />
    </div>
    <BoolField label="Mostrar estrelas" value={block.showRating} onChange={(v) => onChange({ ...block, showRating: v })} />
  </div>
);

const SliderEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Label" value={block.label} onChange={(v) => onChange({ ...block, label: v })} />
    <div className="grid grid-cols-3 gap-3">
      <NumberField label="Mínimo" value={block.min} onChange={(v) => onChange({ ...block, min: v })} />
      <NumberField label="Máximo" value={block.max} onChange={(v) => onChange({ ...block, max: v })} />
      <NumberField label="Passo" value={block.step} onChange={(v) => onChange({ ...block, step: v })} min={1} />
    </div>
    <StringField label="Unidade" value={block.unit} onChange={(v) => onChange({ ...block, unit: v })} placeholder="Ex: kg, %, R$" />
    <div className="grid grid-cols-2 gap-3">
      <StringField label="Label mínimo" value={block.minLabel} onChange={(v) => onChange({ ...block, minLabel: v })} />
      <StringField label="Label máximo" value={block.maxLabel} onChange={(v) => onChange({ ...block, maxLabel: v })} />
    </div>
    <div className="flex flex-wrap gap-4">
      <BoolField label="Mostrar valor" value={block.showValue} onChange={(v) => onChange({ ...block, showValue: v })} />
      <BoolField label="Obrigatório" value={block.required} onChange={(v) => onChange({ ...block, required: v })} />
    </div>
  </div>
);

const NPSEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Pergunta" value={block.question} onChange={(v) => onChange({ ...block, question: v })} />
    <div className="grid grid-cols-2 gap-3">
      <StringField label="Label baixo (0)" value={block.lowLabel} onChange={(v) => onChange({ ...block, lowLabel: v })} placeholder="Muito ruim" />
      <StringField label="Label alto (10)" value={block.highLabel} onChange={(v) => onChange({ ...block, highLabel: v })} placeholder="Excelente" />
    </div>
    <div className="flex flex-wrap gap-4">
      <BoolField label="Mostrar labels" value={block.showLabels} onChange={(v) => onChange({ ...block, showLabels: v })} />
      <BoolField label="Comentário" value={block.showComment} onChange={(v) => onChange({ ...block, showComment: v })} />
      <BoolField label="Obrigatório" value={block.required} onChange={(v) => onChange({ ...block, required: v })} />
    </div>
  </div>
);

const TextInputEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Label" value={block.label} onChange={(v) => onChange({ ...block, label: v })} />
    <StringField label="Placeholder" value={block.placeholder} onChange={(v) => onChange({ ...block, placeholder: v })} />
    <div className="grid grid-cols-2 gap-3">
      <NumberField label="Máx caracteres" value={block.maxLength} onChange={(v) => onChange({ ...block, maxLength: v })} min={1} />
      <SelectField label="Validação" value={block.validation} onChange={(v) => onChange({ ...block, validation: v })}
        options={[{ value: 'none', label: 'Nenhuma' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Telefone' }, { value: 'number', label: 'Número' }, { value: 'cpf', label: 'CPF' }, { value: 'cnpj', label: 'CNPJ' }]} />
    </div>
    <div className="flex flex-wrap gap-4">
      <BoolField label="Multilinha" value={block.multiline} onChange={(v) => onChange({ ...block, multiline: v })} />
      <BoolField label="Obrigatório" value={block.required} onChange={(v) => onChange({ ...block, required: v })} />
    </div>
  </div>
);

const PriceEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <StringField label="Nome do plano" value={block.planName} onChange={(v) => onChange({ ...block, planName: v })} />
      <StringField label="Preço" value={block.price} onChange={(v) => onChange({ ...block, price: v })} />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <StringField label="Moeda" value={block.currency} onChange={(v) => onChange({ ...block, currency: v })} placeholder="R$" />
      <StringField label="Período" value={block.period} onChange={(v) => onChange({ ...block, period: v })} placeholder="/mês" />
      <StringField label="Preço original" value={block.originalPrice} onChange={(v) => onChange({ ...block, originalPrice: v })} />
    </div>
    <StringField label="Desconto" value={block.discount} onChange={(v) => onChange({ ...block, discount: v })} />
    <StringField label="URL do botão" value={block.buttonUrl} onChange={(v) => onChange({ ...block, buttonUrl: v })} />
    <StringField label="Texto do botão" value={block.buttonText} onChange={(v) => onChange({ ...block, buttonText: v })} />
    <BoolField label="Destacado" value={block.highlighted} onChange={(v) => onChange({ ...block, highlighted: v })} />
  </div>
);

const AccordionEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Título" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
    <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
      options={[{ value: 'default', label: 'Padrão' }, { value: 'minimal', label: 'Minimal' }, { value: 'bordered', label: 'Bordado' }]} />
    <BoolField label="Permitir múltiplos abertos" value={block.allowMultiple} onChange={(v) => onChange({ ...block, allowMultiple: v })} />
    {Array.isArray(block.items) && (
      <div className="space-y-2">
        <Label className="text-xs font-medium">Itens FAQ ({block.items.length})</Label>
        {block.items.map((item: any, i: number) => (
          <div key={i} className="space-y-1 p-2 border rounded">
            <Input className="h-7 text-xs" placeholder="Pergunta" value={item.question || ''} onChange={(e) => {
              const items = [...block.items]; items[i] = { ...item, question: e.target.value };
              onChange({ ...block, items });
            }} />
            <Textarea className="min-h-[40px] text-xs" placeholder="Resposta" value={item.answer || ''} onChange={(e) => {
              const items = [...block.items]; items[i] = { ...item, answer: e.target.value };
              onChange({ ...block, items });
            }} />
          </div>
        ))}
      </div>
    )}
  </div>
);

const CalloutEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Título" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
    <SelectField label="Variante" value={block.variant} onChange={(v) => onChange({ ...block, variant: v })}
      options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Aviso' }, { value: 'success', label: 'Sucesso' }, { value: 'error', label: 'Erro' }]} />
    <StringField label="Nota de rodapé" value={block.footnote} onChange={(v) => onChange({ ...block, footnote: v })} />
    <BoolField label="Dispensável" value={block.dismissible} onChange={(v) => onChange({ ...block, dismissible: v })} />
    {Array.isArray(block.items) && (
      <div className="space-y-1">
        <Label className="text-xs">Itens</Label>
        {block.items.map((item: string, i: number) => (
          <Input key={i} className="h-7 text-xs" value={item} onChange={(e) => {
            const items = [...block.items]; items[i] = e.target.value;
            onChange({ ...block, items });
          }} />
        ))}
      </div>
    )}
  </div>
);

const SeparatorEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
        options={[{ value: 'line', label: 'Linha' }, { value: 'dots', label: 'Pontos' }, { value: 'dashes', label: 'Tracejado' }, { value: 'space', label: 'Espaço' }]} />
      <SelectField label="Espessura" value={block.thickness} onChange={(v) => onChange({ ...block, thickness: v })}
        options={[{ value: 'thin', label: 'Fina' }, { value: 'medium', label: 'Média' }, { value: 'thick', label: 'Grossa' }]} />
    </div>
  </div>
);

const EmbedEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="URL" value={block.url} onChange={(v) => onChange({ ...block, url: v })} placeholder="https://..." />
    <StringField label="HTML embed" value={block.html} onChange={(v) => onChange({ ...block, html: v })} multiline />
  </div>
);

const QuoteEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Texto" value={block.text} onChange={(v) => onChange({ ...block, text: v })} multiline />
    <StringField label="Autor" value={block.author} onChange={(v) => onChange({ ...block, author: v })} />
    <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
      options={[{ value: 'default', label: 'Padrão' }, { value: 'large', label: 'Grande' }, { value: 'minimal', label: 'Minimal' }]} />
  </div>
);

const BannerEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Texto" value={block.text} onChange={(v) => onChange({ ...block, text: v })} />
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Variante" value={block.variant} onChange={(v) => onChange({ ...block, variant: v })}
        options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Aviso' }, { value: 'success', label: 'Sucesso' }, { value: 'promo', label: 'Promo' }]} />
      <StringField label="URL link" value={block.linkUrl} onChange={(v) => onChange({ ...block, linkUrl: v })} />
    </div>
    <BoolField label="Dispensável" value={block.dismissible} onChange={(v) => onChange({ ...block, dismissible: v })} />
  </div>
);

const AnimatedCounterEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-3 gap-3">
      <NumberField label="Valor inicial" value={block.startValue} onChange={(v) => onChange({ ...block, startValue: v })} />
      <NumberField label="Valor final" value={block.endValue} onChange={(v) => onChange({ ...block, endValue: v })} />
      <NumberField label="Duração (s)" value={block.duration} onChange={(v) => onChange({ ...block, duration: v })} min={1} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <StringField label="Prefixo" value={block.prefix} onChange={(v) => onChange({ ...block, prefix: v })} placeholder="R$" />
      <StringField label="Sufixo" value={block.suffix} onChange={(v) => onChange({ ...block, suffix: v })} placeholder="%" />
    </div>
    <StringField label="Label" value={block.label} onChange={(v) => onChange({ ...block, label: v })} />
    <SelectField label="Easing" value={block.easing} onChange={(v) => onChange({ ...block, easing: v })}
      options={[{ value: 'linear', label: 'Linear' }, { value: 'easeOut', label: 'Ease Out' }, { value: 'easeInOut', label: 'Ease In/Out' }]} />
  </div>
);

const ComparisonEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <StringField label="Título esquerda" value={block.leftTitle} onChange={(v) => onChange({ ...block, leftTitle: v })} />
      <StringField label="Título direita" value={block.rightTitle} onChange={(v) => onChange({ ...block, rightTitle: v })} />
    </div>
    <BoolField label="Mostrar ícones" value={block.showIcons} onChange={(v) => onChange({ ...block, showIcons: v })} />
    <SelectField label="Destacar" value={block.highlightWinner} onChange={(v) => onChange({ ...block, highlightWinner: v })}
      options={[{ value: 'none', label: 'Nenhum' }, { value: 'left', label: 'Esquerda' }, { value: 'right', label: 'Direita' }]} />
  </div>
);

const RatingEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Label" value={block.label} onChange={(v) => onChange({ ...block, label: v })} />
    <div className="grid grid-cols-2 gap-3">
      <NumberField label="Max estrelas" value={block.maxStars} onChange={(v) => onChange({ ...block, maxStars: v })} min={1} max={10} />
      <SelectField label="Tamanho" value={block.size} onChange={(v) => onChange({ ...block, size: v })}
        options={[{ value: 'sm', label: 'Pequeno' }, { value: 'md', label: 'Médio' }, { value: 'lg', label: 'Grande' }, { value: 'xl', label: 'Extra Grande' }]} />
    </div>
    <div className="flex flex-wrap gap-4">
      <BoolField label="Mostrar valor" value={block.showValue} onChange={(v) => onChange({ ...block, showValue: v })} />
      <BoolField label="Meias estrelas" value={block.halfStars} onChange={(v) => onChange({ ...block, halfStars: v })} />
      <BoolField label="Obrigatório" value={block.required} onChange={(v) => onChange({ ...block, required: v })} />
    </div>
  </div>
);

const AnswerSummaryEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Título" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
    <StringField label="Subtítulo" value={block.subtitle} onChange={(v) => onChange({ ...block, subtitle: v })} />
    <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
      options={[{ value: 'card', label: 'Card' }, { value: 'list', label: 'Lista' }, { value: 'minimal', label: 'Minimal' }]} />
    <div className="flex flex-wrap gap-4">
      <BoolField label="Mostrar texto pergunta" value={block.showQuestionText} onChange={(v) => onChange({ ...block, showQuestionText: v })} />
      <BoolField label="Mostrar ícone" value={block.showIcon} onChange={(v) => onChange({ ...block, showIcon: v })} />
      <BoolField label="Botão copiar" value={block.showCopyButton} onChange={(v) => onChange({ ...block, showCopyButton: v })} />
    </div>
  </div>
);

const SocialProofEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <NumberField label="Intervalo (ms)" value={block.interval} onChange={(v) => onChange({ ...block, interval: v })} min={1000} step={500} />
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Estilo" value={block.style} onChange={(v) => onChange({ ...block, style: v })}
        options={[{ value: 'toast', label: 'Toast' }, { value: 'banner', label: 'Banner' }, { value: 'floating', label: 'Flutuante' }]} />
      <SelectField label="Posição" value={block.position} onChange={(v) => onChange({ ...block, position: v })}
        options={[{ value: 'bottom-left', label: 'Inferior esq.' }, { value: 'bottom-right', label: 'Inferior dir.' }, { value: 'top-left', label: 'Superior esq.' }, { value: 'top-right', label: 'Superior dir.' }]} />
    </div>
    <BoolField label="Mostrar avatar" value={block.showAvatar} onChange={(v) => onChange({ ...block, showAvatar: v })} />
    {Array.isArray(block.notifications) && (
      <div className="space-y-2">
        <Label className="text-xs font-medium">Notificações ({block.notifications.length})</Label>
        {block.notifications.map((n: any, i: number) => (
          <div key={i} className="grid grid-cols-3 gap-1">
            <Input className="h-7 text-xs" placeholder="Nome" value={n.name || ''} onChange={(e) => {
              const ns = [...block.notifications]; ns[i] = { ...n, name: e.target.value };
              onChange({ ...block, notifications: ns });
            }} />
            <Input className="h-7 text-xs" placeholder="Ação" value={n.action || ''} onChange={(e) => {
              const ns = [...block.notifications]; ns[i] = { ...n, action: e.target.value };
              onChange({ ...block, notifications: ns });
            }} />
            <Input className="h-7 text-xs" placeholder="Tempo" value={n.time || ''} onChange={(e) => {
              const ns = [...block.notifications]; ns[i] = { ...n, time: e.target.value };
              onChange({ ...block, notifications: ns });
            }} />
          </div>
        ))}
      </div>
    )}
  </div>
);

const CalculatorEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => (
  <div className="space-y-3">
    <StringField label="Fórmula" value={block.formula} onChange={(v) => onChange({ ...block, formula: v })} placeholder="Ex: (a * b) / 100" />
    <div className="grid grid-cols-3 gap-3">
      <StringField label="Unidade resultado" value={block.resultUnit} onChange={(v) => onChange({ ...block, resultUnit: v })} />
      <StringField label="Prefixo" value={block.resultPrefix} onChange={(v) => onChange({ ...block, resultPrefix: v })} />
      <NumberField label="Decimais" value={block.decimalPlaces} onChange={(v) => onChange({ ...block, decimalPlaces: v })} min={0} max={4} />
    </div>
    <StringField label="Label resultado" value={block.resultLabel} onChange={(v) => onChange({ ...block, resultLabel: v })} />
    <BoolField label="Mostrar gauge" value={block.showGauge} onChange={(v) => onChange({ ...block, showGauge: v })} />
  </div>
);

// ── Registry mapping type → editor component ──
const BLOCK_EDITORS: Record<string, (props: { block: any; onChange: (b: any) => void }) => JSX.Element> = {
  question: QuestionEditor,
  text: TextEditor,
  image: ImageEditor,
  video: VideoEditor,
  audio: AudioEditor,
  button: ButtonEditor,
  loading: LoadingEditor,
  countdown: CountdownEditor,
  progress: ProgressEditor,
  testimonial: TestimonialEditor,
  slider: SliderEditor,
  nps: NPSEditor,
  textInput: TextInputEditor,
  price: PriceEditor,
  accordion: AccordionEditor,
  callout: CalloutEditor,
  separator: SeparatorEditor,
  embed: EmbedEditor,
  quote: QuoteEditor,
  banner: BannerEditor,
  animatedCounter: AnimatedCounterEditor,
  comparison: ComparisonEditor,
  rating: RatingEditor,
  answerSummary: AnswerSummaryEditor,
  socialProof: SocialProofEditor,
  calculator: CalculatorEditor,
};

// ── JSON Fallback ──
const JsonFallbackEditor = ({ block, onChange }: { block: any; onChange: (b: any) => void }) => {
  const { id, type, order, ...editableFields } = block;
  const [json, setJson] = useState(JSON.stringify(editableFields, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(json);
      onChange({ ...block, ...parsed });
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Code className="h-3.5 w-3.5 text-muted-foreground" />
        <Label className="text-xs text-muted-foreground">Editor JSON (tipo: {type})</Label>
      </div>
      <Textarea
        value={json}
        onChange={(e) => { setJson(e.target.value); setError(null); }}
        className="min-h-[120px] text-xs font-mono"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" variant="outline" onClick={handleApply} className="h-7 text-xs">
        Aplicar JSON
      </Button>
    </div>
  );
};

// ── Main Component ──
export const SupportBlockEditor = ({ block, blockIndex, onBlockChange }: SupportBlockEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const Editor = BLOCK_EDITORS[block.type];
  const blockLabel = block.type.charAt(0).toUpperCase() + block.type.slice(1);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors">
          <Badge variant="secondary" className="text-[10px] shrink-0">{blockIndex + 1}</Badge>
          <Badge variant={Editor ? 'default' : 'outline'} className="text-[10px]">{block.type}</Badge>
          <span className="text-xs text-muted-foreground flex-1 truncate">
            {block.questionText || block.content || block.text || block.url || block.label || block.title || block.quote || block.formula || blockLabel}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-1 border-dashed">
          <CardContent className="p-3">
            {Editor ? (
              <Editor block={block} onChange={onBlockChange} />
            ) : (
              <JsonFallbackEditor block={block} onChange={onBlockChange} />
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
