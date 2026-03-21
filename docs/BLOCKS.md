# 📦 Catálogo de Blocos — MasterQuizz

> Documentação completa dos 34 tipos de blocos disponíveis no sistema de quiz.
> Atualizado em: 21/03/2026 | v2.37.0

---

## Índice

1. [Blocos de Conteúdo](#1-blocos-de-conteúdo) (3)
2. [Mídia](#2-mídia) (4)
3. [Avançado](#3-avançado) (6)
4. [Captura de Dados](#4-captura-de-dados) (3)
5. [Apresentação](#5-apresentação) (7)
6. [Visual](#6-visual) (5)
7. [Dinâmico](#7-dinâmico) (6)

---

## 1. Blocos de Conteúdo

### 1.1 `question` — Pergunta
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `question` |
| **Descrição** | Bloco principal do quiz. Renderiza a pergunta com opções de resposta (sim/não, escolha única, múltipla escolha ou texto curto). Suporta emojis por opção, pontuação por opção, auto-avanço e texto customizado do botão "Próxima". |
| **Exemplo prático** | "Qual seu objetivo principal?" com opções: 🏋️ Emagrecer, 💪 Ganhar massa, 🧘 Saúde mental |
| **Campos configuráveis** | `questionText`, `answerFormat`, `options[]`, `scores[]`, `emojis[]`, `required`, `subtitle`, `hint`, `autoAdvance`, `nextButtonText` |
| **Onde configurar** | Editor central (inline) + Painel de Propriedades lateral |

### 1.2 `text` — Texto
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `text` |
| **Descrição** | Bloco de texto livre com suporte a HTML. Útil para instruções, contexto ou explicações entre perguntas. |
| **Exemplo prático** | "Nas próximas perguntas, vamos entender melhor seu perfil para recomendar o plano ideal." |
| **Campos configuráveis** | `content`, `alignment` (left/center/right), `fontSize` (small/medium/large) |
| **Onde configurar** | Editor central (textarea com rich-text) + Painel de Propriedades |

### 1.3 `separator` — Separador
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `separator` |
| **Descrição** | Divisor visual entre blocos. Pode ser linha, pontilhado, tracejado ou espaço em branco. |
| **Exemplo prático** | Linha fina cinza entre a pergunta e um bloco de depoimento |
| **Campos configuráveis** | `style` (line/dots/dashes/space), `color`, `thickness` (thin/medium/thick) |
| **Onde configurar** | Painel de Propriedades |

---

## 2. Mídia

### 2.1 `image` — Imagem
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `image` |
| **Descrição** | Exibe uma imagem com URL, texto alternativo, legenda e controle de tamanho. |
| **Exemplo prático** | Foto do produto acima da pergunta "Você já conhece nosso novo lançamento?" |
| **Campos configuráveis** | `url`, `alt`, `caption`, `size` (small/medium/large/full) |
| **Onde configurar** | Editor central (input de URL) + Painel de Propriedades |

### 2.2 `video` — Vídeo
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `video` |
| **Descrição** | Player de vídeo com suporte a YouTube, Vimeo, upload direto e Bunny Stream. Configurações avançadas de reprodução (autoplay, mudo, loop, controles, velocidade, legendas, thumbnail). |
| **Exemplo prático** | Vídeo de apresentação do produto antes da primeira pergunta, com autoplay e mudo |
| **Campos configuráveis** | `url`, `provider`, `caption`, `size`, `autoplay`, `muted`, `loop`, `hideControls`, `hidePlayButton`, `startTime`, `endTime`, `playbackSpeed`, `showCaptions`, `captionsUrl`, `thumbnailUrl`, `aspectRatio`, `bunnyVideoId` |
| **Onde configurar** | Editor central + Painel de Propriedades (aba completa de reprodução) |

### 2.3 `audio` — Áudio
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `audio` |
| **Descrição** | Player de áudio com URL externa ou upload. Suporta autoplay e legenda. |
| **Exemplo prático** | Podcast curto explicando o contexto do quiz |
| **Campos configuráveis** | `url`, `provider` (external/uploaded), `caption`, `autoplay` |
| **Onde configurar** | Editor central (input de URL) + Painel de Propriedades |

### 2.4 `gallery` — Galeria
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `gallery` |
| **Descrição** | Coleção de imagens exibidas em grid, carrossel ou masonry. Cada imagem tem URL, alt e legenda. |
| **Exemplo prático** | Galeria de "Antes e Depois" com 6 fotos de clientes |
| **Campos configuráveis** | `images[]` (url, alt, caption), `layout` (grid/carousel/masonry) |
| **Onde configurar** | Editor central (gerenciador de imagens) + Painel de Propriedades |

---

## 3. Avançado

### 3.1 `embed` — Conteúdo Incorporado
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `embed` |
| **Descrição** | Incorpora conteúdo externo via iframe (formulários, mapas, widgets). |
| **Exemplo prático** | Google Maps mostrando localização da clínica |
| **Campos configuráveis** | `url`, `html`, `provider` |
| **Onde configurar** | Editor central (input de URL/HTML) |

### 3.2 `button` — Botão
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `button` |
| **Descrição** | Botão de ação com 3 modos: link externo, próxima pergunta, ou ir para pergunta específica. Suporta personalização dinâmica com templates (`{resposta}`) e mapeamento condicional (unificado do antigo `personalizedCTA`). |
| **Exemplo prático** | "Ver plano para {resposta}" que redireciona para URL diferente conforme a resposta selecionada |
| **Campos configuráveis** | `text`, `action` (link/next_question/go_to_question), `url`, `targetQuestionIndex`, `variant`, `size`, `openInNewTab`, `icon`, `sourceQuestionId`, `textTemplate`, `conditions[]`, `fallbackText` |
| **Onde configurar** | Editor central + Painel de Propriedades (com QuestionSelector para dinâmico) |

### 3.3 `price` — Preço
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `price` |
| **Descrição** | Card de preço com nome do plano, valor, moeda, período, preço original, desconto, lista de features e botão CTA. |
| **Exemplo prático** | "Plano Premium — R$ 99,90/mês" com lista de 5 recursos e botão "Assinar agora" |
| **Campos configuráveis** | `planName`, `price`, `currency`, `period`, `originalPrice`, `discount`, `features[]`, `buttonText`, `buttonUrl`, `highlighted` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 3.4 `metrics` — Métricas/Gráfico
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `metrics` |
| **Descrição** | Gráfico visual (barra, pizza, linha, donut) com dados estáticos. Lazy-loaded (~200KB recharts). |
| **Exemplo prático** | Gráfico de pizza "85% dos nossos clientes recomendam" |
| **Campos configuráveis** | `title`, `chartType` (bar/pie/line/donut), `data[]` (label, value, color), `showLegend`, `showValues` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 3.5 `loading` — Loading/Carregamento
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `loading` |
| **Descrição** | Tela de carregamento animada com mensagem, spinner customizável e auto-avanço. Útil para criar "processamento" de resultado. |
| **Exemplo prático** | "Analisando suas respostas..." com spinner durante 3 segundos antes de mostrar o resultado |
| **Campos configuráveis** | `duration`, `message`, `completionMessage`, `spinnerType` (spinner/dots/pulse/bars), `autoAdvance`, `showProgress`, `loadingMessages[]` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 3.6 `calculator` — Calculadora
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `calculator` |
| **Descrição** | Bloco de cálculo dinâmico que avalia uma fórmula matemática usando variáveis vinculadas a respostas do quiz. Exibe resultado com prefixo, unidade e faixas coloridas. |
| **Exemplo prático** | Calculadora de IMC: `peso / (altura * altura)` com faixas "Abaixo do peso", "Normal", "Sobrepeso" |
| **Campos configuráveis** | `formula`, `variables[]` (id, name, sourceQuestionId, defaultValue), `resultUnit`, `resultPrefix`, `decimalPlaces`, `resultLabel`, `ranges[]` (min, max, label, color) |
| **Onde configurar** | Painel de Propriedades (com QuestionSelector para cada variável) |

---

## 4. Captura de Dados

### 4.1 `slider` — Slider/Range
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `slider` |
| **Descrição** | Controle deslizante para seleção de valor numérico. Útil para capturar dados quantitativos (idade, orçamento, intensidade). |
| **Exemplo prático** | "Qual seu orçamento mensal?" — slider de R$ 100 a R$ 5.000, step R$ 100 |
| **Campos configuráveis** | `label`, `min`, `max`, `step`, `defaultValue`, `unit`, `showValue`, `required` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 4.2 `textInput` — Input de Texto
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `textInput` |
| **Descrição** | Campo de texto livre com validação. Pode ser single-line ou multiline. Suporta validação de email, telefone ou número. |
| **Exemplo prático** | "Qual seu email?" com validação de formato de email |
| **Campos configuráveis** | `label`, `placeholder`, `multiline`, `maxLength`, `required`, `validation` (none/email/phone/number) |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 4.3 `nps` — NPS (Satisfação)
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `nps` |
| **Descrição** | Escala de 0-10 estilo Net Promoter Score. Exibe botões numerados com labels nos extremos. |
| **Exemplo prático** | "De 0 a 10, qual a probabilidade de recomendar nosso serviço?" — "Pouco provável" ↔ "Muito provável" |
| **Campos configuráveis** | `question`, `lowLabel`, `highLabel`, `showLabels`, `required` |
| **Onde configurar** | Editor central + Painel de Propriedades |

---

## 5. Apresentação

### 5.1 `accordion` — Acordeão FAQ
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `accordion` |
| **Descrição** | Lista colapsável de perguntas frequentes. Cada item tem pergunta e resposta. |
| **Exemplo prático** | FAQ com 3 itens: "Como funciona?", "Quanto custa?", "Tem garantia?" |
| **Campos configuráveis** | `title`, `items[]` (question, answer), `style` (default/minimal/bordered), `allowMultiple` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 5.2 `comparison` — Comparação
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `comparison` |
| **Descrição** | Tabela lado a lado comparando dois cenários (ex: Antes vs Depois, Com vs Sem). |
| **Exemplo prático** | "Sem nosso método" (❌ Dor nas costas, ❌ Noites mal dormidas) vs "Com nosso método" (✅ Postura correta, ✅ Sono reparador) |
| **Campos configuráveis** | `leftTitle`, `rightTitle`, `leftItems[]`, `rightItems[]`, `leftStyle`, `rightStyle`, `showIcons` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 5.3 `socialProof` — Prova Social
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `socialProof` |
| **Descrição** | Notificações tipo toast que aparecem em sequência, simulando atividade de outros usuários. |
| **Exemplo prático** | "João Silva acabou de completar o quiz — agora" → "Maria Santos acabou de se inscrever — 2 min atrás" |
| **Campos configuráveis** | `notifications[]` (name, action, time, avatar), `interval`, `style` (toast/banner/floating), `position`, `showAvatar` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 5.4 `testimonial` — Depoimento
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `testimonial` |
| **Descrição** | Card de depoimento com citação, autor, cargo, empresa, foto e rating (estrelas). |
| **Exemplo prático** | "Este produto mudou minha vida!" — João Silva, CEO da Empresa XYZ ⭐⭐⭐⭐⭐ |
| **Campos configuráveis** | `quote`, `authorName`, `authorRole`, `authorCompany`, `authorImage`, `rating`, `showRating`, `style`, `primaryColor`, `secondaryColor` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 5.5 `animatedCounter` — Contador Animado
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `animatedCounter` |
| **Descrição** | Número que anima de um valor inicial para um final, com easing configurável. Útil para estatísticas impactantes. |
| **Exemplo prático** | "0 → 1.000+" animando em 2s com easing easeOut, label "Clientes satisfeitos" |
| **Campos configuráveis** | `startValue`, `endValue`, `duration`, `prefix`, `suffix`, `easing`, `fontSize`, `color`, `label`, `separator` |
| **Onde configurar** | Editor central + Painel de Propriedades |

### 5.6 `progress` — Barra de Progresso
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `progress` |
| **Descrição** | Indicador visual de progresso no quiz. Estilos: barra, steps, círculo ou percentual. |
| **Exemplo prático** | Barra verde no topo mostrando "Pergunta 3 de 10 — 30%" |
| **Campos configuráveis** | `style` (bar/steps/circle/percentage), `showPercentage`, `showCounter`, `color`, `height`, `animated`, `label` |
| **Onde configurar** | Painel de Propriedades |

### 5.7 `countdown` — Countdown/Timer
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `countdown` |
| **Descrição** | Timer regressivo por data-alvo ou duração. Exibe dias, horas, minutos e segundos com ação ao expirar. |
| **Exemplo prático** | "Oferta expira em 04:59:59" com redirect automático ao expirar |
| **Campos configuráveis** | `mode` (date/duration), `targetDate`, `duration`, `showDays/Hours/Minutes/Seconds`, `style`, `expiryMessage`, `expiryAction` (none/hide/redirect), `redirectUrl`, `primaryColor`, `secondaryColor` |
| **Onde configurar** | Editor central + Painel de Propriedades |

---

## 6. Visual

### 6.1 `callout` — Callout/Alerta
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `callout` |
| **Descrição** | Caixa de destaque com variantes visuais (warning, info, success, error). Lista de itens com ícone e footnote. |
| **Exemplo prático** | ⚠️ "Atenção: Este quiz é apenas para maiores de 18 anos" |
| **Campos configuráveis** | `variant`, `title`, `items[]`, `footnote`, `icon`, `backgroundColor`, `borderColor`, `textColor` |
| **Onde configurar** | Painel de Propriedades |

### 6.2 `iconList` — Lista com Ícones
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `iconList` |
| **Descrição** | Lista de itens com ícone (emoji/símbolo) e texto. Layout vertical ou horizontal. |
| **Exemplo prático** | ✅ Sem taxa de adesão / ✅ Cancele quando quiser / ✅ Suporte 24h |
| **Campos configuráveis** | `items[]` (icon, text), `iconColor`, `layout` (vertical/horizontal) |
| **Onde configurar** | Painel de Propriedades |

### 6.3 `quote` — Citação/Destaque
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `quote` |
| **Descrição** | Bloco de citação estilizado com borda lateral, texto e autor opcional. |
| **Exemplo prático** | "A única forma de fazer um ótimo trabalho é amar o que você faz." — Steve Jobs |
| **Campos configuráveis** | `text`, `author`, `borderColor`, `style` (default/large/minimal) |
| **Onde configurar** | Painel de Propriedades |

### 6.4 `badgeRow` — Selos/Badges
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `badgeRow` |
| **Descrição** | Linha de badges/selos com ícone e texto. Variantes outline ou filled. |
| **Exemplo prático** | 🔒 Seguro · ⚡ Rápido · ✅ Garantido |
| **Campos configuráveis** | `badges[]` (icon, text), `variant` (outline/filled), `size` (sm/md/lg) |
| **Onde configurar** | Painel de Propriedades |

### 6.5 `banner` — Banner/Faixa
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `banner` |
| **Descrição** | Faixa horizontal com mensagem e variante visual (warning, success, info, promo). |
| **Exemplo prático** | 🔥 "Oferta por tempo limitado! 50% de desconto hoje" |
| **Campos configuráveis** | `text`, `variant` (warning/success/info/promo), `icon`, `dismissible` |
| **Onde configurar** | Painel de Propriedades |

---

## 7. Dinâmico

> Blocos que se adaptam em runtime baseados nas respostas do usuário.

### 7.1 `answerSummary` — Resumo de Respostas
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `answerSummary` |
| **Descrição** | Exibe um resumo das respostas dadas pelo usuário até o momento. Pode filtrar por perguntas específicas via `selectedQuestionIds`. |
| **Exemplo prático** | "📋 Resumo: P1: Emagrecer, P2: 3x por semana, P3: R$ 200/mês" |
| **Campos configuráveis** | `title`, `subtitle`, `style` (card/list/minimal), `showQuestionText`, `showIcon`, `accentColor`, `selectedQuestionIds[]` |
| **Onde configurar** | Painel de Propriedades (com QuestionMultiSelector) |

### 7.2 `progressMessage` — Mensagem de Progresso
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `progressMessage` |
| **Descrição** | Exibe mensagem diferente conforme o progresso do quiz (baseado em threshold percentual). |
| **Exemplo prático** | 25%: "🚀 Ótimo começo!" → 50%: "💪 Metade!" → 75%: "🔥 Quase lá!" → 100%: "🎉 Parabéns!" |
| **Campos configuráveis** | `messages[]` (threshold, text), `style` (card/inline/toast), `icon`, `accentColor` |
| **Onde configurar** | Painel de Propriedades |

### 7.3 `avatarGroup` — Grupo de Avatares
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `avatarGroup` |
| **Descrição** | Exibe grupo de avatares sobrepostos com contagem, criando senso de comunidade. |
| **Exemplo prático** | [👤👤👤👤👤 +1.229] "pessoas já fizeram este quiz" |
| **Campos configuráveis** | `count`, `label`, `maxVisible`, `showCount`, `avatarStyle` (circle/square) |
| **Onde configurar** | Painel de Propriedades |

### 7.4 `conditionalText` — Texto Condicional
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `conditionalText` |
| **Descrição** | Exibe texto diferente baseado na resposta de uma pergunta específica. Define condições `answer → text` com fallback. |
| **Exemplo prático** | Se respondeu "Emagrecer" → "Perfeito! Vamos focar em deficit calórico." / Se "Ganhar massa" → "Ótimo! Vamos focar em hipertrofia." |
| **Campos configuráveis** | `sourceQuestionId`, `conditions[]` (answer, text), `fallbackText`, `style` (default/highlighted/card) |
| **Onde configurar** | Painel de Propriedades (com QuestionSelector) |

### 7.5 `comparisonResult` — Comparação Dinâmica
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `comparisonResult` |
| **Descrição** | Comparação antes/depois personalizada com base nas respostas. Vincula a perguntas-fonte via `sourceQuestionIds`. |
| **Exemplo prático** | "Sem nosso produto: [problemas baseados nas respostas]" vs "Com nosso produto: [soluções personalizadas]" |
| **Campos configuráveis** | `sourceQuestionIds[]`, `beforeTitle`, `afterTitle`, `beforeTemplate`, `afterTemplate`, `beforeItems[]`, `afterItems[]`, `showIcons` |
| **Onde configurar** | Painel de Propriedades (com QuestionMultiSelector) |

### 7.6 `recommendation` — Recomendação
| Campo | Detalhe |
|-------|---------|
| **Tipo** | `recommendation` |
| **Descrição** | Sistema de recomendação baseado em regras. Cada produto/serviço tem regras (perguntaId + respostas + peso). O sistema calcula scores e exibe o melhor match, top 3 ou todos. |
| **Exemplo prático** | "🎯 Recomendamos: Plano Gold" — baseado em: P1=Emagrecer(+3), P2=3x/semana(+2), P3=Orçamento alto(+5) = Score 10 |
| **Campos configuráveis** | `title`, `subtitle`, `recommendations[]` (id, name, description, imageUrl, buttonText, buttonUrl, badge, rules[]), `displayMode` (best_match/top_3/all_scored), `style` (card/list/grid), `showScore`, `fallbackText` |
| **Onde configurar** | Painel de Propriedades (com QuestionSelector por regra) |

---

## Bloco Legado

### `personalizedCTA` — CTA Personalizado (Deprecated)
| Campo | Detalhe |
|-------|---------|
| **Status** | ⚠️ Mantido para compatibilidade. Funcionalidade unificada ao bloco `button` com campos dinâmicos (`sourceQuestionId`, `textTemplate`, `conditions[]`). |
| **Migração** | Novos quizzes devem usar `button` com `action: 'link'` + campos dinâmicos. |

---

## Resumo por Categoria

| Categoria | Qtd | Blocos |
|-----------|-----|--------|
| Conteúdo | 3 | question, text, separator |
| Mídia | 4 | image, video, audio, gallery |
| Avançado | 6 | embed, button, price, metrics, loading, calculator |
| Captura de Dados | 3 | slider, textInput, nps |
| Apresentação | 7 | accordion, comparison, socialProof, testimonial, animatedCounter, progress, countdown |
| Visual | 5 | callout, iconList, quote, badgeRow, banner |
| Dinâmico | 6 | answerSummary, progressMessage, avatarGroup, conditionalText, comparisonResult, recommendation |
| **Total** | **34 tipos** | 28 ativos + 1 legado (`personalizedCTA`) |

---

## Arquitetura Técnica

### Arquivos-chave do sistema de blocos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/types/blocks.ts` | Tipagem TypeScript (interfaces, union type `QuizBlock`, `createBlock`, `normalizeBlock`) |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | Catálogo para paletas/dropdowns (ícone, label, seção) |
| `src/components/quiz/blocks/BlockEditor.tsx` | Editor central com drag & drop, dropdown "Adicionar", renderização inline |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | Painel lateral de propriedades por tipo de bloco |
| `src/components/quiz/QuizBlockPreview.tsx` | Renderizador de preview (quiz publicado/preview) |
| `src/components/quiz/preview/*.tsx` | Sub-componentes de preview por categoria (Static, Interactive, Visual, Dynamic) |
| `src/components/quiz/blocks/BlockTemplates.tsx` | Templates pré-configurados de combinações de blocos |
| `src/components/quiz/blocks/BlockErrorBoundary.tsx` | Error boundary por bloco (evita WSOD) |

### Fluxo de dados

```
blockPaletteCatalog.ts → BlockEditor.tsx (dropdown/palette)
                              ↓
                     createBlock() → QuizBlock
                              ↓
                     BlockEditor renders inline preview
                              ↓
                     BlockPropertiesPanel (sidebar config)
                              ↓
                     normalizeBlock() → safe defaults
                              ↓
                     QuizBlockPreview.tsx (published quiz render)
```

### Segurança e resiliência

- `normalizeBlock()` garante valores padrão para todos os campos, prevenindo crashes por dados legados/malformados
- `BlockErrorBoundary` isola falhas por bloco individual
- 130+ testes automatizados validam integridade do sistema

---

## Melhorias Sugeridas — Fase 2B (Blocos 1–14)

> 2 melhorias por bloco. Priorizadas por impacto na UX e viabilidade técnica.

| # | Bloco | Melhoria 1 | Descrição | Melhoria 2 | Descrição |
|---|-------|-----------|-----------|-----------|-----------|
| 1 | `question` | Imagem por opção de resposta | Permitir associar uma imagem a cada opção, exibindo cards visuais em vez de radio buttons simples. Aumenta engajamento em quizzes visuais (moda, decoração, food). | Randomizar ordem das opções | Switch no painel de propriedades para embaralhar a ordem das opções a cada render, eliminando viés de posição. |
| 2 | `text` | Editor rich-text inline | Substituir textarea por editor com toolbar (negrito, itálico, link, lista) usando react-quill já instalado. | Variáveis dinâmicas `{nome}` | Suportar placeholders como `{nome}`, `{email}`, `{resposta_P1}` que são substituídos em runtime pelos dados do respondente. |
| 3 | `separator` | Preview da cor no editor | Mostrar a cor configurada diretamente no bloco inline do editor, não apenas no preview publicado. | Animação de entrada (fade) | Opção de fade-in ao separador quando aparece na tela, usando framer-motion. |
| 4 | `image` | Crop/resize integrado | Ao colar URL ou fazer upload, abrir modal de crop com proporções pré-definidas (1:1, 16:9, 4:3). | Galeria de imagens stock | Integrar busca de imagens gratuitas (Unsplash/Pexels API) direto no painel, sem sair do editor. |
| 5 | `video` | Preview thumbnail no editor | Mostrar thumbnail do YouTube/Vimeo automaticamente no bloco inline, em vez de apenas o input de URL. | Suporte a Loom embed | Detectar URLs do Loom e renderizar com player nativo Loom (já usa iframe, só precisa de pattern matching). |
| 6 | `audio` | Waveform visual no player | Exibir waveform estilizado no player de áudio em vez do player nativo do browser. | Gravação de áudio inline | Botão "Gravar" que usa `MediaRecorder` API para gravar áudio direto no editor e fazer upload. |
| 7 | `gallery` | Lightbox ao clicar | Ao clicar em uma imagem da galeria, abrir em tela cheia com navegação (setas) entre as imagens. | Legendas individuais por imagem | Cada imagem já tem campo `caption` no tipo, mas o editor não expõe. Adicionar input de legenda por imagem. |
| 8 | `embed` | Preview do conteúdo incorporado | Mostrar iframe preview no editor (mesmo em tamanho reduzido) em vez de apenas exibir a URL. | Whitelist de domínios | Lista configurável de domínios permitidos para segurança (evitar XSS via iframe malicioso). |
| 9 | `button` | Picker visual de ícones Lucide | Substituir input de texto `icon` por grid visual com busca dos 1000+ ícones Lucide disponíveis. | Animação hover configurável | Opções de efeito no hover: scale, glow, shake, slide. Configurável no painel de propriedades. |
| 10 | `price` | Múltiplos planos lado a lado | Permitir adicionar 2-3 planos em um único bloco, exibidos em colunas com highlight no plano recomendado. | Toggle mensal/anual automático | Switch visual que alterna entre preço mensal e anual, com cálculo automático do desconto. |
| 11 | `metrics` | Animação de entrada | Animar o gráfico ao entrar na viewport (barras crescendo, pizza girando), usando framer-motion. | Dados de fonte externa (API) | Permitir configurar uma URL de API que retorna os dados do gráfico em runtime. |
| 12 | `loading` | Mensagens rotativas com fade | Exibir sequência de mensagens com transição suave (fade) durante o loading, em vez de mensagem estática. | Barra de progresso customizável | Além do spinner, mostrar barra de progresso com cor e velocidade configuráveis. |
| 13 | `calculator` | Templates de fórmula prontos | Biblioteca de fórmulas pré-configuradas: IMC, ROI, Economia mensal, Tempo de retorno. Usuário seleciona e adapta. | Gráfico visual do resultado | Exibir o resultado em formato visual (gauge/velocímetro) com as faixas coloridas configuradas. |
| 14 | `progress` | Cor por faixa de progresso | Mudar cor da barra conforme avança: vermelho (0-33%), amarelo (34-66%), verde (67-100%). | Ícone de conclusão | Exibir ícone/emoji customizável ao atingir 100% (ex: 🎉, ✅, 🏆). |

---

## Melhorias Sugeridas — Fase 2C (Blocos 15–28)

> Será documentada e implementada na próxima etapa.

| # | Bloco | Melhoria 1 | Descrição | Melhoria 2 | Descrição |
|---|-------|-----------|-----------|-----------|-----------|
| 15 | `countdown` | Ação ao expirar (redirect) | Quando o timer chega a zero, redirecionar automaticamente para URL configurada. Campo `redirectUrl` já existe no tipo mas não está implementado no runtime. | Estilo flip-clock | Novo estilo visual com animação de flip (como relógios de aeroporto), usando CSS 3D transforms. |
| 16 | `testimonial` | Carrossel de depoimentos | Permitir múltiplos depoimentos em um único bloco, com auto-slide e dots de navegação. | Integração com Google Reviews | Puxar reviews reais via Google Places API e exibir com rating nativo. |
| 17 | `slider` | Labels nos extremos (min/max) | Exibir labels customizáveis nas pontas do slider (ex: "Nada" ↔ "Muito"), além do valor numérico. | Steps visuais com dots | Mostrar dots/marcadores nos steps do slider para valores discretos (ex: 1-5). |
| 18 | `textInput` | Máscara de input (CPF, telefone) | Aplicar máscara automática conforme o tipo de validação (ex: 000.000.000-00 para CPF). | Validação em tempo real | Exibir feedback visual (borda verde/vermelha + mensagem) enquanto o usuário digita. |
| 19 | `nps` | Cores por faixa (detrator/neutro/promotor) | Colorir botões 0-6 em vermelho, 7-8 em amarelo, 9-10 em verde automaticamente. | Comentário opcional após nota | Exibir textarea condicional após seleção da nota para capturar feedback qualitativo. |
| 20 | `accordion` | Ícone customizável (seta/plus) | Escolher entre ícone de seta (chevron) ou plus/minus para o toggle do accordion. | Animação suave de abertura | Adicionar transição suave com height animation ao abrir/fechar itens. |
| 21 | `comparison` | Highlight da coluna vencedora | Aplicar borda/sombra destacada na coluna "positiva" para guiar visualmente o usuário. | Ícones por item | Permitir associar ícone/emoji a cada item da comparação (além do ✅/❌ padrão). |
| 22 | `socialProof` | Dados reais do banco | Puxar contagem real de leads/respostas do quiz e usar nas notificações (ex: "1.234 pessoas já fizeram"). | Animação de entrada (slide-in) | Notificações entram com animação slide-in lateral, como toast real. |
| 23 | `animatedCounter` | Formato de moeda (R$ 1.234) | Opção de formatar o número como moeda brasileira com separador de milhar e decimal. | Trigger ao scroll | Iniciar a animação apenas quando o bloco entra na viewport (Intersection Observer). |
| 24 | `callout` | Picker visual de ícones | Grid de ícones para substituir input de texto do campo `icon`. | Callout dismissível | Botão X para fechar o callout, com estado persistido na sessão. |
| 25 | `iconList` | Picker de ícones Lucide integrado | Substituir input de emoji por grid visual de ícones Lucide com busca. | Cores individuais por item | Permitir cor diferente para o ícone de cada item da lista. |
| 26 | `quote` | Fonte tipográfica customizável | Dropdown com 5-6 fontes decorativas para a citação (serif, script, etc). | Imagem de fundo opcional | Upload de imagem de fundo com overlay escuro para efeito editorial. |
| 27 | `badgeRow` | Tooltip por badge | Ao passar o mouse, exibir tooltip com descrição expandida do selo. | Cores individuais por selo | Permitir cor de fundo/borda diferente para cada badge. |
| 28 | `banner` | Countdown integrado | Adicionar timer regressivo dentro do banner (ex: "🔥 Oferta expira em 04:59"). | Link clicável no banner | Tornar o banner inteiro clicável com URL de destino configurável. |

### Blocos Dinâmicos (continuação)

| # | Bloco | Melhoria 1 | Descrição | Melhoria 2 | Descrição |
|---|-------|-----------|-----------|-----------|-----------|
| 29 | `answerSummary` | Editar resposta inline | Ao clicar em uma resposta no resumo, voltar à pergunta correspondente para alterar. | Exportar respostas como texto | Botão "Copiar resumo" que gera texto formatado com todas as respostas. |
| 30 | `progressMessage` | Animação de transição | Fade/slide entre mensagens ao mudar de faixa de progresso. | Ícone por faixa | Associar emoji/ícone diferente a cada threshold (🚀, 💪, 🔥, 🎉). |
| 31 | `avatarGroup` | Upload de avatares reais | Substituir avatares genéricos por uploads reais de fotos de clientes. | Link para perfil ao clicar | Cada avatar pode ter URL de destino (ex: LinkedIn, perfil de cliente). |
| 32 | `conditionalText` | Preview da condição ativa | No editor, mostrar qual texto será exibido baseado em um "modo simulação" com resposta selecionável. | Múltiplas perguntas-fonte (AND) | Suportar condições compostas: "Se P1=A E P2=B então texto X". |
| 33 | `comparisonResult` | Cores configuráveis por coluna | Customizar as cores de antes (vermelho) e depois (verde) no painel. | Ícones personalizados | Escolher ícones diferentes de ❌/✅ para os itens. |
| 34 | `recommendation` | Ordenação manual de prioridade | Drag & drop para definir ordem de exibição quando scores são iguais. | Limite máximo de exibição | Configurar "mostrar no máximo N recomendações" independente do displayMode. |
