

# Plano: Corrigir problemas encontrados nos testes

## Resumo

Apos testes completos de todas as funcoes e edge functions, foram identificados 3 problemas que precisam de correcao:

### Problema 1: OPENAI_API_KEY ausente dos secrets
A chave da OpenAI nao esta configurada nos secrets do Supabase. Sem ela, selecionar qualquer modelo OpenAI no seletor resultara em fallback para Gemini (LOVABLE_API_KEY). Sera necessario adiciona-la.

### Problema 2: Seletor de modelo nao inclui familia GPT-4 real
O seletor atual mostra "GPT-5", "GPT-5 Mini", "GPT-5 Nano" que internamente mapeiam para gpt-4o e gpt-4o-mini. Isso confunde o usuario. O plano e:
- Adicionar `gpt-4o` e `gpt-4o-mini` como opcoes diretas no seletor (AISettings.tsx)
- Adicionar `gpt-4-turbo` como opcao premium
- Manter os modelos Gemini
- Remover os nomes "GPT-5" pois nao existem oficialmente

### Problema 3: Remover funcao create-checkout (Stripe descontinuado)
A edge function `create-checkout` usa Stripe que foi substituido por Kiwify. Sera removida do codigo e do config.toml.

---

## Detalhes Tecnicos

### Alteracao 1: Adicionar OPENAI_API_KEY aos secrets
Solicitar a chave via ferramenta de secrets.

### Alteracao 2: Atualizar AISettings.tsx (seletor de modelo)
Substituir os itens do `<Select>` no componente `SettingsTab`:

Modelos atualizados no seletor:
- `gpt-4o` - "GPT-4o" (Recomendado OpenAI - melhor custo/beneficio)
- `gpt-4o-mini` - "GPT-4o Mini" (OpenAI - rapido e barato)
- `gpt-4-turbo` - "GPT-4 Turbo" (OpenAI - contexto estendido)
- `google/gemini-2.5-flash` - Gemini 2.5 Flash (Recomendado Gemini)
- `google/gemini-2.5-flash-lite` - Gemini 2.5 Flash Lite
- `google/gemini-2.5-pro` - Gemini 2.5 Pro

### Alteracao 3: Atualizar generate-quiz-ai/index.ts
- Atualizar MODEL_COSTS para incluir gpt-4o, gpt-4o-mini, gpt-4-turbo
- Ajustar logica: modelos que comecam com "gpt-" vao direto para OpenAI API (sem prefixo "openai/")
- Remover mapeamento confuso de "gpt-5" -> "gpt-4o"

### Alteracao 4: Remover create-checkout
- Deletar `supabase/functions/create-checkout/index.ts`
- Remover entrada do `config.toml`

### Alteracao 5: Remover referencia de Checkout no App.tsx
- A rota `/checkout` pode ser mantida ou removida (verificar se Kiwify usa outra pagina)

---

## Ranking de modelos para geracao de quiz (informativo)

| Ranking | Modelo | Por que |
|---|---|---|
| 1 | gpt-4o | Melhor qualidade/velocidade/custo para geracao de texto estruturado |
| 2 | gpt-4o-mini | 17x mais barato que gpt-4o, qualidade muito boa para quizzes simples |
| 3 | gemini-2.5-flash | Alternativa gratuita via LOVABLE_API_KEY, boa qualidade |
| 4 | gpt-4-turbo | So se precisar de janela de contexto maior (128k tokens) |
| 5 | gemini-2.5-pro | Mais caro, marginal melhoria sobre flash para quizzes |

