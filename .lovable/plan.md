
# Plano: Fix "Cannot read properties of null (reading 'questionCount')"

## Causa raiz

Os templates no banco de dados tem `preview_config = NULL` em todas as linhas. O codigo em `QuizTemplateSelector.tsx` acessa `template.preview.questionCount` diretamente, sem verificar se `preview` e null.

O fluxo e:
1. `useQuizTemplates` busca templates do banco
2. `convertDBTemplateToQuizTemplate` converte `preview_config` (que e null) em `preview`
3. `QuizTemplateSelector` renderiza `template.preview.questionCount` -- CRASH

## Correcao

### Arquivo 1: `src/hooks/useQuizTemplates.ts` (linha 28)

Na funcao `convertDBTemplateToQuizTemplate`, adicionar fallback para quando `preview_config` e null:

```typescript
preview: (dbTemplate.preview_config as unknown as QuizTemplate['preview']) || {
  questionCount: 5,
  template: 'moderno'
},
```

### Arquivo 2: `src/components/quiz/QuizTemplateSelector.tsx` (linhas 147 e 197)

Adicionar optional chaining como seguranca adicional:

```typescript
// Linha 147
<span>{template.preview?.questionCount ?? 5}</span>
// Linha 148
<span>{template.preview?.template ?? 'moderno'}</span>
// Linha 197 (mesma coisa na secao premium)
<span>{template.preview?.questionCount ?? 5}</span>
// Linha 198
<span>{template.preview?.template ?? 'moderno'}</span>
```

## Opcao adicional: corrigir dados no banco

Atualizar os templates que tem `preview_config = NULL` com valores validos via SQL:

```sql
UPDATE quiz_templates 
SET preview_config = jsonb_build_object('questionCount', 5, 'template', 'moderno')
WHERE preview_config IS NULL;
```

Isso resolve na raiz, mas o fallback no codigo e necessario como defesa.
