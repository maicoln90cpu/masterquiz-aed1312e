# 🔧 SERVICES — Catálogo de Services

> MasterQuiz — Service layer do frontend
> Versão 2.42.0 | 16 de Abril de 2026

---

## 📋 Visão Geral

Services encapsulam lógica de acesso a dados e processamento que não pertence a hooks ou componentes. São funções puras (ou async) sem estado React.

---

## 📊 observabilityService.ts

**Localização:** `src/services/observabilityService.ts`  
**Propósito:** Queries de observabilidade para a aba Sistema do admin

| Função | Descrição | Tabelas |
|--------|-----------|---------|
| `fetchSLAOverview()` | Calcula uptime e disponibilidade | `system_health_metrics` |
| `fetchAICosts()` | Custos de IA (quiz + blog) | `ai_quiz_generations`, `blog_generation_logs` |
| `fetchEmailDelivery()` | Métricas de entrega de email | `email_recovery_contacts` |
| `fetchRecentErrors()` | Erros nas últimas 24h | `client_error_logs` |
| `fetchPerformanceMetrics()` | P95/P99 de operações | `performance_logs` |
| `fetchWebVitals()` | Core Web Vitals (LCP, FID, CLS) | `performance_logs` |
| `fetchHealthHistory()` | Histórico de health checks | `system_health_metrics` |

**Cache:** TanStack Query com `staleTime: 5min`

---

## 🔍 gtmDiagnosticService.ts

**Localização:** `src/services/gtmDiagnosticService.ts`  
**Propósito:** Diagnóstico automatizado do Google Tag Manager

| Função | Descrição |
|--------|-----------|
| `runGTMDiagnostic(maxRetries)` | Executa verificação em 3 etapas com retry |
| `fetchGTMId()` | Busca `gtm_container_id` do perfil do usuário |
| `checkGTMScript(gtmId)` | Verifica presença do script GTM no DOM |
| `checkDataLayer()` | Verifica se `window.dataLayer` está ativo |

**Fluxo:**
```
Step 1: GTM ID configurado no perfil? → profiles.gtm_container_id
Step 2: Script GTM carregado no DOM? → document.querySelector('script[src*="gtm.js"]')
Step 3: DataLayer ativo? → window.dataLayer existe e é array
```

**Retry:** 3 tentativas com intervalo de 2s entre cada

---

## 🩺 systemMonitorService.ts

**Localização:** Lógica distribuída em `SystemHealthTab.tsx`  
**Propósito:** Invoca Edge Function `system-health-check` para verificar saúde do sistema

| Verificação | Descrição |
|-------------|-----------|
| Database | Conexão com PostgreSQL |
| Auth | Serviço de autenticação |
| Storage | Supabase Storage |
| Edge Functions | Disponibilidade de funções |

---

## 🔑 Outros Services Relevantes

### `lib/gtmLogger.ts`
Centraliza push de eventos GTM + persistência em `gtm_event_logs`.

### `lib/calculatorEngine.ts`
Motor de cálculo para resultados do tipo calculadora (substituição de variáveis + parser seguro).

### `lib/conditionEvaluator.ts`
Avaliador de condições para branching (AND/OR, 5 operadores, detecção de ciclos).

### `lib/logger.ts`
Logger centralizado do projeto (substitui `console.log`).

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura e fluxos |
| [COMPONENTS.md](./COMPONENTS.md) | Componentes que consomem os services |
| [API_DOCS.md](./API_DOCS.md) | Edge Functions chamadas pelos services |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões de código |
| [ADR.md](./ADR.md) | Decisões arquiteturais |
