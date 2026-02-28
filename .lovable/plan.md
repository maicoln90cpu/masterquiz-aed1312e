

## Plano: 4 Correções/Melhorias no Sistema de Blog

### 1. Renomear label "Gemini 2.5 Flash Image" → "Nano Banana"
**Arquivo:** `src/components/admin/blog/BlogAutomationSettings.tsx`
- Alterar o label do `SelectItem` de "Gemini 2.5 Flash Image" para "Nano Banana (Gemini Flash Image)"
- Adicionar opção "Nano Banana Pro (Gemini 3 Pro)" com value `google/gemini-3-pro-image-preview`
- Manter os values técnicos iguais (o backend já usa corretamente)

### 2. Adicionar frequências por intervalo de horas
**Arquivo:** `src/components/admin/blog/BlogAutomationSettings.tsx`
- Adicionar novas opções ao Select de Frequência:
  - `every_12h` — A cada 12 horas
  - `every_24h` — A cada 24 horas  
  - `every_36h` — A cada 36 horas
  - `every_48h` — A cada 48 horas
  - `every_72h` — A cada 72 horas
- Manter as opções existentes (daily, weekly, biweekly, monthly)

**Nota:** A frequência é salva em `blog_settings.cron_schedule` e lida pelo `blog-cron-trigger`. O cron atual roda 1x/dia; o controle granular (36h, 48h) seria feito com lógica de "última geração" no trigger — verificando o timestamp do último post gerado e pulando se o intervalo não tiver passado.

**Arquivo:** `supabase/functions/blog-cron-trigger/index.ts`
- Adicionar lógica: carregar `cron_schedule`, calcular intervalo em horas, comparar com `created_at` do último post AI gerado, pular se não atingiu o intervalo

### 3. Modal de edição não carrega conteúdo dos posts
**Arquivo:** `src/components/admin/blog/BlogPostsManager.tsx`

**Diagnóstico:** O `openEditor` faz `setEditPost({ ...post })` e o query usa `select("*")`, então o conteúdo deveria estar lá. O problema provável é que para posts com conteúdo HTML longo, a listagem traz tudo mas o ReactQuill pode não renderizar corretamente no mount. 

**Solução:** Ao abrir o modal para edição, fazer um fetch individual do post completo por ID (`select("*").eq("id", post.id).single()`) para garantir dados frescos e completos. Isso também resolve possíveis problemas de cache ou truncamento.

### 4. Arquitetura do prompt de geração — Explicação

**Como funciona hoje:**
- O prompt é controlado em **2 lugares**:
  1. **`blog_settings.system_prompt`** (banco de dados) — editável via Admin Panel → Blog → aba "Prompts IA" (`BlogPromptConfig.tsx`)
  2. **`DEFAULT_SYSTEM_PROMPT`** (hardcoded na Edge Function `generate-blog-post/index.ts`, linhas 43-76) — usado como fallback quando `blog_settings.system_prompt` está vazio

- **Fluxo:** A Edge Function carrega `settings.system_prompt`; se vazio, usa o `DEFAULT_SYSTEM_PROMPT`. Depois substitui variáveis (`{{topic}}`, `{{categories}}`, `{{author}}`, `{{keywords}}`, `{{base_url}}`).

- **O prompt do usuário** (linha 165-166) é fixo: `"Escreva um artigo completo e detalhado sobre: '{{topic}}'. Responda APENAS com o JSON no formato especificado."`

**Recomendação:** O system prompt na aba "Prompts IA" do admin é 100% o que controla a geração. Para melhorar os artigos, basta editar esse campo no painel. Não há outra instrução oculta — tudo passa por ali. O formato JSON de resposta (title, content, meta_title, etc.) está embutido no prompt e precisa ser mantido para o parser funcionar.

**Nenhuma mudança de código** necessária para o ponto 4 — é apenas orientação. O usuário pode ir ao painel Admin → Blog → Prompts IA e reescrever o system prompt livremente, mantendo o bloco `FORMATO DE RESPOSTA (JSON)` no final.

---

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `BlogAutomationSettings.tsx` | Labels Nano Banana + frequências por hora |
| `BlogPostsManager.tsx` | Fetch individual ao abrir modal de edição |
| `blog-cron-trigger/index.ts` | Lógica de intervalo dinâmico baseado em horas |

