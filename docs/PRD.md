# 📄 PRD - Product Requirements Document

## MasterQuiz - Plataforma de Funis de Auto-Convencimento

**Versão:** 2.40  
**Última atualização:** 14 de Abril de 2026  
**Owner:** Product Team

---

## 📋 Índice

1. [Visão do Produto](#visão-do-produto)
2. [Problema e Solução](#problema-e-solução)
3. [Personas](#personas)
4. [Requisitos Funcionais](#requisitos-funcionais)
5. [Requisitos Não-Funcionais](#requisitos-não-funcionais)
6. [Requisitos de Segurança](#requisitos-de-segurança)
7. [Backlog](#backlog)
8. [Qualidade e Testes](#qualidade-e-testes)
9. [Métricas de Sucesso](#métricas-de-sucesso)

---

## 🎯 Visão do Produto

### Missão
Criar funis de auto-convencimento onde perguntas estratégicas conduzem o lead a reconhecer seus próprios problemas, entender as consequências de não agir, e decidir por conta própria que precisa de uma solução.

### Visão
Ser a principal plataforma de quiz marketing na América Latina até 2026, processando mais de 10 milhões de leads que se auto-convencem por mês.

### Proposta de Valor
> "Seu tráfego não converte? Talvez o problema não seja o anúncio — é que seu lead ainda não percebeu que precisa de você."

MasterQuiz não é apenas uma ferramenta de qualificação — é um **condutor de decisão**. Através de perguntas estratégicas, revelamos dores ocultas, criamos consciência e conduzimos o lead a decidir sozinho que precisa da sua solução.

### Conceito Central: Funil de Auto-Convencimento

O MasterQuiz opera sob um paradigma diferente do quiz tradicional:

| Quiz Tradicional | MasterQuiz |
|------------------|-------------|
| Coleta dados do lead | Revela dores do lead |
| Classifica e segmenta | Conduz à consciência |
| Sistema decide o que mostrar | Lead decide por si mesmo |
| Venda acontece no CTA | Venda acontece nas perguntas |

**Estrutura das Perguntas:**
1. **Espelhamento** - O lead se reconhece na situação
2. **Amplificação da dor** - O problema ganha peso e clareza
3. **Consequência** - O custo de não agir fica evidente
4. **Contraste** - Estado atual vs estado desejado
5. **Conclusão guiada** - A solução passa a fazer sentido

### O que o MasterQuiz NÃO é

Para garantir clareza conceitual, é importante definir o que o produto **não é**:

| ❌ NÃO é | ✅ É |
|---------|-----|
| Um formulário de pesquisa | Uma experiência de descoberta |
| Um questionário neutro | Um espelho de problemas reais |
| Uma coleta fria de dados | Um condutor de decisão |
| Um teste sem progressão lógica | Uma jornada de consciência progressiva |

> **Regra de ouro:** A qualificação de leads é um efeito colateral natural do processo de auto-convencimento, não o objetivo primário.

---

## 🔍 Problema e Solução

### O Problema

**Para gestores de tráfego e infoprodutores:**
- Leads chegam sem reconhecer que têm um problema
- Tráfego caro não converte porque o lead "não está pronto"
- Funis tradicionais tentam vender antes de criar consciência
- Formulários frios não engajam nem educam
- O lead sai do funil sem entender por que precisa da solução

**A verdade inconveniente:**
- 68% dos leads não estão prontos para comprar — mas não porque são "frios", e sim porque ainda não perceberam o problema
- Funis tradicionais pulam a etapa de consciência e vão direto para a oferta
- O resultado: leads que abandonam, objeções infinitas, baixa conversão

### A Solução

**MasterQuizz cria funis de auto-convencimento:**

1. **Revelação de dores**
   - Perguntas que expõem problemas latentes
   - Lead reconhece sua própria situação
   - Dores ganham clareza e urgência

2. **Condução de consciência**
   - Progressão lógica de perguntas
   - Contraste entre estado atual e desejado
   - Consequências de não agir ficam claras

3. **Decisão natural**
   - Lead conclui por conta própria que precisa da solução
   - CTA confirma decisão já tomada
   - Venda acontece antes do botão de compra

4. **Analytics de consciência**
   - Métricas de engajamento por pergunta
   - Identificação de pontos de resistência
   - Otimização baseada em comportamento

---

## 👥 Personas

### Persona 1: Gestor de Tráfego - "Rafael"

**Perfil:**
- 28-35 anos
- Gerencia tráfego para múltiplos clientes
- Orçamento mensal: R$ 50k-200k
- Dor principal: Leads que não convertem

**Jobs to be Done:**
- Fazer leads reconhecerem que precisam da solução
- Aumentar taxa de conversão do funil
- Demonstrar valor mensurável aos clientes
- Escalar operação sem perder qualidade

**Quote:**
> "Preciso de leads que cheguem ao checkout já convencidos, não leads frios que vou ter que convencer depois."

---

### Persona 2: Infoprodutor - "Carla"

**Perfil:**
- 30-45 anos
- Vende cursos online
- Faturamento: R$ 20k-100k/mês
- Dor principal: Conversão do lançamento

**Jobs to be Done:**
- Educar leads antes do webinar/VSL
- Fazer leads perceberem que precisam do curso
- Segmentar por nível de consciência
- Aumentar conversão orgânica

**Quote:**
> "Quero que o lead chegue no meu checkout já pensando 'eu preciso disso', não 'será que vale a pena?'"

---

### Persona 3: Agência de Marketing - "Tech Agency"

**Perfil:**
- 5-20 funcionários
- 10-50 clientes ativos
- Ticket médio: R$ 3k-10k/mês
- Dor principal: Provar resultados

**Jobs to be Done:**
- Oferecer serviço diferenciado
- Aumentar conversão dos clientes
- Apresentar relatórios de impacto
- Escalar sem aumentar equipe

**Quote:**
> "Preciso mostrar pro cliente que nosso funil não só gera leads, mas gera leads que compram."

---

### Persona 4: Consultor/Freelancer - "Ana"

**Perfil:**
- 25-40 anos
- Negócio próprio ou freelancer
- Orçamento limitado
- Dor principal: Fechar projetos certos

**Jobs to be Done:**
- Atrair clientes que já entendem o valor
- Evitar reuniões com curiosos
- Educar antes da primeira conversa
- Fechar com menos objeções

**Quote:**
> "Não quero ficar me vendendo em call. Quero que a pessoa já chegue sabendo que precisa do meu serviço."

---

## ✅ Requisitos Funcionais

### RF01 - Autenticação e Autorização

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF01.1 | Login com email/senha | Alta | ✅ |
| RF01.2 | Cadastro com validação | Alta | ✅ |
| RF01.3 | Recuperação de senha | Alta | ✅ |
| RF01.4 | Roles (user, admin, master_admin) | Alta | ✅ |
| RF01.5 | 2FA | Média | 🔄 Em Progresso |

### RF02 - Criação de Quiz (Funil de Auto-Convencimento)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF02.1 | Editor visual de blocos | Alta | ✅ |
| RF02.2 | Tipos de pergunta (yes/no, single, multiple, text) | Alta | ✅ |
| RF02.3 | Upload de mídia (imagem, vídeo, áudio) | Alta | ✅ |
| RF02.4 | Upload de vídeo via Bunny CDN | Alta | ✅ |
| RF02.5 | Templates visuais (8 templates) | Alta | ✅ |
| RF02.6 | Geração com IA (modo auto-convencimento) | Alta | ✅ |
| RF02.7 | Geração via PDF | Média | ✅ |
| RF02.8 | Preview interativo | Alta | ✅ |
| RF02.9 | Duplicação de perguntas | Média | ✅ |
| RF02.10 | Undo/Redo no editor | Média | ✅ |
| RF02.11 | Quiz branching (lógica condicional) | Alta | ✅ |
| RF02.12 | Otimização automática de imagens (WebP) | Média | ✅ |
| RF02.13 | Imagens por opção de resposta (optionImages, optionImageLayout) | Média | ✅ |
| RF02.14 | Editor Classic/Modern com thin router | Alta | ✅ |
| RF02.15 | 34 tipos de blocos no editor | Alta | ✅ |

### RF03 - Resultados e Condições

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF03.1 | Resultado único (always) | Alta | ✅ |
| RF03.2 | Resultado por score range | Alta | ✅ |
| RF03.3 | Resultado por respostas específicas | Média | ✅ |
| RF03.4 | Resultado tipo Calculadora | Alta | ✅ |
| RF03.5 | Fórmulas matemáticas personalizadas | Alta | ✅ |
| RF03.6 | **Calculator Wizard (3 passos: variáveis → fórmula → faixas)** | Alta | ✅ |
| RF03.7 | Redirecionamento customizado | Alta | ✅ |
| RF03.8 | CTA personalizado | Alta | ✅ |

### RF04 - Coleta de Dados

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF04.1 | Formulário básico (nome, email, WhatsApp) | Alta | ✅ |
| RF04.2 | Campos customizados | Alta | ✅ |
| RF04.3 | Timing configurável (before/after/both/none) | Alta | ✅ |
| RF04.4 | Validação de campos | Alta | ✅ |

### RF05 - Publicação e Compartilhamento

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF05.1 | URL única por quiz | Alta | ✅ |
| RF05.2 | URL customizada (/:company/:slug) | Média | ✅ |
| RF05.3 | Embed via iframe | Alta | ✅ |
| RF05.4 | Preview link para draft | Média | ✅ |
| RF05.5 | QR Code | Baixa | ✅ |

### RF06 - CRM e Gestão de Leads

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF06.1 | Lista de respostas | Alta | ✅ |
| RF06.2 | Kanban de leads | Alta | ✅ |
| RF06.3 | Tags e filtros | Alta | ✅ |
| RF06.4 | Exportação Excel/CSV | Alta | ✅ |
| RF06.5 | Webhooks | Alta | ✅ |

### RF07 - Analytics (Métricas de Consciência)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF07.1 | Dashboard de métricas | Alta | ✅ |
| RF07.2 | Gráficos de conversão | Alta | ✅ |
| RF07.3 | Funnel visualization | Alta | ✅ |
| RF07.4 | Video analytics | Média | ✅ |
| RF07.5 | Métricas por pergunta (impacto emocional) | Média | ✅ |
| RF07.6 | Relatório PDF | Média | ✅ |
| RF07.7 | A/B testing | Média | ✅ |
| RF07.8 | Heatmap de respostas | Média | ✅ |

### RF08 - Tracking

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF08.1 | Facebook Pixel por quiz | Alta | ✅ |
| RF08.2 | GTM global | Alta | ✅ |
| RF08.3 | GTM por quiz | Média | ✅ |
| RF08.4 | Eventos de vídeo | Média | ✅ |
| RF08.5 | Eventos GTM centralizados (pushGTMEvent) | Alta | ✅ |
| RF08.6 | Persistência de eventos para analytics admin | Média | ✅ |
| RF08.7 | Dashboard de eventos GTM no admin | Média | ✅ |
| RF08.8 | GTM lifecycle completo (quiz_view/start/complete/lead_captured persistidos) | Alta | ✅ |

### RF09 - Pagamentos

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF09.1 | Integração Kiwify | Alta | ✅ |
| RF09.2 | Planos (Free, Paid, Partner, Premium) | Alta | ✅ |
| RF09.3 | Limites por plano | Alta | ✅ |
| RF09.4 | Página de sucesso/cancelamento | Alta | ✅ |
| RF09.5 | Preços diferenciados por modo (A/B) com checkout dinâmico | Alta | ✅ |

### RF10 - Integrações

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF10.1 | Zapier via webhook | Alta | ✅ |
| RF10.2 | Make via webhook | Alta | ✅ |
| RF10.3 | n8n via webhook | Alta | ✅ |
| RF10.4 | HubSpot | Média | ✅ |
| RF10.5 | RD Station | Média | ✅ |
| RF10.6 | Pipedrive | Média | ✅ |
| RF10.7 | Mailchimp | Média | ✅ |
| RF10.8 | ActiveCampaign | Média | ✅ |
| RF10.9 | Logs de sincronização | Alta | ✅ |

### RF11 - Admin

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF11.1 | Gestão de templates | Alta | ✅ |
| RF11.2 | Configuração de planos | Alta | ✅ |
| RF11.3 | Configuração Kiwify | Alta | ✅ |
| RF11.4 | Configuração Bunny CDN | Alta | ✅ |
| RF11.5 | Prompts de IA (auto-convencimento) | Alta | ✅ |
| RF11.6 | Audit logs | Média | ✅ |
| RF11.7 | Audit logs expandido (integrações, exports) | Média | ✅ |
| RF11.8 | Support tickets | Média | ✅ |
| RF11.9 | CSP monitoring | Média | ✅ |
| RF11.10 | Dashboard de eventos GTM (observabilidade) | Média | ✅ |
| RF11.11 | Rotação de prompts de imagem do blog (5 estilos) | Média | ✅ |
| RF11.12 | Cooldown global de campanhas de recuperação | Média | ✅ |
| RF11.13 | Aba Custos de email transacional (cálculo por categoria) | Média | ✅ |
| RF11.14 | Preview de email antes de envio em massa (compose→preview→enviar) | Média | ✅ |
| RF11.15 | Comparação A×B de modos de monetização (métricas históricas) | Média | ✅ |
| RF11.16 | Modo Suporte Avançado (impersonação, editor de quiz, diff visual) | Alta | ✅ |
| RF11.17 | Editor de blocos admin (34 tipos, edição individual) | Alta | ✅ |
| RF11.18 | Notificações admin para usuários (admin_notifications + NotificationBell) | Média | ✅ |
| RF11.19 | CRUD de perguntas no editor de suporte (adicionar/remover) | Média | ✅ |
| RF11.20 | Relatório PDF de sessão de suporte (jsPDF + branding) | Média | ✅ |
| RF11.21 | Histórico de sessões de suporte (reconstrução via audit_logs) | Média | ✅ |

### RF12 - Email Marketing Automatizado

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF12.1 | Templates de email estáticos (12 tipos) | Alta | ✅ |
| RF12.2 | Templates dinâmicos com IA (5 tipos) | Alta | ✅ |
| RF12.3 | Automações de email (blog digest, dica semanal, etc.) | Alta | ✅ |
| RF12.4 | A/B testing de assuntos (subject_b) | Média | ✅ |
| RF12.5 | Dashboard de performance por categoria | Média | ✅ |
| RF12.6 | E-goi Bulk API (lotes de 100) | Alta | ✅ |
| RF12.7 | Webhook de tracking (open/click/bounce) | Alta | ✅ |
| RF12.8 | Envio de teste individual | Média | ✅ |

### RF13 - Compliance Email (CAN-SPAM/LGPD)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF13.1 | Unsubscribe via link no email | Alta | ✅ |
| RF13.2 | Tabela email_unsubscribes | Alta | ✅ |
| RF13.3 | Header List-Unsubscribe | Alta | ✅ |
| RF13.4 | Footer com opt-out obrigatório | Alta | ✅ |
| RF13.5 | Página de confirmação de unsubscribe | Média | ✅ |

---

## 🔒 Requisitos de Segurança

### RS01 - Row Level Security (RLS)

| ID | Requisito | Status |
|----|-----------|--------|
| RS01.1 | RLS em todas as tabelas | ✅ |
| RS01.2 | ab_test_sessions UPDATE restrito a 24h | ✅ |
| RS01.3 | landing_ab_sessions UPDATE restrito a 24h | ✅ |
| RS01.4 | View user_integrations_safe (mascara API keys) | ✅ |
| RS01.5 | Admins podem ver integrações para suporte | ✅ |

### RS02 - Autosave e Persistência

| ID | Requisito | Status |
|----|-----------|--------|
| RS02.1 | Hook useAutoSave com debounce 30s | ✅ |
| RS02.2 | Indicador visual de status (saving/saved/error) | ✅ |
| RS02.3 | Detecção de online/offline | ✅ |
| RS02.4 | saveNow() para salvamento imediato | ✅ |

---

## 🔒 Requisitos Não-Funcionais

### RNF01 - Performance

| ID | Requisito | Meta |
|----|-----------|------|
| RNF01.1 | LCP (Largest Contentful Paint) | < 2.5s |
| RNF01.2 | FID (First Input Delay) | < 100ms |
| RNF01.3 | CLS (Cumulative Layout Shift) | < 0.1 |
| RNF01.4 | PageSpeed Score (mobile) | > 90 |

### RNF02 - Segurança

| ID | Requisito | Status |
|----|-----------|--------|
| RNF02.1 | HTTPS obrigatório | ✅ |
| RNF02.2 | RLS em todas as tabelas | ✅ |
| RNF02.3 | Sanitização de inputs | ✅ |
| RNF02.4 | CSP headers (inclui Bunny CDN) | ✅ |
| RNF02.5 | Rate limiting | ✅ |

### RNF03 - Disponibilidade

| ID | Requisito | Meta |
|----|-----------|------|
| RNF03.1 | Uptime | 99.9% |
| RNF03.2 | Recovery Time Objective | < 1h |
| RNF03.3 | Recovery Point Objective | < 24h |

### RNF04 - Escalabilidade

| ID | Requisito | Meta |
|----|-----------|------|
| RNF04.1 | Concurrent users | 10.000+ |
| RNF04.2 | Quizzes simultâneos | 1.000+ |
| RNF04.3 | Respostas/minuto | 10.000+ |

### RNF05 - Compliance

| ID | Requisito | Status |
|----|-----------|--------|
| RNF05.1 | LGPD (banner cookies, exportação, exclusão, anonimização) | ✅ |
| RNF05.2 | GDPR (futuro) | 🔜 |
| RNF05.3 | Consentimento de cookies | ✅ |
| RNF05.4 | Direito ao esquecimento (cascade delete) | ✅ |
| RNF05.5 | Anonimização de IPs após 6 meses | ✅ |

### RNF06 - Qualidade de Código

| ID | Requisito | Status |
|----|-----------|--------|
| RNF06.1 | Cobertura de testes mínima 50% | ✅ |
| RNF06.2 | ESLint sem erros críticos | ✅ |
| RNF06.3 | TypeScript strict mode | ✅ |
| RNF06.4 | CI/CD com validação automática | ✅ |

---

## 📝 Backlog

### Épico 1: LGPD Compliance (Q1 2025) ✅

| User Story | Prioridade | Status |
|------------|------------|--------|
| Como usuário, quero um banner de cookies para consentir com tracking | Alta | ✅ |
| Como usuário, quero acessar política de privacidade clara | Alta | ✅ |
| Como usuário, quero exportar todos meus dados | Alta | ✅ |
| Como usuário, quero deletar minha conta e dados | Alta | ✅ |
| Como admin, quero que IPs sejam anonimizados após 6 meses | Média | ✅ |

### Épico 2: Testes Automatizados (Q1 2025) ✅

| User Story | Prioridade | Status |
|------------|------------|--------|
| Como dev, quero testes de funções utilitárias (validations, sanitize) | Alta | ✅ |
| Como dev, quero testes de componentes críticos (LivePreview) | Alta | ✅ |
| Como dev, quero testes do AuthContext | Alta | ✅ |
| Como dev, quero testes de páginas (Login, QuizView) | Alta | ✅ |
| Como dev, quero CI/CD com cobertura mínima de 50% | Alta | ✅ |

### Épico 3: AI Features - Auto-Convencimento (Q2 2025)

| User Story | Prioridade | Sprint |
|------------|------------|--------|
| Como usuário, quero quiz branching inteligente | Alta | Sprint 4 |
| Como usuário, quero sugestões de otimização AI | Alta | Sprint 5 |
| Como usuário, quero tradução automática | Média | Sprint 6 |
| Como usuário, quero lead scoring por consciência | Alta | Sprint 7 |

### Épico 5: Email Marketing (H1 2026) ✅

| User Story | Prioridade | Status |
|------------|------------|--------|
| Como admin, quero templates de email para recuperação de inativos | Alta | ✅ |
| Como admin, quero automações de email com conteúdo gerado por IA | Alta | ✅ |
| Como admin, quero enviar emails em massa via Bulk API | Alta | ✅ |
| Como admin, quero dashboard de performance de emails | Média | ✅ |
| Como usuário, quero poder fazer unsubscribe de emails | Alta | ✅ |

### Épico 6: Monetização e Observabilidade (H1 2026) ✅

| User Story | Prioridade | Status |
|------------|------------|--------|
| Como admin, quero ver custos detalhados de email transacional por categoria | Média | ✅ |
| Como admin, quero preview de email antes de envio em massa | Média | ✅ |
| Como admin, quero comparar métricas históricas entre modos A e B | Média | ✅ |
| Como admin, quero preços independentes por modo de monetização | Alta | ✅ |
| Como admin, quero GTM lifecycle tracking completo nos quizzes | Alta | ✅ |
| Como admin, quero que a aba de usuários mostre dados reais mesmo com 400+ users | Alta | ✅ |

### Épico 7: Suporte Avançado (Abril 2026) ✅

| User Story | Prioridade | Status |
|------------|------------|--------|
| Como admin, quero visualizar o dashboard de qualquer usuário sem trocar de conta | Alta | ✅ |
| Como admin, quero editar quizzes de usuários diretamente (metadados, perguntas, blocos) | Alta | ✅ |
| Como admin, quero ver um diff visual antes de salvar alterações no quiz do usuário | Alta | ✅ |
| Como admin, quero adicionar e remover perguntas no quiz do usuário | Média | ✅ |
| Como admin, quero editar os 34 tipos de blocos individualmente no quiz do usuário | Alta | ✅ |
| Como usuário, quero ser notificado quando o suporte alterar meu quiz | Média | ✅ |
| Como admin, quero gerar um relatório PDF da sessão de suporte | Média | ✅ |
| Como admin, quero ver o histórico de sessões de suporte anteriores | Média | ✅ |

### Épico 4: Enterprise (Q3-Q4 2025)

| User Story | Prioridade | Sprint |
|------------|------------|--------|
| Como empresa, quero white-label completo | Alta | Sprint 8 |
| Como empresa, quero SSO | Alta | Sprint 9 |
| Como empresa, quero workspaces de time | Média | Sprint 10 |
| Como empresa, quero permissões granulares | Média | Sprint 11 |

---

## 🧪 Qualidade e Testes

### Suíte de Testes Implementada

| Categoria | Arquivos | Testes | Status |
|-----------|----------|--------|--------|
| Validações (Zod) | validations.test.ts | 45+ | ✅ |
| Sanitização (XSS) | sanitize.test.ts | 40+ | ✅ |
| Tratamento de Erros | errorHandler.test.ts | 25+ | ✅ |
| Motor de Cálculo | calculatorEngine.test.ts | 25+ | ✅ |
| Lógica Condicional | conditionEvaluator.test.ts | 30+ | ✅ |
| Hook useAutoSave | useAutoSave.test.ts | 15+ | ✅ |
| Hook useVideoAnalytics | useVideoAnalytics.test.ts | 20+ | ✅ |
| Hook useFunnelData | useFunnelData.test.ts | 15+ | ✅ |
| Hook useABTest | useABTest.test.ts | 15+ | ✅ |
| AuthContext | AuthContext.test.tsx | 15+ | ✅ |
| LivePreview | LivePreview.test.tsx | 35+ | ✅ |
| AIQuizGenerator | AIQuizGenerator.test.tsx | 15+ | ✅ |
| ConditionBuilder | ConditionBuilder.test.tsx | 15+ | ✅ |
| Login Page | Login.test.tsx | 40+ | ✅ |
| QuizView Page | QuizView.test.tsx | 30+ | ✅ |
| Dashboard Page | Dashboard.test.tsx | 20+ | ✅ |
| CRM Page | CRM.test.tsx | 15+ | ✅ |
| Analytics Page | Analytics.test.tsx | 15+ | ✅ |
| QuizViewState | useQuizViewState.test.ts | 15+ | ✅ |
| QuizTracking | useQuizTracking.test.ts | 15+ | ✅ |
| **Total** | **20+ arquivos** | **~460 testes** | ✅ |

### CI/CD Pipeline

O workflow de validação de PRs inclui:

1. **ESLint** - Verificação de padrões de código
2. **TypeScript Check** - Compilação sem erros
3. **Testes com Cobertura** - Mínimo 50%
4. **Build de Produção** - Verificação de build
5. **Análise de Bundle** - Monitoramento de tamanho
6. **Comentário no PR** - Relatório automático com métricas

### Threshold de Cobertura

| Métrica | Mínimo Requerido | Meta |
|---------|------------------|------|
| Lines | 50% | 80% |
| Statements | 50% | 80% |
| Functions | 50% | 80% |
| Branches | 40% | 70% |

PRs que não atingem 50% de cobertura média falham automaticamente.

---

## 📊 Métricas de Sucesso

### North Star Metric
**Leads que se auto-convencem por mês** (taxa de conversão pós-quiz)

### Métricas de Aquisição
- CAC (Custo de Aquisição de Cliente)
- Taxa de conversão trial → paid
- Canais de aquisição performance

### Métricas de Engajamento
- DAU/MAU ratio
- Quizzes criados por usuário
- Tempo médio no editor
- Feature adoption rate

### Métricas de Retenção
- Churn rate mensal
- NPS (Net Promoter Score)
- Customer Lifetime Value (LTV)
- LTV/CAC ratio

### Métricas de Produto (Consciência)
- Taxa de conclusão de quiz
- Engajamento por pergunta (tempo, interação)
- Pontos de resistência cognitiva (abandono)
- Taxa de conversão pós-resultado
- Tempo de decisão (resultado → CTA)

### Métricas de Qualidade
- Cobertura de testes
- Bugs reportados por release
- Tempo médio de resolução de bugs
- Uptime do sistema

---

## 📎 Anexos

### Glossário

| Termo | Definição |
|-------|-----------|
| Quiz | Funil de perguntas estratégicas para auto-convencimento |
| Lead | Visitante que passou pelo funil de consciência |
| Auto-convencimento | Processo onde o lead reconhece seu problema e decide sozinho |
| Espelhamento | Pergunta que faz o lead se reconhecer na situação |
| Amplificação | Pergunta que evidencia o peso do problema |
| Score | Pontuação baseada em respostas |
| Bloco | Unidade de conteúdo no editor |
| Template | Tema visual pré-definido |
| Calculadora | Tipo de resultado com fórmula matemática |
| Bunny CDN | CDN para streaming de vídeos |

### Referências

- [Typeform](https://www.typeform.com/) - Inspiração UX
- [Interact](https://www.tryinteract.com/) - Funcionalidades quiz
- [Outgrow](https://outgrow.co/) - Calculadoras interativas
- [LeadQuizzes](https://www.leadquizzes.com/) - Quiz marketing

### Documentação Relacionada

- [../README.md](../README.md) - Setup, stack e arquitetura
- [ROADMAP.md](./ROADMAP.md) - Planejamento estratégico
- [PENDENCIAS.md](./PENDENCIAS.md) - Changelog e pendências
- [STYLE_GUIDE.md](./STYLE_GUIDE.md) - Padrões de código
- [CHECKLIST.md](./CHECKLIST.md) - Checklist de validação MVP
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) - Arquitetura técnica
- [API_DOCS.md](./API_DOCS.md) - Documentação Edge Functions
- [COMPONENTS.md](./COMPONENTS.md) - Documentação componentes
- [BLOCKS.md](./BLOCKS.md) - Catálogo dos 34 tipos de blocos
- [TESTING.md](./TESTING.md) - Guia de testes
- [BLOG.md](./BLOG.md) - Guia do blog com IA
- [EGOI.md](./EGOI.md) - Guia do email marketing
- [MONETIZATION.md](./MONETIZATION.md) - Monetização A/B e custos
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema completo do banco
- [SECURITY.md](./SECURITY.md) - Práticas de segurança e RLS
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Padrões obrigatórios de código
- [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) - Catálogo das 61 Edge Functions
- [ONBOARDING.md](./ONBOARDING.md) - Guia para novos desenvolvedores
- [ADR.md](./ADR.md) - Architecture Decision Records

---

**Documento mantido por:** Product Team  
**Próxima revisão:** Junho 2026
