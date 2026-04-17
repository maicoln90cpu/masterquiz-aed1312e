# 🚀 ONBOARDING — Guia para Novos Desenvolvedores

> Configure o ambiente e entenda o projeto em menos de 1 dia
> Versão 2.42.0 | 17 de Abril de 2026

---

## ⏱️ Roteiro (estimativa: 4-6 horas)

| Etapa | Tempo | O que fazer |
|-------|-------|-------------|
| 1. Setup | 30 min | Clonar, instalar, rodar |
| 2. Arquitetura | 60 min | Ler SYSTEM_DESIGN.md |
| 3. Código | 90 min | Explorar páginas principais |
| 4. Database | 60 min | Ler DATABASE_SCHEMA.md |
| 5. Segurança | 30 min | Ler SECURITY.md |
| 6. Padrões | 30 min | Ler CODE_STANDARDS.md |
| 7. Teste | 30 min | Rodar testes, criar um quiz |

---

## 1️⃣ Setup (30 min)

```bash
git clone <REPO_URL>
cd masterquiz
npm install    # ou bun install
npm run dev    # localhost:5173
```

### Variáveis de ambiente
O `.env` já vem configurado com:
- `VITE_SUPABASE_URL` — URL do Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Chave pública (anon)

### Secrets (Edge Functions)
Configurados no Supabase Dashboard → Settings → Functions (ver README.md para lista completa).

---

## 2️⃣ Entendendo a Arquitetura (60 min)

### Resumo em 1 minuto
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend**: Supabase (PostgreSQL + RLS + 64 Edge Functions + Auth + Storage)
- **Pagamento**: Kiwify (webhook)
- **Email**: E-goi (Bulk API)
- **WhatsApp**: Evolution API
- **Vídeo**: Bunny CDN

### Fluxo principal
```
Landing → Login → Dashboard → Quiz Editor → Publish → Quiz Público → Lead → CRM → Analytics
```

### Leia estes docs (nesta ordem)
1. **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)** — Arquitetura completa
2. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** — Tabelas e relações
3. **[CODE_STANDARDS.md](./CODE_STANDARDS.md)** — Como escrever código

---

## 3️⃣ Código: Onde Encontrar o Quê

| Preciso de... | Arquivo/Pasta |
|---------------|---------------|
| Rotas da aplicação | `src/App.tsx` |
| Páginas | `src/pages/` |
| Editor de quiz | `src/pages/CreateQuizClassic.tsx` / `CreateQuizModern.tsx` |
| Quiz público (visitante) | `src/pages/QuizView.tsx` + `src/components/quiz/view/` |
| 34 tipos de blocos | `src/types/blocks.ts` + `src/components/quiz/blocks/` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Support mode | `src/contexts/SupportModeContext.tsx` |
| Hooks | `src/hooks/` (35+) |
| Utilitários | `src/lib/` (calculator, sanitize, logger) |
| Edge Functions | `supabase/functions/` (64 funções) |
| Tipos Supabase (auto-gerado) | `src/integrations/supabase/types.ts` (read-only) |
| Traduções (i18n) | `src/i18n/` |
| Admin dashboard | `src/pages/AdminDashboard.tsx` |
| Componentes UI base | `src/components/ui/` (shadcn) |

---

## 4️⃣ Conceitos-Chave

### Thin Router Pattern
O `CreateQuiz.tsx` não tem hooks — só decide se carrega Classic ou Modern via lazy loading. Hooks pesados vivem dentro de cada variante.

### Blocos (34 tipos)
Cada pergunta pode ter N blocos anexados (countdown, image, price, nps, etc.). Tipos definidos em `src/types/blocks.ts`.

### RLS
Todas as tabelas têm Row Level Security. Admin usa `has_role()` (SECURITY DEFINER). Ver [SECURITY.md](./SECURITY.md).

### Modo Suporte
Master admins podem "impersonar" usuários via `SupportModeContext` sem trocar de conta. Dados acessados via `admin-view-user-data` Edge Function.

### TanStack Query
Todo dado do servidor passa por TanStack Query (cache, refetch, mutations). Nunca usar `useState` + `useEffect` + `fetch` diretamente.

---

## 5️⃣ Rodando Testes

```bash
npm run test                # Single run
npm run test -- --watch     # Watch mode
npm run test -- --coverage  # Cobertura
```

Setup global em `src/__tests__/setup.ts`. Padrões em [TESTING.md](./TESTING.md).

---

## 6️⃣ Primeiro Exercício

1. Faça login no preview
2. Crie um quiz com 3 perguntas
3. Publique e abra a URL pública
4. Responda o quiz e veja o lead no CRM
5. Vá ao painel admin e explore as abas

---

## 📚 Mapa de Documentação

| Doc | Para quê |
|-----|----------|
| [README.md](../README.md) | Setup e visão geral |
| [CHANGELOG.md](../CHANGELOG.md) | Histórico de versões (Keep a Changelog) |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica + diagrama Mermaid |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema do banco (68 tabelas) |
| [SECURITY.md](./SECURITY.md) | RLS, auth, rate limiting |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões de código |
| [HOOKS.md](./HOOKS.md) | Catálogo de 60+ hooks (`npm run docs:api`) |
| [SERVICES.md](./SERVICES.md) | Service layer (observability, GTM diag) |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo das 64 funções |
| [API_DOCS.md](./API_DOCS.md) | Payloads detalhados |
| [COMPONENTS.md](./COMPONENTS.md) | Componentes React |
| [BLOCKS.md](./BLOCKS.md) | 34 tipos de blocos |
| [TESTING.md](./TESTING.md) | Testes automatizados |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Formatação e linting |
| [ADR.md](./ADR.md) | Decisões arquiteturais (016 ADRs) |
| [PRD.md](./PRD.md) | Requisitos do produto |
| [ROADMAP.md](./ROADMAP.md) | Planejamento |
| [PENDENCIAS.md](./PENDENCIAS.md) | Changelog interno |
| [BLOG.md](./BLOG.md) | Blog com IA |
| [EGOI.md](./EGOI.md) | Email marketing |
| [MONETIZATION.md](./MONETIZATION.md) | Modos A/B |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação |
| [AUDIT_TEMPLATE.md](./AUDIT_TEMPLATE.md) | Template de auditoria |
| [MEMOCOPY.md](./MEMOCOPY.md) | Backup de memórias |
