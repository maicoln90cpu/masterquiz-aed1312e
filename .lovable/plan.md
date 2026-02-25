

# Analise dos Erros do Banco de Dados

## Erros identificados no print (19 rows)

### 1. `GET /rest/v1/validation_requests` → 400 (4 ocorrencias)
**Causa**: A tabela `validation_requests` tem RLS que exige role `admin` ou `master_admin`. O erro 400 acontece quando um usuario normal (sem essas roles) tenta acessar, ou quando a autenticacao ainda nao resolveu no momento da query.

**Status**: **Parcialmente protegido**. A rota `/masteradm` tem `ProtectedRoute requiredRole="master_admin"`, entao usuarios normais nao deveriam chegar la. Porem, o `loadData()` pode ser chamado antes do `isAdmin` resolver, ou o guard `if (isAdmin)` pode ter um timing issue. A query tambem nao tem tratamento gracioso — deveria retornar `[]` em caso de erro de permissao em vez de logar 400.

**Correcao**: Adicionar guard mais robusto no `AdminDashboard.tsx` — verificar `isAdmin` antes de qualquer query, e capturar erros de RLS graciosamente (retornar dados vazios).

### 2. `GET /rest/v1/quiz_step_analytics` → 400 (2 ocorrencias)
**Causa**: O `useFunnelData.ts` (linha 33) faz `.select('quizzes!inner(user_id, title)')` — um JOIN com a tabela `quizzes` — mas a tabela `quiz_step_analytics` **NAO tem FK para `quizzes`**. Sem FK, o PostgREST nao consegue resolver o join e retorna 400.

**Status**: **BUG ATIVO**. Precisa criar a FK ou reescrever a query sem join.

**Correcao**: 
- Opcao A: Criar FK `quiz_step_analytics.quiz_id → quizzes.id`
- Opcao B: Reescrever a query em `useFunnelData.ts` para fazer 2 queries separadas (buscar step_analytics, depois buscar quizzes pelo user_id)

A opcao A eh a correta — a FK deveria existir. Criar com:
```sql
ALTER TABLE quiz_step_analytics 
ADD CONSTRAINT fk_quiz_step_analytics_quiz_id 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
```

### 3. `column "qual" does not exist` → 42703 (2 ocorrencias)
**Causa**: Nenhum codigo no frontend referencia uma coluna "qual". Este erro provavelmente vem de uma query manual feita no Supabase Dashboard ou de uma migration/trigger antigo. Nao ha codigo no projeto que gere esse erro.

**Status**: **NAO eh um bug do app**. Provavelmente foi uma query manual executada diretamente no DB.

**Correcao**: Nenhuma necessaria no codigo. Se persistir, investigar no Supabase Dashboard quem esta executando essa query.

### 4. `POST /auth/v1/token` → 400 (4 ocorrencias)
**Causa**: Tentativas de login com credenciais invalidas (senha errada, email nao cadastrado, etc). Isso eh comportamento normal do auth — nao eh bug.

**Status**: **Normal/Esperado**. Erro 400 em auth/token significa credenciais invalidas.

**Correcao**: Nenhuma necessaria. O frontend ja mostra mensagem de erro ao usuario.

### 5. `duplicate key value violates unique constraint "user_roles_user_id_role_key"` → 23505
**Causa**: A trigger `handle_new_user_role()` faz `INSERT INTO user_roles ... ON CONFLICT DO NOTHING`. O erro 23505 eh logado pelo Postgres antes do `ON CONFLICT` resolver. Isso eh **esperado e tratado** — o `ON CONFLICT DO NOTHING` impede que o erro afete o fluxo.

**Status**: **Tratado**. O log aparece no Postgres mas a operacao nao falha.

**Correcao**: Nenhuma necessaria — o `ON CONFLICT DO NOTHING` ja trata isso corretamente.

### 6. `PATCH /rest/v1/user_subscriptions` → 409 + `duplicate key violates "user_subscriptions_user_id_key"` → 23505
**Causa**: Similar ao anterior — a trigger `handle_new_user_subscription()` usa `ON CONFLICT (user_id) DO NOTHING`. O erro eh logado mas tratado.

**Status**: **Tratado**. Conforme documentado na memoria `auth/provisao-automatica-usuarios`.

**Correcao**: Nenhuma necessaria.

### 7. `GET /auth/v1/user` → 403 (2 ocorrencias)
**Causa**: Token expirado ou sessao invalida. O client Supabase tenta pegar o usuario, mas o token ja expirou. O `autoRefreshToken: true` deveria prevenir isso, mas pode falhar em edge cases (tab inativa por muito tempo, etc).

**Status**: **Esperado em edge cases**. O frontend redireciona para login quando isso acontece.

**Correcao**: Nenhuma critica necessaria.

---

## Resumo

| Erro | Gravidade | Status | Acao |
|------|-----------|--------|------|
| validation_requests 400 | Baixa | Guard existe mas pode ter timing issue | Adicionar tratamento gracioso de erro |
| quiz_step_analytics 400 | **ALTA** | **BUG — FK ausente** | Criar FK `quiz_id → quizzes.id` |
| column "qual" 42703 | Nenhuma | Query manual externa | Ignorar |
| auth/token 400 | Nenhuma | Login com credenciais invalidas | Normal |
| user_roles 23505 | Nenhuma | ON CONFLICT trata | Normal |
| user_subscriptions 23505/409 | Nenhuma | ON CONFLICT trata | Normal |
| auth/user 403 | Nenhuma | Token expirado | Normal |

## Plano de correcao (somente os bugs reais)

### 1. Criar FK em `quiz_step_analytics` (SQL migration)
```sql
ALTER TABLE public.quiz_step_analytics 
ADD CONSTRAINT fk_quiz_step_analytics_quiz_id 
FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;
```

### 2. Melhorar tratamento de erros no `useFunnelData.ts`
Adicionar `try/catch` que retorna `[]` em caso de erro 400, em vez de propagar a excecao.

### 3. Guard mais robusto no `AdminDashboard.tsx`
Garantir que `loadData()` so execute quando `isAdmin === true` (ja tem o guard, mas adicionar tratamento de erro nas queries de `validation_requests` para retornar dados vazios graciosamente em caso de 400).

### Arquivos a editar:
- **SQL migration**: Criar FK em `quiz_step_analytics`
- `src/hooks/useFunnelData.ts`: Tratamento de erro gracioso
- `src/pages/AdminDashboard.tsx`: Tratamento de erro gracioso nas queries de validation_requests

