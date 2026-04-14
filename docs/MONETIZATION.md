# 💰 MONETIZATION — Guia de Monetização A/B

> Documentação do sistema de modos de monetização (Modo A: Freemium / Modo B: Apenas Pago)
> Versão 2.40 | 14 de Abril de 2026

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Modo A — Freemium](#modo-a--freemium)
- [Modo B — Apenas Pago](#modo-b--apenas-pago)
- [Tabelas e Colunas](#tabelas-e-colunas)
- [Fluxo de Checkout Dinâmico](#fluxo-de-checkout-dinâmico)
- [Comparação A×B (Admin)](#comparação-ab-admin)
- [Aba Custos de Email](#aba-custos-de-email)
- [Configuração no Admin](#configuração-no-admin)

---

## 🎯 Visão Geral

O MasterQuiz suporta dois modos de monetização que podem ser alternados pelo admin:

| Aspecto | Modo A (Freemium) | Modo B (Apenas Pago) |
|---------|-------------------|----------------------|
| Signup | Livre → Dashboard | Livre → Paywall |
| Acesso ao Dashboard | Imediato | Após pagamento confirmado |
| Free tier | Sim (limites) | Não |
| Preços | `price_monthly` | `price_monthly_mode_b` (ou fallback) |
| Checkout URL | `kiwify_checkout_url` | `kiwify_checkout_url_mode_b` (ou fallback) |

---

## 🆓 Modo A — Freemium

Fluxo padrão:

```
Signup → Dashboard (free tier) → Upgrade opcional → Checkout Kiwify → Plano pago
```

- Usuário acessa o Dashboard imediatamente
- Limites do plano gratuito (ex: 3 quizzes, 100 respostas)
- CTAs de upgrade aparecem baseados no nível PQL

---

## 💎 Modo B — Apenas Pago

Fluxo com paywall:

```
Signup → Tela de Paywall → Checkout Kiwify → Webhook confirma → Dashboard liberado
```

- Coluna `payment_confirmed` na subscription bloqueia acesso
- Webhook Kiwify seta `payment_confirmed = true`
- Preços podem ser diferentes do Modo A (ex: promoção exclusiva)

---

## 🗄 Tabelas e Colunas

### `subscription_plans`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `price_monthly` | decimal | Preço mensal Modo A |
| `price_monthly_mode_b` | decimal | Preço mensal Modo B (NULL = usar padrão) |
| `kiwify_checkout_url` | text | URL de checkout Modo A |
| `kiwify_checkout_url_mode_b` | text | URL de checkout Modo B (NULL = usar padrão) |

### `system_settings`

| Key | Valor | Descrição |
|-----|-------|-----------|
| `site_mode` | `A` ou `B` | Modo ativo atual |

### `user_subscriptions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `payment_confirmed` | boolean | Se o pagamento foi confirmado (Modo B) |

---

## 🔄 Fluxo de Checkout Dinâmico

```typescript
// Lógica no PricingSection / checkout
const getCheckoutUrl = (plan, siteMode) => {
  if (siteMode === 'B' && plan.kiwify_checkout_url_mode_b) {
    return plan.kiwify_checkout_url_mode_b;
  }
  return plan.kiwify_checkout_url;
};

const getPrice = (plan, siteMode) => {
  if (siteMode === 'B' && plan.price_monthly_mode_b) {
    return plan.price_monthly_mode_b;
  }
  return plan.price_monthly;
};
```

---

## 📊 Comparação A×B (Admin)

### Componente: `ModeComparison.tsx`

Dashboard que segmenta métricas históricas por modo:

| Métrica | Modo A | Modo B | Diferença |
|---------|--------|--------|-----------|
| Cadastros | X | Y | +Z% |
| Quizzes criados | X | Y | +Z% |
| Conversões pagas | X | Y | +Z% |

**Como funciona:**
1. Consulta `system_settings` para saber períodos de cada modo
2. Segmenta dados de `profiles`, `quizzes` e `user_subscriptions` por período
3. Calcula métricas comparativas

---

## 📧 Aba Custos de Email

### Componente: `EmailRecoveryCosts.tsx`

Cálculo detalhado de custos de email transacional:

| Card | Cálculo |
|------|---------|
| Saldo (R$) | `R$190 - (total_enviados × custo_unitário)` |
| Custo Total (R$) | `total_enviados × custo_unitário` |
| Custo por Email | `R$190 / 40.533 = R$0,00469` |
| Emails Restantes | `40.533 - total_enviados` |

**Tabela por categoria:**
- Blog Digest, Weekly Tip, Success Story, Platform News, Monthly Summary
- Recovery (process-queue), Teste
- Volume, custo individual, % do total

---

## ⚙️ Configuração no Admin

### Trocar Modo (A↔B)

1. Admin → Config → `site_mode`
2. Alterar valor para `A` ou `B`
3. Landing page, checkout e paywall se adaptam automaticamente

### Configurar Preços Modo B

1. Admin → Planos
2. Editar plano → campos "Preço Modo B" e "URL Checkout Modo B"
3. Deixar vazio para usar os mesmos valores do Modo A

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup e visão geral |
| [PRD.md](./PRD.md) | Requisitos do produto |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [PENDENCIAS.md](./PENDENCIAS.md) | Changelog |
| [EGOI.md](./EGOI.md) | Guia do email marketing |
| [BLOG.md](./BLOG.md) | Guia do blog com IA |
