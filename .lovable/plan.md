
## Auditoria completa realizada

### Evidências coletadas
- Li a função completa `supabase/functions/parse-pdf-document/index.ts`.
- Li o fluxo de upload/parse no frontend em `src/components/quiz/AIQuizGenerator.tsx`.
- Li `supabase/config.toml` (função registrada com `verify_jwt = false`).
- Consultei logs recentes da Edge Function `parse-pdf-document`.
- Consultei logs de `generate-quiz-ai` (sem eventos no período).
- Verifiquei secrets: `LOVABLE_API_KEY` e `OPENAI_API_KEY` existem (não são a causa atual).
- Tentei chamada interna direta para `/parse-pdf-document`; retornou `401 Unauthorized` no meu contexto (sem token de sessão nesta execução), então validação autenticada precisa ser feita no fluxo do usuário logado.

---

## Diagnóstico técnico (causa raiz atual)

**Erro confirmado em produção (repetido):**
`No "GlobalWorkerOptions.workerSrc" specified.`

**Onde quebra:**
- Em `parse-pdf-document/index.ts`, na chamada `pdfjsLib.getDocument(...)`.
- Logs mostram falha exatamente na inicialização do worker do `pdfjs-dist` (build legacy via esm.sh).

**Por que persiste mesmo com `disableWorker: true`:**
- Em versões atuais/arquitetura usada, esse flag **não está impedindo** a inicialização do worker nesse bundle específico.
- Resultado: a função falha antes de extrair qualquer texto do PDF.
- Isso explica por que `generate-quiz-ai` nem recebe chamadas: o fluxo morre antes, no parse.

---

## “Do I know what the issue is?”

**Sim.**  
O bloqueio principal é a biblioteca/forma de import do parser PDF no Edge Runtime (Deno): `pdfjs-dist` está exigindo `workerSrc` e abortando o processamento.

---

## Mapa completo de possíveis erros (priorizado)

### Confirmado (P0)
1. **Worker obrigatório não configurado no runtime atual**
   - Erro explícito nos logs.
   - Impacto: 100% das tentativas de parse falham.

### Muito provável (P1) após corrigir P0
2. **Extração vazia em PDF escaneado/imagem**
   - `getTextContent()` pode retornar pouco texto.
   - Impacto: geração ruim ou falha sem conteúdo útil.

3. **Tratamento de erro genérico no frontend**
   - UI mostra “Erro ao processar PDF” sem detalhe técnico.
   - Impacto: dificulta suporte/diagnóstico.

### Possíveis (P2)
4. **Arquivo protegido/criptografado**
   - Pode disparar exceções específicas de PDF.
5. **Timeout/memória em PDFs complexos**
   - Menos provável no seu caso (15 páginas), mas possível com páginas pesadas.
6. **401 quando usuário não autenticado**
   - Não é seu caso no fluxo de geração autenticado, mas é causa real em testes internos sem token.

---

## Plano de implementação (para corrigir de forma definitiva)

### Etapa 1 — Trocar engine de parse para ambiente serverless (correção estrutural)
**Arquivo:** `supabase/functions/parse-pdf-document/index.ts`

- Substituir `pdfjs-dist` por build serverless compatível com Deno (ex.: `pdfjs-serverless`), eliminando dependência de worker tradicional.
- Manter limite de 50 páginas e 20MB.
- Adicionar tratamento explícito para:
  - PDF inválido
  - PDF protegido por senha
  - conteúdo extraído muito curto
- Melhorar logs com etapas:
  - decode ok
  - open doc ok
  - page count
  - chars por página
  - total chars

### Etapa 2 — Melhorar observabilidade no frontend
**Arquivo:** `src/components/quiz/AIQuizGenerator.tsx`

- Exibir mensagem de erro diferenciada por cenário:
  - parser indisponível
  - PDF protegido
  - PDF sem texto detectável (scan/imagem)
  - limite de tamanho
- Persistir detalhes técnicos no `console.error` com `parseError` + payload resumido (sem PII desnecessária).
- Manter UX atual (toast), mas com diagnóstico acionável.

### Etapa 3 — Endurecer validações do parser
**Arquivo:** `supabase/functions/parse-pdf-document/index.ts`

- Validar formato base64 antes de `atob`.
- Validar assinatura PDF (`%PDF`) após decode (se inválido, responder 400 claro).
- Se texto extraído < limiar mínimo, retornar status semântico (422) com motivo (`LOW_TEXT_DENSITY`).

### Etapa 4 — Deploy e ciclo de tentativas internas até sucesso
- Deploy imediato de `parse-pdf-document`.
- Teste técnico da função (chamada autenticada).
- Repetir ciclo até passar:
  1) upload PDF
  2) parse com sucesso
  3) geração `generate-quiz-ai` com sucesso
  4) criação de quiz no banco
- Só encerrar após evidência objetiva de sucesso no fluxo completo.

---

## Critérios objetivos de sucesso

1. `parse-pdf-document` retorna `200` com:
   - `pages` correto
   - `text` não vazio
   - `markdown` não vazio
2. Frontend sai do estado “Extraindo conteúdo...” e mostra sucesso de parse.
3. `generate-quiz-ai` é chamado na sequência (logs passam a aparecer).
4. Quiz é criado e abre no editor sem erro.
5. Em caso de falha, toast traz motivo específico (não apenas erro genérico).

---

## Escopo de arquivos a alterar quando você aprovar

- `supabase/functions/parse-pdf-document/index.ts`
- `src/components/quiz/AIQuizGenerator.tsx`

(sem tocar no restante do fluxo de editor/publicação)

