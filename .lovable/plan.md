

# Plano de Correção — Eventos GTM Não Disparados

## Diagnóstico Completo (com dados reais do banco)

Analisei os logs do usuário teste2 (`50dd1ec3`) no banco. Aqui está a **timeline real**:

```text
02:17:01 → AccountCreated         ✅ Disparou
02:17:07 → objective_selected     ✅ Disparou (value: ON)
02:17:07 → express_started        ✅ Disparou
02:17:31 → quiz_published         ✅ Disparou (express)
02:17:31 → express_first_published ✅ Disparou
         → STAGE PROMOVIDO PARA "construtor" ← AQUI ESTÁ O PROBLEMA
02:18:01 → quiz_created           ✅ Disparou (manual)
02:18:01 → quiz_published         ✅ Disparou (manual)
02:18:01 → quiz_first_publishedB  ❌ NÃO disparou
02:18:01 → first_quiz_createdB    ❌ NÃO disparou
```

### Causa Raiz

**O quiz Express promove o user_stage para `construtor` imediatamente.** Quando o usuário cria o quiz manual logo depois, o sistema verifica `earlyStages = ['explorador', 'iniciado', 'engajado']` — mas o usuário já é `construtor`. Logo, os eventos condicionais são bloqueados.

### Problema "perfilON"
O evento `objective_selected` **disparou corretamente** no banco com `value: ON`. O que pode ter ocorrido é que no GTM Preview as tags não estão configuradas para escutar `objective_selected`. **Não é um bug de código — é configuração GTM.**

---

## Erros Identificados

| # | Problema | Causa | Gravidade |
|---|---------|-------|-----------|
| 1 | `quiz_first_publishedB` não dispara para quiz manual | Stage já é `construtor` após express | 🔴 Alta |
| 2 | `first_quiz_createdB` não dispara para quiz manual | Mesma causa — guard `earlyStages` | 🔴 Alta |
| 3 | Express promove para `construtor` antes do quiz manual | Promoção prematura de stage | 🟡 Média |
| 4 | Eventos milestone ignoram quizzes manuais pós-express | Lógica de "primeiro quiz" não distingue express de manual | 🟡 Média |

---

## Como funciona HOJE vs Como ficará

```text
HOJE:
  Express → stage=construtor → Manual → (guard bloqueia eventos milestone)
  
DEPOIS:
  Express → stage=engajado (não construtor!)
  Manual → stage=construtor + dispara quiz_first_publishedB + first_quiz_createdB
```

### Mudança principal: **Separar promoção de stage entre Express e Manual**

- Express deve promover apenas até `engajado` (não `construtor`)
- Somente quiz MANUAL (non-express) promove para `construtor`
- Eventos `quiz_first_published` / `first_quiz_created` são para quizzes MANUAIS — express já tem seus próprios eventos (`express_first_published`)

---

## Etapa 1 — Correção da lógica de promoção de stage

### Arquivo: `src/hooks/useQuizPersistence.ts`

**UPDATE branch (L442-448):** Promoção para `construtor` NÃO deve acontecer se é express
```text
ANTES: Promove para construtor sempre que earlyStages
DEPOIS: 
  - Se isExpressMode → promove apenas para 'engajado'
  - Se manual → promove para 'construtor'
```

**INSERT branch (L582-589):** Mesma lógica
```text
ANTES: Promove para construtor sempre que earlyStages  
DEPOIS:
  - Se isExpressMode → promove apenas para 'engajado'
  - Se manual → promove para 'construtor'
```

**UPDATE branch (L409):** `quiz_first_publishedB` no UPDATE deve disparar para `construtor` também (não só earlyStages), DESDE que seja o primeiro quiz manual
```text
ANTES: if (earlyStages.includes(currentStage))
DEPOIS: if ([...earlyStages, 'construtor'].includes(currentStage))
  — Isso permite que um user que publicou express (agora engajado/construtor) 
    ainda dispare o evento ao publicar seu primeiro quiz manual
```

### Arquivo: `src/pages/Start.tsx`
Nenhuma mudança — o express_started e objective_selected já estão corretos.

---

## Etapa 2 — Adicionar flag `first_manual_quiz_published` para deduplicação

Para evitar que `quiz_first_publishedB` dispare em TODA publicação manual (só queremos na primeira):

**No useQuizPersistence.ts:**
- Antes de disparar `quiz_first_publishedB`, verificar no localStorage se já disparou: `mq_first_manual_published_{userId}`
- Após disparar, salvar a flag

Isso é um guard leve que não depende de stage.

---

## Resumo de Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useQuizPersistence.ts` | Separar promoção express (→engajado) vs manual (→construtor). Expandir guard de milestone events para incluir `construtor` em quizzes manuais. Adicionar dedup flag. |

**Total: 1 arquivo, ~30 linhas alteradas**

---

## Resumo para Leigos

**O que acontece hoje:** Quando você cria um quiz rápido (Express), o sistema "marca" seu perfil como "usuário avançado" (construtor). Quando depois você cria um quiz manual, o sistema pensa "esse usuário já é avançado, não preciso rastrear a primeira vez dele" — e não envia o evento para o Google Analytics.

**Como ficará:** O quiz Express vai marcar o perfil apenas como "engajado" (um nível abaixo). Assim, quando criar o quiz manual, o sistema ainda reconhece que é a "primeira vez real" e envia o evento corretamente.

**Sobre o "perfilON":** O evento `objective_selected` com valor `ON` **já está disparando corretamente** no banco. Se não apareceu no GTM Preview, é porque a TAG no GTM precisa ser configurada para escutar o evento `objective_selected` (configuração no painel do GTM, não no código).

## Vantagens
- Eventos de milestone ficam precisos para usuários que passam por Express → Manual
- Dados de conversão no GA4/GTM refletem a realidade
- Sem risco de quebrar fluxo existente (mudança apenas na ordem de promoção)

## Checklist Manual Pós-Implementação
- [ ] Criar conta teste, escolher objetivo, publicar express → verificar stage = `engajado`
- [ ] Criar quiz manual e publicar → verificar `quiz_first_publishedB` no GTM Preview
- [ ] Verificar no banco que stage final = `construtor`
- [ ] Confirmar que `objective_selected` aparece no banco (ON ou OFF)

