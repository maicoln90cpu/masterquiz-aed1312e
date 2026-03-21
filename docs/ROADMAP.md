# 🗺 ROADMAP - MasterQuiz

> Plataforma de Funis de Auto-Convencimento — Planejamento estratégico 2025-2026

---

## 📅 Visão Geral

```
Q4 2024: Funcionalidades Core & Integrações ✅
Q1 2025: Compliance, Estabilidade & Testes ✅
Q2 2025: AI & Automação + Recovery WhatsApp ✅
Q3 2025: Enterprise & Scale
Q4 2025: Expansão Internacional
2026:    Expansão Global + AI Conversational
```

---

## ✅ Q4 2024 - Funcionalidades Core (COMPLETO)

- Funnel Visualization, Undo/Redo, Integrações (8 CRMs)
- Calculadoras, Bunny CDN, Video Analytics
- Heatmap de Respostas, Templates visuais (8)
- Testes automatizados (~285), CI/CD com cobertura

---

## ✅ Q1 2025 - Compliance & Estabilidade (COMPLETO)

### Janeiro
- Consolidação Kiwify (Stripe removido)
- Performance optimization (lazy loading, chunks)
- Calculator Wizard (3 passos)
- RLS Security hardening
- Hook useAutoSave (debounce 30s)
- Testes expandidos (~460)

### Fevereiro
- Cookie consent banner + Privacy policy ✅
- Data export LGPD ✅
- Account deletion flow ✅
- Paradigma Auto-Convencimento (v2.25) ✅
- i18n Landing Page EN/ES ✅
- Sistema PQL (v2.26) ✅

### Março
- IP anonymization (6 meses) ✅
- Audit logging expandido ✅
- 2FA 🔄 Em Progresso

---

## ✅ Q2 2025 - AI & Automação (COMPLETO)

### Implementado
- Sistema de Recuperação WhatsApp (Evolution API) ✅
  - Templates, campanhas, fila, blacklist
  - Welcome message automático
  - First quiz message automático
- Prompts IA otimizados para auto-convencimento ✅
- System health check (Edge Function) ✅
- PQL Analytics no admin ✅

### Pendente para Q3
- Quiz branching inteligente (AI) 🔜
- API pública v1 🔜
- AI quiz optimization suggestions 🔜

---

## 🚀 Q3 2025 - Enterprise & Scale

| Prioridade | Feature | Status |
|------------|---------|--------|
| 🔴 Alta | White-label completo | 🔜 Pendente |
| 🔴 Alta | SSO (SAML/OIDC) | 🔜 Pendente |
| 🟡 Média | Team workspaces | 🔜 Pendente |
| 🟡 Média | Custom domains API | 🔜 Pendente |
| 🟡 Média | Advanced permissions | 🔜 Pendente |

---

## 🏢 Q4 2025 - Expansão Internacional

| Área | Iniciativa | Status |
|------|------------|--------|
| Mercado | Expansão LATAM (México, Argentina, Colômbia) | 🔜 |
| Produto | Multi-currency support | 🔜 |
| Produto | Local payment methods | 🔜 |
| Infra | Regional data centers | 🔜 |

---

## 🌎 2026 - Expansão Global

### H1 2026
- Entrada Europa (Espanha, Portugal)
- GDPR enhanced compliance
- Multi-language AI
- Agency partner program
- Tracking GTM centralizado + Dashboard de observabilidade ✅
- Blog AI: Rotação de prompts de imagem (5 estilos visuais) ✅
- Campanhas WhatsApp: Cooldown global configurável ✅
- **Sistema de Email Marketing Automatizado** ✅
  - 12 templates estáticos + 5 dinâmicos com IA
  - E-goi Bulk API (lotes de 100)
  - A/B testing de assuntos
  - Dashboard de performance por categoria
  - Unsubscribe com compliance CAN-SPAM/LGPD
  - Webhook de tracking (open/click/bounce)
- **34 tipos de blocos no editor** (5 visuais, 6 dinâmicos, 1 calculadora) ✅
- **Editor Classic/Modern com thin router** ✅
- **Imagens por opção de resposta no quiz publicado** ✅
- **Estabilização da suíte de testes (~22 fixes, 10 suites)** ✅
- **Templates re-habilitados (14 ativos)** ✅

### H2 2026
- Expansão para EUA
- Enterprise tier advanced
- AI conversational quizzes
- Reseller program

---

## 📊 KPIs Globais

| Métrica | 2024 | 2025 Target | 2026 Target |
|---------|------|-------------|-------------|
| MRR | R$ 10k | R$ 100k | R$ 500k |
| Usuários ativos | 500 | 5.000 | 25.000 |
| Quizzes criados | 2.000 | 50.000 | 250.000 |
| Leads gerados | 50k | 2M | 10M |
| NPS | 35 | 50 | 60 |
| Churn mensal | 8% | 5% | 3% |
| Cobertura testes | 0% | 80% | 90% |

---

## 📝 Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| 2026-03-19 | **v2.30 — Email Marketing Automatizado + Bulk API + Documentação completa** |
| 2026-03-15 | **v2.29 — Rotação Prompts de Imagem Blog (5 estilos) + Cooldown Campanhas** |
| 2026-03-09 | **v2.28 — 5 Eventos GTM + Dashboard Observabilidade + gtmLogger centralizado** |
| 2026-02-25 | **v2.27 — Correção useFunnelData, AdminDashboard, QuestionsList refatorado** |
| 2025-02-05 | **v2.26 — Sistema PQL + Lead de Teste** |
| 2025-02-04 | **v2.25 — Paradigma Auto-Convencimento + i18n completo** |
| 2025-01-23 | **v2.24 — System Design Document + Correções** |
| 2025-01-12 | **v2.23 — Calculator Wizard + Correções UX** |
| 2025-01-12 | **v2.22 — Performance + Lazy Loading** |
| 2025-01-12 | **v2.21 — QuizCard + Responsividade** |
| 2025-01-12 | **v2.20 — Refatoração + i18n** |
| 2025-01-08 | **v2.19 — Segurança + Autosave + Testes** |
| 2024-12-23 | **v2.18 — Testes Automatizados** |
| 2024-12-23 | **v2.17 — Padronização de Código** |

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup, stack e arquitetura |
| [PRD.md](./PRD.md) | Requisitos do produto e backlog |
| [PENDENCIAS.md](./PENDENCIAS.md) | Changelog e pendências atuais |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação do MVP |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura e fluxos técnicos |
| [API_DOCS.md](./API_DOCS.md) | Documentação Edge Functions |
| [COMPONENTS.md](./COMPONENTS.md) | Documentação componentes |
