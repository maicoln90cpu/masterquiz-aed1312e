

## Plano: Melhorias na Geração de Blog — Deduplicação, Auto-publish e Temas Diversificados

### Problema atual
1. **Temas repetidos**: O tópico é escolhido aleatoriamente do pool (`allTopics[Math.floor(Math.random() * allTopics.length)]`) sem verificar o que já foi publicado — gera artigos sobre o mesmo assunto.
2. **Não publica automaticamente**: `auto_publish` está `false` por padrão e depende de toggle manual no admin.
3. **Temas limitados a quiz**: Os 20 `DEFAULT_TOPICS` são todos sobre quizzes. O concorrente (inlead) cobre infoprodutos, marketing digital, funil de vendas, copywriting, tráfego pago, métricas (CAC, LTV, CPL, ROI, MQL, SQL, CTR), eventos, nutrição, etc.

---

### Correção 1: Deduplicação de temas

**Arquivo**: `supabase/functions/generate-blog-post/index.ts`

Na seção de seleção de tópico (linha ~242-244), antes de escolher:
- Buscar os últimos 20 posts (`title`, `categories`) da tabela `blog_posts`
- Enviar os títulos recentes como contexto no prompt para a IA, instruindo: "NÃO repita temas já cobertos"
- Se usando o pool estático, filtrar tópicos cujas palavras-chave já aparecem em títulos recentes
- Adicionar instrução explícita no prompt: lista dos últimos 20 títulos + "gere sobre um tema DIFERENTE"

### Correção 2: Auto-publish por padrão

**Arquivo**: `supabase/functions/generate-blog-post/index.ts`

- Alterar linha 236: `const autoPublish = settings?.auto_publish ?? true;` (default `true` em vez de `false`)
- Posts gerados entram como `published` com `published_at` preenchido automaticamente

### Correção 3: Expandir DEFAULT_TOPICS para infoprodutos

**Arquivo**: `supabase/functions/generate-blog-post/index.ts`

Substituir os 20 tópicos atuais (todos sobre quiz) por ~50 tópicos diversificados cobrindo:
- **Funil de vendas**: CPL, CAC, LTV, ROI, MQL, SQL, CTR, métricas
- **Infoprodutos**: como vender, tipos, plataformas, lançamentos
- **Marketing digital**: tráfego pago, Meta Ads, Google Ads, SEO, copywriting
- **Estratégia**: automação, remarketing, segmentação, e-mail marketing
- **Tendências**: IA no marketing, eventos, personalização
- **Quiz interativo**: manter ~10 tópicos sobre quiz (mas como parte do mix, não 100%)

### Correção 4: Prompt com contexto de posts recentes

**Arquivo**: `supabase/functions/generate-blog-post/index.ts`

No user prompt (linha ~288), adicionar:
```
ARTIGOS JÁ PUBLICADOS (NÃO repita estes temas):
- título 1
- título 2
...

Escolha um ângulo NOVO e DIFERENTE. Varie entre categorias: Infoprodutos, Marketing Digital, Funil de Vendas, Tráfego Pago, Copywriting, Métricas, Quizzes.
```

---

### 10 Melhorias adicionais para o Blog

Implementarei estas junto com as correções acima:

**SEO & Descoberta:**
1. **Canonical URL + hreflang**: Adicionar `<link rel="alternate" hreflang="pt-BR">` no `BlogSEOHead` para sinalizar idioma ao Google
2. **Breadcrumb JSON-LD**: Adicionar schema BreadcrumbList no `BlogPost.tsx` para rich snippets no Google
3. **Reading time calculado**: Calcular `reading_time_min` baseado em word count real (`content.split(/\s+/).length / 200`) em vez de confiar no valor da IA

**Conteúdo:**
4. **Excerpt mais longo no card**: Aumentar `line-clamp-3` para `line-clamp-4` no `BlogCard` para melhor preview
5. **Author bio section**: Adicionar seção de autor ao final do post com link para mais artigos do mesmo autor
6. **Artigo destaque (hero post)**: O post mais recente aparece em destaque (maior) no topo da listagem do blog

**Performance & UX:**
7. **Lazy loading de imagens com blur placeholder**: Usar `loading="lazy"` + placeholder CSS no `BlogCard`
8. **Infinite scroll ou "Carregar mais"**: Substituir paginação numérica por botão "Carregar mais" para melhor UX mobile
9. **Tempo de leitura no formato "X min de leitura"**: Adicionar ao `BlogCard` (já existe `readingTimeMin` mas não exibe o texto completo)
10. **Link interno automático melhorado**: Aumentar de 5 para 8 links internos auto-injetados e usar matching por bigrams (2 palavras) em vez de palavras soltas para links mais naturais

---

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-blog-post/index.ts` | Dedup, auto-publish, novos topics, prompt com contexto |
| `src/components/blog/BlogCard.tsx` | Excerpt maior, texto de leitura |
| `src/pages/Blog.tsx` | Hero post destaque, "carregar mais", breadcrumb schema |
| `src/components/blog/BlogSEOHead.tsx` | hreflang, breadcrumb JSON-LD |
| `src/pages/BlogPost.tsx` | Author bio, breadcrumb schema |

