

# Plano: Correcoes no Template Emagrecimento + Atualizacao dos Prompts IA

## Item 1: Fix Pergunta 9 + Adicionar 3 Perguntas de Espelhamento

### 1a) Diagnostico da Pergunta 9

A pergunta 9 (indice 8) tem blocos validos (image + text + question), mas o campo `options` no bloco question esta como array simples de strings sem `scores`. Alem disso, a URL da imagem pode estar retornando 404 no Unsplash. A correcao inclui:
- Garantir que todos os blocos tenham IDs unicos e formatos corretos
- Trocar imagem por URL Unsplash mais confiavel
- Adicionar `scores` nos blocos question para consistencia

### 1b) 3 Novas Perguntas Iniciais de Espelhamento

Inserir 3 perguntas ANTES das atuais (reordenar `order_number` de todas):

| Nova # | Pergunta | Tipo | Objetivo |
|---|---|---|---|
| 1 | Qual a sua faixa etaria? | single_choice | Personalizacao - o lead sente que o quiz e feito para ele |
| 2 | Qual o seu sexo biologico? | single_choice | Personalizacao - segmentacao de comunicacao |
| 3 | Como voce descreveria sua rotina hoje? | single_choice | Espelhamento - o lead se ve na situacao descrita |

Apos inserir, as 14 perguntas originais passam a ser perguntas 4-17 (total: 17 perguntas).

### Implementacao tecnica

SQL Migration que faz `UPDATE` no `full_config` do template existente:
1. Recompor o JSON `questions` com as 3 novas perguntas no inicio
2. Ajustar `order_number` de 0 a 16
3. Atualizar `preview_config.questionCount` para 17
4. Corrigir blocos da pergunta 9 original (agora sera pergunta 12)

---

## Item 2: Atualizar Prompts do Sistema (Form + PDF)

### Prompts atuais (no banco `system_settings`)

Os prompts ja mencionam a estrutura de auto-convencimento mas NAO incluem a instrucao obrigatoria de comecar com perguntas de espelhamento.

### Alteracoes nos 4 prompts:

**2a) `ai_system_prompt_form`** - Adicionar regra explicita:

```
REGRA CRITICA - PERGUNTAS INICIAIS DE ESPELHAMENTO:
As primeiras 2-3 perguntas do quiz DEVEM SEMPRE ser perguntas de espelhamento/identificacao pessoal.
Exemplos: idade, sexo, rotina, momento de vida, objetivo principal.
Essas perguntas fazem o lead sentir que o quiz foi feito ESPECIFICAMENTE para ele.
Nunca comece com perguntas sobre o produto ou problema diretamente.

ESTRUTURA OBRIGATORIA (em ordem):
1. Espelhamento (2-3 perguntas) - O lead se reconhece: idade, perfil, rotina
2. Amplificacao da dor - O problema ganha peso e clareza  
3. Consequencia - O custo de nao agir fica evidente
4. Contraste - Estado atual vs estado desejado
5. Conclusao guiada - A solucao passa a fazer sentido
```

**2b) `ai_system_prompt_pdf`** - Mesma adicao da regra de espelhamento

**2c) `ai_prompt_form`** - Adicionar instrucao no prompt do usuario:

```
IMPORTANTE: As primeiras 2-3 perguntas devem ser de ESPELHAMENTO 
(ex: faixa etaria, sexo, como descreveria sua rotina) para que o 
respondente sinta que o quiz e personalizado para ele.
Depois siga o funil: dor -> consequencia -> contraste -> solucao -> CTA.
```

**2d) `ai_prompt_pdf`** - Mesma adicao

### Tambem atualizar os defaults na Edge Function

Atualizar os prompts default em `supabase/functions/generate-quiz-ai/index.ts` (linhas 130-180) para incluir as mesmas instrucoes de espelhamento. Isso garante que mesmo sem configuracao no banco, o comportamento padrao ja inclui espelhamento.

---

## Resumo de Alteracoes

| Recurso | Alteracao |
|---|---|
| SQL Migration | UPDATE `quiz_templates` - adicionar 3 perguntas, fix Q9, reordenar |
| SQL Migration | UPDATE `system_settings` - 4 prompts com regra de espelhamento |
| Edge Function | Atualizar defaults dos prompts em `generate-quiz-ai/index.ts` |

## Ordem de Execucao
1. SQL Migration: atualizar template de emagrecimento (3 perguntas + fix Q9)
2. SQL Migration: atualizar os 4 prompts no `system_settings`
3. Codigo: atualizar defaults na edge function `generate-quiz-ai`

