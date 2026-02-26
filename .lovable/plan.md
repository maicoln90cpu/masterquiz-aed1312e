

# Plano: Correcoes Criticas + Migracao Objetivos + Express para Usuarios Antigos

---

## Diagnostico e Alteracoes

### ITEM 1 — Bug Critico: Mensagens de Boas-Vindas Duplicadas

**Causa raiz encontrada:** A tabela `recovery_contacts` NAO tem constraint UNIQUE em `(user_id, template_id)`. O `ON CONFLICT DO NOTHING` na funcao `trigger_welcome_message` nao faz nada porque so existe constraint no `id` (PK). Resultado: cada update no profile (ex: salvar whatsapp, mudar nome, etc.) dispara o trigger e insere um novo registro.

Dados reais: 10 usuarios afetados com 3 a 6 mensagens de boas-vindas duplicadas cada.

**Correcao (migration SQL):**

1. Criar constraint UNIQUE em `recovery_contacts (user_id, template_id)`:
```sql
ALTER TABLE recovery_contacts 
ADD CONSTRAINT uq_recovery_user_template UNIQUE (user_id, template_id);
```
Isso faz o `ON CONFLICT DO NOTHING` funcionar de verdade.

2. Limpar duplicatas existentes — manter apenas o registro mais antigo por `(user_id, template_id)`.

3. Atualizar `trigger_welcome_message` para usar `ON CONFLICT (user_id, template_id) DO NOTHING`.

4. Atualizar `trigger_welcome_on_whatsapp_update` com o mesmo ajuste.

5. Atualizar `trigger_first_quiz_message` com o mesmo ajuste.

**Arquivo:** Nova migration SQL

---

### ITEM 2 — Migrar Objetivos "other" para "educational"

**Dados atuais no banco:**
- 12 usuarios com objetivo `other` (generico)
- 7 usuarios com objetivos customizados tipo `other:Brincar`, `other:Estudo para prova`, `other:Quiz para entretenimento`, `other:Venda`, `other:Teste de equipe`, etc.

**Regra de migracao:**
- `other` → `educational`
- `other:Estudo para prova` → `educational`
- `other:Quiz para entretenimento` → `educational`
- `other:Brincar` → `educational`
- `other:Teste de equipe` → `educational`
- `other:Como esta sua saude mental` → `educational`
- `other:Fazer videos educativos` → `educational`
- `other:Venda` → `lead_capture_launch` (este e comercial)

**Correcao:** SQL UPDATE para migrar todos, usando logica: se o primeiro objetivo comeca com `other`, substituir. `other:Venda` vai para `lead_capture_launch`, todos os demais vao para `educational`.

**Frontend:** Remover a opcao "Outro" do modal `UserObjectiveModal` e da tela `/start` (atualmente ja nao existe no Start.tsx, mas verificar o modal).

**PQL Analytics:** O componente `PQLAnalytics.tsx` usa o primeiro elemento de `user_objectives` como chave. Com a migracao, as linhas "other:*" somem e se consolidam em `educational` ou `lead_capture_launch`.

**Arquivo:** SQL via insert tool (data update, nao migration)

---

### ITEM 3 — Template "Primeiro Quiz Criado" no Express Mode

**Situacao atual:** O trigger `on_first_quiz_created` na tabela `quizzes` dispara `trigger_first_quiz_message()` sempre que um quiz muda para `status = 'active'` pela primeira vez. No Express Mode, o quiz e publicado automaticamente → trigger dispara → usuario recebe mensagem WhatsApp "Primeiro Quiz Criado".

**Problema:** No Express Mode, o quiz foi auto-gerado, nao criado com intencao real. A mensagem WhatsApp nao deveria disparar.

**Correcao:** Adicionar uma coluna `source` na tabela `quizzes` (ou usar campo existente) para identificar a origem do quiz. Alternativa mais simples: verificar se o usuario tem `user_stage` em `['explorador', 'iniciado']` quando o trigger dispara — se sim, o quiz veio do express e NAO deve disparar a mensagem.

Melhor abordagem: Adicionar campo `creation_source` ao quiz (`express_auto` vs `manual`/`ai`/`template`/etc). O trigger `trigger_first_quiz_message` so dispara se `NEW.creation_source != 'express_auto'` OU se o usuario ja interagiu (stage >= 'engajado').

**Alteracoes:**
1. Migration: adicionar coluna `creation_source TEXT DEFAULT 'manual'` na tabela `quizzes`
2. `Start.tsx`: ao criar o quiz draft, incluir `creation_source: 'express_auto'`
3. `trigger_first_quiz_message`: adicionar guard `IF NEW.creation_source = 'express_auto' THEN RETURN NEW;`

---

### ITEM 4 — Express Mode para Usuarios Antigos sem Quiz

**Objetivo:** Quando um usuario antigo (que ja tem conta mas nunca criou quiz) fizer login, ser redirecionado para o `/start` (Express Mode) automaticamente.

**Situacao atual:** O Dashboard.tsx ja faz isso parcialmente:
```typescript
const earlyStages = ['explorador', 'iniciado'];
if (!statsLoading && earlyStages.includes(profile?.user_stage) && stats?.activeQuizzes === 0) {
  navigate('/start', { replace: true });
}
```

**Problema:** Usuarios antigos podem ter `user_stage = null` (coluna nao existia quando se cadastraram) ou outro valor. Tambem podem ter quizzes em `draft` mas nenhum `active`.

**Correcao:**
1. `Dashboard.tsx`: Expandir a condicao para incluir `user_stage IS NULL`:
```typescript
const earlyStages = ['explorador', 'iniciado'];
const stage = profile?.user_stage || 'explorador';
if (!statsLoading && earlyStages.includes(stage) && (stats?.activeQuizzes ?? 0) === 0) {
  navigate('/start', { replace: true });
}
```

2. Migration SQL: Atualizar todos os profiles com `user_stage IS NULL` para `'explorador'`:
```sql
UPDATE profiles SET user_stage = 'explorador' WHERE user_stage IS NULL;
```

Isso garante que qualquer usuario sem quiz publicado e sem stage definido entre no funil express.

---

### ITEM 5 — Resumo Leigo do PQL + Schema

**A tabela profiles JA tem as colunas necessarias:**
- `user_stage TEXT` — ja existe, aceita qualquer valor texto
- `user_objectives TEXT[]` — ja existe
- `stage_updated_at TIMESTAMP` — ja existe

**NAO precisa alterar a tabela profiles.** Os 8 estagios sao apenas valores diferentes no mesmo campo `user_stage`.

**Resumo leigo dos fluxos PQL alterados:**

```text
ANTES (3 estagios):
  Explorador → Construtor → Operador
  (criou conta)   (publicou)   (tem lead)

DEPOIS (8 estagios):
  1. Explorador  → criou conta, nao fez nada
  2. Iniciado    → entrou no express, chegou na pergunta 2
  3. Engajado    → editou algo de verdade (titulo, pergunta, opcao)
  4. Construtor  → publicou o quiz
  5. Operador    → recebeu primeiro lead real
  6. Potencial   → 30+ respostas ou 10+ leads
  7. Quase Up    → 60+ respostas ou 25+ leads  
  8. Limite      → 100 respostas (plano free)

O QUE MUDOU NA PRATICA:
- Antes: criar quiz contava como "intencao". Agora nao.
  O quiz e criado automaticamente no express, entao
  so conta quando o usuario EDITA algo de verdade.
  
- Antes: 3 niveis simples. Agora: 8 niveis que mostram
  exatamente ONDE o usuario parou no funil.
  
- O campo no banco e o mesmo (user_stage na tabela profiles).
  So mudaram os valores possiveis. Nao precisa criar tabela nova.

- Os estagios 5-8 (operador em diante) ainda dependem de
  logica no backend (edge function) que sera feita na fase 2.
```

---

## Resumo de Alteracoes

| # | O que | Tipo | Detalhe |
|---|-------|------|---------|
| 1 | Constraint UNIQUE + limpar duplicatas | Migration SQL | `recovery_contacts (user_id, template_id)` |
| 1b | Atualizar 3 triggers | Migration SQL | welcome, whatsapp_update, first_quiz |
| 2 | Migrar objectives "other*" | Data UPDATE | other→educational, other:Venda→lead_capture_launch |
| 3 | Coluna `creation_source` em quizzes | Migration SQL | + guard no trigger first_quiz_message |
| 3b | Start.tsx: marcar quiz como express_auto | Frontend | `creation_source: 'express_auto'` no INSERT |
| 4 | Dashboard redirect para stage null | Frontend | Tratar null como explorador |
| 4b | Normalizar stages null no banco | Data UPDATE | SET user_stage = 'explorador' WHERE NULL |

