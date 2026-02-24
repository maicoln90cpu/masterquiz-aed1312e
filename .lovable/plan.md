
# Plano: Nova aba "Uso Educacional" + Select de proposta no PDF

## Resumo

Adicionar uma terceira aba na geracao por IA chamada "Uso Educacional" com campos e prompts especificos para quizzes educativos, e adicionar um campo "Proposta do Quiz" no modo Upload de PDF para que o usuario escolha entre Infoprodutor, Gestor de Trafego ou Uso Educacional antes de enviar o arquivo.

**O formulario guiado NAO sera modificado.**

---

## Alteracoes detalhadas

### 1. Frontend: `src/components/quiz/AIQuizGenerator.tsx`

**Nova aba "Uso Educacional" (3a aba):**
- Mudar `uploadMode` de `"form" | "pdf"` para `"form" | "pdf" | "educational"`
- Alterar TabsList de `grid-cols-2` para `grid-cols-3`
- Adicionar nova TabsTrigger "Uso Educacional" com icone `GraduationCap`
- A nova aba tera campos especificos:
  - **Disciplina/Materia** (texto): Ex: "Matematica", "Historia do Brasil"
  - **Conteudo/Tema** (textarea): Ex: "Equacoes de 2o grau", "Revolucao Francesa"
  - **Nivel de Ensino** (select): Fundamental, Medio, Superior, Pos-graduacao, Livre/Autodidata
  - **Objetivo Educacional** (select): Revisao de conteudo, Avaliacao diagnostica, Fixacao de conceitos, Preparacao para prova, Autoestudo
  - **Numero de perguntas** (input number, reutiliza o existente)
  - **Nivel de Dificuldade** (select): Facil, Medio, Dificil, Misto
  - **Incluir explicacao nas respostas** (checkbox): Se marcado, o prompt pedira explicacao para cada alternativa

**Novo state:**
```typescript
interface EducationalSettings {
  subject: string;        // Disciplina
  topic: string;          // Conteudo/Tema
  educationLevel: string; // Nivel de ensino
  educationalGoal: string;// Objetivo educacional
  difficultyLevel: string;// Dificuldade
  includeExplanations: boolean; // Explicar respostas
}
```

**Campo "Proposta do Quiz" no modo PDF:**
- Adicionar um Select ANTES da area de upload do PDF
- Opcoes: "Infoprodutor" (default), "Gestor de Trafego", "Uso Educacional"
- State: `pdfProposal: 'infoprodutor' | 'gestor_trafego' | 'educational'`
- O valor sera enviado junto ao payload para a Edge Function

**Logica de envio (`handleGenerateQuiz`):**
- Validacao para modo `educational`: exigir `subject` e `topic`
- Payload do modo educational:
  ```typescript
  {
    mode: 'educational',
    subject, topic, educationLevel, educationalGoal,
    difficultyLevel, includeExplanations,
    numberOfQuestions
  }
  ```
- Payload do modo PDF: adicionar campo `pdfProposal` ao body existente

### 2. Backend: `supabase/functions/generate-quiz-ai/index.ts`

**Novos prompts educacionais:**

Adicionar 2 novas chaves de system_settings consultadas:
- `ai_system_prompt_educational` 
- `ai_prompt_educational`

**System prompt educacional (default inline):**
```
Voce e um professor especialista em criar quizzes educacionais para fixacao e avaliacao de conhecimento.

SEU OBJETIVO: Criar quizzes que testem o conhecimento do aluno sobre o tema, ajudem na fixacao de conceitos e identifiquem lacunas de aprendizado.

ESTRUTURA DAS PERGUNTAS:
1. Perguntas conceituais - Definicoes e conceitos fundamentais
2. Perguntas de aplicacao - Uso pratico do conhecimento
3. Perguntas de analise - Interpretacao e raciocinio
4. Perguntas de sintese - Conexao entre conceitos

REGRAS:
- Perguntas claras, objetivas e sem ambiguidade
- Alternativas plausíveis (evitar opcoes absurdas)
- Distribuir dificuldade conforme nivel solicitado
- Se solicitado, incluir explicacao para cada alternativa
- NAO usar funil de vendas ou auto-convencimento
- Foco 100% pedagogico
```

**User prompt educacional (default inline):**
```
Crie um quiz educacional sobre:
DISCIPLINA: {subject}
CONTEUDO/TEMA: {topic}
NIVEL DE ENSINO: {educationLevel}
OBJETIVO: {educationalGoal}
DIFICULDADE: {difficultyLevel}
QUANTIDADE DE PERGUNTAS: {numberOfQuestions}
INCLUIR EXPLICACOES: {includeExplanations}
...
Retorne JSON com: title, description, questions (question_text, answer_format, options)
```

**Logica do PDF com proposta:**
- Quando `pdfProposal === 'educational'`, usar o system prompt educacional em vez do prompt PDF padrao
- Quando `pdfProposal === 'gestor_trafego'`, adicionar contexto de trafego pago ao prompt existente
- Quando `pdfProposal === 'infoprodutor'` (default), manter comportamento atual

**Interface `QuizGenerationRequest` atualizada:**
```typescript
interface QuizGenerationRequest {
  // ... campos existentes ...
  mode?: 'form' | 'pdf' | 'educational';
  // Novos campos educacionais
  subject?: string;
  topic?: string;
  educationLevel?: string;
  educationalGoal?: string;
  includeExplanations?: boolean;
  // Novo campo para PDF
  pdfProposal?: 'infoprodutor' | 'gestor_trafego' | 'educational';
}
```

**Funcao `replaceVariables` atualizada** com novas variaveis:
- `{subject}`, `{topic}`, `{educationLevel}`, `{educationalGoal}`, `{includeExplanations}`
- `{pdfProposal}`

### 3. Banco de dados

Nenhuma alteracao de schema necessaria. Os novos prompts podem ser inseridos opcionalmente na tabela `system_settings` com as chaves:
- `ai_system_prompt_educational`
- `ai_prompt_educational`

Mas terao defaults hardcoded na Edge Function (mesmo padrao dos prompts existentes).

A tabela `ai_quiz_generations` ja armazena `input_data` como JSONB, entao os novos campos serao salvos automaticamente.

---

## Resumo de arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/components/quiz/AIQuizGenerator.tsx` | Nova aba educacional + select de proposta no PDF |
| `supabase/functions/generate-quiz-ai/index.ts` | Novos prompts educacionais + logica de pdfProposal |

## Arquivos NAO tocados
- Formulario guiado (aba "form") - zero alteracoes
- Banco de dados (schema) - zero alteracoes
- Templates, hooks, rotas - zero alteracoes
