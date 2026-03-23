

## Auditoria Completa do Rastreio de CTA

### Diagnóstico confirmado

**Problema raiz: `sendBeacon` nao funciona com Supabase Edge Functions.**

O gateway do Supabase exige o header `apikey` em TODAS as requisicoes — mesmo com `verify_jwt = false`. O `navigator.sendBeacon()` NAO permite enviar headers customizados. Resultado: o beacon eh rejeitado silenciosamente (401) e nenhum dado chega na edge function.

Evidencias:
- `quiz_cta_click_analytics` tem **0 registros** (nenhum clique rastreado)
- Logs da edge function mostram apenas boot/shutdown, nenhum request processado
- `quiz_step_analytics` tem 8 sessoes em TODOS os steps (0-9), todas com 47% (8/17 views)
- O 47% uniforme eh correto dado os dados — simplesmente o tracking de CTA nunca funcionou

**Sobre o "47% em tudo":** Os 8 usuarios que iniciaram o quiz navegaram ate o final (step 9). Como o tracking de step normal grava ao avancar, step 9 ja esta registrado. O CTA nao esta adicionando dados extras porque nunca foi gravado.

**Sobre "onde esta o card de CTAs":** O card so aparece quando `ctaSummary.length > 0`, que exige dados em `quiz_cta_click_analytics`. Como a tabela esta vazia, o card nunca renderiza.

---

### Plano de correcao (Etapa 1 de 2)

#### 1. Corrigir `useCtaTracking.ts` — Abandonar `sendBeacon`, usar `fetch` com `apikey`

O `sendBeacon` eh incompativel com o gateway Supabase. A correcao:
- Remover `sendBeacon` completamente
- Usar `fetch` com `keepalive: true` + header `apikey` (funciona para fire-and-forget)
- Adicionar header `Authorization: Bearer <anonKey>` tambem (belt-and-suspenders)
- Manter o `window.open` DEPOIS do fetch (nao esperar resposta)

#### 2. Corrigir edge function `track-cta-redirect` — Remover logica duplicada de completions

A funcao atual tem logica redundante e incorreta:
- Chama `increment_blog_views` (funcao de blog, nao de quiz)
- Faz upsert + select + update em `quiz_analytics` de forma nao atomica
- Pode criar contagens duplicadas

Simplificar: um unico fluxo select → update/insert para `completions`.

#### 3. Verificar propagacao do `onCtaClick` nos blocos

Confirmar que `QuizBlockPreview` propaga `onCtaClick` para `ButtonBlockPreview`, que eh o bloco usado na ultima etapa do quiz de teste.

---

### Arquivos a modificar

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useCtaTracking.ts` | Substituir sendBeacon por fetch com apikey header |
| `supabase/functions/track-cta-redirect/index.ts` | Limpar logica duplicada de completions |

### Vantagens
- Resolve a causa raiz (header apikey ausente)
- Mais confiavel que sendBeacon para este caso
- Edge function mais limpa e sem efeitos colaterais incorretos

### Desvantagens
- `fetch` com `keepalive` tem limite de ~64KB por pagina (mais que suficiente para tracking)
- Se o browser fechar antes do fetch iniciar (raro em `_blank`), perde o evento

### Checklist manual pos-implementacao
1. Responder quiz `teste-metricas` e clicar no CTA da ultima etapa
2. Verificar no banco: `SELECT * FROM quiz_cta_click_analytics` deve ter registro com `cta_text` preenchido
3. Verificar logs da edge function `track-cta-redirect` — deve mostrar mensagem de sucesso
4. Recarregar planilha de dados — card "Performance dos CTAs" deve aparecer com ranking
5. Retenção da ultima etapa deve refletir o merge de step analytics + CTA clicks

### Como usar
- O criador do quiz nao precisa fazer nada diferente
- Na ultima etapa de um quiz funil, qualquer botao/banner/link com acao de redirecionamento sera rastreado automaticamente
- O card "Performance dos CTAs" aparecera na planilha de dados apos o primeiro clique rastreado
- O card mostra: texto do CTA, numero de cliques, e % de clique (CTR) em relacao ao total de visitantes

### Proxima fase (Etapa 2)
- Adicionar coluna "CTA Clicado" na tabela de respostas individuais
- Exibir no detalhe da resposta qual CTA o usuario clicou
- Dashboard de conversao por CTA no Analytics

