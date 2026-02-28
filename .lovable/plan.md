

## Diagnóstico Completo: Posts do Blog

### Análise dos Dados no Banco

Consultei todos os 10 posts no banco de dados. Resultado:

| Campo | Preenchido? | Detalhe |
|---|---|---|
| `title` | Sim (10/10) | Todos têm título |
| `meta_title` | Sim (10/10) | Todos preenchidos |
| `content` | **8/10 VAZIOS** | Apenas 2 posts têm conteúdo, e está em formato JSON (não HTML) |
| `excerpt` | **0/10** | Todos `null` |
| `meta_description` | **0/10** | Todos `null` |
| `seo_keywords` | **0/10** | Todos `[]` vazio |
| `tags` | **0/10** | Todos `[]` vazio |
| `categories` | 2/10 | Apenas os 2 com conteúdo |
| `faq_schema` | 2/10 | Apenas os 2 com conteúdo |
| `featured_image_url` | Parcial | Alguns têm imagem |

### Causa Raiz Identificada

**Problema 1 — Conteúdo em formato JSON, não HTML:**
Os 2 posts que têm conteúdo armazenaram JSON estruturado (`{"sections":[{"heading":"...","content":"..."}]}`) em vez de HTML como o prompt pede. Isso acontece quando o modelo (provavelmente Gemini no fallback) não segue a instrução de retornar HTML.

**Problema 2 — 8 posts com conteúdo completamente vazio:**
A geração falhou silenciosamente para esses posts — o content foi salvo como string vazia. Provavelmente o JSON parsing extraiu um campo `content` vazio ou inexistente.

**Problema 3 — Campos SEO nunca preenchidos:**
Mesmo nos 2 posts com conteúdo, `excerpt`, `meta_description`, `seo_keywords` e `tags` estão todos vazios. O modelo retornou esses campos no JSON mas em formato diferente do esperado, ou simplesmente não retornou.

**Problema 4 — Modal não mostra conteúdo:**
O fix anterior (fetch by ID) funciona, mas o problema real é que os dados simplesmente não existem no banco.

### Plano de Correção

#### 1. Fix na Edge Function: Normalizar conteúdo para HTML
**Arquivo:** `supabase/functions/generate-blog-post/index.ts`

Após o `JSON.parse(rawContent)`, adicionar lógica de normalização:
- Se `textResult.content` é um objeto/array (não string HTML), converter para HTML automaticamente (percorrer sections, headings, paragraphs e gerar tags `<h2>`, `<h3>`, `<p>`, `<ul>`, `<li>`)
- Garantir que o resultado final é sempre uma string HTML válida
- Adicionar fallback: se `content` está vazio mas existem outros campos com conteúdo estruturado, reconstruir

#### 2. Fix na Edge Function: Extrair campos SEO com fallback robusto
**Arquivo:** `supabase/functions/generate-blog-post/index.ts`

Adicionar fallbacks inteligentes após o parse:
- `excerpt`: Se vazio, gerar automaticamente dos primeiros 160 chars do conteúdo (strip HTML)
- `meta_description`: Se vazio, usar `excerpt` ou gerar dos primeiros 155 chars
- `seo_keywords`: Se vazio, extrair palavras-chave do título
- `tags`: Se vazio, extrair do título + categorias

#### 3. Backfill: Preencher os posts existentes que estão incompletos
**Arquivo:** Nova migration SQL

Para os 2 posts com conteúdo JSON:
- Converter o JSON para HTML e atualizar o campo `content`
- Gerar `excerpt`, `meta_description`, `seo_keywords`, `tags` a partir do conteúdo existente

Para os 8 posts sem conteúdo:
- Deletar esses posts vazios (são irrecuperáveis sem re-gerar)

#### 4. Prompt mais explícito para o modelo
**Arquivo:** `supabase/functions/generate-blog-post/index.ts`

Reforçar no user message: `"O campo 'content' DEVE ser uma string HTML, NÃO um objeto JSON. Use tags <h2>, <p>, <ul>, <li>, <a>, <strong>."`

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `generate-blog-post/index.ts` | Normalização JSON→HTML, fallbacks SEO, prompt reforçado |
| Nova migration SQL | Backfill dos 2 posts com dados + delete dos 8 vazios |

