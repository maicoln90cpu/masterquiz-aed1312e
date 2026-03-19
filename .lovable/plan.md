

# Plano: Atualizar Documentacao Completa + Mover para docs/

## Escopo

1. Mover todos os `.md` da raiz para `docs/` (exceto README.md que fica na raiz por convenção)
2. Atualizar conteúdo de todos os docs para v2.30 (incluindo sistema de email, automações, unsubscribe, A/B, bulk API)
3. Atualizar cross-references entre documentos
4. Criar `docs/API_DOCS.md` (endpoints Edge Functions) e `docs/COMPONENTS.md` (componentes principais)
5. Gerar prompt de knowledge atualizado no chat

## Arquivos a mover (raiz → docs/)

| De | Para |
|---|---|
| `PENDENCIAS.md` | `docs/PENDENCIAS.md` |
| `PRD.md` | `docs/PRD.md` |
| `ROADMAP.md` | `docs/ROADMAP.md` |
| `STYLE_GUIDE.md` | `docs/STYLE_GUIDE.md` |
| `CHECKLIST.md` | `docs/CHECKLIST.md` |

**README.md permanece na raiz** (padrão Git). Links internos do README apontarão para `docs/`.

## Atualizações de conteúdo por arquivo

### README.md (raiz)
- Versão → 2.30.0, data → 19 Março 2026
- Corrigir typo linha 81: `(ce(centralizado via pushGTMEvent) ntralizado...)`
- Corrigir typo linha 121: `hooks/   7` → `hooks/`
- Edge Functions: 39 → 57 (contar real: 57 pastas)
- Adicionar seção "Email Recovery & Automações" nas funcionalidades admin
- Adicionar secrets: `EGOI_API_KEY`
- Atualizar tree de `docs/` com novos arquivos
- Atualizar links: todos `./PENDENCIAS.md` → `./docs/PENDENCIAS.md` etc
- Adicionar `docs/API_DOCS.md` e `docs/COMPONENTS.md` na tabela de docs

### docs/PENDENCIAS.md
- Adicionar v2.30.0 com todas as mudanças recentes:
  - Etapa 4a-4d do Email Recovery (templates, triggers, automações IA, unsubscribe, A/B, bulk API)
  - 12 templates de email estáticos + 5 dinâmicos com IA
  - Dashboard de performance por categoria
  - Crons automáticos via migration
  - E-goi Bulk API
- Atualizar pendências abertas (remover itens concluídos)
- Atualizar links para `./` (mesma pasta docs)

### docs/PRD.md
- Versão → 2.30, data atualizada
- Adicionar RF12 — Email Marketing Automatizado (templates, automações IA, unsubscribe, A/B)
- Adicionar RF13 — Compliance Email (CAN-SPAM, LGPD, List-Unsubscribe)
- Atualizar backlog: Épico 5 (Email Recovery completo ✅)
- Atualizar links

### docs/ROADMAP.md
- Adicionar entrada H1 2026 com: Sistema Email completo, Bulk API, Unsubscribe, A/B
- Atualizar histórico: v2.30.0
- Atualizar links

### docs/SYSTEM_DESIGN.md
- Versão → 2.30
- Adicionar seção "Sistema de Email Automatizado" com:
  - Fluxo de dados (triggers → fila → E-goi)
  - Tabelas (email_recovery_*, email_automation_*, email_unsubscribes, email_tips)
  - Edge Functions de email (12 funções)
  - Bulk API flow
  - A/B testing logic
- Atualizar contagem de Edge Functions (57)
- Atualizar links

### docs/STYLE_GUIDE.md
- Atualizar data, links
- Sem mudanças de conteúdo significativas

### docs/CHECKLIST.md
- Versão → 2.30
- Adicionar seção "17. Sistema de Email" com checklist para:
  - Templates, automações, unsubscribe, teste de email, crons
- Atualizar links

### docs/AUDIT_TEMPLATE.md
- Apenas atualizar links

### src/__tests__/README.md
- Atualizar links para `../../docs/`

## Novos arquivos

### docs/API_DOCS.md
Documentação das 57 Edge Functions organizadas por domínio:
- Core (quiz, draft, PDF)
- Auth & Users (login, delete, export, merge)
- Analytics & Tracking (quiz, step, video, GTM)
- Bunny CDN (6 funções)
- WhatsApp Recovery (8 funções)
- Email Recovery & Automações (12 funções)
- Blog (generate, sitemap, cron, regenerate, track)
- Payments (kiwify-webhook)
- Admin (health, export, anonymize)

Cada entrada: método, auth, payload, response, exemplo.

### docs/COMPONENTS.md
Documentação dos componentes principais sem Storybook:
- Páginas (Index, CreateQuiz, QuizView, Dashboard, CRM, Analytics, AdminDashboard)
- Quiz Editor (BlockEditor, QuestionsList, CalculatorWizard, UnifiedQuizPreview)
- Admin Recovery (CustomerRecovery, EmailAutomations, EmailRecoveryReports, EmailRecoveryTemplates)
- Landing (HeroSection, PricingSection, FeaturesSection)
- Props, uso e dependências de cada um

## Cross-references

Todos os documentos terão links relativos atualizados:
- README.md (raiz): `./docs/PRD.md`, `./docs/ROADMAP.md`, etc
- Docs entre si: `./PRD.md`, `./ROADMAP.md` (mesma pasta)
- `src/__tests__/README.md`: `../../docs/STYLE_GUIDE.md`, etc

## Prompt de Knowledge

Após implementação, enviarei no chat um prompt completo e atualizado para knowledge do projeto incluindo:
- Resumo da plataforma e stack
- Estrutura de pastas
- Padrões de código
- Regras de implementação
- Checklist pós-implementação obrigatório
- Formato de resposta (antes x depois, vantagens/desvantagens)

## Estimativa

~12 arquivos criados/modificados. Maioria é documentação pura sem impacto no runtime.

