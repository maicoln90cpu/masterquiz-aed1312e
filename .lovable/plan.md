
# Plano: Correcao de 3 Problemas no Sistema de Mensagens

## Diagnostico Completo

### Problema 1: Mensagens pendentes nao sendo disparadas automaticamente

**Causa raiz:** Nao existe cron job configurado. A extensao `pg_cron` nao esta habilitada no Supabase. O `process-recovery-queue` so executa quando alguem clica "Processar Fila" manualmente no painel admin.

Alem disso, o trigger `trigger_welcome_message` insere contatos na `recovery_contacts` **sem `template_id`** (campo fica NULL). Quando o `send-whatsapp-recovery` processa, ele busca template por categoria `welcome` com `trigger_days <= 0` — isso funciona, mas o template fica como "N/A" na UI ate ser processado.

**Solucao:** Como `pg_cron` nao esta disponivel neste projeto Supabase, implementar auto-processamento de 2 formas:
1. Fazer o trigger de welcome chamar diretamente o `send-welcome-message` (via `pg_net`) ao inserir o contato, eliminando a necessidade de fila para boas-vindas
2. Adicionar logica no frontend (RecoveryQueue) para auto-processar ao carregar se houver pendentes com `scheduled_at` no passado

### Problema 2: Nome do usuario aparecendo como "N/A"

**Causa raiz:** A query na `RecoveryQueue.tsx` (linha 81) usa join relacional `profiles:user_id (full_name)`. Isso funciona, mas os contatos inseridos pelo trigger de welcome tem `priority: -1` e a query ordena por `priority ascending` — ou seja, esses aparecem primeiro. O join com profiles funciona (confirmei que os nomes existem no banco). O problema e que o Supabase retorna `profiles` como objeto, e o codigo acessa `item.profiles?.full_name`. Se o tipo retornado for array em vez de objeto (por ser nullable FK), retorna undefined.

Na verdade, investigando os dados, os perfis TEM nome (Brenda, Alice Sophia, etc.) mas o join `profiles:user_id` pode falhar silenciosamente se a FK nao esta definida formalmente. A tabela `recovery_contacts` tem `user_id` sem foreign key explicita para `profiles`.

**Solucao:** Alterar a query para fazer um join explicito ou buscar perfis separadamente, garantindo que o nome sempre apareca. Tambem atualizar os contatos pendentes para incluir o `template_id` correto.

### Problema 3: Catia recebeu mensagem de "primeiro quiz" mas mostra 0 quizzes

**Causa raiz:** O trigger `trigger_first_quiz_message` disparou em 13/02/2026, indicando que um quiz de Catia foi colocado como `status = 'active'` naquele momento. Porem, consultando a tabela `quizzes` com o `user_id` de Catia (`ce6821fa-...`), retorna **0 registros**. Isso significa que o quiz foi **deletado** depois de ativar.

A contagem na `list-all-users` (linha 73) faz `SELECT user_id, id FROM quizzes WHERE user_id IN (...)` — mostra apenas quizzes existentes, nao contabiliza deletados.

**Solucao:** Isso e comportamento correto — o quiz foi deletado. Nenhuma correcao necessaria. A mensagem foi enviada corretamente no momento da ativacao. Podemos adicionar uma coluna de "quizzes criados historico" no futuro, mas nao e um bug.

---

## Correcoes a Implementar

### 1. Auto-disparo de mensagens de welcome via `pg_net`

Alterar o trigger `trigger_welcome_message` para, alem de inserir na fila, tambem invocar a edge function `send-welcome-message` diretamente via `pg_net.http_post`. Isso garante envio imediato sem depender de cron ou processamento manual.

**Tipo:** SQL Migration

```sql
-- Habilitar pg_net se nao estiver
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Atualizar trigger para chamar send-welcome-message diretamente
CREATE OR REPLACE FUNCTION trigger_welcome_message()
RETURNS TRIGGER AS $$
DECLARE
  settings_record RECORD;
  welcome_enabled BOOLEAN;
BEGIN
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN
    RETURN NEW;
  END IF;

  SELECT is_connected INTO settings_record
  FROM recovery_settings LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM recovery_templates 
    WHERE category = 'welcome' AND is_active = true
  ) INTO welcome_enabled;

  IF NOT welcome_enabled THEN
    RETURN NEW;
  END IF;

  -- Inserir na fila (backup)
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now()
  ) ON CONFLICT DO NOTHING;

  -- Disparar envio imediato via pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') 
           || '/functions/v1/send-welcome-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'phone_number', NEW.whatsapp,
      'user_name', NEW.full_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Aplicar o mesmo padrao ao trigger `trigger_welcome_on_whatsapp_update` e `trigger_first_quiz_message`.

### 2. Corrigir "N/A" na fila — atualizar template_id dos pendentes + fix query

**Tipo:** SQL (dados) + Codigo frontend

**2a. Atualizar contatos pendentes com template_id correto:**
```sql
UPDATE recovery_contacts 
SET template_id = '2776b38e-7090-411c-a528-c0d0b6877f38'
WHERE status = 'pending' AND template_id IS NULL AND days_inactive_at_contact = 0;
```

**2b. Corrigir RecoveryQueue.tsx** para exibir nome corretamente mesmo quando o join falha:

No `RecoveryQueue.tsx`, adicionar fallback buscando profiles separadamente caso o join nao retorne dados. A alteracao principal e na query (linhas 69-87) e na renderizacao (linha 476).

### 3. Processar os 4 pendentes atuais

Depois de aplicar as correcoes, invocar `process-recovery-queue` para enviar as 4 mensagens pendentes.

---

## Ordem de Execucao

1. SQL Migration: atualizar triggers para usar `pg_net` (disparo imediato)
2. SQL: atualizar `template_id` dos contatos pendentes
3. Corrigir `RecoveryQueue.tsx` para exibir nomes corretamente
4. Deploy e testar enviando mensagens para os 4 pendentes

## Arquivos Alterados

| Recurso | Alteracao |
|---------|----------|
| SQL Migration | Atualizar 3 triggers para usar `pg_net` (envio imediato) |
| SQL (dados) | UPDATE `template_id` nos 4 contatos pendentes |
| `src/components/admin/recovery/RecoveryQueue.tsx` | Fix exibicao de nome e template |

## Nota sobre Catia
O caso da Catia nao e um bug: o trigger de primeiro quiz disparou corretamente quando ela ativou um quiz em 13/02. O quiz foi posteriormente deletado, por isso mostra 0 na listagem. A mensagem foi enviada no momento correto.
