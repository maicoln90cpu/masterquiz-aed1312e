
# Refazer Completa da Pagina Observabilidade

## Problema

O erro `Cannot convert undefined or null to object` ocorre em `ModuleHealthCard` na linha 85:
```
Object.entries(module.details)  // details pode ser null/undefined vindo do banco
```

A tabela `system_health_metrics` pode retornar `details` como `null`, e nenhum componente da cadeia faz guarda contra isso.

## Solucao

Reescrever os 3 componentes da aba Observabilidade com tratamento defensivo em todos os pontos de acesso a dados, mantendo a mesma funcionalidade visual.

## Arquivos modificados

| Arquivo | Alteracao |
|---------|----------|
| `src/components/admin/ModuleHealthCard.tsx` | Reescrever com guarda contra `details` nulo |
| `src/components/admin/SystemHealthDashboard.tsx` | Reescrever com guarda contra `modules` vazio e dados parciais |
| `src/components/admin/HealthReport.tsx` | Reescrever com guarda contra historico vazio e modules nulos |
| `src/hooks/useSystemHealth.ts` | Adicionar defaults/fallbacks para `details` e `status` |

## Detalhes tecnicos

### 1. `useSystemHealth.ts` -- Normalizar dados na origem

Adicionar fallback ao mapear metricas do banco:
- `details`: fallback para `{}` se nulo
- `status`: fallback para `'warning'` se valor invalido
- `score`: fallback para `0` se nulo

### 2. `ModuleHealthCard.tsx` -- Reescrever com defesas

- Linha critica: `Object.entries(module.details || {})` resolve o crash
- Adicionar early return se `module` for nulo
- Usar optional chaining em todo acesso a propriedades aninhadas

### 3. `SystemHealthDashboard.tsx` -- Simplificar e proteger

- Guardar `healthReport.modules` com fallback para array vazio
- Proteger rendering do chart contra `historicalData` vazio
- Manter layout identico (gauge + stats + modules grid + recomendacoes + chart)

### 4. `HealthReport.tsx` -- Proteger comparacoes

- Guardar acessos a `historicalData[i]` com optional chaining
- Proteger `maintenanceSchedule` contra modules vazios

## Arquivos NAO tocados

- `src/components/admin/HealthScoreGauge.tsx` (funciona corretamente, recebe apenas primitivos)
- `src/pages/AdminDashboard.tsx` (apenas importa e renderiza os componentes)
- Nenhuma migration de banco
- Nenhuma edge function
