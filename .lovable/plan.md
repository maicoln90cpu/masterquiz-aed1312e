

## Plano: Editor de Landing Page com suporte a Modo A e Modo B

### Problema
A tabela `landing_content` não tem coluna `site_mode` — todas as entradas são usadas apenas no Modo A. Quando o admin troca para Modo B, o editor continua mostrando o mesmo conteúdo.

### Solução

#### 1. Migration: Adicionar `site_mode` à tabela `landing_content`
- Adicionar coluna `site_mode TEXT DEFAULT 'A'` à tabela
- Marcar todas as entradas existentes como `site_mode = 'A'`
- Duplicar todas as 14 entradas hero com `site_mode = 'B'` e copy apropriada para o modo pago:
  - `hero_cta_primary` → "Escolher meu plano"
  - `hero_cta_secondary` → "Ver planos"
  - `hero_trust_1` → "15 dias de garantia"
  - `hero_trust_2` → "Acesso imediato"
  - `hero_trust_3` → "Suporte prioritário"
  - `hero_headline_main` → "Transforme cliques em decisões antes do checkout" (mesmo)
  - `hero_badge` → "Plataforma completa de quizzes"
  - Bullets ajustados para remover menção a "grátis"

#### 2. Hook `useLandingContent` — filtrar por site_mode
- Atualizar a query para receber o `siteMode` atual e filtrar `WHERE site_mode = ?`
- Ou carregar tudo e filtrar no client (mais simples, cache único)

#### 3. `LandingContentEditor.tsx` — toggle Modo A/B
- Importar `useSiteMode` para mostrar o modo atual
- Adicionar um seletor/tabs "Modo A" / "Modo B" no topo do editor
- Filtrar `contentByCategory` pelo `site_mode` selecionado
- Preview adapta-se ao modo selecionado

#### 4. `HeroSection.tsx` — usar conteúdo do modo correto
- O `useLandingContent` já filtra pelo `siteMode`, então o fallback condicional existente (`isModeB`) continua como backup mas o CMS assume prioridade

### Arquivos a modificar
| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `site_mode`, duplicar entradas para Modo B |
| `src/hooks/useLandingContent.ts` | Filtrar por `site_mode` |
| `src/components/admin/LandingContentEditor.tsx` | Tabs Modo A/B, filtro |
| `src/integrations/supabase/types.ts` | Adicionar `site_mode` ao tipo |

