

# Plano: Alinhar Prompts de IA + Relatorio Completo de Testes

## PARTE 1: Analise dos 4 Prompts e Problemas Encontrados

### Status atual dos prompts salvos no banco (system_settings):

| Prompt | Alinhado? | Problema |
|---|---|---|
| System Prompt Form | Sim | Correto - foco em auto-convencimento |
| User Prompt Form | Parcial | Falta suporte para `{resultProfiles}` e `{ctaText}` que o formulario envia |
| System Prompt PDF | NAO | Diz "quizzes educacionais e de avaliacao" - deveria seguir o mesmo principio de auto-convencimento/qualificacao |
| User Prompt PDF | Parcial | Nao usa as variaveis `{quizIntent}`, `{focusTopics}`, `{difficultyLevel}`, `{targetAudiencePdf}` que o formulario PDF envia |

### Problemas tecnicos detalhados:

1. **Edge function `replaceVariables()` nao trata `resultProfiles` nem `ctaText`** - o formulario envia esses campos mas a function ignora
2. **Prompt PDF no banco nao usa variaveis avancadas** - as variaveis `{focusTopics}`, `{quizIntent}`, `{difficultyLevel}`, `{targetAudiencePdf}` existem na function `replaceVariables()` mas nao estao no prompt PDF salvo no banco
3. **System Prompt PDF tem abordagem errada** - esta como "quiz educacional" em vez de acompanhar a filosofia de auto-convencimento do sistema

### Correcoes necessarias:

**Alteracao 1: Edge function `generate-quiz-ai/index.ts`**
- Adicionar `{resultProfiles}` e `{ctaText}` ao `replaceVariables()`
- Adicionar essas variaveis ao `QuizGenerationRequest` interface
- Atualizar os prompts default (fallback) para incluir todas as variaveis

**Alteracao 2: Prompts default na edge function**
- `defaultSystemPromptPdf`: trocar de "quizzes educacionais" para seguir a mesma logica de auto-convencimento
- `defaultPromptPdf`: incluir variaveis `{quizIntent}`, `{focusTopics}`, `{difficultyLevel}`, `{targetAudiencePdf}`
- `defaultPromptForm`: incluir `{resultProfiles}` e `{ctaText}`

**Alteracao 3: AISettings.tsx (frontend admin)**
- Adicionar badges das variaveis `{resultProfiles}` e `{ctaText}` no modo formulario
- Ja tem as variaveis PDF corretas exibidas

**Alteracao 4: Atualizar prompts no banco de dados (via SQL)**
- Atualizar `ai_system_prompt_pdf` para seguir abordagem de auto-convencimento
- Atualizar `ai_prompt_pdf` para incluir as variaveis avancadas
- Atualizar `ai_prompt_form` para incluir `{resultProfiles}` e `{ctaText}`

---

## PARTE 2: Relatorio Completo para Testes Manuais

### A) EDGE FUNCTIONS - Teste Manual Passo a Passo

#### 1. `generate-quiz-ai` (Geracao de Quiz por IA)
- Acesse: Dashboard > Novo Quiz > Criar com IA
- Modo Formulario: preencha Nome, Problema, Publico > clique Gerar
- Modo PDF: faca upload de um PDF > clique Gerar
- Resultado esperado: quiz criado no banco com perguntas
- Onde verificar: Dashboard (quiz aparece na lista)

#### 2. `rate-limiter` (Controle de taxa)
- Acesse qualquer quiz publico e responda varias vezes seguidas
- Resultado esperado: apos X tentativas, retorna erro 429
- Onde verificar: Console do navegador

#### 3. `track-quiz-analytics` (Analytics de quiz)
- Responda um quiz publico completamente
- Resultado esperado: evento registrado em `quiz_analytics`
- Onde verificar: Dashboard > Analytics

#### 4. `track-quiz-step` (Steps do quiz)
- Responda um quiz publico, avancando pergunta a pergunta
- Resultado esperado: cada step registrado
- Onde verificar: Analytics > Funil

#### 5. `track-video-analytics` (Analytics de video)
- Abra um quiz com video e assista
- Resultado esperado: evento de visualizacao registrado
- Onde verificar: Analytics > Video

#### 6. `kiwify-webhook` (Webhook de pagamento Kiwify)
- Simule um webhook via Kiwify test ou ferramenta como Postman
- URL: `https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/kiwify-webhook`
- Resultado esperado: subscription atualizada no banco

#### 7. `evolution-connect` (Conexao WhatsApp)
- Acesse: Admin > Recuperacao > Conectar WhatsApp
- Resultado esperado: retorna QR code ou status de conexao
- Onde verificar: Tela de configuracao de WhatsApp

#### 8. `evolution-webhook` (Webhook do WhatsApp)
- Automatico - disparado quando mensagens sao recebidas pelo WhatsApp
- Teste: envie mensagem para o numero conectado
- Onde verificar: Logs da edge function

#### 9. `send-whatsapp-recovery` / `send-test-message` / `send-welcome-message`
- Acesse: Admin > Recuperacao > Enviar mensagem teste
- Resultado esperado: mensagem enviada via Evolution API
- Onde verificar: WhatsApp do destinatario + logs

#### 10. `process-recovery-queue` (Fila de recuperacao)
- Automatico - processa contatos pendentes
- Teste: adicione um contato na fila via Admin e aguarde processamento

#### 11. `merge-user-data` (Migracao de dados)
- Faca login com email que tenha dados em conta antiga
- Resultado esperado: dados migrados automaticamente
- Onde verificar: Dashboard (quizzes/leads da conta antiga devem aparecer)

#### 12. `check-imported-user` / `migrate-imported-user`
- Relacionado ao fluxo de migracao de usuarios importados
- Teste: crie conta com email que existia antes
- Onde verificar: Console do navegador + banco

#### 13. `save-quiz-draft` (Auto-save)
- Edite um quiz e aguarde 30s sem salvar manualmente
- Resultado esperado: indicador "Salvo" aparece
- Onde verificar: Editor de quiz (indicador no topo)

#### 14. `bunny-upload-video` / `bunny-upload-video-multipart` / `bunny-chunked-*` / `bunny-tus-*`
- Acesse: Editor de Quiz > Adicione bloco de video > Faca upload
- Resultado esperado: video enviado para Bunny CDN
- Onde verificar: Player de video no preview + Bunny dashboard

#### 15. `bunny-confirm-upload` / `bunny-delete-video` / `bunny-generate-thumbnail`
- Apos upload: confirme que thumbnail aparece
- Delete: remova o video do bloco
- Onde verificar: Bunny dashboard

#### 16. `generate-pdf-report` (Relatorio PDF)
- Acesse: Respostas > Exportar PDF
- Resultado esperado: download do PDF com dados
- Onde verificar: Arquivo baixado

#### 17. `export-schema-sql` / `export-table-data` / `export-user-data`
- Acesse: Admin > Exportar dados
- Resultado esperado: arquivo com dados exportados

#### 18. `list-all-users` (Lista de usuarios)
- Acesse: Admin > Usuarios
- Resultado esperado: lista de todos os usuarios
- Onde verificar: Tabela de usuarios no painel admin

#### 19. `system-health-check` (Saude do sistema)
- Acesse: Admin > System Health
- Resultado esperado: metricas de saude atualizadas

#### 20. `delete-user` / `delete-user-complete`
- Acesse: Admin > Usuarios > Deletar usuario
- CUIDADO: operacao destrutiva
- Resultado esperado: usuario removido

#### 21. `anonymize-ips` (Anonimizacao)
- Automatico - roda periodicamente
- Resultado esperado: IPs antigos (>6 meses) anonimizados

#### 22. `check-inactive-users` (Usuarios inativos)
- Automatico - verifica usuarios sem atividade
- Resultado esperado: lista de inativos para recuperacao

#### 23. `sync-integration` (Sincronizar integracoes)
- Acesse: Integracoes > Sincronizar
- Resultado esperado: dados da integracao atualizados

### B) SECRETS - Verificacao

| Secret | Como testar |
|---|---|
| OPENAI_API_KEY | Selecione modelo GPT-4o no admin, gere um quiz |
| LOVABLE_API_KEY | Selecione Gemini no admin, gere um quiz |
| BUNNY_API_KEY | Faca upload de video em um quiz |
| BUNNY_STORAGE_ZONE_NAME | Mesmo teste acima |
| BUNNY_STORAGE_ZONE_PASSWORD | Mesmo teste acima |
| BUNNY_CDN_HOSTNAME | Verifique se video carrega no player |
| EVOLUTION_API_KEY | Admin > Recuperacao > Conectar WhatsApp |
| EVOLUTION_API_URL | Mesmo teste acima |
| SUPABASE_SERVICE_ROLE_KEY | Admin > Usuarios (list-all-users usa) |
| SUPABASE_DB_URL | Usado internamente |

### C) FUNCOES DO BANCO (DB Functions)

| Funcao | Como testar |
|---|---|
| handle_new_user_profile | Crie nova conta - perfil deve ser criado |
| handle_new_user_role | Crie nova conta - role 'admin' atribuida |
| handle_new_user_subscription | Crie nova conta - plano 'free' criado |
| trigger_welcome_message | Crie conta com WhatsApp preenchido |
| trigger_welcome_on_whatsapp_update | Atualize perfil adicionando WhatsApp |
| trigger_first_quiz_message | Publique primeiro quiz (status = active) |
| generate_slug / set_quiz_slug | Crie quiz sem slug - deve gerar automaticamente |
| get_quiz_for_display | Acesse quiz publico via URL /:company/:slug |
| get_user_quiz_stats | Admin > Usuarios (mostra contadores) |
| cleanup_old_audit_logs | Automatico |
| cleanup_expired_rate_limits | Automatico |
| anonymize_old_ips | Automatico |
| cleanup_old_health_metrics | Automatico |

---

## PARTE 3: Demais Itens do Sistema - Roteiro de Teste

### D) AUTENTICACAO
1. Signup com email/senha - verificar se perfil, role e subscription sao criados
2. Login com email/senha
3. Reset de senha (esqueci minha senha)
4. Logout e verificar limpeza de sessao

### E) QUIZ EDITOR
1. Criar quiz manual (sem IA) - verificar todos os tipos de bloco
2. Adicionar perguntas: single_choice, multiple_choice, yes_no
3. Adicionar blocos: texto, imagem, video, separador, botao, accordion, etc.
4. Drag and drop para reordenar perguntas
5. Preview do quiz (desktop e mobile)
6. Configurar formulario de lead (nome, email, whatsapp)
7. Configurar resultados
8. Publicar quiz (status draft > active)
9. Copiar link publico
10. Embed code (dialog de embed)

### F) QUIZ PUBLICO (Respondente)
1. Acessar quiz via URL publica /:company/:slug
2. Responder todas as perguntas
3. Preencher formulario de lead
4. Ver resultado
5. Verificar se resposta foi salva no banco (CRM)
6. Verificar se analytics registrou a resposta

### G) CRM
1. Acessar CRM - ver leads em kanban
2. Mover lead entre colunas (drag and drop)
3. Filtrar leads por quiz
4. Exportar leads (XLSX)

### H) ANALYTICS
1. Dashboard principal - verificar graficos
2. Analytics por quiz
3. Funil de conversao
4. Heatmap de respostas

### I) INTEGRACOES
1. Verificar lista de integracoes ativas
2. Adicionar nova integracao (webhook, GTM, Pixel)
3. Ver logs de integracao

### J) CONFIGURACOES
1. Editar perfil (nome, whatsapp, company_slug)
2. Facebook Pixel por usuario
3. GTM por usuario

### K) ADMIN (Master Admin)
1. Gerenciar planos (subscription_plans)
2. Gerenciar templates
3. Ver logs de auditoria
4. System Health Dashboard
5. Gerenciar usuarios
6. Configuracoes de IA (prompts - foco deste plano)
7. Configuracao de tracking (GTM global)
8. Recuperacao de clientes (WhatsApp)

### L) GTM / TRACKING
1. Verificar se GTM global carrega na landing page (inspecionar Elements > script com gtm.js)
2. Verificar se GTM carrega em paginas internas (dashboard, editor)
3. Verificar se GTM carrega em quiz publico
4. Verificar se Facebook Pixel por quiz dispara no quiz publico
5. Usar GTM Debug Mode (preview no GTM) para validar tags

### M) MULTI-IDIOMA (i18n)
1. Trocar idioma (PT/EN/ES) no seletor
2. Verificar se todas as telas traduzem corretamente
3. Verificar quiz publico em outro idioma

---

## Detalhes Tecnicos da Implementacao (Parte 1)

### Arquivo: `supabase/functions/generate-quiz-ai/index.ts`
- Adicionar `resultProfiles` e `ctaText` ao `QuizGenerationRequest`
- Adicionar `.replace(/{resultProfiles}/g, ...)` e `.replace(/{ctaText}/g, ...)` em `replaceVariables()`
- Atualizar `defaultSystemPromptPdf` para auto-convencimento
- Atualizar `defaultPromptPdf` para incluir variaveis avancadas
- Atualizar `defaultPromptForm` para incluir `{resultProfiles}` e `{ctaText}`

### Arquivo: `src/components/admin/AISettings.tsx`
- Adicionar badges `{resultProfiles}` e `{ctaText}` na secao de variaveis do formulario

### SQL Migration
- Atualizar `system_settings` para os 3 prompts que estao desatualizados no banco (pdf system, pdf user, form user)

