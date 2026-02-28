

## Correção: Logo Carousel — Overlap em Mobile/Tablet

### Problema
`max-h-8` limita altura mas logos largas (PerfectPay, Kirvano, Monetizze) mantêm largura excessiva, causando sobreposição. O `mr-12` (48px) não é suficiente para compensar.

### Solução (arquivo: `src/components/landing/LogoCarousel.tsx`)

1. **Adicionar `max-w` responsivo nas imagens:**
   - Mobile: `max-w-[80px] max-h-6`
   - sm (640px+): `max-w-[110px] max-h-8`
   - md (768px+): `max-w-none max-h-14` (sem restrição de largura)

2. **Aumentar gap mínimo em mobile:**
   - Mobile: `mr-10` (40px) — suficiente com logos menores
   - sm: `mr-14` (56px)
   - md: `mr-[100px]` (mantém atual)

3. **Atualizar cálculo do gap no JS** para corresponder aos novos valores CSS (40, 56, 100).

### Resultado esperado
Logos nunca ultrapassam 80px de largura em mobile, eliminando sobreposição. Desktop inalterado.

---

## Fases restantes do Blog

- **Fase 4:** Edge Function `generate-blog-post` — geração de conteúdo via OpenAI/Gemini + imagem + upload Bunny.net
- **Fase 5:** Edge Function `blog-cron-trigger` — disparo automático via pg_cron
- **Fase 6:** Edge Function `blog-sitemap` + RSS Feed para SEO
- **Fase 7:** Rastreamento server-side de views por post
- **Fase 8:** Internal linking automático + FAQ schema markup

