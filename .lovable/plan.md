

# Diagnóstico e Correção — Webhook Kiwify não processa pagamentos reais

## Problema encontrado

O webhook da Kiwify envia dados **reais** dentro de `body.order`:
```text
{
  "order": {
    "webhook_event_type": "order_approved",
    "Customer": { "email": "eumonicamanhaes@gmail.com" },
    "Product": { "product_name": "Master Quiz" },
    "Subscription": { "plan": { "name": "Partner" } }
  }
}
```

Mas o código atual procura em `body.Customer`, `body.event`, `body.Product` (nível raiz). O teste da Kiwify usa formato plano, por isso os testes funcionam e aparecem nos logs (`johndoe@example.com`). Pagamentos reais nunca são processados porque os dados não são encontrados na estrutura esperada.

Além disso, o produto se chama "Master Quiz" mas o plano na Kiwify é "Partner" — o `mapProductToPlanType` precisa considerar o nome do plano de assinatura (`Subscription.plan.name`), não apenas o nome do produto.

## O que será feito

**Arquivo:** `supabase/functions/kiwify-webhook/index.ts`

1. **Extrair dados do wrapper `order`**: Se `body.order` existir, usar seus campos como fonte primária
2. **Melhorar extração de evento**: Priorizar `body.order.webhook_event_type` → `body.order.order_status` → fallbacks atuais
3. **Melhorar extração de email**: `body.order.Customer.email` → fallbacks atuais
4. **Usar nome do plano de assinatura**: Verificar `body.order.Subscription.plan.name` além do nome do produto para mapear o plano correto (Partner)
5. **Atualizar manualmente o plano da Monica** via admin-update-subscription após o deploy

## Como fica

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Payload real da Kiwify | Ignorado (dados não encontrados) | Parseado corretamente via `body.order` |
| Mapeamento de plano | Só olha nome do produto | Olha nome do plano de assinatura também |
| Plano "Partner" | Nunca ativado automaticamente | Ativado via `Subscription.plan.name = "Partner"` |
| Monica (eumonicamanhaes) | free, quiz_limit=2 | partner, quiz_limit=5, response_limit=25000 |

## Checklist manual
- [ ] Após deploy, ir na Kiwify e clicar "Enviar teste" novamente
- [ ] Verificar em Admin → Kiwify → Logs se aparece o teste com status `pending` (johndoe não existe)
- [ ] Verificar se a Monica foi atualizada para plano Partner
- [ ] Fazer um novo pagamento de teste real (se possível) e confirmar ativação automática

## Risco
- Nenhum risco de quebra — apenas melhora o parsing para cobrir o formato real da Kiwify
- Formato plano (teste) continua funcionando como fallback

