
# Plano: Correcoes de 6 Itens Criticos

## 1) Erro ao clicar em "Criar Quiz"

### Causa raiz identificada
O componente `RequireAuth` em `src/App.tsx` (linhas 138-141) chama `toast.error()` e `navigate()` **durante o render** (nao dentro de useEffect). Isso viola as regras do React e causa crash intermitente, acionando o `ErrorBoundary`.

```text
// ERRADO (render direto):
if (!user) {
  toast.error(t('nav.needLogin'));  // side effect no render!
  navigate('/login');               // side effect no render!
  return null;
}
```

### Correcao
Mover a logica de redirecionamento para um `useEffect`, igual ao padrao usado no `ProtectedRoute`.

**Arquivo:** `src/App.tsx` - componente `RequireAuth`

Alem disso, ha um erro 406 vindo de `useCookieConsent.ts` que usa `.single()` para buscar `require_cookie_consent`. Quando a query retorna com formato inesperado, o erro 406 e gerado. A correcao e trocar `.single()` por `.maybeSingle()`.

**Arquivo:** `src/hooks/useCookieConsent.ts` - linha 51

---

## 2) Revisao de Todas as Rotas

Apos analise rota a rota no `App.tsx`:

| Rota | Status | Problema |
|---|---|---|
| `/` (Index) | OK | Nao lazy, carrega rapido |
| `/login` | OK | Nao lazy |
| `/faq` | OK | Lazy com retry |
| `/precos` | OK | Lazy com retry |
| `/privacy-policy` | OK | Lazy com retry |
| `/kiwify/success` | OK | Lazy com retry |
| `/kiwify/cancel` | OK | Lazy com retry |
| `/dashboard` | RISCO | `RequireAuth` + `ProtectedRoute` - crash no RequireAuth |
| `/meus-quizzes` | RISCO | Mesmo problema |
| `/settings` | RISCO | Mesmo problema |
| `/create-quiz` | RISCO | Mesmo problema (o bug reportado) |
| `/crm` | RISCO | Mesmo problema |
| `/responses` | RISCO | Mesmo problema |
| `/analytics` | RISCO | Mesmo problema |
| `/webhook-logs` | RISCO | Mesmo problema |
| `/webhook-settings` | RISCO | Mesmo problema |
| `/maisfy-generator` | RISCO | Mesmo problema |
| `/media-library` | RISCO | Mesmo problema |
| `/integrations` | RISCO | Mesmo problema |
| `/checkout` | RISCO | Mesmo problema |
| `/masteradm` | OK | Usa apenas `ProtectedRoute` (que tem useEffect) |
| `/masteradm/template-editor/:id` | OK | Idem |
| `/preview/:quizId` | RISCO | Usa `RequireAuth` sem ProtectedRoute |
| `/:company/:slug` | OK | Publica, sem auth |
| `/quiz/:slug` | OK | Publica, sem auth |
| `*` (NotFound) | OK | Sem auth |

**Resultado:** Todas as rotas que usam `RequireAuth` tem o mesmo risco de crash. A correcao do `RequireAuth` resolve todas de uma vez.

---

## 3) Remover Referencias ao Bunny no Frontend

### Arquivos a alterar (user-facing apenas):

**3a) `src/components/BunnyVideoUploader.tsx`**
- Remover badge "Bunny CDN" (linha 160-163)
- Trocar texto "Powered by Bunny CDN" (linha 310-313) por "CDN Global" ou remover

**3b) `src/components/quiz/blocks/VideoBlock.tsx`**
- Remover badge "Bunny CDN" (linhas 82-87)
- Texto "CDN Global ativo" (linha 183) - trocar para "CDN ativo"
- SelectItem "Bunny Stream" (linha 158) - trocar para "Stream CDN" ou "CDN Direto"

**3c) `src/components/MediaLibraryCard.tsx`**
- Remover badges "Bunny CDN" (linhas 107-110, 139-142)
- Texto "Video CDN" no label (linha 205) - manter (generico)
- Texto "sera removido do Bunny CDN" (linha 284) - trocar para "sera removido do servidor"

**3d) `src/hooks/useVideoProvider.ts`**
- O tipo `VideoProvider = 'supabase' | 'bunny'` e interno, nao precisa mudar (nao visivel ao usuario)

**3e) `src/components/analytics/VideoStorageCard.tsx`** (se existir referencia)
- Verificar e limpar referencias visuais

**Nota:** Os hooks internos (`useBunnyUpload.ts`, `useVideoStorage.ts`) e edge functions Bunny NAO serao alterados pois sao logica interna.

---

## 4) Botao "Renomear Pergunta" Sumindo

### Analise
Olhando o `QuestionsList.tsx`, o botao de renomear existe (linhas 296-308) com icone `Edit3`. Ele esta dentro de um container com classes:

```text
className="absolute top-1.5 right-1 flex gap-0.5 z-30 bg-card/90 rounded-md p-0.5 backdrop-blur-sm"
```

O container e `absolute` posicionado dentro do card da pergunta. O card pai tem `pr-20` no container de conteudo (linha 189), o que empurra o conteudo para dar espaco.

**Problema provavel:** O container dos botoes esta SEMPRE visivel (nao tem `opacity-0 group-hover:opacity-100`), mas com `bg-card/90` pode ficar sobreposto pelo conteudo em telas menores ou dependendo do tamanho do texto. O screenshot do usuario mostra o botao cortado/sobreposto pelo menu de blocos.

**Correcao:**
- Garantir que os botoes tenham `z-30` (ja tem)
- Adicionar `min-w-fit` no container dos botoes para evitar que encolha
- Verificar se o `overflow-hidden` de algum pai esta cortando

**Arquivo:** `src/components/quiz/QuestionsList.tsx` - linhas 295-319

---

## 5) Erro ao Subir Imagem para Thumbnail do Video

### Analise
O `ImageUploader.tsx` e usado no `VideoBlock.tsx` (linha 437-441) para thumbnail. O upload usa `supabase.storage.from('quiz-media').upload()`.

**Causa provavel:** O `ImageUploader` usa um `id="image-upload"` fixo (linha 162), o que significa que se houver MULTIPLOS `ImageUploader` na mesma pagina (ex: imagem do quiz + thumbnail do video), os IDs conflitam. O `htmlFor` aponta para o mesmo ID, e o clique pode abrir o input errado ou causar comportamento inesperado.

**Correcao:**
- Gerar ID unico para cada instancia do `ImageUploader` usando `useId()` do React ou `crypto.randomUUID()`

**Arquivo:** `src/components/ImageUploader.tsx` - linhas 162-168

Alem disso, verificar se o bucket `quiz-media` tem RLS que permite uploads autenticados. Pode ser um problema de permissao no storage.

---

## 6) Bordas Pretas no Player de Video

### Causa raiz identificada
No `CustomVideoPlayer.tsx` (linha 543):

```text
className={cn(
  'relative group bg-black rounded-lg overflow-hidden focus:outline-none',
  aspectRatioClass,
  className
)}
```

O container tem `bg-black` fixo. O video usa `object-contain` (linha 556), que preserva a proporcao original do video mas preenche o espaco restante com a cor de fundo (preto).

Quando o video tem proporcao diferente do container (ex: video gravado em 9:16 mas container em 16:9), o `object-contain` mostra o video centralizado com barras pretas nas laterais.

**Correcao:**
- Trocar `bg-black` para `bg-transparent` ou `bg-muted`
- OU trocar `object-contain` para `object-cover` (corta o video para preencher)
- A melhor opcao e manter `object-contain` mas trocar `bg-black` para `bg-muted/50` para integrar melhor com o design

Porem, o `aspectRatio` configurado no editor (4:3, 16:9, etc) define o container. Se o video nao bate com a proporcao do container, bordas sao inevitaveis com `object-contain`.

**Solucao recomendada:**
1. Trocar `bg-black` para `bg-muted` no container
2. Adicionar opcao `object-cover` para quem quiser "cortar para preencher" (nova prop `fit?: 'contain' | 'cover'`)

**Arquivo:** `src/components/video/CustomVideoPlayer.tsx` - linhas 542-546 e 556

---

## Resumo de Arquivos a Alterar

| Arquivo | Alteracao |
|---|---|
| `src/App.tsx` | Fix RequireAuth (useEffect para redirect) |
| `src/hooks/useCookieConsent.ts` | Trocar `.single()` por `.maybeSingle()` |
| `src/components/BunnyVideoUploader.tsx` | Remover referencias visuais "Bunny" |
| `src/components/quiz/blocks/VideoBlock.tsx` | Remover referencias visuais "Bunny" |
| `src/components/MediaLibraryCard.tsx` | Remover referencias visuais "Bunny" |
| `src/components/quiz/QuestionsList.tsx` | Fix posicionamento botoes edit/delete |
| `src/components/ImageUploader.tsx` | Fix ID duplicado (gerar unique ID) |
| `src/components/video/CustomVideoPlayer.tsx` | Fix bg-black + opcao object-cover |

## Ordem de Implementacao
1. Fix `RequireAuth` (resolve items 1 e 2 de uma vez)
2. Fix `useCookieConsent` (406 error)
3. Fix `ImageUploader` ID unico (resolve item 5)
4. Fix `CustomVideoPlayer` bg + fit (resolve item 6)
5. Fix `QuestionsList` botoes (resolve item 4)
6. Cleanup Bunny references (resolve item 3)
