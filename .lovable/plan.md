

# Plano — Correções no Painel Admin (5 itens)

## Resumo dos 5 problemas (e causa raiz)

| # | Problema | Causa raiz |
|---|----------|------------|
| 1 | Custos de Blog mostram tudo zerado | `blog_generation_logs` está vazia (0 registros). Posts antigos foram criados antes do tracking de custo. |
| 2 | Teste A/B antigo "Hero CTA Test" tem 314/258 sessões mas variantes vazias ("Não configurado") + texto "Testar 7 dias grátis" não condiz com plano free | `Hero CTA Test` foi criado em dez/2025 com `variant_a_content` e `variant_b_content` = `null`. Sessões foram coletadas sem nunca ter conteúdo configurado. Já o teste novo "Compare Page - Final CTA" usa "Testar 7 dias grátis" (incorreto, pois há plano grátis). |
| 3 | Diagnóstico GTM diz "Não Configurado" mesmo com `GTM-MDK55T4H` salvo | `gtmDiagnosticService.fetchGTMId()` busca apenas em `profiles.gtm_container_id` do usuário logado. Mas o GTM real está em `system_settings.gtm_container_id` (global do sistema). |
| 4 | Cards do Banco de Dados (67 tabelas, 17.925 registros etc.) — atualizam automaticamente? | Sim — usam `useQuery` com `staleTime` do TanStack Query e RPC `get_table_sizes()`. Recarrega quando o usuário entra na aba. Não há refresh automático periódico. |
| 5 | "Verificação de Coleta": Frontend Errors, Performance Logs, Health Metrics com X vermelho | Não são bugs. Significa que as tabelas `client_error_logs` e `performance_logs` estão vazias (0 registros — bom sinal!) e `system_health_metrics` teve último registro em 16/abr (>24h). O painel marca como "vermelho" se não houver dado nas últimas 24h. |

---

## O que será feito (somente as correções reais)

### Etapa 1 — Diagnóstico GTM (problema 3, prioridade alta)

**Antes:** Sistema mostra "❌ Não Configurado" e "Nenhum GTM ID encontrado", mesmo com GTM-MDK55T4H salvo em `system_settings`.

**Depois:** Painel busca primeiro em `system_settings` (global), depois faz fallback para `profiles` (admin individual). Mostra a origem do ID (Sistema vs. Perfil).

**Arquivo:** `src/services/gtmDiagnosticService.ts` — alterar `fetchGTMId()` para consultar `system_settings.gtm_container_id` primeiro.

### Etapa 2 — A/B Testing Landing (problema 2)

**Antes:** Lista mostra teste antigo "Hero CTA Test" com 572 sessões coletadas mas variantes nulas (impossível ler resultado). Teste novo usa "Testar 7 dias grátis" (errado, pois MasterQuiz tem plano grátis real).

**Depois:**
- **Excluir** o teste órfão "Hero CTA Test" (id `fe7b08c8...`) — está pausado, sem variantes válidas, gerando confusão. Sessões antigas serão removidas em cascata.
- **Atualizar** o teste "Compare Page - Final CTA": variante B passa de `"Testar 7 dias grátis"` → `"Começar grátis agora"` (alinhado ao plano gratuito).

**Como:** migration SQL (DELETE + UPDATE em `landing_ab_tests`).

### Etapa 3 — Custos Blog (problema 1)

**Antes:** 4 cards zerados + alerta dizendo "Dados históricos indisponíveis".

**Depois:** Mantém o alerta (já está correto e honesto), mas adiciona um card extra mostrando **"16 posts publicados (2 últimos 7d) — sem log de custo (anteriores ao tracking)"** para dar contexto visual de que há posts, só não há log de custo deles.

**Arquivo:** `src/components/admin/UnifiedCostsDashboard.tsx` — refinar a seção `Blog — Detalhamento` puxando contagem real de `blog_posts`.

### Etapa 4 — Esclarecimento visual: "Verificação de Coleta" (problema 5)

**Antes:** Cards vermelhos (X) sem explicação — usuário acha que é erro.

**Depois:** Quando `lastDataAt` é `null` ou >24h, trocar ícone vermelho por **círculo amarelo de info** com texto "Sem registros recentes (normal se não houve uso)". Vermelho passa a indicar **só problemas reais** (ex: tabela inacessível). Adicionar tooltip explicando o significado.

**Arquivo:** `src/components/admin/system/ObservabilityTab.tsx` (componente `MetricsHealthPanel`).

### Etapa 5 — Cards do Banco de Dados (problema 4)

**Antes:** Atualiza só ao abrir a aba.

**Depois:** Adicionar botão "Atualizar agora" + indicador "Última atualização: HH:MM" no topo de `DatabaseMonitorTab`. Sem auto-polling (custo zero), mas ação manual visível.

**Arquivo:** `src/components/admin/system/DatabaseMonitorTab.tsx`.

---

## Vantagens × Desvantagens

| Etapa | Vantagem | Desvantagem |
|-------|----------|-------------|
| 1 GTM | Diagnóstico finalmente correto | Nenhuma |
| 2 A/B | Limpeza de dado órfão + copy alinhada ao produto free | Perda de 572 sessões históricas inúteis (variantes vazias = sem valor analítico) |
| 3 Blog | Contexto visual claro | Nenhuma — só visual |
| 4 Coleta | Para de assustar com falsos vermelhos | Precisa testar visual |
| 5 BD | Refresh manual sob demanda | Não é tempo real (mas custo zero é ganho) |

## Checklist manual pós-implementação
1. Aba Sistema → GTM/Diag → 3 passos verdes (GTM-MDK55T4H detectado).
2. Aba Conteúdo → A/B Testing → só 1 teste visível ("Compare Page"), variante B = "Começar grátis agora".
3. Aba Sistema → Observabilidade → cards Erros/Performance amarelos com tooltip "Sem registros recentes".
4. Aba Sistema → Banco de Dados → botão "Atualizar agora" funciona, timestamp aparece.
5. Custos → Blog mostra "16 posts publicados, sem log histórico".

## Pendências (não tratadas agora — propostas futuras opcionais)
- Backfill de custo de posts antigos (impossível — APIs não retornam histórico).
- Polling automático em DatabaseMonitorTab (custo de DB; deixar manual).

## Prevenção de regressão
- Validação em `fetchGTMId`: testar ambos os caminhos (system + profile) para evitar volta da regressão.
- Migration registra deleção do teste órfão (auditável).
- Tooltip explicativo em "Verificação de Coleta" evita futuras dúvidas do mesmo tipo.

