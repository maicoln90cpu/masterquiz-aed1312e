

# Plano: Correcoes de Email, Subject B, Bulk API e Melhorias de Conteudo

## Diagnostico

| Item | Status | Problema |
|------|--------|----------|
| `subject_b` no editor | NAO implementado | Campo nao existe no modal `EmailRecoveryTemplates.tsx` |
| Bulk API E-goi | NAO implementado | Todos os envios usam `/send/single` — endpoint correto e `/v2/email/messages/action/send/bulk` |
| CTA dos emails | Quebrado | VML condicional renderiza mal — botao aparece distorcido (prints 3 e 4) |
| Blog Digest intro | Generico | "Publicamos novos conteudos..." pouco engajante |
| Weekly Tip | Robotico | Texto compactado, sem espacamento, tom de tutorial |
| Categorias no editor | Incompletas | Faltam milestone, tutorial, survey, plan_compare, integration_guide, re_engagement |

---

## Mudancas

### 1. Adicionar campo `subject_b` no editor de templates

**Arquivo**: `src/components/admin/recovery/EmailRecoveryTemplates.tsx`

- Adicionar `subject_b` ao form state (inicializado como `''`)
- Adicionar campo de input "Assunto B (Teste A/B)" abaixo do campo de assunto principal
- Placeholder: "Deixe vazio para nao usar teste A/B"
- Incluir `subject_b` no `save()` e no `openEdit()`
- Adicionar `subject_b` ao tipo `EmailTemplate`
- Expandir array `CATEGORIES` com as 7 categorias novas (milestone, tutorial, survey, plan_compare, integration_guide, re_engagement, webinar)

### 2. Corrigir CTA (botao) em todos os emails

**Arquivo**: `supabase/functions/generate-email-content/index.ts`

O problema esta no `makeButton()` — o VML condicional para Outlook interfere com a renderizacao em clientes modernos. Correcao:

**Antes** (funcao `makeButton`):
```html
<table><tr><td>
<!--[if mso]><v:roundrect...>...<![endif]-->
<!--[if !mso]><!--><a href="..." style="display:inline-block;padding:14px 32px;...">Texto</a><!--<![endif]-->
</td></tr></table>
```

**Depois**: Usar abordagem padding-based com fallback VML separado que nao quebra em Gmail/Apple Mail:
```html
<table width="100%"><tr><td align="center" style="padding:24px 0;">
<table><tr><td style="background:#0f9b6e;border-radius:8px;text-align:center;">
<a href="..." style="display:inline-block;padding:14px 32px;color:#fff;background:#0f9b6e;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;mso-padding-alt:0;text-underline-color:#0f9b6e;">
<!--[if mso]><i style="mso-font-width:150%;mso-text-raise:24pt;" hidden>&emsp;</i><span style="mso-text-raise:12pt;"><!--<![endif]-->
Texto
<!--[if mso]></span><i style="mso-font-width:150%;" hidden>&emsp;&#8203;</i><!--<![endif]-->
</a>
</td></tr></table>
</td></tr></table>
```

### 3. Melhorar conteudo dos emails dinamicos

**Arquivo**: `supabase/functions/generate-email-content/index.ts`

#### Blog Digest — Antes vs Depois

| | Antes | Depois |
|---|---|---|
| Saudacao | "Ola, {name}! 👋" | "Ola, {name}! 👋" (manter) |
| Intro | "Publicamos novos conteudos no blog para te ajudar a captar mais leads com quizzes." | "{N} artigos fresquinhos saíram do forno! 🔥 Cada um deles traz insights práticos que você pode aplicar hoje mesmo para turbinar seus resultados com quizzes." |
| Cards | Sem separacao visual forte | Adicionar divider sutil entre cards, melhorar tipografia do excerpt |

#### Weekly Tip — Antes vs Depois

| | Antes | Depois |
|---|---|---|
| Prompt IA | "Gere uma dica pratica... max 200 palavras" | Prompt reformulado: tom conversacional, analogias do dia-a-dia, parágrafos curtos, emojis naturais, como se um amigo especialista estivesse contando. Min 250 palavras, max 400. Incluir "por que isso importa" + "como aplicar em 3 passos" |
| Layout | Bloco unico de texto com borda esquerda | Secao "Por que isso importa" em destaque + lista numerada de passos com icones + separadores visuais |
| Espacamento | `padding:16px 20px` compacto | Padding generoso `24px 28px`, `line-height:1.8`, `margin-bottom:16px` entre paragrafos |
| CTA | "Coloque essa dica em pratica agora mesmo!" | "Bora colocar isso em pratica? Seu proximo quiz pode ser o melhor que voce ja fez. 💪" |

#### Success Story — Ajustes finos

- Aumentar padding interno das secoes Desafio/Solucao
- Adicionar `line-height:1.7` nos paragrafos
- Metricas: fonte maior (32px -> 36px), mais espaco entre colunas

#### Monthly Summary — Ajustes finos

- Cards de metricas: padding 16px -> 20px
- Insight: `line-height:1.8`
- Adicionar frase motivacional antes do CTA

#### Platform News — Ajustes finos

- Lista de novidades: `line-height:1.7`, `margin-bottom:12px` entre items
- Padding da caixa verde: 20px -> 28px

### 4. Implementar E-goi Bulk API

**Arquivos**: `send-blog-digest`, `send-weekly-tip`, `send-success-story`, `send-platform-news`

Endpoint correto: `POST https://slingshot.egoiapp.com/api/v2/email/messages/action/send/bulk`

Payload (array de ate 100 items):
```json
[{
  "domain": "masterquizz.com",
  "senderId": "...",
  "senderName": "MasterQuizz",
  "to": ["user@email.com"],
  "subject": "...",
  "htmlBody": "...",
  "openTracking": true,
  "clickTracking": true
}]
```

Logica:
- Agrupar destinatarios em lotes de 100
- Cada item do lote tem o HTML personalizado (first_name ja substituido)
- Uma unica chamada API por lote vs 100 chamadas individuais
- Manter `/send/single` para test mode e `send-monthly-summary` (conteudo unico por usuario)

**Como testar**: Disparar "Blog Digest" ou "Dica da Semana" via botao teste na UI e verificar nos logs da Edge Function se a chamada usa `/send/bulk` ao inves de `/send/single`. Tambem pode verificar no painel E-goi > Logs se os envios aparecem agrupados.

### 5. Redeploy de Edge Functions

Apos todas as alteracoes, deploy de: `generate-email-content`, `send-blog-digest`, `send-weekly-tip`, `send-success-story`, `send-platform-news`.

---

## Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/components/admin/recovery/EmailRecoveryTemplates.tsx` | Campo subject_b + categorias novas |
| `supabase/functions/generate-email-content/index.ts` | CTA fix + conteudo melhorado em todos os templates |
| `supabase/functions/send-blog-digest/index.ts` | Bulk API |
| `supabase/functions/send-weekly-tip/index.ts` | Bulk API |
| `supabase/functions/send-success-story/index.ts` | Bulk API |
| `supabase/functions/send-platform-news/index.ts` | Bulk API |

## Checklist

- [ ] Abrir modal de edicao de template e verificar campo "Assunto B"
- [ ] Enviar email teste de Blog Digest e verificar CTA renderiza corretamente
- [ ] Enviar email teste de Dica da Semana e verificar espacamento/tom
- [ ] Verificar logs da Edge Function para confirmar uso de `/send/bulk`
- [ ] Testar categorias novas no dropdown do editor

## Vantagens

- CTA consistente em todos os clientes de email (Gmail, Outlook, Apple Mail)
- Emails com tom mais humano aumentam open rate e engajamento
- Bulk API reduz tempo de envio de minutos para segundos
- A/B testing acessivel diretamente pelo editor visual

## Proximas fases

- Webhooks E-goi para tracking de bounces em tempo real
- MJML compiler para compatibilidade garantida
- Segmentacao avancada por comportamento

