

# CTAs Dinamicos no Dashboard: Matriz Estagio x Intencao

## Resumo

Alterar o dashboard para exibir headline, CTA e mensagem de upgrade **personalizados** com base no cruzamento entre o **nivel do usuario** (`user_stage`: explorador/construtor/operador) e a **intencao principal** (`user_objectives` do perfil). Nenhuma pagina nova sera criada -- apenas o card PQL existente no dashboard sera alterado dinamicamente.

## O que muda para o usuario

Em vez de um CTA generico ("Publicar primeiro quiz" / "Ver leads no CRM" / "Desbloquear recursos"), o card principal do dashboard mostrara:

- Uma **headline contextualizada** (ex: "Filtre curiosos antes de mandar para sua VSL")
- Um **CTA especifico** (ex: "Criar quiz pre-VSL")
- Uma **sugestao de upgrade** quando aplicavel (ex: "Desbloqueie analytics avancado")

## Arquitetura da solucao

```text
profiles.user_objectives  -->  useUserStage hook  -->  Dashboard PQL Card
profiles.user_stage       -->       (matriz)       -->  (headline + CTA + upgrade)
```

Nenhuma tabela nova. Nenhuma edge function nova. Apenas logica frontend.

## Detalhes tecnicos

### 1. Refatorar `src/hooks/useUserStage.ts`

- Buscar `user_objectives` junto com `user_stage` na query ao profiles
- Derivar a **intencao primaria** do array `user_objectives` (primeiro item, ou "other" como fallback)
- Criar a matriz completa `STAGE_INTENT_MATRIX` como um objeto `Record<UserStage, Record<string, StageIntentConfig>>` com as 18 combinacoes
- Exportar os novos campos na interface `UserStageData`: `headline`, `upgradeHint` (opcional)

Estrutura da matriz (exemplo):

```text
STAGE_INTENT_MATRIX = {
  explorador: {
    lead_capture_launch: {
      headline: "Seu quiz pode aquecer o lead antes do carrinho abrir.",
      ctaLabel: "Criar quiz de captacao",
      ctaRoute: "/create-quiz",
      upgradeHint: null
    },
    vsl_conversion: {
      headline: "Filtre curiosos antes de mandar para sua VSL.",
      ctaLabel: "Criar quiz pre-VSL",
      ctaRoute: "/create-quiz",
      upgradeHint: null
    },
    // ... demais intencoes
  },
  construtor: {
    lead_capture_launch: {
      headline: "Agora transforme respostas em compradores.",
      ctaLabel: "Gerar lead de teste",
      ctaRoute: "/crm",
      upgradeHint: "Remover limite de respostas"
    },
    // ... demais
  },
  operador: {
    // ... demais
  }
}
```

Todas as 18 celulas da matriz serao mapeadas conforme a especificacao fornecida.

### 2. Atualizar `src/pages/Dashboard.tsx`

- O card PQL (linhas ~223-260) passara a usar os novos campos `headline` e `upgradeHint` do hook
- `userStageData.message` sera substituido por `userStageData.headline`
- Se `upgradeHint` existir, renderizar um texto secundario abaixo do CTA

Nenhuma outra secao do dashboard sera alterada.

### 3. Internacionalizacao (i18n)

- As strings da matriz serao acessadas via chaves i18n no formato `pqlMatrix.<stage>.<intent>.headline` / `.cta` / `.upgrade`
- Fallbacks em portugues hardcoded para garantir que funcione mesmo sem traducao completa

### Arquivos modificados

| Arquivo | Tipo de alteracao |
|---------|------------------|
| `src/hooks/useUserStage.ts` | Refatorar: buscar objectives, criar matriz 3x6, exportar headline/upgradeHint |
| `src/pages/Dashboard.tsx` | Atualizar card PQL para usar novos campos |

### Arquivos NAO tocados

- `src/components/UserObjectiveModal.tsx` (ja funciona)
- `src/components/ui/*` (nenhuma alteracao em primitivos)
- Nenhuma migration de banco (dados ja existem em `profiles.user_objectives` e `profiles.user_stage`)
- Nenhuma edge function

