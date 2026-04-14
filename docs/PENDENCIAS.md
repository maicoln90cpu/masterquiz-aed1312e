# 📋 PENDÊNCIAS - MasterQuiz

## ✅ v2.40.0 - Suporte Avançado + Visual Diff + Block Editor + Notificações + Docs Overhaul (14/04/2026)

### Feature: Modo Suporte Avançado
- SupportDashboard com impersonação segura (SupportModeContext + useEffectiveUser)
- SupportQuizEditor com edição completa de metadados, perguntas e blocos
- Diff visual antes/depois no modal de confirmação
- CRUD de perguntas (adicionar/remover) com atualização do question_count
- Histórico de sessões de suporte (reconstrução via audit_logs)
- Relatório PDF profissional com branding MasterQuiz (jsPDF + jspdf-autotable)
- Banner de modo suporte com cronômetro (SupportModeBanner)

### Feature: Editor de Blocos Admin (SupportBlockEditor)
- Interfaces dedicadas para 26 tipos de blocos (question, countdown, loading, nps, price, etc.)
- Editor JSON de fallback para 9 tipos menos comuns (com validação em tempo real)
- 100% de editabilidade dos 34 tipos de blocos

### Feature: Notificações ao Usuário
- Tabela `admin_notifications` com RLS (usuário vê só suas notificações)
- Componente NotificationBell integrado ao DashboardLayout
- Polling a cada 60s + marcação de lidas (individual e em massa)
- Notificação automática ao salvar quiz via suporte

### Docs: Overhaul Completo v2.40.0
- 6 novos docs: DATABASE_SCHEMA, SECURITY, CODE_STANDARDS, EDGE_FUNCTIONS, ONBOARDING, ADR
- Todos os docs existentes atualizados para v2.40.0 (14 arquivos)
- Edge Functions: 57 → 61
- Cross-references atualizados com os 20 docs

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/SupportQuizEditor.tsx` | Editor completo com diff visual + CRUD perguntas |
| `src/pages/support/SupportBlockEditor.tsx` | NOVO — editor de blocos admin (34 tipos) |
| `src/components/notifications/NotificationBell.tsx` | NOVO — sino de notificações |
| `src/components/admin/SupportModeBanner.tsx` | Banner com cronômetro |
| `src/contexts/SupportModeContext.tsx` | Context de impersonação + tracking |
| `src/components/DashboardLayout.tsx` | +NotificationBell no header |
| `src/lib/supportPdfReport.ts` | NOVO — geração de PDF de sessão |
| `supabase/functions/admin-view-user-data/index.ts` | +save_quiz, +session_history, +questions_to_add/delete, +notifications |
| `supabase/functions/admin-update-subscription/index.ts` | Atualização de plano pelo admin |
| Migration admin_notifications | NOVA tabela com RLS |
| `README.md` | v2.40.0, 61 EFs, +6 docs |
| `docs/*.md` (14 arquivos) | Versão 2.40.0 |
| `docs/DATABASE_SCHEMA.md` | NOVO |
| `docs/SECURITY.md` | NOVO |
| `docs/CODE_STANDARDS.md` | NOVO |
| `docs/EDGE_FUNCTIONS.md` | NOVO |
| `docs/ONBOARDING.md` | NOVO |
| `docs/ADR.md` | NOVO |

---

### Feature: Aba Custos de Email Transacional
- Novo componente `EmailRecoveryCosts.tsx` com cálculo detalhado de custos por categoria
- Cards de saldo, custo total, custo por email, emails restantes
- Tabela por categoria com volume e custo individual
- Baseado em recarga de R$190 = 40.533 emails

### Feature: Preview de Email antes do Envio em Massa
- Fluxo compose→preview→enviar para automação "Novidades da Plataforma"
- Modal com preview do assunto + HTML renderizado + contagem de destinatários
- Botão "Enviar Agora" com confirmação

### Feature: Comparação A×B (Modos de Monetização)
- Novo componente `ModeComparison.tsx` com métricas históricas por modo
- Segmenta cadastros, quizzes e conversões pagas por período A vs B
- Tabela comparativa com diferenças percentuais

### Feature: Preços Diferenciados por Modo (A/B)
- Colunas `price_monthly_mode_b` e `kiwify_checkout_url_mode_b` em `subscription_plans`
- Checkout dinâmico: usa preço/URL do modo ativo
- Fallback para valores padrão quando modo B não configurado

### Feature: GTM Lifecycle Tracking Completo
- Novo hook `useQuizGTMTracking.ts` integrado ao estado real do quiz
- `quiz_view` independe de `gtm_container_id` — dispara para todos os quizzes
- `quiz_start`, `quiz_complete`, `lead_captured` disparados nos pontos reais do fluxo
- `AccountCreated` só marca como enviado após persistência confirmada no banco

### Fix: Batching na `list-all-users`
- Refatorada para buscar profiles, subscriptions, roles, quizzes e audit_logs em lotes de 100
- Corrige dados zerados (nome, WhatsApp, logins, quizzes, leads) com 400+ usuários
- Tratamento de erro em cada consulta

### Fix: Custos de Email — Cálculo Correto
- Corrigido cálculo do custo total que somava saldo ao invés de subtrair
- Custo por email agora reflete R$190/40.533 = R$0,00469

### Docs: Overhaul Completo v2.39.0
- Todos os docs atualizados para v2.39.0
- Novo: `docs/MONETIZATION.md` — guia de monetização A/B
- `src/__tests__/README.md` substituído por ponteiro para `docs/TESTING.md`
- Cross-references atualizados com BLOG.md, EGOI.md e MONETIZATION.md
- Knowledge prompt atualizado para v2.39.0

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/recovery/EmailRecoveryCosts.tsx` | NOVO — aba de custos |
| `src/components/admin/recovery/EmailAutomations.tsx` | +fluxo preview de novidades |
| `src/components/admin/ModeComparison.tsx` | NOVO — comparação A×B |
| `src/hooks/useQuizGTMTracking.ts` | NOVO — lifecycle tracking |
| `src/hooks/useAccountCreatedEvent.ts` | persistência confirmada |
| `src/hooks/useQuizTracking.ts` | quiz_view independente |
| `src/pages/QuizView.tsx` | integração GTM lifecycle |
| `supabase/functions/list-all-users/index.ts` | batching em lotes de 100 |
| `README.md` | v2.39.0, +features, +troubleshooting, +doc links |
| `docs/PRD.md` | +5 RFs, +1 épico |
| `docs/ROADMAP.md` | +itens H1 2026, +histórico |
| `docs/SYSTEM_DESIGN.md` | +hooks, +GTM events, +batching |
| `docs/API_DOCS.md` | +batching list-all-users |
| `docs/COMPONENTS.md` | +3 componentes |
| `docs/CHECKLIST.md` | +5 itens de validação |
| `docs/TESTING.md` | +merge conteúdo src/__tests__/README.md |
| `docs/MONETIZATION.md` | NOVO |

---

## ✅ v2.38.0 - Fix Automações Email + Vault Secrets + Tracking (07/04/2026)

### Fix: Vault secrets para pg_cron
- Inseridos `supabase_url` e `supabase_anon_key` no vault do Supabase
- Os 4 cron jobs de automação (Blog Digest, Weekly Tip, Success Story, Monthly Summary) agora conseguem chamar as Edge Functions corretamente
- **Antes**: cron jobs falhavam silenciosamente (URL=NULL)
- **Depois**: cron jobs executam normalmente nos horários configurados

### Fix: Logging nas automações de email
- Todas as 5 funções de automação agora gravam registros na tabela `email_automation_logs`
- O dashboard de automações passa a mostrar histórico real de execuções
- Atualizam `email_automation_config` com última execução, contagem e resultado

### Fix: Tracking de abertura/clique (webhookUrl)
- Adicionado `webhookUrl` em todos os envios E-goi (bulk e single) das 5 funções
- A E-goi agora notifica o webhook `egoi-email-webhook` sobre aberturas e cliques
- **Antes**: apenas `process-email-recovery-queue` tinha tracking
- **Depois**: Blog Digest, Weekly Tip, Success Story, Monthly Summary e Platform News todos com tracking

### Funções alteradas
| Função | Mudanças |
|--------|----------|
| `send-blog-digest` | +webhookUrl +logAutomation |
| `send-weekly-tip` | +webhookUrl +logAutomation |
| `send-success-story` | +webhookUrl +logAutomation |
| `send-monthly-summary` | +webhookUrl +logAutomation |
| `send-platform-news` | +webhookUrl +logAutomation |


> Documento centralizado de changelog, pendências e histórico de desenvolvimento.

---

## ✅ v2.37.0 - Documentation Overhaul + Thin Router + Test Fixes (21/03/2026)

## ✅ v2.37.1 - Fix Preview Inline + Remoção da Cor no Text Block (30/03/2026)

### Fix: saída real do preview inline na COL 3
- O preview lateral do editor Modern deixou de usar `mode="fullscreen"` dentro da COL 3 e passou a usar `mode="inline"`, evitando o overlay que prendia o usuário no preview.
- `UnifiedQuizPreview` inline agora exibe botão `X Sair do Preview` ao lado de `Reiniciar`, com retorno imediato para o modo edição.
- O botão do header da COL 3 também passou a mostrar `X Sair do Preview` enquanto o preview está ativo.

### Simplificação: remoção da cor customizada do bloco Text
- Removida a propriedade `Cor do Texto` do painel do bloco Text.
- O `TextBlock` voltou a usar apenas a cor padrão do tema no editor e no preview publicado.
- `RichTextEditor` deixou de aceitar `textColor` para esse fluxo, eliminando a inconsistência reportada.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/CreateQuizModern.tsx` | preview inline da COL 3 corrigido + botão `X Sair do Preview` |
| `src/components/quiz/UnifiedQuizPreview.tsx` | header inline com ação explícita de saída |
| `src/components/quiz/blocks/TextBlock.tsx` | remoção do repasse de `textColor` |
| `src/components/quiz/blocks/RichTextEditor.tsx` | remoção do `textColor` customizado |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | remoção do controle `Cor do Texto` no bloco Text |
| `src/components/quiz/preview/StaticBlockPreviews.tsx` | preview do Text volta a usar cor padrão do tema |
| `docs/PENDENCIAS.md` | changelog da correção |

### Fix: WYSIWYG final da Etapa 1/2 do editor Modern
- `RichTextEditor` agora respeita `textColor` no canvas do editor, corrigindo o caso em que o texto permanecia preto mesmo após escolha de cor.
- `ImageBlock` passou a respeitar `borderRadius` (`none` → `full`) e `shadow` (`none` → `large`) com os valores reais usados no painel.
- `CreateQuizModern` ganhou saída real do modo preview: botão no header, botão dentro do preview e atalho `Esc` para voltar à edição.

### Feature: Finalização da Etapa 2 dos blocos
- `AnimatedCounter` recebeu botão de reset do preview com reinício real da animação via `_previewKey`.
- `IconList` aplica a cor configurada ao texto dos itens (explicando a limitação técnica dos emojis).
- `Rating` agora suporta `halfStars`, permitindo seleção de 0.5 estrela no editor e no quiz.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/components/quiz/blocks/RichTextEditor.tsx` | suporte a `textColor` no editor |
| `src/components/quiz/blocks/TextBlock.tsx` | repassa `textColor` ao editor rico |
| `src/components/quiz/blocks/ImageBlock.tsx` | corrige shadow + borda arredondada inline |
| `src/components/quiz/blocks/AnimatedCounterBlock.tsx` | reinicia preview com `key` |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | reset do counter, ajuda do IconList, toggle de half-stars |
| `src/components/quiz/preview/VisualBlockPreviews.tsx` | cor do IconList aplicada ao texto |
| `src/components/quiz/preview/InteractiveBlockPreviews.tsx` | half-stars no Rating |
| `src/pages/CreateQuizModern.tsx` | botão sair do preview + atalho `Esc` |

### Feature: CreateQuiz Thin Router (Classic/Modern)
- `CreateQuiz.tsx` refatorado como thin router: só decide Classic vs Modern via `useEditorLayout`
- `CreateQuizClassic.tsx` e `CreateQuizModern.tsx` carregados via `React.lazy` + `Suspense`
- Elimina hooks duplicados que causavam freeze no editor Modern

### Feature: Imagens por Opção de Resposta no Quiz Publicado
- `optionImages`, `optionImageLayout`, `optionImageSize` suportados no `QuizViewQuestion`
- Layouts: acima do texto, ao lado (esquerda/direita), somente imagem
- Tamanhos: small, medium, large

### Feature: Templates Re-habilitados
- `disabledTemplateIds` removido — 14 templates ativos novamente
- Todos os templates renderizam corretamente no preview e no quiz público

### Fix: Estabilização da Suíte de Testes (~22 correções)
- `useUserRole.test.tsx`: `vi.unmock` para AuthContext e useUserRole, supabase mock expandido
- `Analytics.test.tsx`: Mock de DashboardLayout, AuthContext override com user autenticado
- `CRM.test.tsx`: Mock de DashboardLayout, useUserStage, useTrackPageView
- `Dashboard.test.tsx`: Mock de DashboardLayout com primaryCTA e stageLabel
- `UnifiedQuizPreview.test.tsx`: Assertions corrigidas (getByText vs getByLabelText, progress %)

### Fix: Label PQLAnalytics A/B
- "Primeiro Quiz Criado" → "Primeiro Quiz Editado Manualmente" (reflete condição `hasUserInteracted`)

### Docs: Overhaul Completo v2.37.0
- Todos os docs atualizados para v2.37.0, contagem de blocos 22→34
- `blocks.md` renomeado para `BLOCKS.md`
- Novo: `docs/TESTING.md` — guia de infraestrutura de testes
- Cross-references corrigidos entre documentos
- Knowledge prompt atualizado

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/CreateQuiz.tsx` | Thin router (lazy Classic/Modern) |
| `src/components/admin/PQLAnalytics.tsx` | Label A/B corrigido |
| `README.md` | v2.37.0, 34 blocos, BLOCKS.md, TESTING.md |
| `docs/PENDENCIAS.md` | +v2.37.0 entry |
| `docs/ROADMAP.md` | +H1 2026 items |
| `docs/PRD.md` | +RF02.13, RF02.14, 34 blocos |
| `docs/SYSTEM_DESIGN.md` | 34 blocos, thin router |
| `docs/COMPONENTS.md` | +CreateQuizClassic/Modern |
| `docs/STYLE_GUIDE.md` | +thin router pattern |
| `docs/CHECKLIST.md` | +image options, editor mode |
| `docs/BLOCKS.md` | Renomeado, v2.37.0 |
| `docs/TESTING.md` | NOVO |
| `docs/AUDIT_TEMPLATE.md` | +block coverage item |
| `docs/API_DOCS.md` | v2.37.0 |

---

## ✅ v2.36.0 - Fix Preview Atual + Bloco Calculadora (20/03/2026)

### Bug Fix: Preview Atual sempre mostrava pergunta 1
- **Causa**: `useQuizPreviewState` inicializava `internalQuestionIndex = 0` e o `useEffect` com ref não detectava mudança no mount.
- **Correção**: Inicializa com `externalQuestionIndex ?? 0`, força `currentStep = 'quiz'` quando `externalQuestionIndex` é fornecido, e `showIntroScreen={false}` no Preview Atual.

### Feature: Bloco Calculadora
- Novo tipo `calculator` registrado em `BlockType` com interface `CalculatorBlock`.
- Campos: fórmula, variáveis (com pergunta-fonte), unidade, prefixo, casas decimais, faixas de resultado.
- Adicionado ao catálogo (`blockPaletteCatalog.ts`), dropdown do editor, painel de propriedades, e preview.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useQuizPreviewState.ts` | Fix init index + force quiz step |
| `src/pages/CreateQuizModern.tsx` | `showIntroScreen={false}` no Preview Atual |
| `src/types/blocks.ts` | +`calculator` type, +`CalculatorBlock` interface, +createBlock, +normalizeBlock |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +Calculadora na seção Avançado |
| `src/components/quiz/blocks/BlockEditor.tsx` | +calculator no dropdown, renderBlock, isBlockComplete |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +CalculatorProperties panel completo |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +calculator icon e label |
| `src/components/quiz/QuizBlockPreview.tsx` | +calculator case no preview |

---

## ✅ v2.35.0 - Seletor Inteligente de Perguntas nos Blocos (20/03/2026)

### Melhoria: Dropdown de Perguntas no Painel de Propriedades
- **QuestionSelector**: Dropdown reutilizável que lista todas as perguntas do quiz (P1, P2, P3...) com texto truncado. Substitui o campo manual "Cole o ID da pergunta".
- **QuestionMultiSelector**: Checkboxes para selecionar múltiplas perguntas (usado no Resumo de Respostas e Comparação Dinâmica). Mostra contagem de selecionadas, botão limpar.
- **Fallback automático**: Se `questions` não for passado (ex: editor Classic), mantém o input de texto manual.

### Blocos Atualizados
| Bloco | Antes | Depois |
|-------|-------|--------|
| Botão (personalização dinâmica) | Input "Cole o ID" | Select dropdown com perguntas |
| Texto Condicional | Input "Cole o ID" | Select dropdown com perguntas |
| CTA Personalizado | Input "Cole o ID" | Select dropdown com perguntas |
| Comparação Dinâmica | Input "IDs separados por vírgula" | Multi-select com checkboxes |
| Resumo de Respostas | Input "IDs separados por vírgula" | Multi-select com checkboxes |
| Recomendação (regras) | Input "ID pergunta" tiny | Select dropdown inline por regra |

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +2 componentes (QuestionSelector, QuestionMultiSelector), +`questions` prop, 6 blocos atualizados |
| `src/pages/CreateQuizModern.tsx` | Passa `questions` para BlockPropertiesPanel |

---

## ✅ v2.34.0 - Etapa 4: Motor de Recomendação (20/03/2026)

### Novo Bloco: Recommendation Engine
- **Recomendação (recommendation)**: Motor de recomendação baseado em regras que sugere produtos/serviços conforme respostas do quiz. Cada recomendação tem nome, descrição, imagem, badge, botão com URL, e regras de match (pergunta + respostas + peso). Sistema de pontuação automático com 3 modos: melhor match, top 3 ou todos com score. 3 estilos visuais (card/list/grid). Exibe pontuação de compatibilidade opcionalmente.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/types/blocks.ts` | +1 interface (RecommendationBlock), +1 createBlock, +1 normalizeBlock, +1 union type |
| `src/components/quiz/preview/RecommendationBlockPreview.tsx` | NOVO — motor de recomendação com scoring e 3 estilos |
| `src/components/quiz/QuizBlockPreview.tsx` | +1 case no switch, +1 import |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +1 item na seção "Dinâmico" |
| `src/components/quiz/blocks/BlockEditor.tsx` | +1 dropdown, blockTypeNames, isBlockComplete, renderBlock |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +1 painel de propriedades completo com editor de regras |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +1 item |

---

## ✅ v2.33.0 - Etapa 3: 3 Novos Blocos Dinâmicos com Respostas (20/03/2026)

### 3 Novos Blocos Dependentes de Respostas
- **Texto Condicional (conditionalText)**: Exibe texto diferente baseado na resposta de uma pergunta específica. Configurável com múltiplas condições (resposta → texto) e fallback. 3 estilos (default/highlighted/card).
- **Comparação Dinâmica (comparisonResult)**: Antes/depois personalizado com placeholders {resposta1}, {resposta2} substituídos por respostas reais. Grid lado a lado com ícones ✅/❌.
- **CTA Personalizado (personalizedCTA)**: Botão com texto dinâmico usando template {resposta}. Suporta condições avançadas (resposta → texto + URL), 4 variantes visuais, 3 tamanhos, abrir em nova aba.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/types/blocks.ts` | +3 interfaces, +3 createBlock, +3 normalizeBlock |
| `src/components/quiz/preview/DynamicBlockPreviews.tsx` | +3 componentes (ConditionalText, ComparisonResult, PersonalizedCTA) |
| `src/components/quiz/QuizBlockPreview.tsx` | +3 cases no switch |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +3 itens na seção "Dinâmico" |
| `src/components/quiz/blocks/BlockEditor.tsx` | +3 dropdown, blockTypeNames, isBlockComplete, renderBlock |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +3 painéis de propriedades completos |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +3 itens |

---

## ✅ v2.32.0 - Etapa 2: 3 Novos Blocos Dinâmicos (20/03/2026)

### 3 Novos Blocos Dinâmicos (dependem de dados em runtime)
- **Resumo de Respostas (answerSummary)**: Exibe todas as respostas anteriores do usuário inline no quiz. No editor mostra preview placeholder; no quiz publicado mostra dados reais. 3 estilos (card/list/minimal), ícones opcionais.
- **Mensagem de Progresso (progressMessage)**: Mensagem motivacional que muda conforme % do quiz completado. Configurável com múltiplos thresholds. 3 estilos (card/inline/toast).
- **Grupo de Avatares (avatarGroup)**: Prova social visual com avatares + contador ("+1.234 pessoas já fizeram este quiz"). Avatares circulares ou quadrados, quantidade configurável.

### Fluxo de dados runtime
- `QuizBlockPreview` agora aceita props opcionais: `answers`, `questions`, `currentStep`, `totalQuestions`
- `QuizViewQuestion` passa dados runtime para blocos dinâmicos via `QuizBlockPreview`
- Blocos dinâmicos funcionam tanto no editor (com dados placeholder) quanto no quiz publicado (com dados reais)

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/types/blocks.ts` | +3 interfaces (AnswerSummaryBlock, ProgressMessageBlock, AvatarGroupBlock), createBlock, normalizeBlock |
| `src/components/quiz/preview/DynamicBlockPreviews.tsx` | NOVO — 3 componentes de preview dinâmicos |
| `src/components/quiz/QuizBlockPreview.tsx` | +4 props opcionais, +3 cases no switch, import DynamicBlockPreviews |
| `src/components/quiz/view/QuizViewQuestion.tsx` | Passa answers/questions/currentStep/totalQuestions para QuizBlockPreview |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +3 itens na nova seção "Dinâmico" |
| `src/components/quiz/blocks/BlockEditor.tsx` | +3 no dropdown, blockTypeNames, isBlockComplete, renderBlock |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +3 painéis de propriedades, BLOCK_ICONS, BLOCK_NAMES |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +3 itens no blockTypes, getBlockIcon, getBlockLabel |

---

## ✅ v2.31.0 - Etapa 1: Paridade de Blocos + 5 Novos Blocos Visuais (20/03/2026)

### Paridade de Blocos (6 blocos existentes adicionados ao catálogo e dropdown)
- `button`, `price`, `metrics`, `loading`, `progress`, `countdown` agora disponíveis no dropdown Classic e na paleta Modern
- Antes só existiam na sidebar Classic (CompactBlockPalette)

### 5 Novos Blocos Visuais
- **Callout/Alerta**: Caixa colorida com ícone, título, lista de itens e nota de rodapé (4 variantes: warning/info/success/error)
- **Lista com Ícones**: Lista com emojis/ícones customizáveis e texto (layout vertical ou horizontal)
- **Citação/Destaque**: Citação com aspas, borda lateral colorida e autor opcional (3 estilos)
- **Selos/Badges**: Linha de selos com ícone + texto (outline ou filled, 3 tamanhos)
- **Banner/Faixa**: Faixa colorida para destaque (4 variantes: promo/warning/success/info, dispensável)

### Arquivos Alterados
- `src/types/blocks.ts` — 5 novos tipos + interfaces + createBlock + normalizeBlock
- `src/components/quiz/blocks/blockPaletteCatalog.ts` — +11 itens (6 paridade + 5 novos) + nova seção "Visual"
- `src/components/quiz/blocks/BlockEditor.tsx` — dropdown com todos os 27 blocos + isBlockComplete + renderBlock
- `src/components/quiz/blocks/CompactBlockPalette.tsx` — labels e ícones dos 5 novos
- `src/components/quiz/blocks/BlockPropertiesPanel.tsx` — 5 novos painéis de propriedades
- `src/components/quiz/preview/VisualBlockPreviews.tsx` — 5 novos componentes de preview
- `src/components/quiz/QuizBlockPreview.tsx` — 5 novos cases no switch

---

## ✅ v2.29.0 - Rotação de Prompts de Imagem do Blog + Cooldown de Campanhas (15/03/2026)

### Sistema de Rotação de Prompts de Imagem
- **Tabela `blog_image_prompts`**: 5 estilos visuais pré-cadastrados com rotação automática
- **Estilos implementados**: Objetos 3D, Pessoa Real Pop, Flat Lay, Conceitual Hiper-Realista, Gradiente Abstrato
- **Lógica de rotação**: Seleção aleatória excluindo o último prompt usado (`last_used_at`)
- **Tracking de uso**: Campos `usage_count` e `last_used_at` atualizados a cada geração
- **Fallback**: Se nenhum prompt ativo, usa `image_prompt_template` do `blog_settings`

### Edge Functions Atualizadas
- **`generate-blog-post`**: Busca prompts ativos da tabela, seleciona aleatoriamente com anti-repetição
- **`regenerate-blog-asset`**: Mesma lógica de rotação para regeneração individual de imagens

### UI Admin (BlogPromptConfig)
- Cards por estilo com Switch de ativação, contagem de uso e data do último uso
- Edição inline de prompts (clique para expandir)
- CRUD completo: adicionar, editar, ativar/desativar, remover estilos
- Prompt fallback separado abaixo da lista de rotação

### Cooldown Global de Campanhas (RecoveryCampaigns)
- Card "Cooldown Entre Contatos" com Switch + Input numérico (dias)
- Persiste em `recovery_settings.user_cooldown_days`
- Botão "Atualizar Alvos" por campanha ativa (chama `check-inactive-users`)

### Arquivos Criados/Editados
| Arquivo | Ação |
|---------|------|
| `supabase/migrations/20260315*` | NOVO — tabela `blog_image_prompts` + seed 5 estilos |
| `src/components/admin/blog/BlogPromptConfig.tsx` | Reescrito — rotação + CRUD |
| `supabase/functions/generate-blog-post/index.ts` | Rotação de prompts |
| `supabase/functions/regenerate-blog-asset/index.ts` | Rotação de prompts |
| `src/components/admin/recovery/RecoveryCampaigns.tsx` | Cooldown global + refresh |

---

## ✅ v2.28.0 - Eventos GTM Completos + Dashboard de Observabilidade (09/03/2026)

### 5 Novos Eventos GTM
- **SignupStarted**: Disparado ao acessar aba "Criar Conta" (Login.tsx, 1x/sessão)
- **PlanUpgraded**: Hook detecta transição free→pago via localStorage (usePlanUpgradeEvent.ts)
- **QuizShared**: Disparado ao copiar link (CreateQuiz.tsx) ou embed (EmbedDialog.tsx)
- **EditorAbandoned**: Disparado via visibilitychange quando editor tem alterações não publicadas
- **LeadExported**: Disparado ao exportar Excel/CSV no CRM e Responses

### Infraestrutura de Tracking
- **gtmLogger.ts**: Helper centralizado — push dataLayer + persist em gtm_event_logs
- **Tabela gtm_event_logs**: Persistência de eventos com cleanup automático 30 dias
- **RLS**: INSERT para authenticated, SELECT para admins

### Dashboard GTM no Admin
- Sub-tab "Eventos GTM" na aba Observabilidade
- Cards: total 24h, total 7d, tipos únicos
- Tabela de contagem por evento com categoria
- Log dos últimos 100 disparos com filtro
- Auto-refresh (15s logs, 30s contagens)

### Re-disparo AccountCreated
- Reset de account_created_event_sent para perfis dos últimos 5 dias
- Correção de captura GTM que estava com evento divergente

### Arquivos Criados/Editados
| Arquivo | Ação |
|---------|------|
| src/lib/gtmLogger.ts | NOVO — helper centralizado |
| src/hooks/usePlanUpgradeEvent.ts | NOVO — detecta upgrade |
| src/components/admin/GTMEventsDashboard.tsx | NOVO — dashboard |
| src/pages/Login.tsx | SignupStarted |
| src/pages/CreateQuiz.tsx | QuizShared + EditorAbandoned |
| src/components/quiz/EmbedDialog.tsx | QuizShared (embed) |
| src/pages/CRM.tsx | LeadExported |
| src/pages/Responses.tsx | LeadExported (Excel + CSV) |
| src/App.tsx | Integrar usePlanUpgradeEvent |
| src/pages/AdminDashboard.tsx | Sub-tab GTM Events |
| Migration SQL | gtm_event_logs + cleanup |

---

## ✅ v2.27.0 - Correções de Banco + Refatoração QuestionsList (25/02/2026)

### Correções de Banco de Dados

#### Bug Crítico: `useFunnelData.ts` — query reescrita
- **Problema:** `.select('quizzes!inner(user_id, title)')` fazia JOIN via PostgREST, mas dependia de FK que não existia inicialmente. Mesmo após FK criada, a query era frágil.
- **Solução:** Reescrita para 2 queries separadas: 1) busca quiz_ids do usuário via `quizzes`, 2) filtra `quiz_step_analytics` com `.in('quiz_id', ids)`.
- **Impacto:** Elimina erro 400 em analytics de funil.

#### AdminDashboard: tratamento gracioso de `validation_requests`
- **Problema:** Query a tabela `validation_requests` retornava 400 quando role admin não estava resolvida.
- **Solução:** `try/catch` que retorna `{ data: [], error: null }` silenciosamente.
- **Impacto:** Elimina logs de erro desnecessários no console.

#### Análise completa dos 19 erros de banco
| Erro | Veredicto |
|------|-----------|
| quiz_step_analytics 400 | ✅ Corrigido (query reescrita) |
| validation_requests 400 | ✅ Corrigido (try/catch) |
| column "qual" 42703 | ⚪ Query manual externa |
| auth/token 400 | ⚪ Credenciais inválidas (normal) |
| user_roles 23505 | ⚪ ON CONFLICT trata |
| user_subscriptions 23505/409 | ⚪ ON CONFLICT trata |
| auth/user 403 | ⚪ Token expirado (normal) |

### Refatoração QuestionsList (Editor Sidebar)

#### Layout dos cards refatorado
- **Antes:** `flex items-center` com `truncate` (1 linha) — botões empurrados para fora
- **Depois:** `flex items-start` com `line-clamp-2 break-words` (2 linhas) — ícones fixos à direita
- Ícone de editar (lápis) + excluir (lixeira) sempre visíveis
- Duplo clique no texto ou clique no lápis para editar inline

### Arquivos Editados
| Arquivo | Alterações |
|---------|------------|
| `src/hooks/useFunnelData.ts` | Query reescrita sem JOIN, try/catch |
| `src/pages/AdminDashboard.tsx` | try/catch em validation_requests |
| `src/components/quiz/QuestionsList.tsx` | Layout cards refatorado |
| `.lovable/plan.md` | Análise documentada dos erros de banco |

---

## ✅ v2.26.0 - Sistema PQL + Lead de Teste (05/02/2025)

### Implementado

#### Sistema de Níveis PQL (Product Qualified Lead)
- **3 níveis de usuário**: Explorador (🧊), Construtor (🔥), Operador (🚀)
- **Progressão automática**: Baseada em comportamento real
  - Explorador → Construtor: Ao publicar primeiro quiz
  - Construtor → Operador: Ao visualizar CRM ou Analytics
- **CTAs dinâmicos no Dashboard**: Mensagens e ações personalizadas por nível
- **Campos em profiles**: `user_stage`, `crm_viewed_at`, `analytics_viewed_at`, `stage_updated_at`

#### Lead de Teste (Simulação)
- **Botão "Gerar Lead de Teste"**: Aparece em quizzes ativos
- **Dados fictícios realistas**: Nome, email, WhatsApp, resultado associado
- **Marcação especial**: Campo `_is_test_lead` nos answers
- **Badge visual no CRM**: Ícone de laboratório (🧪) identifica leads de teste

#### Hooks Criados
| Hook | Descrição |
|------|-----------|
| `useUserStage.ts` | Gerencia nível PQL e CTAs dinâmicos |
| `useTestLead.ts` | Gera leads de teste para simulação |
| `useTrackPageView` | Rastreia visualização de CRM/Analytics |

---

## ✅ v2.25.0 - Paradigma Auto-Convencimento + i18n Completo (04/02/2025)

### Mudança Conceitual (MAJOR)
- **Antes:** Plataforma de qualificação e segmentação de leads
- **Depois:** Plataforma de funis de auto-convencimento via perguntas estratégicas

### Landing Page i18n (PT/EN/ES)
- 14 chaves `hero_*` atualizadas com novo paradigma
- Demo mockup internacionalizado

### Edge Function: generate-quiz-ai
- Prompts de IA atualizados para auto-convencimento
- Estrutura obrigatória: 5 fases de consciência

### Admin Dashboard Otimizado
- Lazy loading de 15+ componentes pesados
- TanStack Query com cache 5min

---

## ✅ v2.24.0 - Documentação e Correções (23/01/2025)

- Correção crítica: inicialização de perguntas no CreateQuiz.tsx
- Landing page: 6 novos feature cards
- `docs/SYSTEM_DESIGN.md` criado
- Documentação sincronizada (README, PRD, ROADMAP)

---

## ✅ v2.23.0 - Calculator Wizard + Correções UX (12/01/2025)

- Calculator Wizard (3 passos): VariableStep, FormulaStep, RangesStep
- Botão deletar sempre visível no QuestionsList
- Confirmação de deleção com AlertDialog
- CHECKLIST.md criado

---

## ✅ v2.22.0 - Performance (12/01/2025)

- Lazy loading agressivo (EditorComponentsBundle, AnalyticsChartsBundle)
- Hooks: useStableCallback, useDeferredValue
- Vite: 13 chunks separados, ES2020 target
- QuizView.tsx: 1146 → ~100 linhas

---

## ✅ v2.21.0 - QuizCard + Responsividade (12/01/2025)

- QuizCard: layout 4 linhas (mobile/tablet/desktop)
- CRM: kanban scroll horizontal
- Responses: filtros flex-wrap

---

## ✅ v2.20.0 - Refatoração + i18n (12/01/2025)

- QuizCard isolado como componente
- 40+ novas chaves i18n
- Edge Functions padronizadas (_shared/cors.ts, auth.ts)

---

## ✅ v2.19.0 - Segurança + Autosave + Testes (08/01/2025)

- RLS hardening (ab_test_sessions, landing_ab_sessions)
- View user_integrations_safe
- Hook useAutoSave (debounce 30s)
- ~430 testes automatizados

---

## ✅ v2.18.0 - Testes Automatizados (23/12/2024)

- Setup Vitest + Testing Library
- ~285 testes (validations, sanitize, calculator, auth, pages)
- CI/CD com cobertura mínima 50%

---

## ✅ v2.17.0 e anteriores

Consultar histórico detalhado nos commits e no ROADMAP.md.

---

## 🔄 Pendências Abertas

### Prioridade Alta
- [ ] Internacionalização: remover strings hardcoded restantes
- [ ] 2FA implementation
- [ ] Migrar eventos GTM legados para pushGTMEvent (landing, tracking, vitals)
- [ ] Testar rotação de prompts de imagem em produção (validar variedade visual)

### Prioridade Média
- [ ] API pública v1
- [ ] Webhook documentation
- [ ] AI quiz optimization suggestions

### Prioridade Baixa
- [ ] White-label completo
- [ ] SSO (SAML/OIDC)
- [ ] Team workspaces

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup, stack e arquitetura |
| [PRD.md](./PRD.md) | Requisitos do produto e backlog |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação MVP |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [BLOCKS.md](./BLOCKS.md) | Catálogo dos 34 tipos de blocos |
| [TESTING.md](./TESTING.md) | Guia de testes |
