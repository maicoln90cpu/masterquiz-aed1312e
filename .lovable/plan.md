

# Plano: 2 Correções

## Item 1 — Reverter email e remover colunas Roles e Limites na tabela admin

**Problema:** O email foi reduzido demais (`text-xs`, `truncate`, `max-w-[180px]`) e as colunas "Roles" e "Limites" ocupam espaço desnecessário na tabela.

**Correção em `src/pages/AdminDashboard.tsx`:**

1. **Reverter coluna Email** (linhas 842-846) — voltar para tamanho normal:
```text
<TableCell className="text-sm">
  {user.email || '-'}
</TableCell>
```

2. **Remover header "Roles"** (linha 830) e **"Limites"** (linha 832) do `TableHeader`.

3. **Remover body da coluna Roles** (linhas 879-886) — o bloco com badges de roles.

4. **Remover body da coluna Limites** (linhas 904-906) — o texto com `quiz_limit / response_limit`.

5. **Remover `table-fixed`** da Table (linha 819) — voltar para `Table` sem classe extra, pois sem as colunas extras a tabela cabe naturalmente.

Resultado: tabela mais limpa com colunas Nome, Email, WhatsApp, Cadastro, Ultimo Login, Logins, Quizzes, Leads, Plano, Acoes.

---

## Item 2 — Bolinha amarela imediata apos save manual

**Problema raiz identificado:** Quando `saveDraftToSupabase()` termina, chama `markAsSaved()` que seta status para `saved`. Porem `markAsSaved()` NAO atualiza o `lastSavedSnapshotRef`. Logo, quando o `useEffect` (linha 84 de `useQuizPersistence.ts`) re-dispara `scheduleAutoSave()` com o mesmo payload, o snapshot nao bate com `lastSavedSnapshotRef` (que esta vazio ou desatualizado) e marca como `unsaved` imediatamente.

O auto-save de 30s funciona porque `performSave()` atualiza o `lastSavedSnapshotRef` (linha 180). O save manual bypassa `performSave()`, entao o snapshot nunca e atualizado.

**Correção em `src/hooks/useAutoSave.ts`:**

Modificar `markAsSaved` para aceitar um snapshot opcional e atualizar `lastSavedSnapshotRef`:

```text
const markAsSaved = useCallback((currentData?: AutoSaveData) => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  pendingDataRef.current = null;
  setHasUnsavedChanges(false);
  setStatus('saved');
  setLastSavedAt(new Date());
  // Atualizar snapshot para evitar que scheduleAutoSave marque como unsaved
  if (currentData) {
    lastSavedSnapshotRef.current = JSON.stringify(currentData);
  }
}, []);
```

**Correção em `src/hooks/useQuizPersistence.ts`:**

Na funcao `saveDraftToSupabase` (linha 537), passar o payload atual para `markAsSaved`:

```text
markAsSaved({
  quizId,
  ...appearanceState,
  questionCount: editorState.questionCount,
  isPublic: editorState.isPublic,
  questions,
  formConfig: {
    collectionTiming: formConfigState.collectionTiming,
    collectName: formConfigState.collectName,
    collectEmail: formConfigState.collectEmail,
    collectWhatsapp: formConfigState.collectWhatsapp
  }
});
```

Da mesma forma, no `saveQuiz` (publicar) na linha 452, passar o payload para `markAsSaved`.

---

## Resumo de arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/pages/AdminDashboard.tsx` | Reverter email para tamanho normal, remover colunas Roles e Limites |
| `src/hooks/useAutoSave.ts` | `markAsSaved` aceita snapshot opcional |
| `src/hooks/useQuizPersistence.ts` | Passar payload para `markAsSaved` no save manual e publicar |

## Arquivos NAO tocados
- CreateQuiz.tsx
- AutoSaveIndicator.tsx
- Edge Functions
