

# Diagnóstico e Plano de Correção: Erro ao Publicar no Express Mode

## Causa Raiz Identificada

O trigger `set_quiz_slug_trigger` está configurado para disparar **apenas em UPDATE**, e **NÃO em INSERT**:

```text
set_quiz_slug_trigger  →  BEFORE UPDATE only
```

**O que acontece:**
1. `/start` cria um quiz draft via INSERT → trigger NÃO dispara → **slug fica NULL**
2. Usuário clica "PUBLICAR MEU QUIZ" → UPDATE dispara → trigger tenta gerar slug
3. Slug base "descubra-a-soluo-ideal-para-o-seu-negcio" já existe (quiz ativo de outro user)
4. Tentativa "-1" também existe → a função `generate_slug` deveria tentar "-2", mas há concorrência: autosave e botão publicar disparam UPDATEs simultâneos, ambos tentando gerar o mesmo slug → **409 duplicate key**

**Evidência:** 14 quizzes no banco com `slug = NULL`, todos drafts. Múltiplos 409s nos logs a cada 2 min (usuário clicando repetidamente "Publicar" sem sucesso).

---

## Plano de Correção (3 itens)

### ITEM 1 — Corrigir trigger para disparar em INSERT + UPDATE

**Migration SQL:**

1. DROP o trigger atual e recriá-lo como `BEFORE INSERT OR UPDATE`:
```sql
DROP TRIGGER IF EXISTS set_quiz_slug_trigger ON quizzes;
CREATE TRIGGER set_quiz_slug_trigger
  BEFORE INSERT OR UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION set_quiz_slug();
```

2. Melhorar `generate_slug()` para adicionar um sufixo aleatório como fallback anti-race-condition (após 5 tentativas de contador, usa `substring(md5(random()::text), 1, 4)` como sufixo único).

3. Gerar slugs para todos os quizzes existentes com `slug IS NULL`:
```sql
UPDATE quizzes SET slug = generate_slug(title) WHERE slug IS NULL;
```

**Resultado:** Todos os quizzes (drafts e ativos) terão slug desde a criação. O erro 409 na publicação desaparece.

### ITEM 2 — Prevenir criação de múltiplos drafts express pelo mesmo usuário

Atualmente, se o usuário vai ao `/start` e seleciona objetivo múltiplas vezes (reload, voltar, etc.), cada clique cria um novo draft. Resultado: 3+ drafts idênticos para o mesmo user.

**Correção em `Start.tsx`:**
Antes de criar um novo draft, verificar se já existe um draft `express_auto` do mesmo usuário. Se sim, reutilizar ao invés de criar outro:

```typescript
// Verificar se já existe draft express_auto
const { data: existingDraft } = await supabase
  .from('quizzes')
  .select('id')
  .eq('user_id', user.id)
  .eq('creation_source', 'express_auto')
  .eq('status', 'draft')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (existingDraft) {
  navigate(`/create-quiz?id=${existingDraft.id}&mode=express`);
  return;
}
```

### ITEM 3 — Desabilitar botão Publicar durante salvamento

**Correção em `CreateQuiz.tsx`:**
O botão "PUBLICAR MEU QUIZ" deve ficar `disabled` enquanto `isSaving` é true, prevenindo cliques duplos que geram UPDATEs concorrentes e race conditions no slug.

---

## Resumo de Alterações

| # | O que | Tipo | Arquivo |
|---|-------|------|---------|
| 1a | Trigger INSERT + UPDATE | Migration SQL | Nova migration |
| 1b | `generate_slug` anti-race | Migration SQL | Mesma migration |
| 1c | Backfill slugs NULL | Migration SQL | Mesma migration |
| 2 | Reutilizar draft existente | Frontend | `Start.tsx` |
| 3 | Disable botão durante save | Frontend | `CreateQuiz.tsx` |

