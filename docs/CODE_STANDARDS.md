# 📐 CODE STANDARDS — Padrões Obrigatórios de Código

> MasterQuiz — Regras, convenções e exemplos do/don't
> Versão 2.41.0 | 15 de Abril de 2026

---

## 📋 Índice

- [Princípios Gerais](#princípios-gerais)
- [TypeScript](#typescript)
- [React Patterns](#react-patterns)
- [State Management](#state-management)
- [Naming Conventions](#naming-conventions)
- [File Structure](#file-structure)
- [CSS e Tailwind](#css-e-tailwind)
- [Edge Functions](#edge-functions)
- [Do / Don't](#do--dont)

---

## 🎯 Princípios Gerais

1. **TypeScript strict** — Evitar `any`, tipar explicitamente
2. **Componentes pequenos** — Extrair hooks e utilitários
3. **TanStack Query** — Para toda comunicação com servidor
4. **Logger** — Nunca `console.log`, usar `logger` de `@/lib/logger`
5. **i18n** — Nenhuma string de UI hardcoded
6. **Tokens semânticos** — Cores via CSS variables, nunca hardcoded

---

## 📝 TypeScript

### ✅ Do
```typescript
// Tipagem explícita
interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

// Union types ao invés de string genérico
type BlockType = 'question' | 'text' | 'image' | 'countdown';

// Generics quando necessário
function useQueryData<T>(key: string): T | undefined { ... }
```

### ❌ Don't
```typescript
// NUNCA usar any
const data: any = await fetch(...); // ❌

// NUNCA tipar como object genérico
function process(input: object) { ... } // ❌

// NUNCA ignorar erros de tipo com @ts-ignore
// @ts-ignore // ❌
```

---

## ⚛️ React Patterns

### Thin Router Pattern
```typescript
// ✅ CreateQuiz.tsx — THIN ROUTER (sem hooks pesados)
const CreateQuizClassic = React.lazy(() => import('./CreateQuizClassic'));
const CreateQuizModern = React.lazy(() => import('./CreateQuizModern'));

export default function CreateQuiz() {
  const { layout } = useEditorLayout();
  return (
    <Suspense fallback={<Loading />}>
      {layout === 'modern' ? <CreateQuizModern /> : <CreateQuizClassic />}
    </Suspense>
  );
}
```

### Lazy Loading
```typescript
// ✅ Componentes pesados carregados sob demanda
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));
const Analytics = React.lazy(() => import('./Analytics'));

// ❌ NUNCA importar componentes pesados diretamente em rotas
import AdminDashboard from './AdminDashboard'; // ❌
```

### Custom Hooks
```typescript
// ✅ Extrair lógica em hooks
function useQuizSave(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: QuizData) => saveQuiz(quizId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quiz', quizId] }),
  });
}

// ❌ NUNCA colocar lógica de fetch em componentes
useEffect(() => {
  fetch('/api/quiz').then(r => r.json()).then(setData); // ❌
}, []);
```

---

## 🗃️ State Management

| Tipo de Estado | Solução | Exemplo |
|---------------|---------|---------|
| Server state | TanStack Query | Quizzes, responses, profiles |
| Auth state | React Context (AuthContext) | User, session |
| Support mode | React Context (SupportModeContext) | Target, actions |
| Form state | react-hook-form + zod | Login, quiz editor |
| URL state | React Router (useParams, useSearchParams) | Quiz ID, tab ativa |
| Local UI state | useState | Modal aberto, accordion |

### ❌ Don't
```typescript
// NUNCA reinventar cache de servidor
const [quizzes, setQuizzes] = useState([]); // ❌
useEffect(() => { fetchQuizzes().then(setQuizzes); }, []); // ❌

// ✅ Usar TanStack Query
const { data: quizzes } = useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });
```

---

## 📛 Naming Conventions

| Item | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos de componente | PascalCase | `QuizEditor.tsx` |
| Arquivos de hook | camelCase com `use` | `useQuizState.ts` |
| Arquivos de util | camelCase | `calculatorEngine.ts` |
| Variáveis/funções | camelCase (inglês) | `handleSave`, `quizData` |
| Tipos/Interfaces | PascalCase | `QuizTemplate`, `BlockType` |
| Constantes | UPPER_SNAKE | `MAX_QUIZ_LIMIT` |
| CSS classes | kebab-case (Tailwind) | `bg-primary text-foreground` |
| Edge Functions | kebab-case | `generate-quiz-ai` |
| DB tables | snake_case | `quiz_questions` |
| Comentários | Português (quando necessário) | `// Verifica permissão` |

---

## 📁 File Structure

```
src/components/
├── ui/           # Primitives (shadcn) — NUNCA lógica de negócio
├── quiz/         # Domínio quiz (editor, view, blocks)
├── admin/        # Domínio admin (users, templates, recovery)
├── landing/      # Landing page
├── crm/          # CRM e gestão de leads
├── analytics/    # Dashboards de métricas
├── notifications/ # NotificationBell
└── video/        # Player de vídeo

src/hooks/        # Custom hooks reutilizáveis
src/lib/          # Utilitários puros (sem React)
src/types/        # Tipos compartilhados
src/contexts/     # React Contexts
src/pages/        # Rotas (componentes de página)
```

---

## 🎨 CSS e Tailwind

### ✅ Do
```tsx
// Usar tokens semânticos
<div className="bg-background text-foreground border-border">
<Button className="bg-primary text-primary-foreground">

// Definir tokens em index.css
:root {
  --primary: 160 84% 39%;
}
```

### ❌ Don't
```tsx
// NUNCA hardcodar cores
<div className="bg-white text-black"> // ❌
<div className="bg-[#2ecc71]"> // ❌
<div style={{ color: 'red' }}> // ❌
```

---

## ⚡ Edge Functions

### Estrutura padrão
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verificar auth
    // 2. Validar input
    // 3. Processar lógica
    // 4. Retornar resposta padronizada
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### GTM Events (OBRIGATÓRIO v2.41.0)
```typescript
// ✅ Sempre usar pushGTMEvent para eventos
import { pushGTMEvent } from '@/lib/gtmLogger';
pushGTMEvent('QuizShared', { quizId, method: 'link' });

// ❌ NUNCA usar dataLayer.push diretamente
window.dataLayer?.push({ event: 'QuizShared' }); // ❌

// ❌ NUNCA criar hooks dedicados para eventos simples
// Use pushGTMEvent inline no handler
```

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Formatação e linting |
| [SECURITY.md](./SECURITY.md) | Padrões de segurança |
| [TESTING.md](./TESTING.md) | Padrões de testes |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo das 64 Edge Functions |
| [ADR.md](./ADR.md) | ADR-010: Centralização GTM |
