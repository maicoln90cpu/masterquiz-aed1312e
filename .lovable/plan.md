

## Plano: CSS no Editor + Prompt de Imagem Premium + Regenerar Assets + Preview de Imagem

### 1. CSS avançado no editor Quill do modal (`src/index.css`)
Adicionar bloco `.blog-editor-quill .ql-editor` com os mesmos estilos profissionais do `.blog-article-content`:
- H2/H3 com tamanhos, pesos, margens e borda inferior verde
- Parágrafos com `line-height: 1.8`, `margin-bottom: 1rem`
- Listas com bullets, spacing, marcadores coloridos
- Strong em negrito, links em verde, blockquote estilizado
- Aplicar a classe `blog-editor-quill` no `<div>` que envolve o `<ReactQuill>` no modal

### 2. Prompt de imagem drasticamente melhorado (`generate-blog-post/index.ts`)
Substituir o prompt genérico por um prompt cinematográfico profissional:
- Simulação de câmera Canon EOS R5, lente 35mm f/1.4, shallow DOF
- Color grading teal/orange, composição rule of thirds
- Cena de workspace high-tech com dashboards e UI elements
- Iluminação golden hour + LED accents
- Regras absolutas: NO text, NO watermarks, NO cartoons, ONLY photorealistic

### 3. Nova Edge Function `regenerate-blog-asset`
**Arquivo:** `supabase/functions/regenerate-blog-asset/index.ts`

Endpoint que aceita `{ postId, type: "image" | "content", topic }`:
- **type=image**: Gera nova imagem via Gemini usando o prompt melhorado, faz upload no Bunny CDN, atualiza `featured_image_url` e `og_image_url` do post
- **type=content**: Gera novo conteúdo via OpenAI/Lovable Gateway, atualiza content, excerpt, meta_description, seo_keywords, tags, categories e faq_schema do post
- Usa as mesmas settings de `blog_settings` (model, prompts)

### 4. BlogPostsManager atualizado (`src/components/admin/blog/BlogPostsManager.tsx`)

**Na tabela de posts:**
- Nova coluna "Imagem" com thumbnail 64x40px clicável (abre preview em dialog)
- Botão azul (ícone ImageIcon) para regenerar imagem por post
- Botão laranja (ícone RefreshCw) para regenerar conteúdo por post
- Ambos com loading spinner durante a operação

**No modal de edição:**
- Preview da imagem destaque no topo do formulário (full-width, max-h 300px)
- Botão "Regenerar Imagem" sobreposto na imagem
- Botão "Regenerar Conteúdo" ao lado do label "Conteúdo"
- Classe `blog-editor-quill` no container do ReactQuill para aplicar os estilos

**Dialog de preview de imagem:**
- Dialog dedicado ao clicar na thumbnail da tabela (imagem em tamanho grande)

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/index.css` | Bloco `.blog-editor-quill .ql-editor` com estilos profissionais |
| `supabase/functions/generate-blog-post/index.ts` | Prompt de imagem cinematográfico |
| `supabase/functions/regenerate-blog-asset/index.ts` | **NOVO** — regenerar imagem ou conteúdo individualmente |
| `src/components/admin/blog/BlogPostsManager.tsx` | Thumbnail, preview dialog, botões regenerar, CSS no editor |

