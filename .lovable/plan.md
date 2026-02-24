
# Plano: 6 Correções e Melhorias

## Item 1 — Preview cortado no editor de quiz

**Problema:** A sidebar de preview (`aside` em `CreateQuiz.tsx` linha 692) tem `h-[calc(100vh-5rem)]` e `overflow-y-auto`, mas o `UnifiedQuizPreview` em modo `inline` usa `ScrollArea` com `className="flex-1"` que não se expande corretamente. Em quizzes com textos longos, o conteúdo é cortado.

**Correção em `src/components/quiz/UnifiedQuizPreview.tsx`:**
- No modo `inline` (linha 282-341), o container principal `div.flex.flex-col.h-full` precisa de `min-h-0` para permitir que o flex-child com `ScrollArea` funcione corretamente dentro do container com altura fixa.
- Alternativa: remover o `ScrollArea` interno e deixar o scroll ser controlado pelo `aside` pai que já tem `overflow-y-auto`. Isso simplifica e evita scroll duplo.

**Correção em `src/pages/CreateQuiz.tsx` (linha 692):**
- Adicionar `overflow-hidden` ao `aside` e delegar scroll ao `ScrollArea` interno, OU remover o `ScrollArea` do `UnifiedQuizPreview` inline e manter o `overflow-y-auto` no aside.

---

## Item 2 — Feedback visual do save volta a amarelo imediatamente

**Problema raiz:** Após `saveDraftToSupabase()` chamar `markAsSaved()` (status = `saved`), o `useEffect` em `useQuizPersistence.ts` (linha 84) dispara porque está no dependency array de praticamente todos os states. Esse effect chama `scheduleAutoSave()` que imediatamente seta `status = 'unsaved'` e `hasUnsavedChanges = true`.

**Correção em `src/hooks/useAutoSave.ts`:**
- Modificar `scheduleAutoSave` para verificar o snapshot ANTES de mudar o status. Se o payload é igual ao `lastSavedSnapshotRef`, não marcar como `unsaved`:

```text
const scheduleAutoSave = (data) => {
  const snapshot = JSON.stringify(data);
  if (snapshot === lastSavedSnapshotRef.current) {
    return; // nada mudou, manter status 'saved'
  }
  pendingDataRef.current = data;
  setHasUnsavedChanges(true);
  setStatus('unsaved');
  // ... schedule timeout
};
```

Isso garante que após salvar, a bolinha fica verde até o usuário fazer uma alteração real.

---

## Item 3 — Tag `<p>` aparecendo no gabarito comentado

**Problema:** Na linha 127 de `QuizViewResult.tsx`:
```
<p className="font-semibold text-sm">{idx + 1}. {questionBlock?.questionText || q.question_text}</p>
```
O `questionText` vem do bloco question e pode conter HTML (ex: `<p>Qual é...</p>`) gerado pelo editor rich text. O componente renderiza como texto puro, mostrando as tags literais.

**Correção em `src/components/quiz/view/QuizViewResult.tsx`:**
- Importar `DOMPurify` e usar `dangerouslySetInnerHTML` para renderizar o texto, OU
- Fazer strip de tags HTML com uma função simples:
```text
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
```
- Aplicar na linha 127:
```text
<p className="font-semibold text-sm">
  {idx + 1}. {stripHtml(questionBlock?.questionText || q.question_text)}
</p>
```

---

## Item 4 — Tabela de usuários com scroll horizontal por emails longos

**Correção em `src/pages/AdminDashboard.tsx` (linha 842-843):**
- Adicionar classes CSS para truncar/limitar o email:
```text
<TableCell className="text-sm max-w-[200px]">
  <span className="block truncate text-xs" title={user.email || ''}>
    {user.email || '-'}
  </span>
</TableCell>
```
- Usar `text-xs` para emails longos e `truncate` com `max-w` para impedir expansão da coluna.
- Adicionar `title` para tooltip nativo mostrando o email completo ao hover.
- Aplicar `table-fixed` na tabela pai para evitar expansão automática.

---

## Item 5 — Resposta sobre login_count

A coluna `login_count` foi criada com valor `DEFAULT 0` e é incrementada no frontend via `increment_login_count` RPC chamado no evento `SIGNED_IN`. Portanto:
- **Começou a contar somente após a implementação** (24/02/2026)
- Logins anteriores não são contabilizados
- Todos os usuários começaram com 0, independente de quantas vezes logaram antes
- A partir de agora, cada novo login incrementa +1

Nenhuma alteração de código necessária — apenas resposta informativa.

---

## Item 6 — Erros 400 na fila de WhatsApp + melhor feedback de erro

**Análise dos 4 registros com falha:**

| Usuario | Telefone | Status | Erro | Template |
|---------|----------|--------|------|----------|
| Luiz Fernando | 5531942110698 | pending | HTTP 400: Bad Request | Boas-vindas |
| Daianny A. Lima | 5599984801966 | pending | (sem erro) | Boas-vindas |
| Heloisa Mello | 5562981437989 | failed | HTTP 400: Bad Request | Boas-vindas |
| Daianny A. Lima | 5599984801966 | failed | HTTP 400: Bad Request | Primeiro Quiz |

**Causa provavel do 400:** A Evolution API retorna `Bad Request` quando:
1. O numero nao esta registrado no WhatsApp (mais comum)
2. O formato do numero esta incorreto
3. A instancia nao esta conectada no momento do envio

Os numeros tem formato valido (55 + DDD + numero), então o mais provavel e que esses numeros **nao tem WhatsApp cadastrado** ou estao com formato de celular antigo (sem o 9 extra).

Verificando:
- `5531942110698` = 55 + 31 + 94211069 + 8 (13 digitos, parece OK)
- `5562981437989` = 55 + 62 + 98143798 + 9 (13 digitos, parece OK)
- `5599984801966` = 55 + 99 + 98480196 + 6 (13 digitos, parece OK)

Todos tem 13 digitos (formato correto com 9o digito). O erro 400 indica que a Evolution API nao conseguiu entregar — provavelmente o numero nao possui WhatsApp ativo.

**Melhoria no feedback de erro (`RecoveryQueue.tsx` linhas 502-509):**
- Trocar a mensagem generica "HTTP 400: Bad Request" por mensagens humanizadas:
```text
const getErrorExplanation = (error: string | null) => {
  if (!error) return null;
  if (error.includes('400')) return 'Numero possivelmente sem WhatsApp ativo ou formato invalido';
  if (error.includes('401')) return 'Chave da API invalida';
  if (error.includes('404')) return 'Instancia nao encontrada';
  if (error.includes('429')) return 'Limite de envios atingido, tente mais tarde';
  if (error.includes('500')) return 'Erro no servidor da Evolution API';
  return error;
};
```

**Tambem melhorar na Edge Function `send-whatsapp-recovery` (linha 81):**
- Capturar mais detalhes do body da resposta 400 da Evolution API para gravar no `error_message` do banco, incluindo o campo `response.message` que geralmente traz "number not registered" ou similar.

---

## Resumo de arquivos a alterar

| Arquivo | Alteracao |
|---------|----------|
| `src/components/quiz/UnifiedQuizPreview.tsx` | Corrigir scroll/overflow no modo inline |
| `src/hooks/useAutoSave.ts` | Dedup no `scheduleAutoSave` para manter status `saved` |
| `src/components/quiz/view/QuizViewResult.tsx` | Strip HTML tags do questionText no gabarito |
| `src/pages/AdminDashboard.tsx` | Truncar email + `text-xs` + `max-w` na coluna |
| `src/components/admin/recovery/RecoveryQueue.tsx` | Adicionar traducao humanizada dos erros |
| `supabase/functions/send-whatsapp-recovery/index.ts` | Capturar detalhes do erro 400 da Evolution API |

## Arquivos NAO tocados
- CreateQuiz.tsx (scroll controlado pelo aside pai, OK)
- useQuizPersistence.ts (nao precisa mudar)
- AuthContext.tsx (login_count ja funciona)
