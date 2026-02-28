

## Plano: CSS Profissional para Artigos + Imagem Obrigatória + RSS no Blog

### 1. CSS avançado para artigos do blog (`src/index.css`)
Adicionar bloco de estilos customizados para a classe `prose` usada nos artigos:
- **Headings**: `h2` com `font-size: 1.75rem`, `font-weight: 700`, `margin-top: 2.5rem`, `margin-bottom: 1rem`, borda inferior sutil
- **H3**: `font-size: 1.35rem`, `font-weight: 600`, `margin-top: 2rem`, `margin-bottom: 0.75rem`
- **Parágrafos**: `line-height: 1.8`, `margin-bottom: 1.25rem`
- **Listas** (ul/ol): `margin: 1.5rem 0`, `padding-left: 1.5rem`, `li` com `margin-bottom: 0.5rem`, `line-height: 1.7`
- **Strong/Bold**: `font-weight: 700`, cor ligeiramente diferente
- **Links**: cor primary, underline on hover
- **Blockquote**: borda esquerda primary, padding, background sutil
- **Separadores visuais** entre seções

### 2. Imagem destaque obrigatória (`supabase/functions/generate-blog-post/index.ts`)
**Problema**: Os 2 posts existentes têm `featured_image_url: null` — a imagem não foi gerada ou o upload falhou silenciosamente.
**Correção**: Após a seção de geração de imagem (linha ~489), adicionar fallback: se `featuredImageUrl` ainda é `null`, gerar uma imagem placeholder via URL de serviço externo (ex: `https://placehold.co/1200x630/10B981/FFFFFF?text=MasterQuiz`) ou usar uma imagem padrão do CDN. Também atualizar os 2 posts existentes via SQL para ter uma imagem.

### 3. RSS acessível no Blog (`src/pages/Blog.tsx`)
O RSS já existe na Edge Function `blog-sitemap?format=rss`. Falta apenas:
- Adicionar link RSS no header do Blog (ícone RSS com link para `/functions/v1/blog-sitemap?format=rss`)
- Adicionar `<link rel="alternate" type="application/rss+xml">` no `BlogSEOHead`

### 4. SQL: Atualizar posts existentes com imagem placeholder

---

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/index.css` | Estilos profissionais para `.prose` (blog articles) |
| `src/pages/BlogPost.tsx` | Ajustar classes prose para usar os novos estilos |
| `supabase/functions/generate-blog-post/index.ts` | Fallback de imagem quando geração falha |
| `src/pages/Blog.tsx` | Botão RSS + link `<head>` |
| `src/components/blog/BlogSEOHead.tsx` | Tag `<link>` RSS no head |
| Migration SQL | Atualizar `featured_image_url` dos 2 posts existentes |

