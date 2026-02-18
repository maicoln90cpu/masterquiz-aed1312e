
# Plano: Modal de Objetivo do Usuario (Pos-Cadastro)

## Conceito

Um modal leve e elegante que aparece no Dashboard perguntando "Qual seu principal objetivo com o MasterQuizz?". O usuario seleciona uma ou mais opcoes (checkbox) e confirma. O dado e salvo na tabela `profiles` em uma nova coluna `user_objectives`.

## Regras de Exibicao

- **Novos usuarios**: aparece automaticamente apos o primeiro login (conta recem-criada)
- **Usuarios existentes**: aparece se `user_objectives` estiver NULL/vazio no perfil
- **Uma vez respondido**: nunca mais aparece
- **Nao pode ser ignorado**: sem botao de fechar / clicar fora nao fecha (modal bloqueante)

## Opcoes de Objetivo

| Opcao | Valor interno |
|-------|--------------|
| Captar leads para lancamento | `lead_capture_launch` |
| Melhorar conversao da VSL | `vsl_conversion` |
| Rodar trafego pago | `paid_traffic` |
| Validar oferta | `offer_validation` |
| Uso educacional | `educational` |
| Outro | `other` (com campo de texto opcional) |

O usuario pode selecionar **multiplas opcoes** (checkbox), com minimo de 1 para habilitar o botao "Continuar".

## Alteracoes

### 1. SQL Migration

Adicionar coluna `user_objectives` na tabela `profiles`:

```sql
ALTER TABLE public.profiles
ADD COLUMN user_objectives text[] DEFAULT NULL;
```

Tipo `text[]` (array de strings) — leve, sem necessidade de tabela extra, facil de consultar.

### 2. Novo Componente: `src/components/UserObjectiveModal.tsx`

- Modal com `DialogContent` do shadcn (sem close button, `onInteractOutside` preventDefault)
- Lista de checkboxes estilizados (cards clicaveis com icone + label)
- Opcao "Outro" revela input de texto
- Botao "Continuar" desabilitado ate selecionar pelo menos 1
- Ao confirmar: `UPDATE profiles SET user_objectives = [...] WHERE id = user.id`
- Animacao sutil com Framer Motion nos cards
- i18n para PT/EN/ES

### 3. Dashboard: Integrar o Modal

No `src/pages/Dashboard.tsx`:
- Buscar `user_objectives` junto com o perfil existente
- Se `user_objectives` for NULL ou array vazio, mostrar o modal
- Apos salvar, fechar modal e liberar o dashboard

### 4. Icones sugeridos por opcao (Lucide)

| Opcao | Icone |
|-------|-------|
| Captar leads para lancamento | `Rocket` |
| Melhorar conversao da VSL | `TrendingUp` |
| Rodar trafego pago | `Megaphone` |
| Validar oferta | `FlaskConical` |
| Uso educacional | `GraduationCap` |
| Outro | `MoreHorizontal` |

## Arquivos Alterados

| Recurso | Tipo |
|---------|------|
| SQL Migration | ADD COLUMN `user_objectives text[]` em `profiles` |
| `src/components/UserObjectiveModal.tsx` | Novo componente |
| `src/pages/Dashboard.tsx` | Buscar `user_objectives`, renderizar modal |
| `src/i18n/config.ts` | Strings PT/EN/ES para o modal |

## UX

- Design: cards com borda sutil, hover com destaque primary, checkbox integrado
- Titulo: "Nos conte seu objetivo" com subtitulo "Isso nos ajuda a personalizar sua experiencia"
- Animacao: cards aparecem com stagger (framer-motion)
- O modal bloqueia interacao com o dashboard ate responder (overlay escuro)
- Responsivo: stack vertical em mobile
