

# Plano: Correcao de Erros Supabase, Layout Sidebar e Renderizacao de Templates

## Item 1: Erros e Avisos no Supabase

### Diagnostico dos erros no screenshot:

| Erro | Causa | Status |
|------|-------|--------|
| **400 GET /validation_requests** (repetido ~15x) | Query do AdminDashboard executa para todos os usuarios, mas RLS so permite admin. Usuarios normais recebem 400. | **Ativo — precisa corrigir** |
| **400 GET /quiz_step_analytics** (4x) | RLS so tem policy de SELECT para "Users view own" e INSERT para anon. Se a query usa filtros incompativeis, retorna 400. | **Verificar query no codigo** |
| **400 POST /auth/v1/token** (2x) | Tentativa de login com credenciais invalidas. Comportamento normal de auth, nao e bug. | **OK — ignorar** |
| **23505 user_roles_user_id_role_key** | Tentativa de inserir role duplicada para usuario. | **Ativo — precisa upsert** |
| **23505 user_subscriptions_user_id_key** | Tentativa de inserir subscription duplicada. | **Ativo — precisa upsert** |
| **409 POST /user_roles** | Conflito por unique constraint (mesmo que acima). | **Ativo** |
| **409 PATCH /user_subscriptions** | Conflito por unique constraint. | **Ativo** |
| **403 GET /auth/v1/user** (2x) | Token expirado ou invalido. Comportamento normal de sessao. | **OK — ignorar** |
| **406 GET /scheduled_deletions** | Accept header incompativel (provavelmente `.single()` sem resultado). | **Ativo — usar `.maybeSingle()`** |

### Correcoes necessarias:

**1a. validation_requests — proteger query com check de role**
Em `AdminDashboard.tsx` (linha 251-258), a query a `validation_requests` e executada como parte do `fetchDashboardData` que deve ser protegido por role check. Se o componente ja verifica admin, o problema pode ser que a query executa antes da verificacao. Solucao: adicionar guard `if (!isAdmin)` antes da query ou mover para dentro do bloco admin-only.

**1b. user_roles e user_subscriptions — usar upsert**
Procurar onde esses inserts acontecem e trocar `.insert()` por `.upsert()` com `onConflict`.

**1c. scheduled_deletions — usar maybeSingle()**
Em `Settings.tsx` linha 76, verificar se usa `.single()` e trocar por `.maybeSingle()`.

**1d. quiz_step_analytics — verificar queries**
Verificar se ha queries SELECT com filtros que falham para usuarios normais.

### Arquivos:
- `src/pages/AdminDashboard.tsx` — guard na query de validation_requests
- `src/pages/Settings.tsx` — `.maybeSingle()` em scheduled_deletions
- Buscar e corrigir inserts de `user_roles` e `user_subscriptions` para usar upsert

---

## Item 2: Sidebar Express Mode — Layout Cortado

### Diagnostico:
A sidebar usa `fixed top-20 left-0 w-64 xl:w-72`. No express mode, o `ExpressProgressBar` (~52px) renderiza ANTES do header sticky, adicionando altura extra. Porem `top-20` (80px) nao contabiliza essa barra extra, fazendo a sidebar iniciar atras/sobre a progress bar.

Alem disso, dentro do `QuestionsList`, os botoes de acao (editar/excluir) estao em `absolute top-1.5 right-1` com `min-w-fit`, mas o container pai tem `pr-20` que pode nao ser suficiente quando ha thumbnail de imagem. O resultado e que botoes ficam cortados na lateral.

### Correcoes:

**2a. Ajustar top da sidebar no express mode**
Passar prop `isExpressMode` e ajustar `top` da sidebar para `top-[8.5rem]` (~136px = progress bar + header) quando express, ou melhor, usar classe condicional.

**2b. Melhorar layout dos botoes no QuestionsList**
- Reduzir `pr-20` para `pr-16` ou usar flex layout em vez de absolute positioning para os botoes
- Garantir que botoes nao saiam do container com `overflow-hidden` no item

### Arquivos:
- `src/pages/CreateQuiz.tsx` — classe condicional na sidebar para express mode
- `src/components/quiz/QuestionsList.tsx` — ajustar layout dos botoes de acao

---

## Item 3: Renderizacao de Perguntas de Template na Sidebar

### Diagnostico (bug principal):
Em `QuestionsList.tsx` linha 142:
```typescript
const questionText = questionBlock?.content || q.question_text || '';
```

O campo esta buscando `questionBlock.content`, mas o tipo `QuestionBlock` usa `questionText` (nao `content`). O helper `questionBlock()` em `helpers.ts` gera `{ questionText: text }`. Entao para perguntas vindas de template, `content` e `undefined`, e o fallback `q.question_text` funciona — MAS so se o template definiu `question_text` no nivel da pergunta.

Olhando os templates (ex: `lead-capture.ts` linha 25): `question_text: 'Qual o tamanho da sua operação hoje?'` esta presente. Entao o texto deveria aparecer. Porem, quando o template e processado por `handleSelectTemplate` (linha 83), o `question_text` e extraido corretamente.

O problema real pode ser que `questionBlock?.content` e `undefined` (correto, campo nao existe), e `q.question_text` existe mas esta sendo truncado demais (`max-w-[140px]` na linha 279). Combinado com `pr-20` e thumbnail de imagem, o texto visivel e minimo.

**Verificacao adicional**: No screenshot image-112 (edicao normal com template), as perguntas mostram texto correto ("Espelhamento", "Há quanto tempo v...", etc.) porque tem `custom_label`. Mas no image-113 (quiz do zero), mostra "Pergunta vazia" porque nao tem texto nem label.

O bug de renderizacao que o usuario reporta no image-112 e visual (layout), nao de dados. O texto aparece mas os itens estao apertados/cortados.

### Correcoes:

**3a. Corrigir leitura do texto da pergunta**
Trocar `questionBlock?.content` por `questionBlock?.questionText` para alinhar com o tipo `QuestionBlock`.

**3b. Aumentar espaco para texto**
Aumentar `max-w-[140px]` para `max-w-[160px]` ou usar `flex-1 min-w-0 truncate` sem max-width fixo.

**3c. Reduzir padding direito**
Mudar `pr-20` para `pr-14` e ajustar posicao dos botoes.

### Arquivo:
- `src/components/quiz/QuestionsList.tsx`

---

## Resumo de Impacto

| Arquivo | Mudanca |
|---------|---------|
| `src/components/quiz/QuestionsList.tsx` | Fix `content` → `questionText`; ajustar layout; reduzir pr |
| `src/pages/CreateQuiz.tsx` | Classe condicional top sidebar para express |
| `src/pages/AdminDashboard.tsx` | Guard na query validation_requests |
| `src/pages/Settings.tsx` | `.maybeSingle()` em scheduled_deletions |
| Buscar inserts user_roles/user_subscriptions | Trocar por upsert |

Nenhum risco para fluxos existentes. Todas as mudancas sao defensivas e de layout.

