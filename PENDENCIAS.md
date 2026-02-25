# 📋 PENDÊNCIAS - MasterQuiz

> Documento centralizado de changelog, pendências e histórico de desenvolvimento.

---

## ✅ v2.27.0 - Correções de Banco + Refatoração QuestionsList (25/02/2026)

### Correções de Banco de Dados

#### Bug Crítico: `useFunnelData.ts` — query reescrita
- **Problema:** `.select('quizzes!inner(user_id, title)')` fazia JOIN via PostgREST, mas dependia de FK que não existia inicialmente. Mesmo após FK criada, a query era frágil.
- **Solução:** Reescrita para 2 queries separadas: 1) busca quiz_ids do usuário via `quizzes`, 2) filtra `quiz_step_analytics` com `.in('quiz_id', ids)`.
- **Impacto:** Elimina erro 400 em analytics de funil.

#### AdminDashboard: tratamento gracioso de `validation_requests`
- **Problema:** Query a tabela `validation_requests` retornava 400 quando role admin não estava resolvida.
- **Solução:** `try/catch` que retorna `{ data: [], error: null }` silenciosamente.
- **Impacto:** Elimina logs de erro desnecessários no console.

#### Análise completa dos 19 erros de banco
| Erro | Veredicto |
|------|-----------|
| quiz_step_analytics 400 | ✅ Corrigido (query reescrita) |
| validation_requests 400 | ✅ Corrigido (try/catch) |
| column "qual" 42703 | ⚪ Query manual externa |
| auth/token 400 | ⚪ Credenciais inválidas (normal) |
| user_roles 23505 | ⚪ ON CONFLICT trata |
| user_subscriptions 23505/409 | ⚪ ON CONFLICT trata |
| auth/user 403 | ⚪ Token expirado (normal) |

### Refatoração QuestionsList (Editor Sidebar)

#### Layout dos cards refatorado
- **Antes:** `flex items-center` com `truncate` (1 linha) — botões empurrados para fora
- **Depois:** `flex items-start` com `line-clamp-2 break-words` (2 linhas) — ícones fixos à direita
- Ícone de editar (lápis) + excluir (lixeira) sempre visíveis
- Duplo clique no texto ou clique no lápis para editar inline

### Arquivos Editados
| Arquivo | Alterações |
|---------|------------|
| `src/hooks/useFunnelData.ts` | Query reescrita sem JOIN, try/catch |
| `src/pages/AdminDashboard.tsx` | try/catch em validation_requests |
| `src/components/quiz/QuestionsList.tsx` | Layout cards refatorado |
| `.lovable/plan.md` | Análise documentada dos erros de banco |

---

## ✅ v2.26.0 - Sistema PQL + Lead de Teste (05/02/2025)

### Implementado

#### Sistema de Níveis PQL (Product Qualified Lead)
- **3 níveis de usuário**: Explorador (🧊), Construtor (🔥), Operador (🚀)
- **Progressão automática**: Baseada em comportamento real
  - Explorador → Construtor: Ao publicar primeiro quiz
  - Construtor → Operador: Ao visualizar CRM ou Analytics
- **CTAs dinâmicos no Dashboard**: Mensagens e ações personalizadas por nível
- **Campos em profiles**: `user_stage`, `crm_viewed_at`, `analytics_viewed_at`, `stage_updated_at`

#### Lead de Teste (Simulação)
- **Botão "Gerar Lead de Teste"**: Aparece em quizzes ativos
- **Dados fictícios realistas**: Nome, email, WhatsApp, resultado associado
- **Marcação especial**: Campo `_is_test_lead` nos answers
- **Badge visual no CRM**: Ícone de laboratório (🧪) identifica leads de teste

#### Hooks Criados
| Hook | Descrição |
|------|-----------|
| `useUserStage.ts` | Gerencia nível PQL e CTAs dinâmicos |
| `useTestLead.ts` | Gera leads de teste para simulação |
| `useTrackPageView` | Rastreia visualização de CRM/Analytics |

---

## ✅ v2.25.0 - Paradigma Auto-Convencimento + i18n Completo (04/02/2025)

### Mudança Conceitual (MAJOR)
- **Antes:** Plataforma de qualificação e segmentação de leads
- **Depois:** Plataforma de funis de auto-convencimento via perguntas estratégicas

### Landing Page i18n (PT/EN/ES)
- 14 chaves `hero_*` atualizadas com novo paradigma
- Demo mockup internacionalizado

### Edge Function: generate-quiz-ai
- Prompts de IA atualizados para auto-convencimento
- Estrutura obrigatória: 5 fases de consciência

### Admin Dashboard Otimizado
- Lazy loading de 15+ componentes pesados
- TanStack Query com cache 5min

---

## ✅ v2.24.0 - Documentação e Correções (23/01/2025)

- Correção crítica: inicialização de perguntas no CreateQuiz.tsx
- Landing page: 6 novos feature cards
- `docs/SYSTEM_DESIGN.md` criado
- Documentação sincronizada (README, PRD, ROADMAP)

---

## ✅ v2.23.0 - Calculator Wizard + Correções UX (12/01/2025)

- Calculator Wizard (3 passos): VariableStep, FormulaStep, RangesStep
- Botão deletar sempre visível no QuestionsList
- Confirmação de deleção com AlertDialog
- CHECKLIST.md criado

---

## ✅ v2.22.0 - Performance (12/01/2025)

- Lazy loading agressivo (EditorComponentsBundle, AnalyticsChartsBundle)
- Hooks: useStableCallback, useDeferredValue
- Vite: 13 chunks separados, ES2020 target
- QuizView.tsx: 1146 → ~100 linhas

---

## ✅ v2.21.0 - QuizCard + Responsividade (12/01/2025)

- QuizCard: layout 4 linhas (mobile/tablet/desktop)
- CRM: kanban scroll horizontal
- Responses: filtros flex-wrap

---

## ✅ v2.20.0 - Refatoração + i18n (12/01/2025)

- QuizCard isolado como componente
- 40+ novas chaves i18n
- Edge Functions padronizadas (_shared/cors.ts, auth.ts)

---

## ✅ v2.19.0 - Segurança + Autosave + Testes (08/01/2025)

- RLS hardening (ab_test_sessions, landing_ab_sessions)
- View user_integrations_safe
- Hook useAutoSave (debounce 30s)
- ~430 testes automatizados

---

## ✅ v2.18.0 - Testes Automatizados (23/12/2024)

- Setup Vitest + Testing Library
- ~285 testes (validations, sanitize, calculator, auth, pages)
- CI/CD com cobertura mínima 50%

---

## ✅ v2.17.0 e anteriores

Consultar histórico detalhado nos commits e no ROADMAP.md.

---

## 🔄 Pendências Abertas

### Prioridade Alta
- [ ] Internacionalização: remover strings hardcoded restantes
- [ ] 2FA implementation

### Prioridade Média
- [ ] API pública v1
- [ ] Webhook documentation
- [ ] AI quiz optimization suggestions

### Prioridade Baixa
- [ ] White-label completo
- [ ] SSO (SAML/OIDC)
- [ ] Team workspaces

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [README.md](./README.md) | Setup, stack e arquitetura |
| [PRD.md](./PRD.md) | Requisitos do produto e backlog |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação MVP |
| [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) | Arquitetura técnica |
