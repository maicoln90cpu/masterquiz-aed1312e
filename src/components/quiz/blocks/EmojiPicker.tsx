import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { EMOJI_CATEGORIES, EmojiCategoryKey } from '@/lib/constants';
import { Smile, X, Search } from 'lucide-react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const CATEGORY_LABELS: Record<EmojiCategoryKey, string> = {
  popular: '⭐',
  expressions: '😊',
  business: '💼',
  lifestyle: '🏠',
  health: '💪',
  education: '📚',
  food: '🍕',
  nature: '🌿',
  gestures: '👋',
  sports: '⚽',
  symbols: '🔢',
};

const CATEGORY_NAMES: Record<EmojiCategoryKey, string> = {
  popular: 'Popular',
  expressions: 'Expressões',
  business: 'Negócios',
  lifestyle: 'Lifestyle',
  health: 'Saúde',
  education: 'Educação',
  food: 'Comida',
  nature: 'Natureza',
  gestures: 'Gestos',
  sports: 'Esportes',
  symbols: 'Símbolos',
};

// Search tags for each emoji (PT-BR + EN keywords)
const EMOJI_SEARCH_TAGS: Record<string, string[]> = {
  '✅': ['check', 'sim', 'ok', 'correto', 'verde', 'yes', 'correct'],
  '❌': ['errado', 'nao', 'no', 'wrong', 'x', 'fechar', 'close'],
  '⭐': ['estrela', 'star', 'favorito', 'favorite', 'rating'],
  '💡': ['ideia', 'idea', 'luz', 'light', 'dica', 'tip', 'lampada'],
  '🎯': ['alvo', 'target', 'meta', 'goal', 'objetivo', 'foco', 'focus'],
  '🔥': ['fogo', 'fire', 'hot', 'quente', 'popular', 'trending'],
  '💪': ['forte', 'strong', 'forca', 'muscle', 'poder', 'power'],
  '❤️': ['coracao', 'heart', 'amor', 'love', 'vermelho', 'red'],
  '👍': ['legal', 'like', 'positivo', 'bom', 'good', 'thumbs up'],
  '👎': ['negativo', 'ruim', 'bad', 'dislike', 'thumbs down'],
  '😊': ['feliz', 'happy', 'sorriso', 'smile', 'alegre'],
  '😃': ['sorriso', 'smile', 'feliz', 'happy', 'alegria'],
  '😎': ['cool', 'legal', 'oculos', 'sunglasses', 'confiante'],
  '🤔': ['pensando', 'thinking', 'duvida', 'doubt', 'hmm'],
  '😍': ['apaixonado', 'love', 'coracao', 'olhos', 'adorei'],
  '🥳': ['festa', 'party', 'celebrar', 'celebrate', 'comemoracao'],
  '😅': ['nervoso', 'suor', 'sweat', 'aliviado', 'relieved'],
  '🤩': ['incrivel', 'amazing', 'estrelas', 'stars', 'wow'],
  '😂': ['rindo', 'laugh', 'engracado', 'funny', 'lol', 'risada'],
  '🙌': ['maos', 'hands', 'celebrar', 'celebrate', 'yay'],
  '📊': ['grafico', 'chart', 'dados', 'data', 'estatistica', 'stats'],
  '📈': ['crescimento', 'growth', 'subindo', 'up', 'trending'],
  '💼': ['trabalho', 'work', 'negocios', 'business', 'maleta'],
  '💰': ['dinheiro', 'money', 'rico', 'rich', 'financas', 'finance'],
  '🏆': ['trofeu', 'trophy', 'campeao', 'winner', 'premio', 'award'],
  '📝': ['nota', 'note', 'escrever', 'write', 'lista', 'list'],
  '💎': ['diamante', 'diamond', 'premium', 'valor', 'value', 'joia'],
  '🚀': ['foguete', 'rocket', 'lancamento', 'launch', 'rapido', 'fast'],
  '📱': ['celular', 'phone', 'mobile', 'app', 'smartphone'],
  '💻': ['computador', 'computer', 'laptop', 'tech', 'tecnologia'],
  '🏠': ['casa', 'home', 'house', 'lar', 'moradia'],
  '🌴': ['palmeira', 'palm', 'praia', 'beach', 'ferias', 'vacation'],
  '✈️': ['aviao', 'plane', 'viagem', 'travel', 'voo', 'flight'],
  '🎉': ['festa', 'party', 'celebrar', 'celebrate', 'confete'],
  '🌿': ['planta', 'plant', 'natureza', 'nature', 'verde', 'green'],
  '🌈': ['arco iris', 'rainbow', 'cores', 'colors', 'diversidade'],
  '☀️': ['sol', 'sun', 'verao', 'summer', 'dia', 'day', 'quente'],
  '🌙': ['lua', 'moon', 'noite', 'night', 'dormir', 'sleep'],
  '🎁': ['presente', 'gift', 'surpresa', 'surprise', 'bonus'],
  '🎊': ['confete', 'confetti', 'celebrar', 'celebrate', 'festa'],
  '🥗': ['salada', 'salad', 'saudavel', 'healthy', 'dieta', 'diet'],
  '🏃': ['corrida', 'run', 'exercicio', 'exercise', 'esporte', 'sport'],
  '🧘': ['yoga', 'meditacao', 'meditation', 'relaxar', 'relax', 'calma'],
  '💊': ['remedio', 'medicine', 'saude', 'health', 'pilula', 'pill'],
  '🩺': ['medico', 'doctor', 'saude', 'health', 'consulta'],
  '🧠': ['cerebro', 'brain', 'mente', 'mind', 'inteligencia'],
  '💤': ['sono', 'sleep', 'dormir', 'cansado', 'tired', 'descanso'],
  '🍎': ['maca', 'apple', 'fruta', 'fruit', 'saudavel', 'healthy'],
  '💧': ['agua', 'water', 'gota', 'drop', 'hidratacao', 'hydration'],
  '🌟': ['brilho', 'shine', 'destaque', 'spotlight', 'especial'],
  '📖': ['livro', 'book', 'leitura', 'reading', 'estudo', 'study'],
  '🎓': ['formatura', 'graduation', 'diploma', 'educacao', 'education'],
  '✏️': ['lapis', 'pencil', 'escrever', 'write', 'editar', 'edit'],
  '🎨': ['arte', 'art', 'pintura', 'paint', 'criativo', 'creative'],
  '🔬': ['ciencia', 'science', 'pesquisa', 'research', 'microscopio'],
  '🛠️': ['ferramenta', 'tool', 'construir', 'build', 'consertar', 'fix'],
  '📚': ['livros', 'books', 'biblioteca', 'library', 'estudo', 'study'],
  '🧪': ['experimento', 'experiment', 'quimica', 'chemistry', 'teste'],
  '🔍': ['busca', 'search', 'lupa', 'magnifier', 'procurar', 'find'],
  '💭': ['pensamento', 'thought', 'balao', 'bubble', 'ideia', 'idea'],
  '🍕': ['pizza', 'comida', 'food', 'italiano', 'italian'],
  '🍔': ['hamburguer', 'burger', 'lanche', 'snack', 'fast food'],
  '🥤': ['bebida', 'drink', 'suco', 'juice', 'refrigerante', 'soda'],
  '☕': ['cafe', 'coffee', 'quente', 'hot', 'bebida', 'drink'],
  '🍷': ['vinho', 'wine', 'bebida', 'drink', 'elegante'],
  '🎂': ['bolo', 'cake', 'aniversario', 'birthday', 'doce', 'sweet'],
  '🍿': ['pipoca', 'popcorn', 'cinema', 'movie', 'filme'],
  '🍦': ['sorvete', 'ice cream', 'doce', 'sweet', 'gelado'],
  '🥑': ['abacate', 'avocado', 'saudavel', 'healthy', 'verde'],
  '🍳': ['ovo', 'egg', 'cafe manha', 'breakfast', 'cozinhar', 'cook'],
  '🌸': ['flor', 'flower', 'cerejeira', 'cherry blossom', 'primavera'],
  '🌺': ['hibisco', 'hibiscus', 'flor', 'flower', 'tropical'],
  '🌻': ['girassol', 'sunflower', 'flor', 'flower', 'amarelo', 'yellow'],
  '🍃': ['folha', 'leaf', 'vento', 'wind', 'natureza', 'nature'],
  '🌊': ['onda', 'wave', 'mar', 'sea', 'oceano', 'ocean', 'praia'],
  '⛰️': ['montanha', 'mountain', 'trilha', 'trail', 'aventura'],
  '🌲': ['pinheiro', 'pine', 'arvore', 'tree', 'floresta', 'forest'],
  '🦋': ['borboleta', 'butterfly', 'transformacao', 'transformation'],
  '🐾': ['pata', 'paw', 'animal', 'pet', 'cachorro', 'gato'],
  '🌍': ['mundo', 'world', 'terra', 'earth', 'planeta', 'global'],
  '1️⃣': ['um', 'one', 'numero', 'number', 'primeiro', 'first'],
  '2️⃣': ['dois', 'two', 'numero', 'number', 'segundo', 'second'],
  '3️⃣': ['tres', 'three', 'numero', 'number', 'terceiro', 'third'],
  '4️⃣': ['quatro', 'four', 'numero', 'number', 'quarto', 'fourth'],
  '5️⃣': ['cinco', 'five', 'numero', 'number', 'quinto', 'fifth'],
  '🅰️': ['a', 'letra', 'letter', 'opcao', 'option'],
  '🅱️': ['b', 'letra', 'letter', 'opcao', 'option'],
  '➡️': ['direita', 'right', 'seta', 'arrow', 'proximo', 'next'],
  '⬅️': ['esquerda', 'left', 'seta', 'arrow', 'voltar', 'back'],
  '🔄': ['atualizar', 'refresh', 'reload', 'loop', 'repetir', 'repeat'],
};

// Detect if a string contains an emoji character
const containsEmoji = (str: string): boolean => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;
  return emojiRegex.test(str);
};

// Extract first emoji from string
const extractEmoji = (str: string): string | null => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]*/u;
  const match = str.match(emojiRegex);
  return match ? match[0] : null;
};

export const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    // If user pastes an emoji directly, select it
    if (containsEmoji(val)) {
      const emoji = extractEmoji(val);
      if (emoji) {
        onChange(emoji);
        setOpen(false);
        setSearchQuery('');
      }
    }
  };

  // Filter emojis by search query
  const filteredEmojis = useMemo(() => {
    if (!searchQuery || containsEmoji(searchQuery)) return null;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;

    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    return allEmojis.filter(emoji => {
      const tags = EMOJI_SEARCH_TAGS[emoji];
      if (!tags) return false;
      return tags.some(tag => tag.includes(q));
    });
  }, [searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 text-lg relative shrink-0"
        >
          {value ? (
            <>
              <span className="text-xl">{value}</span>
              {value && (
                <span
                  onClick={handleClear}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-destructive/80"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </>
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Search / Paste input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cole emoji ou busque (ex: fogo, star)..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {filteredEmojis ? (
          // Show search results
          <ScrollArea className="h-48">
            <div className="p-2">
              {filteredEmojis.length > 0 ? (
                <div className="grid grid-cols-6 gap-1">
                  {filteredEmojis.map((emoji, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant={value === emoji ? 'secondary' : 'ghost'}
                      className="h-10 w-10 text-xl p-0 hover:bg-accent"
                      onClick={() => handleSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhum emoji encontrado para "{searchQuery}"
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          // Show categories
          <Tabs defaultValue="popular" className="w-full">
            <TabsList className="w-full grid grid-cols-11 h-10">
              {(Object.keys(EMOJI_CATEGORIES) as EmojiCategoryKey[]).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-lg px-2"
                  title={CATEGORY_NAMES[category]}
                >
                  {CATEGORY_LABELS[category]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <ScrollArea className="h-48">
              {(Object.keys(EMOJI_CATEGORIES) as EmojiCategoryKey[]).map((category) => (
                <TabsContent key={category} value={category} className="p-2 m-0">
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJI_CATEGORIES[category].map((emoji, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant={value === emoji ? 'secondary' : 'ghost'}
                        className="h-10 w-10 text-xl p-0 hover:bg-accent"
                        onClick={() => handleSelect(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        )}
        
        <div className="border-t p-2 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {filteredEmojis ? `${filteredEmojis.length} resultado(s)` : 'Selecione um emoji'}
          </span>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelect('')}
              className="text-xs h-7"
            >
              Remover
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
