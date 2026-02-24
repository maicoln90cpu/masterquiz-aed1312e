

# Plano: Formatos de resposta variados e inteligentes na geração por IA

## Problema

Os prompts do sistema em `generate-quiz-ai/index.ts` dizem apenas:
> "O campo answer_format deve ser EXATAMENTE: single_choice, multiple_choice ou yes_no"

Mas **não explicam quando usar cada formato**. A IA interpreta isso como "escolha qualquer um" e acaba sempre usando `multiple_choice`, gerando perguntas como "Qual sua faixa etária?" com múltipla escolha (onde a pessoa poderia marcar várias idades, o que não faz sentido).

## Solução

Adicionar instruções explícitas em **todos os prompts do sistema** sobre a escolha inteligente de formato, com exemplos claros.

## Detalhes técnicos

### Arquivo: `supabase/functions/generate-quiz-ai/index.ts`

Adicionar o seguinte bloco de regras em cada system prompt (form, PDF, educational, traffic):

```text
REGRAS PARA ESCOLHA DO FORMATO DE RESPOSTA:
- "single_choice": Quando a pergunta tem UMA ÚNICA resposta correta ou o respondente deve escolher APENAS UMA opção.
  Exemplos: faixa etária, sexo, renda, frequência ("Quantas vezes por semana..."), estado atual ("Como você se sente...")
- "multiple_choice": APENAS quando faz sentido o respondente marcar MAIS DE UMA opção simultaneamente.
  Exemplos: "Quais dessas dificuldades você enfrenta?" (pode ter várias), "Quais dessas ferramentas você usa?"
- "yes_no": Para perguntas de confirmação binária simples.
  Exemplos: "Você já tentou resolver isso antes?", "Você tem acompanhamento profissional?"

IMPORTANTE: A MAIORIA das perguntas deve ser "single_choice". Use "multiple_choice" SOMENTE quando listar itens onde múltiplas respostas simultâneas fazem sentido real. Use "yes_no" para perguntas diretas de sim/não. Varie os formatos para criar uma experiência dinâmica.
```

### Prompts afetados (4 blocos no total):
1. `defaultSystemPromptForm` (linha 145) -- prompt principal de formulário
2. `defaultSystemPromptPdf` (linha 175) -- prompt de PDF infoprodutor
3. `defaultSystemPromptEducational` (linha 233) -- prompt educacional
4. `defaultSystemPromptPdfTraffic` (linha 269) -- prompt de gestor de tráfego

Cada um receberá as regras de formato adaptadas ao seu contexto.

### Nenhuma mudança no frontend
O frontend (`AIQuizGenerator.tsx`) já normaliza corretamente os 3 formatos (linhas 393-396). O problema está exclusivamente nos prompts do backend.

## Arquivos a alterar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/generate-quiz-ai/index.ts` | Editar -- adicionar regras de formato nos 4 system prompts |

## Arquivos NAO tocados
- `AIQuizGenerator.tsx` (normalização já funciona)
- `parse-pdf-document/index.ts` (sem relação)
- Nenhum outro arquivo afetado
