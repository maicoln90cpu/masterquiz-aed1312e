

# Diagnostico Completo: Bugs Criticos Pos-Implementacao de Templates

## Bugs Identificados (Raiz dos Problemas)

### BUG 1: ComparisonBlock crash — `Cannot read properties of undefined (reading 'map')`

**Causa raiz**: O helper `comparisonBlock()` em `src/data/templates/helpers.ts` gera campos `beforeTitle`, `afterTitle`, `beforeItems`, `afterItems`. Porem, o tipo `ComparisonBlock` em `src/types/blocks.ts` (linha 250-259) e o renderer `ComparisonBlockPreview` em `QuizBlockPreview.tsx` (linha 1274-1300) esperam `leftTitle`, `rightTitle`, `leftItems`, `rightItems`.

Quando o bloco chega ao renderer, `block.leftItems` e `undefined`, e `.map()` crasha.

**Correcao**: Alterar `comparisonBlock()` no `helpers.ts` para gerar `leftTitle`, `rightTitle`, `leftItems`, `rightItems`, `leftStyle: 'negative'`, `rightStyle: 'positive'`, `showIcons: true` — alinhando com o tipo TypeScript e o renderer.

---

### BUG 2: SocialProofBlock crash — campo `social_proof` vs `socialProof`

**Causa raiz**: O helper `socialProofBlock()` gera `type: 'social_proof'` (com underscore). Porem, o `BlockType` em `src/types/blocks.ts` (linha 24) define `'socialProof'` (camelCase). O renderer no `QuizBlockPreview.tsx` (linha 842) faz `case "socialProof"`. Os blocos com `type: 'social_proof'` caem no `default: return null` e nao renderizam. Alem disso, o `SocialProofBlock` interface espera campos `action` e `time`, mas o helper gera `text` e `timeAgo`.

**Correcao**: Alterar `socialProofBlock()` para usar `type: 'socialProof'` e gerar `action` (em vez de `text`) e `time` (em vez de `timeAgo`), ademas de incluir `interval: 5`, `style: 'toast'`, `position: 'bottom-left'`, `showAvatar: true` — alinhando com a interface `SocialProofBlock`.

---

### BUG 3: questionBlock helper — campo `content` vs `questionText`

**Causa raiz**: O helper `questionBlock()` gera `content: text` (linha 12 do helpers). Porem, o tipo `QuestionBlock` em `blocks.ts` (linha 34) e o renderer no `QuizBlockPreview.tsx` (linha 324) esperam `questionText`. Resultado: a pergunta aparece sem texto, mostrando apenas as opcoes de resposta.

Isso explica o problema #2 e #4 do usuario: "varios sem a pergunta, somente a resposta".

**Correcao**: Alterar `questionBlock()` para gerar `questionText: text` em vez de `content: text`.

---

### BUG 4: questionBlock helper — opcoes como `{text, value}` vs `string`

**Causa raiz**: Os templates geram opcoes como `[{ text: 'Opcao', value: 'valor' }]`. No `QuizBlockPreview.tsx` (linha 374), o renderer faz `block.options.map()` e chama `normalizeOption(rawOption)`. A funcao `normalizeOption` converte objetos para string, entao isso funciona no preview. Porem, o `QuestionBlockRenderer` em `QuizViewQuestion.tsx` (linha 311) faz `typeof option === 'string' ? option : option.text` — isso funciona. Este nao e o problema principal.

---

### BUG 5: CRM crash — `Cannot read properties of null (reading 'UUID')`

**Causa raiz**: Na linha 144 do CRM.tsx, `response.quizzes?.title` pode ser `null` quando o quiz e deletado mas a resposta persiste (a query usa `!inner` join). Mais criticamente, na linha 145, `response.quiz_results?.result_text` — o select retorna um array (nao um objeto), pois quiz_results e uma relacao 1-to-many. O acesso `.result_text` de um array retorna `undefined`, que e inofensivo. 

O crash real esta na linha 979-1006 do Dialog de comparacao: `getSelectedLeads()[0]?.answers` — quando `answers` e `null` (nao `{}`), `Object.keys(null)` crasha. Combinado com leads cujo `quiz_results` retorna arrays inesperados.

Revisando o erro: "Cannot read properties of null (reading '11e8adaa...')" — isso indica acesso a propriedade de `null` com um UUID como chave. Isso ocorre na linha 992: `lead.answers[questionKey]` onde `lead.answers` e `null`.

**Correcao**: Adicionar fallback `response.answers || {}` na transformacao de leads (linha 148) e proteger o dialog de comparacao com `(getSelectedLeads()[0]?.answers || {})`.

---

### BUG 6: Quiz Preview crash na ultima pergunta

**Causa raiz**: Provavelmente relacionado ao ComparisonBlock crash (BUG 1). Muitos templates tem blocos `comparison` nas perguntas 9-10 (fase Contraste). Quando o usuario chega nessas perguntas, o renderer tenta acessar `block.leftItems.map()` → crash.

**Correcao**: Resolver BUG 1 resolve este tambem. Adicionalmente, adicionar null-guards no `ComparisonBlockPreview` e `SocialProofBlockPreview`.

---

### BUG 7: countdownBlock helper — campo `minutes` vs `duration`

**Causa raiz**: O helper gera `{ minutes, label }`. O tipo `CountdownBlock` espera `duration` (em segundos), `showDays`, `showHours`, `showMinutes`, `showSeconds`. O renderer (linha 1040-1100) usa `block.duration`. 

**Correcao**: Alterar `countdownBlock()` para gerar `duration: minutes * 60` e incluir `showDays: false, showHours: false, showMinutes: true, showSeconds: true, label`.

---

### BUG 8: progressBlock helper — campo incompativel

**Causa raiz**: O helper gera `{ value, label, showPercentage }`. O tipo `ProgressBlock` espera `currentStep`, `totalSteps`, `showPercentage`, `label`, `style`, `primaryColor`. O renderer `ProgressBlockPreview` (linha 819) recebe `currentQuestion` e `totalQuestions` como props, nao do bloco.

**Correcao**: Alterar `progressBlock()` para gerar campos compativeis com o tipo `ProgressBlock`.

---

## Plano de Correcao

### Arquivo 1: `src/data/templates/helpers.ts`
Corrigir TODOS os helpers para alinhar com os tipos TypeScript em `src/types/blocks.ts`:

- `questionBlock()`: `content` → `questionText`
- `comparisonBlock()`: `beforeTitle/afterTitle/beforeItems/afterItems` → `leftTitle/rightTitle/leftItems/rightItems` + `leftStyle/rightStyle/showIcons`
- `socialProofBlock()`: `type: 'social_proof'` → `type: 'socialProof'`, `text` → `action`, `timeAgo` → `time`, adicionar `interval/style/position/showAvatar`
- `countdownBlock()`: `minutes` → `duration` (em segundos), adicionar `showDays/showHours/showMinutes/showSeconds`
- `progressBlock()`: alinhar com tipo `ProgressBlock`
- `sliderBlock()`: verificar `showValue` vs `showValue` (ja esta OK)

### Arquivo 2: `src/components/quiz/QuizBlockPreview.tsx`
Adicionar null-guards defensivos nos sub-componentes:
- `ComparisonBlockPreview`: `(block.leftItems || []).map()`
- `SocialProofBlockPreview`: `block.notifications?.[0]`
- Garantir que blocos com dados incompletos nao crasham

### Arquivo 3: `src/pages/CRM.tsx`
- Linha 148: `answers: response.answers || {}`
- Linha 979: `Object.keys(getSelectedLeads()[0]?.answers || {})`
- Linha 992: `lead.answers?.[questionKey]` com fallback

### Arquivo 4: `src/components/quiz/view/QuizViewQuestion.tsx`
Adicionar guards no `QuizBlockPreview` chamado na linha 118-125 para blocos malformados.

### Arquivos 5-12: Todos os templates
Nenhuma alteracao necessaria nos templates individuais — a correcao no `helpers.ts` resolve todos de uma vez, pois todos usam as mesmas funcoes helper.

### Verificacao pos-correcao
Apos as correcoes, todos os 14 templates (9 base + 5 premium) passarao a renderizar corretamente porque:
1. `questionText` sera preenchido → perguntas visiveis
2. `leftItems`/`rightItems` existirao → ComparisonBlock nao crasha
3. `socialProof` tipo correto → blocos de prova social renderizam
4. `duration` em segundos → countdown funciona
5. CRM null-safe → comparacao de leads nao crasha

