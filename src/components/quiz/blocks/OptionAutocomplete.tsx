// ✅ Etapa 3: Autocomplete inteligente para opções de resposta
import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Banco de sugestões por categoria/contexto
const SUGGESTION_BANK: Record<string, string[]> = {
  satisfaction: [
    'Muito satisfeito', 'Satisfeito', 'Neutro', 'Insatisfeito', 'Muito insatisfeito',
    'Excelente', 'Bom', 'Regular', 'Ruim', 'Péssimo',
  ],
  frequency: [
    'Diariamente', 'Semanalmente', 'Mensalmente', 'Raramente', 'Nunca',
    'Sempre', 'Quase sempre', 'Às vezes', 'Quase nunca',
    '1 vez por semana', '2-3 vezes por semana', '4-5 vezes por semana', 'Todos os dias',
  ],
  agreement: [
    'Concordo totalmente', 'Concordo', 'Neutro', 'Discordo', 'Discordo totalmente',
    'Concordo parcialmente', 'Discordo parcialmente',
  ],
  priority: [
    'Muito importante', 'Importante', 'Moderadamente importante', 'Pouco importante', 'Não é importante',
    'Alta prioridade', 'Média prioridade', 'Baixa prioridade',
  ],
  likelihood: [
    'Muito provável', 'Provável', 'Talvez', 'Improvável', 'Muito improvável',
    'Com certeza', 'Provavelmente sim', 'Provavelmente não', 'De jeito nenhum',
  ],
  quantity: [
    'Nenhum', '1-2', '3-5', '6-10', 'Mais de 10',
    'Menos de 5', '5-10', '10-20', '20-50', 'Mais de 50',
  ],
  time: [
    'Menos de 1 mês', '1-3 meses', '3-6 meses', '6-12 meses', 'Mais de 1 ano',
    'Menos de 1 hora', '1-3 horas', '3-5 horas', 'Mais de 5 horas',
  ],
  budget: [
    'Até R$ 100', 'R$ 100-500', 'R$ 500-1.000', 'R$ 1.000-5.000', 'Acima de R$ 5.000',
    'Até R$ 50/mês', 'R$ 50-200/mês', 'R$ 200-500/mês', 'Acima de R$ 500/mês',
  ],
  age: [
    '18-24 anos', '25-34 anos', '35-44 anos', '45-54 anos', '55+ anos',
    'Menor de 18', '18-25', '26-35', '36-45', '46-55', '56+',
  ],
  experience: [
    'Iniciante', 'Intermediário', 'Avançado', 'Especialista',
    'Nenhuma experiência', 'Pouca experiência', 'Experiência moderada', 'Muita experiência',
  ],
  channel: [
    'Google', 'Instagram', 'Facebook', 'YouTube', 'TikTok', 'LinkedIn',
    'Indicação de amigo', 'Email', 'Blog/Artigo', 'Podcast', 'Outro',
  ],
  generic: [
    'Sim', 'Não', 'Talvez', 'Não sei', 'Outro',
    'Opção A', 'Opção B', 'Opção C', 'Opção D',
  ],
};

// Detectar categoria com base no texto da pergunta
function detectCategory(questionText: string): string[] {
  const text = questionText.toLowerCase();
  const matches: string[] = [];
  
  if (/satisf|experiência.*com|o que achou|avaliar|nota/i.test(text)) matches.push('satisfaction');
  if (/frequên|quantas vezes|com que frequên/i.test(text)) matches.push('frequency');
  if (/concord|opini|você acha/i.test(text)) matches.push('agreement');
  if (/importân|prioridad|relevân/i.test(text)) matches.push('priority');
  if (/probabilidad|prováv|chance|pretend/i.test(text)) matches.push('likelihood');
  if (/quant|número|quanto/i.test(text)) matches.push('quantity');
  if (/tempo|quando|há quanto|período|duração/i.test(text)) matches.push('time');
  if (/orçamento|budget|investir|gastar|preço|valor/i.test(text)) matches.push('budget');
  if (/idade|anos|faixa etária/i.test(text)) matches.push('age');
  if (/experiên|nível|conhecimento|habilidad/i.test(text)) matches.push('experience');
  if (/conhec|descobr|como soube|onde encontr|canal/i.test(text)) matches.push('channel');
  
  if (matches.length === 0) matches.push('generic');
  return matches;
}

interface OptionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  questionText: string;
  existingOptions: string[];
  placeholder?: string;
  className?: string;
}

export const OptionAutocomplete = ({
  value,
  onChange,
  questionText,
  existingOptions,
  placeholder = "Digite uma opção...",
  className,
}: OptionAutocompleteProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Gerar sugestões filtradas
  const suggestions = useMemo(() => {
    const categories = detectCategory(questionText);
    const allSuggestions = categories.flatMap(cat => SUGGESTION_BANK[cat] || []);
    
    // Remover duplicatas e opções já existentes
    const unique = [...new Set(allSuggestions)].filter(
      s => !existingOptions.some(opt => opt.toLowerCase() === s.toLowerCase())
    );
    
    // Filtrar por texto digitado
    if (value.trim()) {
      return unique.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
    }
    
    return unique.slice(0, 8);
  }, [questionText, existingOptions, value]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[focusedIndex]);
      setShowSuggestions(false);
      setFocusedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setFocusedIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                idx === focusedIndex && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(suggestion);
                setShowSuggestions(false);
                setFocusedIndex(-1);
              }}
              onMouseEnter={() => setFocusedIndex(idx)}
            >
              {suggestion}
            </button>
          ))}
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-t bg-muted/30">
            💡 Sugestões baseadas no contexto da pergunta
          </div>
        </div>
      )}
    </div>
  );
};
