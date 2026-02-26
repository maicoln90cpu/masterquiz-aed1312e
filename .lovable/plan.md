
Objetivo aprovado: forçar slug aleatório numérico para quizzes do modo express (draft e publicado), eliminando colisões de slug baseadas em título.

1) Do I know what the issue is?
- Sim. O fluxo express ainda usa slug derivado de título via trigger (`set_quiz_slug -> generate_slug(title)`), o que mantém risco de conflito em concorrência e não atende sua regra de “slug numérico aleatório no express”.

2) Arquivos/partes a alterar
- `supabase/migrations/*` (nova migration)
- `src/pages/Start.tsx`
- `src/hooks/useQuizPersistence.ts`
- `src/integrations/supabase/types.ts` (se necessário por regeneração de tipos)
- `.lovable/plan.md` (marcar execução)

3) Implementação (etapas curtas)
- Criar função SQL dedicada `generate_express_slug()` com formato numérico aleatório (ex.: `exp-########`) e loop de unicidade.
- Atualizar função trigger `set_quiz_slug()`:
  - Se `creation_source = 'express_auto'` e `slug` vazio/nulo: usar `generate_express_slug()`.
  - Caso contrário: manter `generate_slug(title)` atual.
- Atualizar trigger de slug para continuar em `BEFORE INSERT OR UPDATE` (mantendo cobertura de draft/publicação).
- Incluir no `Start.tsx` a criação explícita de slug aleatório no insert express (defesa dupla app+DB).
- No `saveQuiz` (`useQuizPersistence.ts`), ao publicar quiz express:
  - garantir que, se slug estiver vazio/legado inválido, faça update com slug aleatório antes de setar `status='active'`.
- Backfill seguro:
  - atualizar somente quizzes `creation_source='express_auto'` com `slug` nulo/vazio para slug aleatório.
  - não reescrever slugs já ativos válidos para evitar quebrar links existentes.

4) Hardening para evitar recorrência
- Adicionar retry local (1 tentativa) no publish express para erro `23505` de slug (regenera slug e repete update).
- Padronizar validação de slug express por regex em runtime (somente no fluxo express).
- Log técnico com contexto mínimo (`quiz_id`, `creation_source`, `status_transition`) para auditoria de conflitos.

5) Verificação pós-implementação
- Criar quiz via `/start` e confirmar slug já nasce aleatório no draft.
- Publicar no express e confirmar manutenção/geração correta de slug aleatório sem erro.
- Repetir fluxo com múltiplos cliques rápidos e confirmar ausência de conflito.
- Validar que quizzes manuais continuam usando slug semântico (baseado em título).
