# 🔒 SECURITY — Práticas de Segurança

> MasterQuiz — Guia de segurança, RLS, rate limiting e audit
> Versão 2.42.0 | 17 de Abril de 2026

---

## 📋 Índice

- [Princípios](#princípios)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Rate Limiting](#rate-limiting)
- [Sanitização e Validação](#sanitização-e-validação)
- [Audit Logging](#audit-logging)
- [LGPD e Compliance](#lgpd-e-compliance)
- [Checklist de Segurança](#checklist-de-segurança)

---

## 🎯 Princípios

1. **RLS em tudo** — Nenhuma tabela sem Row Level Security
2. **Least privilege** — Cada role acessa apenas o necessário
3. **Server-side validation** — Nunca confiar apenas no frontend
4. **No secrets in client** — Apenas chaves públicas/anon no frontend
5. **Defense in depth** — Múltiplas camadas de proteção

---

## 🛡️ Row Level Security (RLS)

### Padrão: Dados do usuário
```sql
-- SELECT: usuário vê apenas seus dados
CREATE POLICY "Users can view own data"
ON public.quizzes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Padrão: Admin via has_role()
```sql
-- SECURITY DEFINER evita recursão RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Uso em policies
CREATE POLICY "Admins can view all"
ON public.some_table FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Padrão: Dados públicos
```sql
-- Quizzes públicos acessíveis sem auth
CREATE POLICY "Public quizzes are viewable"
ON public.quizzes FOR SELECT
TO anon
USING (is_public = true AND status = 'active');
```

### Padrão: INSERT anônimo (tracking)
```sql
-- Analytics e responses permitem INSERT anon
CREATE POLICY "Anyone can insert analytics"
ON public.quiz_analytics FOR INSERT
TO anon
WITH CHECK (true);
```

### Padrão: Notificações (admin_notifications)
```sql
-- Usuário lê e marca como lidas apenas suas notificações
CREATE POLICY "Users can read own notifications"
ON public.admin_notifications FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

-- Admin insere notificações (via Edge Function com service_role)
```

### Padrão: GTM Event Integrations (NOVO v2.41.0)
```sql
-- Apenas admins podem gerenciar integrações GTM
CREATE POLICY "Admins can manage GTM integrations"
ON public.gtm_event_integrations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Qualquer autenticado pode INSERT em gtm_event_logs (tracking)
CREATE POLICY "Authenticated can insert GTM events"
ON public.gtm_event_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Apenas admins podem SELECT gtm_event_logs (dashboard)
CREATE POLICY "Admins can read GTM events"
ON public.gtm_event_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### ⚠️ Anti-padrões

| ❌ Errado | ✅ Correto |
|-----------|-----------|
| Verificar admin via localStorage | Usar `has_role()` server-side |
| RLS com subquery recursiva | Usar SECURITY DEFINER function |
| Armazenar role em profiles | Tabela separada `user_roles` |
| Confiar em `req.headers` para auth | Usar `supabase.auth.getUser()` |

---

## 🔑 Autenticação e Autorização

### Fluxo de Signup
```
1. auth.users criado
2. TRIGGER handle_new_user_profile() → profiles
3. TRIGGER handle_new_user_role() → user_roles (admin)
4. TRIGGER handle_new_user_subscription() → user_subscriptions (free)
```

### Verificação em Edge Functions
```typescript
// SEMPRE verificar auth antes de processar
const authHeader = req.headers.get('Authorization');
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader?.replace('Bearer ', '')
);
if (!user) return new Response('Unauthorized', { status: 401 });

// Para ações admin, verificar role
const { data: roles } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);
const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'master_admin');
```

---

## ⏱️ Rate Limiting

### Edge Function `rate-limiter`
```typescript
// Uso em endpoints públicos
const limited = await checkRateLimit(identifier, action, maxAttempts, windowMinutes);
if (limited) return new Response('Too Many Requests', { status: 429 });
```

### Configuração por endpoint
| Endpoint | Limite | Janela |
|----------|--------|--------|
| quiz_response | 100/IP | 15 min |
| track_analytics | 200/IP | 5 min |
| login | 10/email | 15 min |
| generate_quiz_ai | 5/user | 60 min |

---

## 🧹 Sanitização e Validação

### Frontend
```typescript
// Zod para validação de formulários
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

// DOMPurify para HTML user-generated
import { sanitizeHtml } from '@/lib/sanitize';
const clean = sanitizeHtml(userInput);
```

### Edge Functions
```typescript
// Validar webhook signatures
const signature = req.headers.get('x-kiwify-signature');
if (!verifySignature(body, signature, secret)) {
  return new Response('Invalid signature', { status: 403 });
}

// Validar payloads
if (!body.email || typeof body.email !== 'string') {
  return new Response('Invalid payload', { status: 400 });
}
```

---

## 📝 Audit Logging

### Tabela `audit_logs`
Registra ações sensíveis: login, signup, delete, admin actions, support mode.

### Prefixos de ação
| Prefixo | Contexto |
|---------|----------|
| `support:enter/exit` | Modo suporte |
| `admin:edit_quiz` | Edição de quiz pelo admin |
| `user:delete` | Deleção de conta |
| `auth:login/signup` | Autenticação |
| `payment:approved` | Pagamentos |

### Limpeza automática
- `cleanup_old_audit_logs()` — Remove logs > 90 dias (cron semanal)
- `anonymize_old_ips()` — Anonimiza IPs > 6 meses (LGPD)

---

## ⚖️ LGPD e Compliance

### Implementado
- ✅ Banner de cookies com consentimento granular
- ✅ Exportação de dados (LGPD Art. 18)
- ✅ Exclusão de conta com cascade delete
- ✅ Anonimização de IPs após 6 meses
- ✅ Unsubscribe obrigatório em todos os emails
- ✅ Header List-Unsubscribe
- ✅ Página de confirmação de unsubscribe

### CSP Headers
```
default-src 'self';
script-src 'self' *.googletagmanager.com;
img-src 'self' *.b-cdn.net *.supabase.co;
connect-src 'self' *.supabase.co;
```

---

## ✅ Checklist de Segurança (Nova Feature)

Antes de fazer deploy de qualquer feature:

- [ ] RLS ativo nas tabelas novas/alteradas
- [ ] Nenhuma chave privada no código frontend
- [ ] Edge Functions validam auth antes de processar
- [ ] Inputs sanitizados (XSS, SQL injection)
- [ ] Rate limiting em endpoints públicos
- [ ] Audit log para ações sensíveis
- [ ] Dados PII minimizados em logs
- [ ] Webhook signatures verificadas
- [ ] CORS configurado corretamente
- [ ] Testes de autorização (user não acessa dados de outro user)

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema e RLS policies |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Auth por endpoint |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões de sanitização |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação |
| [ADR.md](./ADR.md) | ADR-006: has_role() SECURITY DEFINER |
| [SERVICES.md](./SERVICES.md) | Catálogo de services |

> **Nota v2.42.0:** RPC `get_table_sizes()` usa SECURITY DEFINER para acessar `pg_class`/`pg_stat_user_tables` sem expor metadados do banco ao client.
