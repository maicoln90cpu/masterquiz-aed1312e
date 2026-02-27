

## Diagnóstico do Bug `account_created`

### O problema raiz
O fluxo atual do novo usuário é: **Login → /start → /create-quiz (editor)**. O evento `account_created` só dispara no **Dashboard.tsx**. Mas o usuário novo **nunca visita o Dashboard imediatamente** — ele vai direto para o editor express. A flag `mq_just_registered` fica no localStorage esperando uma visita ao Dashboard que pode demorar horas ou dias.

O mecanismo retroativo tem uma **limitação de 7 dias** e só roda no Dashboard também — então se o usuário não abrir o Dashboard em 7 dias, o evento é perdido para sempre.

### Dados atuais
- **116 usuários** total no sistema
- **70 NÃO receberam** o evento (60%)
- **67 dos últimos 7 dias** não receberam
- Apenas **3 de 70 recentes** receberam — confirmando que o fluxo está quase totalmente quebrado

---

## Plano de Correção

### Mudança 1: Mover o disparo para um local que SEMPRE executa
Criar um hook `useAccountCreatedEvent` que roda em qualquer página autenticada (via `AuthContext` ou layout compartilhado). Assim não importa se o usuário vai pro Dashboard, Editor, ou qualquer outra rota — o evento dispara.

**Arquivo:** `src/hooks/useAccountCreatedEvent.ts` (novo)
- Verifica se o usuário está autenticado
- Caminho 1: `mq_just_registered` no localStorage → dispara imediatamente, remove flag, marca no DB
- Caminho 2 (retroativo): consulta `profiles.account_created_event_sent` — se `false`, dispara independente de há quantos dias a conta foi criada (sem limite de 7 dias)
- Guard: `sessionStorage` flag para não rodar mais de 1x por sessão (evita re-consulta desnecessária)

### Mudança 2: Integrar o hook no layout autenticado
**Arquivo:** `src/pages/Dashboard.tsx`
- Remover todo o bloco de lógica de `account_created` (linhas 74-111)
- Importar e chamar `useAccountCreatedEvent()`

**Arquivo:** `src/App.tsx` ou layout wrapper
- Garantir que o hook roda em qualquer rota autenticada (Dashboard, Editor, etc.)

### Mudança 3: Compensar os 70 usuários perdidos
Duas abordagens combinadas:

**A) Retroativo automático (já coberto acima):** Ao remover o limite de 7 dias, TODOS os 70 usuários que logarem novamente terão o evento disparado automaticamente no próximo acesso. Isso resolve sem intervenção manual.

**B) Para compensar no Google Ads imediatamente (sem esperar login):** Usar o Google Ads Offline Conversion Import — exportar a lista de emails+datas dos 70 usuários que não tiveram o evento enviado e importar manualmente como conversões no Google Ads. Isso recupera a atribuição.

Para facilitar isso, posso criar um botão no painel admin que exporte os dados dos usuários com `account_created_event_sent = false`.

---

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useAccountCreatedEvent.ts` | **Novo** — hook que dispara `account_created` para qualquer rota autenticada |
| `src/pages/Dashboard.tsx` | Remover lógica duplicada (linhas 74-111), usar o hook |
| `src/App.tsx` ou layout compartilhado | Integrar o hook para rodar em todas as rotas autenticadas |

