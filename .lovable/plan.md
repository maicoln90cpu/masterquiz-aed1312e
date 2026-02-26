

# Plano: Prevenir Colisao de Slug para Quizzes Manuais

## Problema
A funcao `generate_slug()` tenta contador ate 5, depois 1 unico fallback md5. Se esse md5 tambem colidir (improvavel mas possivel em race condition), nao ha retry. Alem disso, o codigo frontend (`useQuizPersistence.ts` INSERT branch e `QuizActions.tsx`) NAO tem retry para erro 23505 em quizzes manuais — so express tem.

## Correcoes

### 1. SQL: Tornar `generate_slug()` a prova de colisao (Migration)
Reescrever `generate_slug()` com loop de retry igual ao `generate_express_slug()`:
- Manter logica atual (base_slug + contador ate 5)
- Apos 5, entrar em loop com sufixo aleatorio (ate 20 tentativas)
- Garantir que SEMPRE retorna slug unico

```sql
CREATE OR REPLACE FUNCTION public.generate_slug(title text) ...
  -- apos counter loop ate 5:
  WHILE EXISTS(...) AND attempts < 20 LOOP
    final_slug := base_slug || '-' || substring(md5(random()::text), 1, 6);
    attempts := attempts + 1;
  END LOOP;
```

### 2. Frontend: Retry para 23505 em `useQuizPersistence.ts` (INSERT branch)
Linha ~416-436: ao fazer INSERT de quiz manual, se erro 23505, limpar slug (setar NULL) e reinserir — o trigger gera novo slug automaticamente.

### 3. Frontend: Retry para 23505 em `QuizActions.tsx` (UPDATE e INSERT)
Mesma logica: ao pegar erro 23505, fazer retry com `slug: null` para forcar o trigger a regenerar.

---

## Resumo

| # | O que | Tipo |
|---|-------|------|
| 1 | `generate_slug()` com loop robusto | Migration SQL |
| 2 | Retry 23505 no INSERT branch | `useQuizPersistence.ts` |
| 3 | Retry 23505 em ambos branches | `QuizActions.tsx` |

