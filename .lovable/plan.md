

# Plano de Implementacao — 5 Melhorias Pos-Correcao

## Resumo dos 5 Itens

1. **Adicionar blocos de imagem em todos os templates** (helpers.ts + todos os 14 templates)
2. **TemplateManagement: colunas "Ordem" e "Vezes utilizado/publicado"**
3. **Corrigir classificacao premium no QuizTemplateSelector** (categoryLabels incompleto + templates com categoria errada)
4. **PQLAnalytics: linha de totais/media + excluir leads de teste da coluna "Com Leads"**
5. **AISettings: mostrar nome do usuario em vez de User ID no Top 10**

---

## Item 1: Imagens IA nos Templates

**Problema**: Nenhum template usa blocos `image`. O usuario quer 1-2 imagens por quiz que facam sentido com o contexto.

**Solucao**: Criar helper `imageBlock()` em `helpers.ts` e adicionar blocos de imagem em perguntas estrategicas de cada template. Como nao ha imagens reais disponiveis, usaremos URLs placeholder com `alt` descritivo que o usuario pode substituir depois, ou melhor, usaremos URLs de imagens de stock gratuitas (Unsplash) que facam sentido com cada nicho.

**Arquivos**:
- `src/data/templates/helpers.ts` — adicionar `imageBlock(id, url, alt, order, size?)`
- `src/data/templates/lead-capture.ts` — 2 imagens (pergunta 1 e 7)
- `src/data/templates/vsl-conversion.ts` — 2 imagens
- `src/data/templates/paid-traffic.ts` — 2 imagens
- `src/data/templates/offer-validation.ts` — 2 imagens
- `src/data/templates/educational.ts` — 1 imagem
- `src/data/templates/health-wellness.ts` — 2 imagens
- `src/data/templates/income-opportunity.ts` — 2 imagens
- `src/data/templates/diagnostic-exam.ts` — 1 imagem
- `src/data/templates/course-onboarding.ts` — 1 imagem
- `src/data/premiumQuizTemplates.ts` — 1-2 imagens por template (5 templates)

Usaremos imagens do Unsplash via URL (ex: `https://images.unsplash.com/photo-XXXXX?w=800&q=80`) com tamanho `medium` e alt descritivo.

---

## Item 2: Colunas "Ordem" e "Uso" no TemplateManagement

**Problema**: O admin nao ve a ordem de exibicao nem quantas vezes cada template foi usado.

**Solucao**:
- Adicionar coluna **"Ordem"** mostrando `display_order` (para hardcoded, usar o indice no array)
- Adicionar coluna **"Uso"** com contagem de quizzes que usam cada template. Isso requer uma query ao banco para contar quizzes por template (podemos usar o titulo do quiz ou uma nova coluna `template_id` — mas como nao existe `template_id` na tabela `quizzes`, faremos uma contagem aproximada via titulo ou simplesmente mostrar "—" para hardcoded e buscar do banco para templates de banco).

Na pratica, nao temos como saber qual template originou qual quiz (nao ha `template_id` em `quizzes`). Entao a coluna "Uso" mostrara "—" por enquanto com uma nota de que seria necessario adicionar tracking de template_id. Alternativamente, podemos contar quantos quizzes tem titulo igual ao do template.

**Decisao**: Adicionar coluna "Ordem" (simples) e coluna "Uso" mostrando "—" com tooltip explicando que tracking futuro sera implementado.

**Arquivo**: `src/components/admin/TemplateManagement.tsx`

---

## Item 3: Templates Premium nao aparecendo como Premium

**Problema**: No `QuizTemplateSelector`, `categoryLabels` so tem 4 categorias. Templates de nichos novos (health_wellness, income_opportunity, etc.) mostram `undefined` na badge. Mais criticamente, TODOS aparecem como "free" porque:

1. Os templates premium hardcoded (`premiumQuizTemplates`) usam `category: 'lead_qualification'` — que e uma das 4 categorias existentes, entao o label aparece.
2. O bug real e que o `categoryLabels` esta incompleto para os templates NORMAIS novos (health, income, diagnostic, onboarding usam `category: 'engagement'`), entao mostram badge vazia.
3. A separacao premium/free funciona corretamente no hook `useQuizTemplates` (usa `premiumIds` baseado em `hardcodedPremiumTemplates`). Se todos aparecem como free, pode ser que o `usePlanFeatures` retorne `allowedTemplates` incorreto ou que `isMasterAdmin` esteja true.

**Solucao**: 
- Expandir `categoryLabels` no `QuizTemplateSelector.tsx` para incluir todas as categorias novas
- Verificar se os premium templates realmente estao em `hardcodedPremiumTemplates` (ja verificado — estao)
- O usuario pode ser master_admin, o que faz `lockedTemplates = []` — nesse caso todos aparecem como "disponiveis" sem badge Premium. Adicionar badge visual "Premium" mesmo para master admin.

**Arquivo**: `src/components/quiz/QuizTemplateSelector.tsx`

---

## Item 4: PQL — Linha de Totais e Leads Reais

**Problema**: 
- Falta linha de somatorio/media no final da tabela "Progressao por Intencao"
- A coluna "Com Leads" pode estar contando leads de teste (flag `_is_test_lead` no answers)

**Solucao**:
- Na tabela PQL, adicionar uma `<TableRow>` final com:
  - Somas para: Total, Quizzes, Publicados, Com Leads, Expl, Constr, Oper, Free, Paid
  - Medias para: % Expl→Constr, % Constr→Oper, % Trial→Paid
- A contagem de `withLeads` ja vem do `list-all-users` edge function que **ja exclui test leads** (linha 115-116: `isTestLead = answers._is_test_lead === true`). Entao `quizzes_with_leads` ja e correto. Porem, `lead_count` (usado na tabela de Impacto) inclui TODOS os leads. Preciso verificar se a contagem de `lead_count` tambem deve excluir test leads — sim, deve.

**Arquivos**:
- `src/components/admin/PQLAnalytics.tsx` — adicionar linha de totais
- `supabase/functions/list-all-users/index.ts` — ajustar `leadCountMap` para excluir test leads (atualmente conta tudo na linha 102-108, sem filtro)

---

## Item 5: Nome do Usuario no Top 10

**Problema**: Mostra UUID truncado em vez do nome. O comentario no codigo diz "via profiles nao temos email" — mas profiles TEM `full_name` e `email`.

**Solucao**: Apos agrupar por user_id, buscar `profiles` para obter `full_name` e `email`, e mostrar nome (com fallback para email, e depois para ID truncado).

**Resposta a duvida**: Sim, se so 1 usuario aparece com custo, e porque so esse usuario usou a funcao de geracao de quiz por IA. A query mostra 5 usuarios no total que ja usaram, mas os outros 4 tem custo $0 ou muito baixo (geracao unica). Isso e normal num produto novo.

**Arquivo**: `src/components/admin/AISettings.tsx` (linhas 554-602 e 910-933)

---

## Detalhamento Tecnico

### helpers.ts — novo helper
```typescript
export function imageBlock(id: string, url: string, alt: string, order: number, size: 'small' | 'medium' | 'large' | 'full' = 'medium') {
  return {
    id: `block-${id}-img`,
    type: 'image' as const,
    order,
    url,
    alt,
    size,
  };
}
```

### QuizTemplateSelector — categoryLabels expandido
```typescript
const categoryLabels: Record<string, string> = {
  lead_qualification: 'Qualificacao de Leads',
  product_discovery: 'Descoberta de Produto',
  customer_satisfaction: 'Satisfacao do Cliente',
  engagement: 'Engajamento',
  conversion: 'Conversao / VSL',
  paid_traffic: 'Trafego Pago',
  offer_validation: 'Validacao de Oferta',
  educational: 'Educacional',
  health_wellness: 'Saude & Bem-estar',
  income_opportunity: 'Renda Extra',
  diagnostic: 'Diagnostico',
  course_onboarding: 'Onboarding de Curso',
};
```

Tambem: mostrar badge "Premium" nos templates disponveis quando `premiumIds.has(template.id)` mesmo para master admin.

### PQLAnalytics — linha de totais
Apos o map de `intentTable`, calcular somas e medias e renderizar uma `<TableRow>` com `font-bold` e `bg-muted`.

### AISettings — buscar profiles
Na queryFn de `topUsers`, apos agrupar por userId, buscar profiles:
```typescript
const userIdsToFetch = Object.keys(userStats);
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name, email')
  .in('id', userIdsToFetch);
```
E mapear `full_name || email || userIdShort`.

### list-all-users — excluir test leads de lead_count
Alterar linhas 101-108 para filtrar `_is_test_lead`:
```typescript
for (const r of leadCountRes.data || []) {
  const ownerUserId = (r as any).quizzes?.user_id;
  const answers = (r as any).answers;
  const isTestLead = answers && typeof answers === 'object' && answers._is_test_lead === true;
  if (ownerUserId && !isTestLead) {
    leadCountMap.set(ownerUserId, (leadCountMap.get(ownerUserId) || 0) + 1);
  }
}
```
Isso requer mudar a query de `leadCountRes` para tambem selecionar `answers`.

