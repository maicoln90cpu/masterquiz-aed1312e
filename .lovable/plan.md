

# Plano: Corrigir erro na geração de quiz via PDF

## Diagnóstico

O erro é claro e definitivo: **a Edge Function `parse-pdf-document` nunca foi criada**. Os logs do Supabase mostram `404` em todas as chamadas OPTIONS/POST para `/functions/v1/parse-pdf-document` — a função simplesmente não existe no backend.

O fluxo atual em `AIQuizGenerator.tsx` (linha 175) faz:
```text
supabase.functions.invoke('parse-pdf-document', { body: { fileName, fileData } })
```

Mas no diretório `supabase/functions/` não existe nenhuma pasta `parse-pdf-document/`.

Além disso, o código envia o PDF inteiro como `Array.from(new Uint8Array(arrayBuffer))` — um array de bytes no JSON — o que para PDFs de 15 páginas pode facilmente gerar payloads de 5-15MB em JSON, ineficiente e propenso a timeout.

## Erros identificados

1. **Edge Function inexistente** — `parse-pdf-document` nunca foi deployada (404)
2. **Serialização ineficiente** — PDF convertido em array de ints no JSON body (payload inflado 3-4x)
3. **Sem fallback client-side** — se a função falha, não há alternativa

## Solução proposta

Criar a Edge Function `parse-pdf-document` que:
1. Recebe o PDF como base64 (mais eficiente que array de bytes)
2. Usa a biblioteca `pdf-parse` (via esm.sh) para extrair texto do PDF
3. Retorna `{ text, pages, markdown }` no formato que o frontend já espera

Ajustar o frontend (`AIQuizGenerator.tsx`) para:
1. Enviar o PDF como base64 ao invés de array de bytes
2. Tratar erros com mensagens mais específicas

## Detalhes técnicos

### 1. Criar `supabase/functions/parse-pdf-document/index.ts`

A função irá:
- Receber `{ fileName: string, fileBase64: string }`
- Decodificar base64 para Uint8Array
- Usar `pdf-parse` para extrair texto de cada página
- Retornar `{ text, pages, markdown }`
- Incluir CORS headers padrão e autenticação via `getUser()`
- Limitar tamanho do payload (20MB)

### 2. Registrar em `supabase/config.toml`

Adicionar:
```text
[functions.parse-pdf-document]
verify_jwt = false
```

### 3. Atualizar `src/components/quiz/AIQuizGenerator.tsx`

Linhas 156-180 — mudar a serialização:
- Converter `arrayBuffer` para base64 ao invés de `Array.from(new Uint8Array(...))`
- Enviar `{ fileName, fileBase64 }` ao invés de `{ fileName, fileData }`
- Melhorar mensagens de erro para diferenciar 404 de outros erros

## Alternativa considerada (client-side)

Usar `pdf.js` no browser para extrair texto. Porém:
- Adicionaria uma dependência pesada (~300KB) ao bundle
- Inconsistente com a arquitetura atual (lógica sensível no backend)
- A Edge Function é a abordagem correta e alinhada com o padrão do projeto

## Arquivos a criar/alterar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/parse-pdf-document/index.ts` | Criar — Edge Function para parsing de PDF |
| `supabase/config.toml` | Editar — registrar a nova função |
| `src/components/quiz/AIQuizGenerator.tsx` | Editar — enviar base64, melhorar tratamento de erro |

## Arquivos NÃO tocados
- `generate-quiz-ai/index.ts` (já funciona, recebe o texto extraído)
- Nenhum outro componente afetado

