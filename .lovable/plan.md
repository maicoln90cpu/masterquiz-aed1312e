

## Plano — Etapa E (correções pós-padronização do header)

Dois itens independentes, ambos pequenos e seguros.

---

### Item 1 — Lint rule: forçar uso de `LandingHeader` em páginas públicas

**Objetivo:** evitar que alguém recrie um header local em uma nova página pública (regressão que aconteceu com `/precos` e `/faq`).

**Como fazer:**
Adicionar regra `no-restricted-syntax` no `eslint.config.js`, escopada apenas para arquivos dentro de `src/pages/` que sejam públicos (lista explícita: `Pricing.tsx`, `FAQ.tsx`, `Compare*.tsx`, `Blog*.tsx`, `Index.tsx`).

A regra detecta uso direto da tag JSX `<header>` nesses arquivos e emite erro com mensagem orientando a usar `<LandingHeader />`.

```js
{
  files: [
    "src/pages/Pricing.tsx",
    "src/pages/FAQ.tsx",
    "src/pages/Compare*.tsx",
    "src/pages/Blog*.tsx",
    "src/pages/Index.tsx",
  ],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "JSXOpeningElement[name.name='header']",
        "message": "🚫 Páginas públicas devem usar <LandingHeader /> de @/components/landing/LandingHeader. Não crie <header> local — quebra navegação cross-page e botão 'Voltar para Home'."
      }
    ]
  }
}
```

**Vantagem:** proteção permanente. Se alguém amanhã criar `<header>` direto em `Pricing.tsx`, o lint falha e a CI/build avisa antes de chegar em produção.

**Desvantagem:** lint roda só em build/dev — não impede commit direto, mas captura no próximo `npm run lint`.

---

### Item 2 — Scroll ao topo ao navegar entre páginas (exceto "Recursos")

**Problema atual:**
No `useScrollToHash`, quando o usuário navega de `/blog` (já rolado para o meio) para `/compare`, o React Router preserva a posição do scroll → a nova página abre no meio.

**Comportamento desejado:**
- Clicar em **"Recursos"** → navega para `/#features` e rola até a seção (mantém comportamento atual).
- Clicar em **qualquer outro item** (Início, Preços, Comparar, Blog, FAQ, Voltar para Home) → navega para a rota e rola para o **topo da página** (`scrollTo(0, 0)`).

**Como fazer:**

**A. Em `LandingHeader.tsx` — `handleNavClick`:**
Após chamar `navigate(item.href)` para itens com `isRoute: true`, executar `window.scrollTo({ top: 0, behavior: 'instant' })`.

Para o caso âncora cross-page (`navigate('/#hero')`, `/#pricing`), também forçar topo *exceto* quando o destino for `#features` (esse é o único que deve rolar até a seção).

**B. Em `handleBackHome`:** adicionar `window.scrollTo(0, 0)` após `navigate('/')`.

**C. Lógica resumida:**

```text
Item clicado          → Comportamento
─────────────────────────────────────────
Início (#hero)        → /  + scroll topo
Recursos (#features)  → /#features + scroll suave até seção  ← ÚNICO que rola
Preços (/precos)      → /precos + scroll topo
Comparar (/compare)   → /compare + scroll topo
Blog (/blog)          → /blog + scroll topo
FAQ (/faq)            → /faq + scroll topo
Voltar para Home      → / + scroll topo
Logo                  → / + scroll topo (já é hero, ok)
```

**Por que não usar um `ScrollToTop` global?**
Porque "Recursos" é exceção — precisa preservar o scroll-to-hash. Solução localizada no header é mais cirúrgica e não afeta navegação programática de outros lugares (ex.: redirects pós-login).

---

### Arquivos alterados

1. `eslint.config.js` — adicionar bloco com `no-restricted-syntax` para páginas públicas.
2. `src/components/landing/LandingHeader.tsx` — ajustar `handleNavClick` e `handleBackHome` para forçar scroll ao topo (exceto `#features`).

---

### Checklist manual de validação

1. **Lint rule:**
   - Rodar `npm run lint` — não deve haver erros novos (páginas públicas já usam `LandingHeader`).
   - Teste de regressão: criar temporariamente `<header>Teste</header>` em `Pricing.tsx` → lint deve falhar com a mensagem customizada. Reverter.

2. **Scroll behavior:**
   - Em `/blog`, rolar para o meio → clicar "Comparar" → `/compare` deve abrir no **topo**.
   - Em `/blog`, rolar para o meio → clicar "Recursos" → `/` deve abrir e rolar até a seção features (comportamento mantido).
   - Em `/precos`, rolar para baixo → clicar "FAQ" → `/faq` no topo.
   - Em `/compare`, clicar "Voltar para Home" → `/` no topo (não no hero scroll suave, instantâneo).
   - Em `/`, clicar "Recursos" → continua scroll suave até features (não recarrega).

---

### Pendências / futuras melhorias

- Avaliar se outros pontos do app (ex.: links do footer) também precisam de scroll-to-top — fora do escopo desta etapa.
- Considerar adicionar testes Playwright para os 6 fluxos de navegação do header (sugestão futura, sem urgência).

### Prevenção de regressão

- **Lint rule** já é a proteção do item 1.
- Para o item 2, o comportamento fica centralizado em `handleNavClick` — qualquer novo item adicionado ao `navItems` herda o scroll-to-top automaticamente, exceto se explicitamente marcado para preservar hash.

