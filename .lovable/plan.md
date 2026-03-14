

## Plano: Edição de Slug do Quiz + Correções KB + Prompt de Replicação

### 1. Edição de Slug do Quiz

**Contexto técnico**: A tabela `quizzes` tem constraint UNIQUE global em `slug` (`quizzes_slug_key`). A tabela `profiles` tem UNIQUE em `company_slug` (`profiles_company_slug_key`). As rotas são `/:company_slug/:quiz_slug` e `/quiz/:slug`.

**Regra**: O slug é globalmente único, então ao editar precisamos verificar contra TODOS os quizzes, não só os do usuário. Porém, como o company_slug é obrigatório para editar, o acesso real será via `/:company_slug/:slug`, reduzindo conflitos na prática.

**Implementação**:

- **QuizCard.tsx**: Adicionar botão "Editar Slug" (ícone `LinkIcon` + `Pencil`) na linha de ações dos 3 layouts (mobile, tablet, desktop). Ao clicar:
  - Se `userProfile.company_slug` está vazio → toast informando que precisa configurar o slug da empresa em Configurações
  - Se preenchido → abrir dialog inline de edição

- **MyQuizzes.tsx**: Adicionar estado para o dialog de edição de slug (`slugDialogOpen`, `quizToEditSlug`, `newSlug`, `slugChecking`, `slugValid`). Handler `handleEditSlug`:
  1. Sanitizar input (lowercase, apenas `a-z0-9-`)
  2. Debounce check: `SELECT id FROM quizzes WHERE slug = :newSlug AND id != :currentQuizId`
  3. Se disponível → `UPDATE quizzes SET slug = :newSlug WHERE id = :quizId AND user_id = :userId`
  4. Invalidar cache e fechar dialog

- **QuizCard props**: Adicionar `onEditSlug: (quizId: string, currentSlug: string) => void`

**Nenhuma migration necessária** — a constraint UNIQUE já existe.

### 2. Correções na Base de Conhecimento

**Erro encontrado**: Artigo `36352f0c` ("Planos e Preços") diz "FREE (1 quiz..." mas o real é 2 quizzes. O artigo `87493322` ("Limites por Plano") está correto com "FREE: 2 quiz".

Preciso também verificar os limites reais vs o que os artigos dizem:
- FREE: 2 quizzes, 100 respostas ✓ (artigo Limites correto, artigo Planos errado)
- PAID: 3 quizzes, 500 respostas
- PARTNER: 5 quizzes, 5000 respostas  
- PREMIUM: 10 quizzes, ilimitadas respostas

**Ação**: Atualizar o artigo "Planos e Preços" (`36352f0c`) via migration SQL para corrigir "1 quiz" → "2 quizzes" e adicionar os números exatos de cada plano.

### 2b. Prompt de Replicação do Sistema de Agente IA

Não requer mudanças no código. Vou fornecer o prompt completo diretamente na resposta após a implementação — um documento técnico genérico descrevendo a arquitetura (tabelas, edge functions, keyword matching, blacklist, knowledge base CRUD, escalation, rate limiting) para replicação em qualquer sistema.

### Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `src/components/quiz/QuizCard.tsx` | Adicionar botão "Editar Slug" + prop `onEditSlug` |
| `src/pages/MyQuizzes.tsx` | Dialog de edição de slug + handler com validação |
| Migration SQL | Corrigir artigo KB "Planos e Preços" (1→2 quizzes) + atualizar limites exatos |

