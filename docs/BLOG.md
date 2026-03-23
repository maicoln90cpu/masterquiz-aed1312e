# BLOG.md — Guia de Replicação: Sistema de Blog Automatizado com IA

> **Objetivo**: Documentar toda a lógica, schema, edge functions e fluxos do sistema de geração automática de artigos de blog com IA (OpenAI + Gemini), para replicação em qualquer outro projeto Lovable.

---

## 1. Visão Geral da Arquitetura

```
┌────────────────────────────────────────────────────────────────┐
│                     FLUXO DE GERAÇÃO                           │
│                                                                │
│  pg_cron (configurável) ──► blog-cron-trigger ──► verifica     │
│  intervalo ──► generate-blog-post ──► OpenAI (texto) +         │
│  Gemini/Lovable AI (imagem) ──► blog_posts ──► publicação      │
│                                                                │
│  Tracking: track-blog-view ──► incrementa views_count          │
│  SEO: blog-sitemap ──► gera sitemap.xml dinâmico               │
│  Custo: blog_generation_logs ──► tracking de tokens/custo      │
└────────────────────────────────────────────────────────────────┘
```

### Componentes Principais
1. **Tabelas** — posts, configurações, logs de custos, prompts de imagem
2. **Edge Functions** — cron trigger, geração, sitemap, tracking, regeneração
3. **pg_cron** — executa `blog-cron-trigger` periodicamente
4. **OpenAI API** — geração de texto (GPT-4o/4o-mini)
5. **Gemini/Lovable AI** — geração de imagens featured
6. **Frontend** — listagem, leitura, SEO (JSON-LD, hreflang)

---

## 2. Schema do Banco de Dados

### 2.1 `blog_posts` (artigos)
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL, -- HTML
  excerpt TEXT,
  status TEXT DEFAULT 'draft', -- draft, published
  featured_image_url TEXT,
  og_image_url TEXT,
  author_name TEXT,
  categories TEXT[],
  tags TEXT[],
  seo_keywords TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  reading_time_min INT,
  views_count INT DEFAULT 0,
  faq_schema JSONB, -- JSON-LD FAQ
  internal_links JSONB, -- links automáticos
  is_ai_generated BOOLEAN DEFAULT false,
  model_used TEXT,
  generation_cost_usd NUMERIC,
  image_generation_cost_usd NUMERIC,
  published_at TIMESTAMPTZ,
  included_in_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 `blog_settings` (configurações)
```sql
CREATE TABLE blog_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT false,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  image_model TEXT DEFAULT 'google/gemini-2.5-flash-image',
  auto_publish BOOLEAN DEFAULT true,
  cron_schedule TEXT DEFAULT 'every_24h',
  default_author TEXT DEFAULT 'SeuApp',
  system_prompt TEXT, -- prompt customizável
  image_prompt_template TEXT, -- fallback
  topics_pool JSONB DEFAULT '[]', -- temas personalizados
  categories_list JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Valores de `cron_schedule`:**
`every_12h`, `every_24h`, `every_36h`, `every_48h`, `every_72h`, `daily`, `weekly`, `biweekly`, `monthly`

### 2.3 `blog_generation_logs` (tracking de custos)
```sql
CREATE TABLE blog_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id),
  model_used TEXT NOT NULL,
  status TEXT DEFAULT 'generating', -- generating, success, failed
  generation_type TEXT, -- 'text' ou 'image'
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  text_cost_usd NUMERIC,
  image_cost_usd NUMERIC,
  total_cost_usd NUMERIC,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.4 `blog_image_prompts` (estilos de imagem rotativos)
```sql
CREATE TABLE blog_image_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  style_description TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**5 estilos pré-configurados (rotação automática):**
1. **Objetos 3D** — renderização 3D estilizada
2. **Pessoa Real / Pop Art** — foto com tratamento artístico
3. **Flat Lay** — composição vista de cima
4. **Hiper-realismo Conceitual** — fotorrealismo com elementos conceituais
5. **Gradiente Abstrato** — formas abstratas com gradientes

**Rotação:** a cada geração, o estilo menos usado recentemente é selecionado (exclui o último usado se há mais de 1 estilo ativo).

---

## 3. Edge Functions

### 3.1 `blog-cron-trigger` (controlador de frequência)

**Executado por:** pg_cron periodicamente

**Fluxo:**
1. Verifica se `blog_settings.is_active = true`
2. Busca `cron_schedule` e converte em horas
3. Compara com timestamp do último post IA
4. Se intervalo atingido, chama `generate-blog-post`
5. Se não, retorna `{ skipped: true }`

### 3.2 `generate-blog-post` (gerador principal — ~800 linhas)

**Fluxo completo:**

1. **Carrega configurações** de `blog_settings`
2. **Rotação de prompt de imagem** — busca `blog_image_prompts` ativos, exclui o mais recente
3. **Deduplicação de temas** — busca últimos 20 posts para evitar repetição
4. **Seleção de tópico** — pool customizado ou 40+ tópicos default
5. **Log inicial** — insere em `blog_generation_logs` com status `generating`
6. **Geração de texto** via OpenAI:
   - System prompt customizável com variáveis (`{{topic}}`, `{{categories}}`, `{{author}}`)
   - Contexto de deduplicação (títulos anteriores)
   - Resposta em JSON com campos: title, content (HTML), excerpt, categories, tags, seoKeywords, metaTitle, metaDescription, readingTime, faqSchema
7. **Cálculo de custo de texto**:
   ```
   cost = (promptTokens * inputCostPer1M + completionTokens * outputCostPer1M) / 1_000_000
   ```
8. **Geração de imagem** via Gemini (Lovable AI gateway):
   - Prompt construído a partir do template de imagem + título do artigo
   - Custo fixo estimado: $0.002 por imagem
9. **Upload de imagem** para Supabase Storage (`quiz-media` bucket)
10. **SEO: Links internos automáticos** — bigram matching contra títulos existentes
11. **Geração de slug** único
12. **Inserção do post** em `blog_posts`
13. **Atualização do log** com custos finais e `status = 'success'`
14. **Atualização do prompt de imagem** usado (`last_used_at`, `usage_count`)

**Tabela de custos por modelo:**
| Modelo | Input ($/1M tokens) | Output ($/1M tokens) |
|--------|--------------------|--------------------|
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4-turbo | $10.00 | $30.00 |

### 3.3 `blog-sitemap` (SEO)

**Gera:** XML sitemap dinâmico com todos os posts publicados

**Inclui:**
- `<url>` para cada post com `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`
- Alternates `<xhtml:link>` para i18n (hreflang)

### 3.4 `track-blog-view` (analytics)

**Chamado por:** Frontend ao carregar artigo

**Lógica:** Incrementa `views_count` via função SQL `increment_blog_views(slug)`

### 3.5 `regenerate-blog-asset` (regeneração)

**Usado por:** Admin para regenerar imagem ou texto de um post existente

---

## 4. SEO Avançado

### 4.1 JSON-LD (Structured Data)
Cada artigo inclui:
- `Article` schema com author, datePublished, image
- `FAQPage` schema (gerado pela IA no campo `faq_schema`)
- `BreadcrumbList` schema

### 4.2 Hreflang (i18n)
```html
<link rel="alternate" hreflang="pt" href="..." />
<link rel="alternate" hreflang="en" href="..." />
<link rel="alternate" hreflang="es" href="..." />
```

### 4.3 Links Internos Automáticos
- Algoritmo de bigram matching entre o conteúdo do novo artigo e títulos existentes
- Injeta até 3 links internos relevantes no corpo do artigo
- Armazenados em `internal_links` (JSONB) para auditoria

### 4.4 Meta Tags
- `meta_title` (≤60 chars)
- `meta_description` (≤160 chars)
- `og:image` (Open Graph)
- `seo_keywords` (array)

---

## 5. Frontend

### 5.1 Listagem (`/blog`)
- Grid responsivo de cards
- Filtro por categoria
- Paginação
- Reading time badge
- Lazy loading de imagens

### 5.2 Artigo (`/blog/:slug`)
- Renderização HTML segura (DOMPurify)
- Tipografia profissional (Tailwind Typography `prose`)
- JSON-LD injetado via `<script type="application/ld+json">`
- Tracking de views automático
- Compartilhamento social

### 5.3 Admin (`/admin > Blog`)
- Gestão de posts (criar, editar, publicar, deletar)
- Configurações de automação (modelo, frequência, temas)
- Prompts de imagem (CRUD, preview de estilos)
- Geração manual (botão "Gerar Agora")

---

## 6. Como Replicar em Outro Projeto Lovable

### Passo 1: Criar tabelas
Execute as queries SQL da seção 2 para criar as 4 tabelas.

### Passo 2: Configurar secrets
- `OPENAI_API_KEY` — chave da OpenAI para geração de texto
- `LOVABLE_API_KEY` — (já disponível) para geração de imagem via Gemini

### Passo 3: Criar Edge Functions
Copie e adapte as 5 funções:
1. `blog-cron-trigger/index.ts`
2. `generate-blog-post/index.ts`
3. `blog-sitemap/index.ts`
4. `track-blog-view/index.ts`
5. `regenerate-blog-asset/index.ts`

**Adapte:**
- Tópicos default para seu nicho
- System prompt para o tom/estilo do seu blog
- URLs base do projeto
- Categorias e tags relevantes
- Nome do autor default

### Passo 4: Configurar pg_cron
```sql
SELECT cron.schedule(
  'blog-cron-trigger',
  '0 */12 * * *', -- a cada 12 horas
  $$SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/blog-cron-trigger',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
```

### Passo 5: Inserir estilos de imagem
```sql
INSERT INTO blog_image_prompts (name, prompt_template, style_description) VALUES
('3D Objects', 'Create a 3D rendered scene...', 'Renderização 3D estilizada'),
('Pop Art', 'Create a vibrant pop-art style...', 'Estilo pop-art colorido'),
('Flat Lay', 'Create a top-down flat lay...', 'Composição flat lay'),
('Hyperrealism', 'Create a photorealistic...', 'Hiper-realismo conceitual'),
('Abstract Gradient', 'Create abstract gradient...', 'Gradientes abstratos');
```

### Passo 6: Inserir configuração inicial
```sql
INSERT INTO blog_settings (is_active, ai_model, cron_schedule, default_author, auto_publish)
VALUES (true, 'gpt-4o-mini', 'every_24h', 'SeuApp', true);
```

### Passo 7: Criar componentes frontend
- `BlogList.tsx` — listagem com grid
- `BlogPost.tsx` — leitura de artigo
- `BlogManager.tsx` — admin panel
- `BlogSettings.tsx` — configurações

---

## 7. Deduplicação de Temas

O sistema evita repetição de temas usando 3 estratégias:

1. **Pool de tópicos** — lista de 40+ temas pré-definidos ou customizados
2. **Exclusão por título** — busca os últimos 20 títulos publicados
3. **Contexto no prompt** — envia títulos anteriores como instrução negativa para a IA

```
ARTIGOS JÁ PUBLICADOS (NÃO repita):
- Como quizzes aumentam conversão...
- Quiz vs formulário tradicional...
Escolha um ângulo NOVO e DIFERENTE.
```

---

## 8. Sistema de Custos

Cada geração registra:
- **Tokens de texto** — prompt + completion (reportados pela OpenAI)
- **Custo de texto** — calculado pela tabela de preços do modelo
- **Custo de imagem** — estimativa fixa ($0.002 por imagem Gemini)
- **Custo total** — text + image

Dashboard admin mostra:
- Total gasto (texto + imagem)
- Custo médio por artigo
- Breakdown por modelo
- Gráfico mensal

---

## 9. Considerações de Performance

- **Geração de texto**: 15-30s (depende do modelo e tamanho)
- **Geração de imagem**: 5-15s
- **Upload**: 1-3s
- **Total por artigo**: ~30-60s
- **Rate limit OpenAI**: respeitado pelo intervalo do cron
- **Storage**: imagens em Supabase Storage (bucket público)

---

## 10. Integração com Email

O sistema de blog se integra com o sistema de email via:
- **`send-blog-digest`** — envia resumo dos novos artigos para usuários
- **`included_in_digest`** — flag em `blog_posts` para evitar reenvio
- **Conteúdo dinâmico** — IA gera HTML do digest baseado nos artigos recentes
