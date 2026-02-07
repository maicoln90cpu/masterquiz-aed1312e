# 🏗️ System Design Document - MasterQuiz

> Plataforma de Funis de Auto-Convencimento — Documentação técnica de arquitetura
> Última atualização: 04 de Fevereiro de 2025 | Versão 2.25

**Conceito Central:** O MasterQuiz não é apenas um criador de quizzes — é um **condutor de decisão**. Através de perguntas estratégicas, o sistema revela dores ocultas, cria consciência e conduz leads a decidirem por conta própria que precisam da solução.

---

## 📋 Índice

- [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
- [Fluxo de Dados](#fluxo-de-dados)
- [Componentes Principais](#componentes-principais)
- [Sistema de Blocos](#sistema-de-blocos)
- [APIs e Edge Functions](#apis-e-edge-functions)
- [Algoritmos Críticos](#algoritmos-críticos)
- [Integrações Externas](#integrações-externas)
- [Segurança e RLS](#segurança-e-rls)
- [Performance](#performance)

---

## 🎯 Visão Geral da Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│  Pages        │  Components   │  Hooks          │  State            │
│  ─────────    │  ──────────   │  ─────          │  ─────            │
│  Index        │  quiz/*       │  useQuizState   │  TanStack Query   │
│  CreateQuiz   │  landing/*    │  useAutoSave    │  React Context    │
│  QuizView     │  admin/*      │  usePlanFeatures│  URL State        │
│  Dashboard    │  crm/*        │  useHistory     │                   │
│  CRM          │  analytics/*  │  useSubscription│                   │
└───────────────┴───────────────┴─────────────────┴───────────────────┘
                                   │
                                   │ HTTPS + JWT
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LOVABLE CLOUD (Supabase)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Auth           │  PostgreSQL      │  Edge Functions  │  Storage    │
│  ────           │  ──────────      │  ──────────────  │  ───────    │
│  JWT Sessions   │  RLS Policies    │  generate-quiz-ai│  quiz-media │
│  Email/Password │  Triggers        │  kiwify-webhook  │  (images)   │
│  Password Reset │  Functions       │  sync-integration│             │
└─────────────────┴──────────────────┴──────────────────┴─────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       INTEGRAÇÕES EXTERNAS                          │
├─────────────────────────────────────────────────────────────────────┤
│  Bunny CDN     │  Kiwify         │  CRMs            │  Marketing    │
│  ─────────     │  ──────         │  ────            │  ─────────    │
│  Video Storage │  Payments       │  HubSpot         │  Mailchimp    │
│  Global CDN    │  Webhooks       │  RD Station      │  ActiveCampaign│
│  Streaming     │  Subscriptions  │  Pipedrive       │  GTM/Pixel    │
└────────────────┴─────────────────┴──────────────────┴───────────────┘
```

### Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **State Management** | TanStack Query, React Context, useHistory (undo/redo) |
| **Routing** | React Router 6 |
| **i18n** | i18next (PT/EN/ES) |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| **CDN** | Bunny CDN (vídeos), Cloudflare (assets) |
| **Payments** | Kiwify |
| **Testes** | Vitest, Testing Library |

---

## 🔄 Fluxo de Dados

### 1. Criação de Quiz

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│ Template │───▶│ Quiz Editor  │───▶│  AutoSave   │───▶│  Supabase  │
│ Selector │    │ (5 Steps)    │    │ (30s debounce)│   │  Database  │
└──────────┘    └──────────────┘    └─────────────┘    └────────────┘
     │                │                    │
     │                ▼                    │
     │         ┌─────────────┐             │
     └────────▶│ AI Generator│─────────────┘
               │ (Gemini)    │
               └─────────────┘
```

**Steps do Editor:**
1. **Step 1** - Quantidade de perguntas (Slider)
2. **Step 2** - Aparência (título, descrição, template, logo)
3. **Step 3** - Configuração de perguntas (blocos, opções, scores)
4. **Step 4** - Formulário de coleta (nome, email, WhatsApp, campos custom)
5. **Step 5** - Resultados (always, score_range, calculator)

### 2. Resposta de Quiz (Público)

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│  Visitor │───▶│   QuizView   │───▶│   Tracking  │───▶│  Analytics │
│          │    │  (questions) │    │ (GTM/Pixel) │    │   Tables   │
└──────────┘    └──────────────┘    └─────────────┘    └────────────┘
                       │                                      │
                       ▼                                      │
                ┌─────────────┐    ┌─────────────┐            │
                │    Form     │───▶│   Lead      │────────────┘
                │  (capture)  │    │ quiz_responses│
                └─────────────┘    └─────────────┘
                       │
                       ▼
                ┌─────────────┐    ┌─────────────┐
                │   Result    │───▶│  Webhooks   │
                │  (display)  │    │ Integrations│
                └─────────────┘    └─────────────┘
```

### 3. Processamento de Pagamento

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│  User    │───▶│   Kiwify     │───▶│  Webhook    │───▶│ user_subs  │
│ Checkout │    │  Checkout    │    │ Edge Func   │    │   UPDATE   │
└──────────┘    └──────────────┘    └─────────────┘    └────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ Audit Log   │
                                    │  (payment)  │
                                    └─────────────┘
```

---

## 🧩 Componentes Principais

### Estrutura de Diretórios

```
src/
├── components/
│   ├── quiz/           # Editor de quiz
│   │   ├── blocks/     # Componentes de blocos (22 tipos)
│   │   ├── preview/    # Preview components
│   │   ├── view/       # QuizView components
│   │   └── wizard/     # Calculator Wizard (3 steps)
│   ├── landing/        # Landing page
│   ├── admin/          # Painel administrativo
│   ├── crm/            # Gestão de leads
│   ├── analytics/      # Gráficos e métricas
│   ├── lazy/           # Lazy-loaded bundles
│   └── ui/             # shadcn components
├── hooks/              # Custom hooks (35+)
├── pages/              # Route components
├── types/              # TypeScript interfaces
├── lib/                # Utilitários
└── contexts/           # React Contexts
```

### Componentes Críticos

| Componente | Arquivo | Propósito |
|------------|---------|-----------|
| `CreateQuiz` | `pages/CreateQuiz.tsx` | Orquestra editor de quiz |
| `QuizView` | `pages/QuizView.tsx` | Renderiza quiz público |
| `UnifiedQuizPreview` | `components/quiz/UnifiedQuizPreview.tsx` | Preview em tempo real |
| `BlockEditor` | `components/quiz/blocks/BlockEditor.tsx` | Edição de blocos |
| `ResultsConfigStep` | `components/quiz/ResultsConfigStep.tsx` | Configuração de resultados |
| `CalculatorWizard` | `components/quiz/CalculatorWizard.tsx` | Wizard de calculadoras |

### Hooks Principais

| Hook | Propósito | Arquivo |
|------|-----------|---------|
| `useQuizState` | Estado completo do editor | `hooks/useQuizState.ts` |
| `useQuizPersistence` | Autosave + carregamento | `hooks/useQuizPersistence.ts` |
| `useHistory` | Undo/Redo | `hooks/useHistory.ts` |
| `useAutoSave` | Debounced save (30s) | `hooks/useAutoSave.ts` |
| `useSubscriptionLimits` | Limites por plano | `hooks/useSubscriptionLimits.ts` |
| `usePlanFeatures` | Features permitidas | `hooks/usePlanFeatures.ts` |

---

## 📦 Sistema de Blocos

### Tipos de Bloco (22 tipos)

```typescript
// types/blocks.ts
export type BlockType = 
  | 'question'      // Pergunta principal
  | 'text'          // Texto formatado
  | 'separator'     // Divisor visual
  | 'image'         // Imagem
  | 'video'         // Vídeo (YouTube/Vimeo/Bunny)
  | 'audio'         // Áudio
  | 'gallery'       // Galeria de imagens
  | 'embed'         // Embed externo
  | 'button'        // Botão de ação
  | 'price'         // Card de preço
  | 'metrics'       // Gráficos
  | 'loading'       // Animação de loading
  | 'progress'      // Barra de progresso
  | 'countdown'     // Contador regressivo
  | 'testimonial'   // Depoimento
  | 'slider'        // Slider numérico
  | 'textInput'     // Input de texto
  | 'nps'           // Escala NPS (0-10)
  | 'accordion'     // FAQ expansível
  | 'comparison'    // Comparação lado a lado
  | 'socialProof';  // Notificações de prova social
```

### Hierarquia de Tipos

```typescript
// BaseBlock - comum a todos
interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

// QuestionBlock - tipo principal
interface QuestionBlock extends BaseBlock {
  type: 'question';
  questionText: string;
  answerFormat: 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text';
  options?: string[];
  scores?: number[];
  emojis?: string[];
  required?: boolean;
  autoAdvance?: boolean;
}

// Union type para todos os blocos
type QuizBlock = QuestionBlock | TextBlock | ImageBlock | ...;
```

### Factory Function

```typescript
// Criar novo bloco com defaults
const newBlock = createBlock('question', 0);
// Retorna QuestionBlock com valores padrão
```

---

## 🔌 APIs e Edge Functions

### Endpoints Disponíveis

| Função | Método | Autenticação | Propósito |
|--------|--------|--------------|-----------|
| `generate-quiz-ai` | POST | JWT | Gera quiz com IA |
| `parse-pdf-document` | POST | JWT | Extrai conteúdo de PDF |
| `kiwify-webhook` | POST | Token | Processa pagamentos |
| `sync-integration` | POST | JWT | Sincroniza com CRMs |
| `trigger-user-webhook` | POST | JWT | Dispara webhooks custom |
| `track-quiz-analytics` | POST | Anon | Tracking de eventos |
| `track-quiz-step` | POST | Anon | Tracking de funil |
| `bunny-upload-video` | POST | JWT | Upload para Bunny |
| `save-quiz-draft` | POST | JWT | Salva rascunho |
| `rate-limiter` | POST | Anon | Rate limiting |

### Exemplo: generate-quiz-ai

```typescript
// Request
POST /functions/v1/generate-quiz-ai
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "mode": "form",
  "productName": "Curso de Marketing",
  "targetAudience": "Empreendedores",
  "numberOfQuestions": 5,
  "desiredAction": "Comprar o curso"
}

// Response
{
  "success": true,
  "quiz": {
    "title": "Descubra seu perfil de marketing",
    "description": "...",
    "questions": [...]
  },
  "tokens": { "prompt": 500, "completion": 800 }
}
```

### Padrão de Edge Function

```typescript
// supabase/functions/my-function/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Lógica
    const { data, error } = await supabase.from('...').select();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

---

## 🧮 Algoritmos Críticos

### 1. Motor de Cálculo (Calculator Engine)

```typescript
// lib/calculatorEngine.ts

/**
 * Substitui variáveis (X1, X2, ...) por valores das respostas
 */
function substituteVariables(
  formula: string,
  variableMapping: Record<string, string>, // { X1: 'question_id_1' }
  answers: Record<string, string | string[]>
): string {
  let result = formula;
  
  for (const [variable, questionId] of Object.entries(variableMapping)) {
    const answer = answers[questionId];
    const value = extractNumericValue(answer);
    result = result.replace(new RegExp(variable, 'g'), value.toString());
  }
  
  return result;
}

/**
 * Avalia expressão matemática de forma segura (sem eval)
 */
function evaluateFormula(expression: string): number {
  // Parser seguro com suporte a +, -, *, /, (, ), ^
  // Não usa eval() por segurança
  return safeEval(expression);
}

/**
 * Formata resultado conforme configuração
 */
function formatResult(
  value: number,
  format: 'number' | 'currency' | 'percentage' | 'custom',
  unit?: string,
  decimalPlaces?: number
): string {
  const fixed = value.toFixed(decimalPlaces ?? 2);
  
  switch (format) {
    case 'currency':
      return `R$ ${fixed}`;
    case 'percentage':
      return `${fixed}%`;
    case 'custom':
      return `${fixed} ${unit || ''}`;
    default:
      return fixed;
  }
}
```

### 2. Avaliador de Condições

```typescript
// lib/conditionEvaluator.ts

interface Condition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | string[];
  logic?: 'AND' | 'OR';
}

/**
 * Avalia condições para determinar resultado
 */
function evaluateConditions(
  conditions: Condition[],
  answers: Record<string, string | string[]>
): boolean {
  if (conditions.length === 0) return true;
  
  const results = conditions.map(cond => 
    evaluateSingleCondition(cond, answers[cond.questionId])
  );
  
  // Aplica lógica AND/OR
  const logic = conditions[0].logic || 'AND';
  return logic === 'AND' 
    ? results.every(r => r) 
    : results.some(r => r);
}
```

### 3. Score Calculation

```typescript
/**
 * Calcula score baseado nas respostas
 */
function calculateScore(
  questions: QuizQuestion[],
  answers: Record<string, string | string[]>
): number {
  let totalScore = 0;
  
  for (const question of questions) {
    const questionBlock = question.blocks?.find(b => b.type === 'question');
    if (!questionBlock?.scores) continue;
    
    const answer = answers[question.id];
    const answerIndex = questionBlock.options?.indexOf(answer as string);
    
    if (answerIndex !== undefined && answerIndex >= 0) {
      totalScore += questionBlock.scores[answerIndex] || 0;
    }
  }
  
  return totalScore;
}
```

---

## 🔗 Integrações Externas

### Bunny CDN

```
Upload Flow:
┌────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│ Client │───▶│ bunny-upload │───▶│ Bunny API   │───▶│ CDN URL  │
│        │    │ edge function│    │ (TUS proto) │    │ returned │
└────────┘    └──────────────┘    └─────────────┘    └──────────┘

CDN URL Format: https://masterquiz.b-cdn.net/{videoId}/play_{quality}.mp4
```

### Kiwify Webhook

```
Payment Flow:
┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ Kiwify  │───▶│ kiwify-webhook│───▶│ Validate    │───▶│ Update       │
│ Event   │    │ edge function │    │ Signature   │    │ Subscription │
└─────────┘    └──────────────┘    └─────────────┘    └──────────────┘

Events: purchase_approved, subscription_renewed, refund_issued
```

### CRM Sync

```typescript
// Providers suportados
const PROVIDERS = {
  hubspot: { endpoint: 'https://api.hubapi.com/crm/v3/objects/contacts' },
  rdstation: { endpoint: 'https://api.rd.services/platform/conversions' },
  pipedrive: { endpoint: 'https://api.pipedrive.com/v1/persons' },
  mailchimp: { endpoint: 'https://us1.api.mailchimp.com/3.0/lists/{list}/members' },
  activecampaign: { endpoint: 'https://{account}.api-us1.com/api/3/contacts' }
};

// Payload padronizado
interface LeadPayload {
  email: string;
  name?: string;
  phone?: string;
  quiz_name: string;
  quiz_result: string;
  answers: Record<string, string>;
}
```

---

## 🔐 Segurança e RLS

### Políticas de RLS

```sql
-- Usuários só veem seus próprios quizzes
CREATE POLICY "Users can view own quizzes"
ON quizzes FOR SELECT
USING (auth.uid() = user_id);

-- Quizzes públicos são acessíveis para respostas
CREATE POLICY "Public quizzes accept responses"
ON quiz_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes 
    WHERE id = quiz_id AND is_public = true
  )
);

-- UPDATE restrito a 24h (anti-fraude)
CREATE POLICY "ab_test_sessions update within 24h"
ON ab_test_sessions FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND started_at > now() - interval '24 hours'
);
```

### View Segura para Integrações

```sql
-- Mascara API keys para admins
CREATE VIEW user_integrations_safe AS
SELECT 
  id, user_id, provider, is_active,
  CASE WHEN api_key IS NOT NULL 
    THEN '****' || RIGHT(api_key, 4) 
    ELSE NULL 
  END as api_key_masked,
  last_sync_at, created_at, updated_at
FROM user_integrations;
```

### Rate Limiting

```typescript
// Implementação em edge function
const LIMITS = {
  quiz_response: { max: 100, window: 3600 },    // 100/hora
  ai_generation: { max: 10, window: 86400 },    // 10/dia
  webhook: { max: 1000, window: 3600 }          // 1000/hora
};

async function checkRateLimit(identifier: string, action: string): Promise<boolean> {
  const { data } = await supabase
    .from('rate_limit_tracker')
    .select('attempt_count, window_start')
    .eq('identifier', identifier)
    .eq('action', action)
    .single();

  const limit = LIMITS[action];
  const windowExpired = new Date(data?.window_start) < new Date(Date.now() - limit.window * 1000);
  
  if (windowExpired || !data) {
    // Reset window
    await supabase.from('rate_limit_tracker').upsert({ ... });
    return true;
  }
  
  return data.attempt_count < limit.max;
}
```

---

## ⚡ Performance

### Lazy Loading Strategy

```typescript
// components/lazy/EditorComponentsBundle.tsx
const BlockEditor = lazy(() => import('../quiz/blocks/BlockEditor'));
const UnifiedQuizPreview = lazy(() => import('../quiz/UnifiedQuizPreview'));
const AIQuizGenerator = lazy(() => import('../quiz/AIQuizGenerator'));

// Fallbacks com Skeleton
export const BlockEditorWrapper = (props) => (
  <Suspense fallback={<EditorSkeleton />}>
    <BlockEditor {...props} />
  </Suspense>
);
```

### Chunk Splitting (vite.config.ts)

```javascript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-ui': ['@radix-ui/*'],
  'vendor-motion': ['framer-motion'],
  'vendor-charts': ['recharts'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'vendor-i18n': ['i18next', 'react-i18next'],
  'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
  'vendor-date': ['date-fns'],
  'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod']
}
```

### Hooks de Performance

```typescript
// Evita re-renders desnecessários
const stableCallback = useStableCallback(myFunction);

// Valores deferidos para filtros
const deferredFilter = useDeferredValue(filter);

// Debounce para buscas
const debouncedSearch = useDebounce(searchTerm, 300);
```

---

## 📚 Documentação Relacionada

| Documento | Propósito |
|-----------|-----------|
| [README.md](../README.md) | Setup, stack, comandos |
| [PRD.md](../PRD.md) | Requisitos funcionais |
| [ROADMAP.md](../ROADMAP.md) | Planejamento estratégico |
| [PENDENCIAS.md](../PENDENCIAS.md) | Changelog detalhado |
| [STYLE_GUIDE.md](../STYLE_GUIDE.md) | Padrões de código |
| [CHECKLIST.md](../CHECKLIST.md) | Validação MVP |
| [src/__tests__/README.md](../src/__tests__/README.md) | Guia de testes |

---

## 📞 Contato

- **Suporte técnico**: suporte@masterquizz.com
- **Issues**: Via tickets no painel admin
