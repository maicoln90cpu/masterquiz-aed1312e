# ✅ CHECKLIST DE VALIDAÇÃO - MasterQuiz MVP

> Guia completo para validação manual do aplicativo antes do lançamento.

**Versão:** 2.30.0  
**Data:** 19/03/2026

---

## 📋 Índice

1. [Fluxo do Visitante (Público)](#1️⃣-fluxo-do-visitante-público)
2. [Fluxo de Autenticação](#2️⃣-fluxo-de-autenticação)
3. [Fluxo de Criação de Quiz](#3️⃣-fluxo-de-criação-de-quiz)
4. [Fluxo de Publicação](#4️⃣-fluxo-de-publicação)
5. [Fluxo de Respostas e Leads](#5️⃣-fluxo-de-respostas-e-leads)
6. [Fluxo do CRM](#6️⃣-fluxo-do-crm)
7. [Fluxo de Analytics](#7️⃣-fluxo-de-analytics)
8. [Fluxo de Integrações](#8️⃣-fluxo-de-integrações)
9. [Fluxo de Pagamentos](#9️⃣-fluxo-de-pagamentos)
10. [Fluxo Admin](#🔟-fluxo-admin)
11. [Configurações](#⚙️-configurações)
12. [Responsividade](#📱-responsividade)
13. [Performance](#⚡-performance)
14. [Segurança](#🔒-segurança)
15. [Internacionalização](#🌐-internacionalização)
16. [Estratégias de Captação](#🚀-estratégias-de-captação-de-clientes)

---

## 1️⃣ Fluxo do Visitante (Público)

### Landing Page (/)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Hero section carrega corretamente | | |
| [ ] Animações do hero funcionam | | |
| [ ] Botão "Começar Grátis" → /login | | |
| [ ] Botão "Ver Demo" → quiz demo | | |
| [ ] Galeria de screenshots funciona | | |
| [ ] Navegação entre screenshots | | |
| [ ] Seção de features exibe corretamente | | |
| [ ] Cards de features animam | | |
| [ ] Seção de preços exibe 3+ planos | | |
| [ ] Preços estão corretos | | |
| [ ] Botões de checkout funcionam | | |
| [ ] FAQ accordion abre/fecha | | |
| [ ] Todas as perguntas do FAQ | | |
| [ ] Footer com links funcionais | | |
| [ ] Link para política de privacidade | | |
| [ ] Link para termos de uso | | |
| [ ] Redes sociais (se houver) | | |

### Quiz Público (/:company/:slug)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Quiz carrega sem erros | | |
| [ ] Loading spinner aparece | | |
| [ ] Logo do quiz exibe (se configurado) | | |
| [ ] Título do quiz exibe | | |
| [ ] Descrição do quiz exibe (se configurado) | | |
| [ ] Botão "Começar" funciona | | |
| [ ] Seletor de idioma funciona (se multi-idioma) | | |

### Perguntas do Quiz

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Pergunta 1 exibe corretamente | | |
| [ ] Opções de resposta clicáveis | | |
| [ ] Feedback visual ao selecionar | | |
| [ ] Botão "Próximo" ativa após seleção | | |
| [ ] Botão "Anterior" funciona | | |
| [ ] Barra de progresso atualiza | | |
| [ ] Número da pergunta atualiza | | |
| [ ] Blocos de mídia (imagem/vídeo) carregam | | |
| [ ] Vídeo reproduz corretamente | | |
| [ ] Áudio reproduz corretamente | | |

### Formulário de Coleta

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Formulário aparece (se configurado) | | |
| [ ] Campo de nome funciona | | |
| [ ] Campo de email funciona | | |
| [ ] Validação de email (formato) | | |
| [ ] Campo de WhatsApp funciona | | |
| [ ] Validação de WhatsApp (formato) | | |
| [ ] Campos customizados aparecem | | |
| [ ] Campos obrigatórios marcados | | |
| [ ] Erro ao enviar sem campos obrigatórios | | |
| [ ] Botão de enviar funciona | | |

### Resultado do Quiz

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Tela de resultado exibe | | |
| [ ] Texto do resultado correto | | |
| [ ] Imagem do resultado (se configurada) | | |
| [ ] Vídeo do resultado (se configurado) | | |
| [ ] Resultado de calculadora (se aplicável) | | |
| [ ] Formatação correta (R$, %, etc.) | | |
| [ ] CTA do resultado exibe | | |
| [ ] CTA redireciona corretamente | | |
| [ ] Branding "Powered by MasterQuiz" (ou oculto) | | |

---

## 2️⃣ Fluxo de Autenticação

### Página de Login (/login)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Logo MasterQuizz exibe | | |
| [ ] Tabs Login/Cadastro funcionam | | |
| [ ] Campo de email funciona | | |
| [ ] Campo de senha funciona | | |
| [ ] Toggle mostrar/ocultar senha | | |
| [ ] Botão "Entrar" funciona | | |
| [ ] Loading state no botão | | |
| [ ] Erro com credenciais inválidas | | |
| [ ] Mensagem de erro amigável | | |
| [ ] Login com sucesso → Dashboard | | |
| [ ] Link "Esqueci senha" funciona | | |

### Cadastro

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Tab "Cadastro" ativa | | |
| [ ] Campo de nome completo | | |
| [ ] Campo de WhatsApp | | |
| [ ] Campo de email | | |
| [ ] Campo de senha | | |
| [ ] Indicador de força da senha | | |
| [ ] Campo de confirmar senha | | |
| [ ] Validação de senhas iguais | | |
| [ ] Botão "Criar Conta" funciona | | |
| [ ] Cadastro cria conta | | |
| [ ] Auto-login após cadastro | | |
| [ ] Redirect para Dashboard | | |

### Recuperação de Senha

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Modal abre ao clicar "Esqueci senha" | | |
| [ ] Campo de email funciona | | |
| [ ] Botão "Enviar" funciona | | |
| [ ] Mensagem de sucesso | | |
| [ ] Email recebido (verificar inbox) | | |
| [ ] Link de reset funciona | | |
| [ ] Formulário de nova senha | | |
| [ ] Nova senha é salva | | |
| [ ] Login com nova senha | | |

---

## 3️⃣ Fluxo de Criação de Quiz

### Dashboard (/dashboard)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Sidebar exibe corretamente | | |
| [ ] Nome do usuário exibe | | |
| [ ] Cards de estatísticas carregam | | |
| [ ] Total de quizzes | | |
| [ ] Total de respostas | | |
| [ ] Total de leads | | |
| [ ] Taxa de conversão | | |
| [ ] Botão "Criar Quiz" visível | | |
| [ ] Botão "Criar Quiz" funciona | | |
| [ ] Lista de quizzes recentes | | |
| [ ] Gráfico de atividade (se houver) | | |

### Editor de Quiz (/create)

#### Etapa 1 - Templates

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Stepper mostra etapa 1 | | |
| [ ] Grid de templates exibe | | |
| [ ] Templates gratuitos disponíveis | | |
| [ ] Templates premium marcados | | |
| [ ] Preview ao hover (se houver) | | |
| [ ] Seleção de template funciona | | |
| [ ] Template selecionado destaca | | |
| [ ] "Criar do zero" funciona | | |
| [ ] "Criar com IA" abre modal | | |
| [ ] Botão "Próximo" funciona | | |

#### Geração com IA

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Modal abre corretamente | | |
| [ ] Campo de tema/objetivo | | |
| [ ] Upload de PDF (opcional) | | |
| [ ] Seletor de número de perguntas | | |
| [ ] Botão "Gerar" funciona | | |
| [ ] Loading/progresso durante geração | | |
| [ ] Quiz gerado aparece | | |
| [ ] Perguntas geradas são relevantes | | |
| [ ] Opções de resposta fazem sentido | | |
| [ ] Limite de gerações exibe (se aplicável) | | |

#### Etapa 2 - Perguntas

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lista de perguntas exibe | | |
| [ ] Pergunta padrão criada | | |
| [ ] Botão "Adicionar Pergunta" funciona | | |
| [ ] **Botão "Deletar" visível** | | |
| [ ] **Confirmação antes de deletar** | | |
| [ ] Botão "Duplicar" funciona | | |
| [ ] Drag-and-drop para reordenar | | |
| [ ] Ordem salva corretamente | | |
| [ ] Campo de título da pergunta | | |
| [ ] **Campo custom_label funciona** | | |
| [ ] Preview do título atualiza | | |

#### Tipos de Pergunta

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Sim/Não funciona | | |
| [ ] Escolha única funciona | | |
| [ ] Múltipla escolha funciona | | |
| [ ] Texto curto funciona | | |
| [ ] Slider funciona | | |
| [ ] NPS funciona | | |

#### Opções de Resposta

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Adicionar opção funciona | | |
| [ ] Remover opção funciona | | |
| [ ] Editar texto da opção | | |
| [ ] Score por opção funciona | | |
| [ ] Imagem por opção (se houver) | | |

#### Blocos de Conteúdo

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Paleta de blocos abre | | |
| [ ] Bloco de Texto funciona | | |
| [ ] Editor rich text funciona | | |
| [ ] Bloco de Imagem funciona | | |
| [ ] Upload de imagem funciona | | |
| [ ] Bloco de Vídeo funciona | | |
| [ ] URL do YouTube aceita | | |
| [ ] Bloco de Áudio funciona | | |
| [ ] Upload de áudio funciona | | |
| [ ] Bloco de Botão funciona | | |
| [ ] Bloco de Countdown funciona | | |
| [ ] Outros blocos (testar cada) | | |

#### Lógica Condicional

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Botão de condições funciona | | |
| [ ] Adicionar condição funciona | | |
| [ ] Seletor de pergunta referência | | |
| [ ] Seletor de resposta | | |
| [ ] Preview da lógica funciona | | |
| [ ] Pergunta oculta se condição não atende | | |

#### Etapa 3 - Formulário

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Toggle de coleta ativa/desativa | | |
| [ ] Campo "Coletar Nome" funciona | | |
| [ ] Campo "Coletar Email" funciona | | |
| [ ] Campo "Coletar WhatsApp" funciona | | |
| [ ] Timing: Antes do quiz | | |
| [ ] Timing: Depois do quiz | | |
| [ ] Timing: Nunca | | |
| [ ] Campos customizados | | |
| [ ] Adicionar campo customizado | | |
| [ ] Tipos de campo (texto, número, data, select) | | |
| [ ] Campo obrigatório toggle | | |

#### Etapa 4 - Aparência

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Seletor de template visual | | |
| [ ] Preview atualiza em tempo real | | |
| [ ] Cores aplicadas corretamente | | |
| [ ] Upload de logo funciona | | |
| [ ] Logo exibe no preview | | |
| [ ] Toggle "Mostrar título" | | |
| [ ] Toggle "Mostrar descrição" | | |
| [ ] Toggle "Mostrar número da pergunta" | | |
| [ ] Toggle "Ocultar branding" (se disponível) | | |

#### Etapa 5 - Resultados

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lista de resultados exibe | | |
| [ ] Resultado padrão criado | | |
| [ ] Botão "Adicionar Resultado" funciona | | |
| [ ] **Botão "Deletar" visível** | | |
| [ ] **Confirmação antes de deletar** | | |
| [ ] Tabs de tipo: Padrão, Score, Calculadora | | |

#### Tipo: Padrão (Always)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Tipo "Sempre" selecionável | | |
| [ ] Texto do resultado editável | | |
| [ ] Upload de imagem funciona | | |
| [ ] URL de vídeo funciona | | |
| [ ] Texto do CTA editável | | |
| [ ] URL de redirecionamento funciona | | |

#### Tipo: Score

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Tipo "Score" selecionável | | |
| [ ] Campo "Score Mínimo" | | |
| [ ] Campo "Score Máximo" | | |
| [ ] Múltiplas faixas funcionam | | |
| [ ] Preview do resultado por score | | |

#### Tipo: Calculadora (NOVO)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Tipo "Calculadora" selecionável | | |
| [ ] **Botão "Configurar Calculadora" funciona** | | |
| [ ] **Calculator Wizard abre** | | |

##### Passo 1 - Variáveis

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lista de perguntas numéricas exibe | | |
| [ ] Checkbox para selecionar pergunta | | |
| [ ] Variável (X1, X2...) atribuída | | |
| [ ] Preview das variáveis | | |
| [ ] Botão "Próximo" funciona | | |

##### Passo 2 - Fórmula

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Editor de fórmula exibe | | |
| [ ] Botões de variáveis (X1, X2...) | | |
| [ ] Botões de operadores (+, -, *, /) | | |
| [ ] Campo de fórmula editável | | |
| [ ] Preview do cálculo funciona | | |
| [ ] Valores de teste editáveis | | |
| [ ] Resultado do preview atualiza | | |
| [ ] Seletor de formato (moeda, %, custom) | | |
| [ ] Seletor de casas decimais | | |
| [ ] Campo de unidade customizada | | |

##### Passo 3 - Faixas

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lista de faixas exibe | | |
| [ ] Adicionar faixa funciona | | |
| [ ] Campo "Mínimo" funciona | | |
| [ ] Campo "Máximo" funciona | | |
| [ ] Campo "Label" funciona | | |
| [ ] Campo "Descrição" funciona | | |
| [ ] Remover faixa funciona | | |
| [ ] Preview visual das faixas | | |
| [ ] Botão "Concluir" salva | | |

#### AutoSave

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Indicador "Salvando..." aparece | | |
| [ ] Indicador "Salvo" aparece | | |
| [ ] Draft persiste ao recarregar | | |
| [ ] Undo/Redo funciona | | |

---

## 4️⃣ Fluxo de Publicação

### Publicar Quiz

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Botão "Publicar" visível | | |
| [ ] Modal de publicação abre | | |
| [ ] Validação: título obrigatório | | |
| [ ] Validação: pelo menos 1 pergunta | | |
| [ ] Slug gerado automaticamente | | |
| [ ] Slug editável manualmente | | |
| [ ] Preview do link público | | |
| [ ] Botão "Publicar" funciona | | |
| [ ] Confirmação de sucesso | | |
| [ ] Quiz muda status para "Publicado" | | |

### Meus Quizzes (/my-quizzes)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Lista de quizzes exibe | | |
| [ ] Filtro por status funciona | | |
| [ ] Busca por título funciona | | |
| [ ] Filtro por tags funciona | | |
| [ ] Card exibe título | | |
| [ ] Card exibe descrição | | |
| [ ] Card exibe data de criação | | |
| [ ] Card exibe contagem de respostas | | |
| [ ] Status badge (Draft/Publicado/Arquivado) | | |

### Ações do Quiz

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Botão "Editar" funciona | | |
| [ ] Botão "Visualizar" abre quiz público | | |
| [ ] Botão "Duplicar" funciona | | |
| [ ] Modal de duplicar com nome | | |
| [ ] **Botão "Deletar" funciona** | | |
| [ ] **Confirmação de deleção** | | |
| [ ] Botão "Arquivar" funciona | | |
| [ ] Botão "Copiar Link" funciona | | |
| [ ] Toast de confirmação "Link copiado" | | |

### Compartilhamento

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Modal de compartilhamento abre | | |
| [ ] Link público exibe | | |
| [ ] Botão copiar link funciona | | |
| [ ] QR Code exibe | | |
| [ ] Download QR Code funciona | | |
| [ ] Código de embed exibe | | |
| [ ] Copiar embed funciona | | |
| [ ] Preview do embed funciona | | |

---

## 5️⃣ Fluxo de Respostas e Leads

### Página de Respostas (/responses)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Lista de respostas exibe | | |
| [ ] Filtro por quiz funciona | | |
| [ ] Filtro por data funciona | | |
| [ ] Busca por email/nome funciona | | |
| [ ] Tabela exibe colunas corretas | | |
| [ ] Nome do respondente | | |
| [ ] Email do respondente | | |
| [ ] WhatsApp do respondente | | |
| [ ] Data da resposta | | |
| [ ] Quiz respondido | | |
| [ ] Resultado obtido | | |

### Detalhes da Resposta

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Expandir resposta funciona | | |
| [ ] Todas as respostas exibem | | |
| [ ] Pergunta + resposta selecionada | | |
| [ ] Score por pergunta (se aplicável) | | |
| [ ] Score total | | |
| [ ] Campos customizados exibem | | |

### Exportação

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Botão "Exportar" visível | | |
| [ ] Dropdown de formatos | | |
| [ ] Exportação Excel funciona | | |
| [ ] Arquivo Excel baixa | | |
| [ ] Dados corretos no Excel | | |
| [ ] Exportação CSV funciona | | |
| [ ] Arquivo CSV baixa | | |

### Paginação

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Paginação exibe (se > 10 itens) | | |
| [ ] Próxima página funciona | | |
| [ ] Página anterior funciona | | |
| [ ] Ir para página específica | | |
| [ ] Contador de itens correto | | |

---

## 6️⃣ Fluxo do CRM

### CRM Kanban (/crm)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Colunas padrão exibem | | |
| [ ] Coluna "Novo" | | |
| [ ] Coluna "Contato" | | |
| [ ] Coluna "Negociação" | | |
| [ ] Coluna "Fechado" | | |
| [ ] Cards de leads exibem | | |
| [ ] Nome do lead no card | | |
| [ ] Email do lead no card | | |
| [ ] Quiz de origem no card | | |
| [ ] Data no card | | |

### Drag-and-Drop

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Arrastar card funciona | | |
| [ ] Feedback visual ao arrastar | | |
| [ ] Soltar em outra coluna funciona | | |
| [ ] Status atualiza no banco | | |
| [ ] Card fica na nova posição | | |

### Filtros e Busca

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Busca por nome funciona | | |
| [ ] Busca por email funciona | | |
| [ ] Filtro por quiz funciona | | |
| [ ] Filtro por tag funciona | | |
| [ ] Limpar filtros funciona | | |

### Tags

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Adicionar tag ao lead funciona | | |
| [ ] Criar nova tag funciona | | |
| [ ] Seletor de cor da tag | | |
| [ ] Remover tag funciona | | |
| [ ] Tags exibem no card | | |

### Ações do Lead

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Clicar no card abre detalhes | | |
| [ ] Todas as informações exibem | | |
| [ ] Histórico de respostas | | |
| [ ] Botão de contato (WhatsApp) | | |
| [ ] Botão de email | | |
| [ ] Notas/observações editáveis | | |

---

## 7️⃣ Fluxo de Analytics

### Dashboard Analytics (/analytics)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Métricas gerais exibem | | |
| [ ] Total de visualizações | | |
| [ ] Total de inícios | | |
| [ ] Total de conclusões | | |
| [ ] Taxa de conversão | | |
| [ ] Taxa de abandono | | |

### Gráficos

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Gráfico de linha/área carrega | | |
| [ ] Dados corretos no gráfico | | |
| [ ] Tooltip ao hover funciona | | |
| [ ] Legenda exibe | | |

### Funnel Visualization

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Funil exibe corretamente | | |
| [ ] Etapas do funil | | |
| [ ] Porcentagem de abandono por etapa | | |
| [ ] Cores indicativas | | |

### Filtros de Período

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Seletor de período funciona | | |
| [ ] Últimos 7 dias | | |
| [ ] Últimos 30 dias | | |
| [ ] Últimos 90 dias | | |
| [ ] Período customizado | | |
| [ ] Dados atualizam ao mudar período | | |

### Analytics por Quiz

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Seletor de quiz funciona | | |
| [ ] Métricas específicas do quiz | | |
| [ ] Heatmap de respostas | | |
| [ ] Opções mais escolhidas | | |
| [ ] Tempo médio de resposta | | |

### Video Analytics (se houver vídeos)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Card de video analytics exibe | | |
| [ ] Taxa de visualização | | |
| [ ] Tempo médio assistido | | |
| [ ] Taxa de conclusão do vídeo | | |

---

## 8️⃣ Fluxo de Integrações

### Página de Integrações (/integrations)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Lista de integrações disponíveis | | |
| [ ] Status de cada integração | | |
| [ ] Botão "Adicionar Integração" | | |

### Conectar Webhook (Zapier/Make/n8n)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Modal de configuração abre | | |
| [ ] Campo de URL do webhook | | |
| [ ] Campo de secret (opcional) | | |
| [ ] Toggle ativar/desativar | | |
| [ ] Botão "Salvar" funciona | | |
| [ ] Botão "Testar" funciona | | |
| [ ] Teste envia payload corretamente | | |
| [ ] Confirmação de teste | | |

### Conectar HubSpot

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Card do HubSpot exibe | | |
| [ ] Botão "Conectar" funciona | | |
| [ ] Campo de API Key | | |
| [ ] Teste de conexão funciona | | |
| [ ] Status "Conectado" exibe | | |

### Conectar RD Station

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Card do RD Station exibe | | |
| [ ] Botão "Conectar" funciona | | |
| [ ] Campo de API Key | | |
| [ ] Teste de conexão funciona | | |
| [ ] Status "Conectado" exibe | | |

### Conectar Mailchimp

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Card do Mailchimp exibe | | |
| [ ] Botão "Conectar" funciona | | |
| [ ] Campo de API Key | | |
| [ ] Seletor de lista | | |
| [ ] Status "Conectado" exibe | | |

### Logs de Integração

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Seção de logs exibe | | |
| [ ] Logs recentes aparecem | | |
| [ ] Status do log (sucesso/erro) | | |
| [ ] Payload do log (expandir) | | |
| [ ] Data/hora do log | | |

---

## 9️⃣ Fluxo de Pagamentos

### Página de Preços (/pricing)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Plano Free exibe | | |
| [ ] Plano Pro exibe | | |
| [ ] Plano Business exibe | | |
| [ ] Preços corretos | | |
| [ ] Lista de features por plano | | |
| [ ] Plano atual destacado | | |
| [ ] Botões de upgrade funcionam | | |

### Checkout (Kiwify)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Clique em "Assinar" redireciona | | |
| [ ] Página do Kiwify carrega | | |
| [ ] Preço correto no Kiwify | | |
| [ ] Formulário de pagamento | | |
| [ ] Pagamento com cartão (teste) | | |
| [ ] Pagamento com PIX (teste) | | |

### Página de Sucesso (/kiwify-success)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega após pagamento | | |
| [ ] Confetti animation | | |
| [ ] Mensagem de sucesso | | |
| [ ] Detalhes do plano | | |
| [ ] Botão "Ir para Dashboard" | | |
| [ ] Plano ativo no perfil | | |

### Página de Cancelamento (/kiwify-cancel)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega se cancelar | | |
| [ ] Mensagem de cancelamento | | |
| [ ] Opções de retry | | |
| [ ] Link para suporte | | |

### Webhook de Pagamento

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Webhook processa pagamento | | |
| [ ] Plano ativado automaticamente | | |
| [ ] Logs do webhook (admin) | | |

---

## 🔟 Fluxo Admin

### Painel Admin (/admin)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Acesso restrito a admins | | |
| [ ] Usuário comum não acessa | | |
| [ ] Dashboard admin carrega | | |
| [ ] Métricas gerais do sistema | | |

### Gestão de Templates

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lista de templates exibe | | |
| [ ] Criar template funciona | | |
| [ ] Editar template funciona | | |
| [ ] Ativar/desativar template | | |
| [ ] Marcar como premium | | |
| [ ] Ordenar templates | | |

### Configuração de Planos

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lista de planos exibe | | |
| [ ] Editar limites do plano | | |
| [ ] Editar preço do plano | | |
| [ ] Editar URL de checkout | | |
| [ ] Features do plano editáveis | | |

### Configuração Kiwify

| Item | Status | Observações |
|------|--------|-------------|
| [ ] API Key configurável | | |
| [ ] Secret do webhook | | |
| [ ] URL do webhook gerada | | |
| [ ] Teste de conexão | | |

### Configuração Bunny CDN

| Item | Status | Observações |
|------|--------|-------------|
| [ ] API Key configurável | | |
| [ ] Library ID configurável | | |
| [ ] CDN hostname configurável | | |
| [ ] Teste de upload | | |

### Prompts de IA

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Prompts editáveis | | |
| [ ] Prompt de geração de quiz | | |
| [ ] Modelo selecionável | | |
| [ ] Teste de geração | | |

### Audit Logs

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Logs de ações exibem | | |
| [ ] Filtro por usuário | | |
| [ ] Filtro por ação | | |
| [ ] Filtro por data | | |
| [ ] Detalhes do log | | |

### Support Tickets

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lista de tickets exibe | | |
| [ ] Filtro por status | | |
| [ ] Responder ticket funciona | | |
| [ ] Fechar ticket funciona | | |
| [ ] Atribuir ticket funciona | | |

### System Health

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Dashboard de saúde carrega | | |
| [ ] Status do banco de dados | | |
| [ ] Status das edge functions | | |
| [ ] Status do storage | | |
| [ ] Métricas de performance | | |

---

## ⚙️ Configurações

### Página de Configurações (/settings)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Página carrega corretamente | | |
| [ ] Tabs organizadas | | |

### Perfil

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Nome editável | | |
| [ ] Email exibe (não editável) | | |
| [ ] WhatsApp editável | | |
| [ ] Company slug editável | | |
| [ ] Salvar alterações funciona | | |

### Tracking Global

| Item | Status | Observações |
|------|--------|-------------|
| [ ] GTM Container ID configurável | | |
| [ ] Facebook Pixel ID configurável | | |
| [ ] Salvar funciona | | |

### Notificações

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Toggle de notificações por email | | |
| [ ] Toggle de notificações in-app | | |
| [ ] Preferências salvas | | |

### Plano e Limites

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Plano atual exibe | | |
| [ ] Limites de uso exibem | | |
| [ ] Progresso de quizzes | | |
| [ ] Progresso de respostas | | |
| [ ] Botão de upgrade | | |

### Conta

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Alterar senha funciona | | |
| [ ] Exportar dados (LGPD) | | |
| [ ] Deletar conta funciona | | |
| [ ] Confirmação de deleção | | |

---

## 📱 Responsividade

### Mobile (< 640px)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Landing page responsiva | | |
| [ ] Hero section adaptada | | |
| [ ] Menu hamburger funciona | | |
| [ ] Pricing cards empilham | | |
| [ ] Login/cadastro responsivo | | |
| [ ] Dashboard responsivo | | |
| [ ] Sidebar colapsável | | |
| [ ] Cards de estatísticas empilham | | |
| [ ] Editor de quiz usável | | |
| [ ] Stepper adaptado | | |
| [ ] Lista de perguntas scrollável | | |
| [ ] Blocos empilham | | |
| [ ] CRM com scroll horizontal | | |
| [ ] Kanban scrollável | | |
| [ ] Quiz público responsivo | | |
| [ ] Botões touch-friendly | | |

### Tablet (640px - 1024px)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Layouts adaptam corretamente | | |
| [ ] Grid de 2 colunas onde apropriado | | |
| [ ] Sidebar pode ser toggled | | |
| [ ] Cards não quebram | | |
| [ ] Formulários usáveis | | |
| [ ] Modals adaptados | | |

### Desktop (> 1024px)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Layouts maximizados | | |
| [ ] Sidebar fixa | | |
| [ ] Grid de múltiplas colunas | | |
| [ ] Hover states funcionam | | |
| [ ] Tooltips exibem | | |
| [ ] Atalhos de teclado | | |

---

## ⚡ Performance

### Core Web Vitals

| Item | Target | Status | Observações |
|------|--------|--------|-------------|
| [ ] LCP (Largest Contentful Paint) | < 2.5s | | |
| [ ] FID (First Input Delay) | < 100ms | | |
| [ ] CLS (Cumulative Layout Shift) | < 0.1 | | |

### PageSpeed Insights

| Item | Target | Status | Observações |
|------|--------|--------|-------------|
| [ ] Score Mobile | > 90 | | |
| [ ] Score Desktop | > 95 | | |

### Otimizações

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Lazy loading de imagens funciona | | |
| [ ] Code splitting por rota | | |
| [ ] Bundles otimizados | | |
| [ ] Fonts otimizadas | | |
| [ ] Cache de assets | | |
| [ ] Compressão gzip/brotli | | |

---

## 🔒 Segurança

### Autenticação

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Login protege rotas autenticadas | | |
| [ ] Redirect para login se não autenticado | | |
| [ ] Token expira corretamente | | |
| [ ] Refresh token funciona | | |
| [ ] Logout limpa sessão | | |

### Autorização

| Item | Status | Observações |
|------|--------|-------------|
| [ ] RLS funciona (usuário só vê seus dados) | | |
| [ ] Admin só acessível por admins | | |
| [ ] Usuário não acessa dados de outros | | |
| [ ] Quiz privado não acessível | | |

### Proteções

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Rate limiting funciona | | |
| [ ] Muitas tentativas de login bloqueiam | | |
| [ ] Sanitização de inputs | | |
| [ ] XSS prevenido | | |
| [ ] SQL injection prevenido | | |
| [ ] CSP headers configurados | | |

---

## 🌐 Internacionalização

### Idiomas

| Idioma | Status | Cobertura | Observações |
|--------|--------|-----------|-------------|
| [ ] Português (PT-BR) | Principal | 100% | - |
| [ ] Inglês (EN) | ✅ Completo | 100% | Landing + Quiz + Common |
| [ ] Espanhol (ES) | ✅ Completo | 100% | Landing + Quiz + Common |

### Troca de Idioma

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Seletor de idioma visível | | |
| [ ] Trocar para Português funciona | | |
| [ ] Trocar para English funciona | | |
| [ ] Trocar para Español funciona | | |
| [ ] Idioma persiste ao recarregar | | |

### Landing Page (PT/EN/ES)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Hero section traduzida | | |
| [ ] Bullets traduzidos (5) | | |
| [ ] Badge traduzido | | |
| [ ] Subheadline traduzido | | |
| [ ] CTAs traduzidos | | |
| [ ] Personas traduzidas | | |
| [ ] Problema/Solução traduzido | | |
| [ ] Pilares traduzidos | | |
| [ ] Use Cases traduzidos | | |
| [ ] FAQ traduzido | | |
| [ ] Preços traduzidos | | |

### Demo do Mockup (LandingQuizDemo)

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Tela intro traduzida | | |
| [ ] Título do demo traduzido | | |
| [ ] Perguntas do demo traduzidas | | |
| [ ] Opções traduzidas (vendas, leads, etc) | | |
| [ ] Loading traduzido | | |
| [ ] Resultado traduzido | | |
| [ ] Botões (Começar, Próximo, etc) | | |

### Block Indicators

| Item | Status | Observações |
|------|--------|-------------|
| [ ] "Blocos usados:" traduzido | | |
| [ ] Nomes dos blocos traduzidos | | |
| [ ] Texto, Título, Pergunta, etc | | |
| [ ] Escolha Única, Múltipla Escolha | | |
| [ ] Barra de Progresso | | |

### Traduções Gerais

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Login/cadastro traduzido | | |
| [ ] Dashboard traduzido | | |
| [ ] Editor traduzido | | |
| [ ] CRM traduzido | | |
| [ ] Analytics traduzido | | |
| [ ] Configurações traduzidas | | |
| [ ] Erros traduzidos | | |
| [ ] Toasts traduzidos | | |

### Teste de Idioma

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Acessar `/?lng=pt` | | |
| [ ] Acessar `/?lng=en` | | |
| [ ] Acessar `/?lng=es` | | |
| [ ] Trocar idioma via seletor | | |
| [ ] Persistência do idioma | | |

### Formatação

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Datas formatadas por locale | | |
| [ ] Números formatados por locale | | |
| [ ] Moeda formatada corretamente | | |

---

## 📧 Sistema de Email (17)

### Templates de Email

| Item | Status | Observações |
|------|--------|-------------|
| [ ] 12 templates estáticos existem | | |
| [ ] 5 templates dinâmicos (IA) existem | | |
| [ ] Editor de templates abre corretamente | | |
| [ ] Campo subject_b (A/B testing) funciona | | |
| [ ] 13 categorias no dropdown | | |
| [ ] Preview de template funciona | | |
| [ ] Salvar template funciona | | |

### Automações de Email

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Dashboard de automações carrega | | |
| [ ] Toggle ativar/desativar automação | | |
| [ ] Botão "Teste" envia email | | |
| [ ] Blog Digest gera conteúdo correto | | |
| [ ] Dica da Semana gera conteúdo IA | | |
| [ ] Case de Sucesso gera conteúdo IA | | |
| [ ] Novidades da Plataforma funciona | | |
| [ ] Resumo Mensal personalizado funciona | | |

### CTA dos Emails

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Botão CTA renderiza corretamente no Gmail | | |
| [ ] Botão CTA renderiza corretamente no Outlook | | |
| [ ] Botão CTA renderiza no Apple Mail | | |
| [ ] Link do CTA redireciona corretamente | | |

### Unsubscribe & Compliance

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Link de unsubscribe aparece no footer | | |
| [ ] Clicar em unsubscribe mostra página de confirmação | | |
| [ ] Email é registrado em email_unsubscribes | | |
| [ ] Emails futuros não são enviados para unsubscribed | | |
| [ ] Header List-Unsubscribe presente | | |

### E-goi Bulk API

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Envio em lotes de 100 funciona | | |
| [ ] HTML personalizado por destinatário | | |
| [ ] Webhook de open tracking funciona | | |
| [ ] Webhook de click tracking funciona | | |
| [ ] Webhook de bounce atualiza status | | |

### Dashboard de Performance

| Item | Status | Observações |
|------|--------|-------------|
| [ ] Dashboard por categoria carrega | | |
| [ ] Métricas de open rate exibem | | |
| [ ] Métricas de click rate exibem | | |
| [ ] Logs de automação exibem | | |

---

## 🚀 ESTRATÉGIAS DE CAPTAÇÃO DE CLIENTES

### 💰 Estratégias COM Custo

| Estratégia | Custo Estimado | ROI Esperado | Prioridade |
|------------|----------------|--------------|------------|
| Google Ads (Search) | R$ 500-2000/mês | Alto | 🔴 Alta |
| Facebook/Instagram Ads | R$ 500-1500/mês | Médio-Alto | 🔴 Alta |
| Influencer Marketing | R$ 1000-5000/campanha | Médio | 🟡 Média |
| Afiliados (Kiwify) | 20-30% comissão | Alto | 🔴 Alta |
| Google Display | R$ 300-800/mês | Baixo-Médio | 🟢 Baixa |
| LinkedIn Ads | R$ 1000-3000/mês | Alto (B2B) | 🟡 Média |

---

### 📝 Copys para Anúncios Pagos

#### Facebook/Instagram - Gestor de Tráfego

```
🎯 Seu tráfego não converte?

Talvez o problema seja o funil, não o anúncio.

MasterQuizz transforma visitantes em leads qualificados com quizzes interativos.

✅ Editor visual (sem código)
✅ Geração com IA em minutos
✅ CRM integrado
✅ Analytics em tempo real

Comece GRÁTIS hoje 👇
[CTA: Criar Meu Primeiro Quiz]
```

#### Facebook/Instagram - Infoprodutor

```
🚀 Lançamento sem leads qualificados = dinheiro jogado fora

Antes de abrir o carrinho, descubra QUEM realmente vai comprar.

Com MasterQuizz você cria um quiz de qualificação em minutos:

→ Segmente por interesse
→ Identifique nível de consciência
→ Priorize os leads mais quentes

Seu próximo lançamento agradece 🙏

[CTA: Testar Grátis]
```

#### Google Ads - Busca

```
Título: Qualifique Leads com Quiz Interativo | MasterQuizz
Descrição: Saiba quem vai comprar ANTES de abrir o carrinho. 
Crie quizzes em minutos com IA. Comece grátis!

---

Título: Quiz de Qualificação de Leads | Grátis
Descrição: Reduza seu CAC em até 40%. Leads qualificados 
direto pro seu CRM. Editor visual sem código.

---

Título: Ferramenta de Quiz Marketing | MasterQuizz
Descrição: +10.000 leads qualificados/mês. Integra com 
Zapier, HubSpot, RD Station. Plano grátis disponível.
```

#### LinkedIn - B2B/Agência

```
📊 O custo de um lead não qualificado:

• Tempo do vendedor: R$ 50/hora
• Ligação + follow-up: 30 minutos
• Conversão: 2%

Custo por venda: R$ 1.250 só em tempo comercial.

A solução? Qualificar ANTES de passar para vendas.

Com um quiz de 2 minutos, você descobre:
→ Nível de interesse real
→ Budget disponível
→ Momento de compra
→ Fit com seu ICP

Resultado: -40% em CAC, +60% em conversão.

Teste grátis: [link]

#marketing #vendas #qualificacao #leads #b2b
```

---

### 🆓 Estratégias SEM Custo

| Estratégia | Esforço | Impacto | Prioridade |
|------------|---------|---------|------------|
| SEO/Blog | Alto | Alto (longo prazo) | 🔴 Alta |
| LinkedIn Orgânico | Médio | Médio-Alto | 🔴 Alta |
| YouTube Tutoriais | Alto | Alto | 🟡 Média |
| Comunidades (Facebook/Telegram) | Médio | Médio | 🟡 Média |
| Product Hunt Launch | Médio | Alto (pico) | 🟡 Média |
| Parcerias com Influencers | Médio | Alto | 🔴 Alta |
| Email Marketing (lista própria) | Baixo | Alto | 🔴 Alta |
| Twitter/X threads | Baixo | Médio | 🟢 Baixa |
| Reddit/Quora | Baixo | Baixo-Médio | 🟢 Baixa |

---

### 📰 Tópicos de Conteúdo SEO

**Palavras-chave de cauda longa (baixa concorrência):**

1. "como qualificar leads antes de vender"
2. "quiz para infoprodutores guia completo"
3. "reduzir CAC com quiz de qualificação"
4. "funil de vendas com quiz como funciona"
5. "quiz vs formulário qual converte mais"
6. "como usar quiz em lançamentos digitais"
7. "automação de leads com quiz zapier"
8. "quiz interativo para captura de leads"
9. "ferramenta de quiz marketing grátis"
10. "criar quiz de qualificação sem código"

**Estrutura de artigo sugerida:**

```
1. Hook (problema do leitor)
2. Agitação (consequências de não resolver)
3. Solução (quiz de qualificação)
4. Como funciona (passo a passo)
5. Caso de uso real
6. CTA para testar grátis
```

---

### 📱 Copy para LinkedIn Orgânico

#### Post 1 - Estatística Impactante

```
🎯 68% dos leads de anúncios não estão prontos para comprar.

Você está desperdiçando dinheiro falando com quem não vai converter.

A solução? Qualificação automática com quiz.

O que muda:
→ Lead responde quiz em 2 minutos
→ Você sabe o nível de interesse ANTES de ligar
→ CRM segmenta automaticamente
→ Você foca em quem VAI comprar

Resultado: CAC menor, conversão maior, menos tempo perdido.

Quem já usa quiz no funil?

#marketing #vendas #qualificacao #leads
```

#### Post 2 - Storytelling

```
🚨 Perdi R$ 12.000 em um lançamento por um erro básico.

O erro: Não qualifiquei minha lista antes de abrir o carrinho.

Resultado:
• 5.000 leads no lançamento
• 47 vendas
• Conversão de 0,9%
• CAC de R$ 85

O que mudou no lançamento seguinte:

Adicionei um quiz de qualificação 7 dias antes da abertura.

Perguntas simples:
1. Qual seu maior desafio com X?
2. Quanto você está disposto a investir?
3. Quando pretende resolver isso?

Resultado:
• Mesmos 5.000 leads
• Quiz qualificou 1.800 como "prontos"
• Foquei energia nesses
• 312 vendas
• Conversão de 6,2%
• CAC de R$ 16

O quiz me economizou R$ 50.000 em remarketing.

Qualificação antes > Remarketing depois.

#infoproduto #lancamento #marketing
```

#### Post 3 - Carrossel (Slides)

```
SLIDE 1: "5 perguntas que revelam se um lead vai comprar"

SLIDE 2: Pergunta 1
"Qual seu maior desafio com [tema]?"
→ Revela: Nível de consciência do problema

SLIDE 3: Pergunta 2
"Há quanto tempo tenta resolver isso?"
→ Revela: Urgência

SLIDE 4: Pergunta 3
"Já tentou outras soluções?"
→ Revela: Experiência e objeções

SLIDE 5: Pergunta 4
"Quanto está disposto a investir?"
→ Revela: Budget real

SLIDE 6: Pergunta 5
"Quando pretende resolver isso?"
→ Revela: Timing de compra

SLIDE 7: "Essas 5 perguntas em um quiz de 2 minutos
eliminam 60% dos leads que nunca iriam comprar.

Ferramenta que uso: MasterQuizz
(link nos comentários)"
```

---

### 📧 Sequência de Email Marketing (5 emails)

#### Email 1 - Boas-Vindas (Imediato)

```
Assunto: 🎉 Bem-vindo ao MasterQuizz!

Olá [NOME],

Seu primeiro passo para converter mais leads foi dado!

Aqui está seu acesso:
→ Dashboard: [LINK]
→ Criar primeiro quiz: [LINK]

Nos próximos dias, vou te enviar dicas para criar quizzes 
que realmente convertem.

Dica #1: Seu primeiro quiz deve ter no máximo 5 perguntas.
Menos é mais quando o objetivo é qualificar.

Qualquer dúvida, responda este email!

[ASSINATURA]
```

#### Email 2 - Educativo (Dia 2)

```
Assunto: 📊 3 erros que matam a conversão do seu quiz

Olá [NOME],

Ontem você criou sua conta no MasterQuizz. Já fez seu primeiro quiz?

Se não, sem problemas. Antes de criar, evite esses 3 erros:

❌ ERRO 1: Quiz muito longo
→ Máximo 7 perguntas. Após isso, abandono dispara.

❌ ERRO 2: Perguntas genéricas
→ "Você gosta de X?" não qualifica ninguém.
→ Prefira: "Quanto você investe em X por mês?"

❌ ERRO 3: Resultado sem CTA claro
→ O resultado é sua chance de vender.
→ Inclua um botão de ação específico.

👉 Quer um template pronto que já aplica essas regras?
[LINK: Ver Templates]

[ASSINATURA]
```

#### Email 3 - Tutorial (Dia 4)

```
Assunto: 🤖 Já criou seu quiz com IA?

Olá [NOME],

Sabia que você pode criar um quiz completo em 2 minutos?

Nossa IA cria perguntas, opções e resultados baseados no seu nicho.

Como usar:
1. Acesse "Criar Quiz"
2. Clique em "Criar com IA"
3. Descreva seu produto/serviço
4. Pronto! Quiz gerado.

É só revisar e publicar.

👉 [LINK: Criar Quiz com IA]

PS: Você tem [X] gerações de IA disponíveis no seu plano.

[ASSINATURA]
```

#### Email 4 - Prova Social (Dia 7)

```
Assunto: 💰 Como [CLIENTE] dobrou leads com quiz

Olá [NOME],

Queria compartilhar um caso real.

[NOME DO CLIENTE], gestor de tráfego, tinha um problema:
- Gastava R$ 5.000/mês em ads
- Gerava 500 leads
- Só 15 compravam (3%)

O que ele fez:
Adicionou um quiz de qualificação na landing page.

Resultado após 30 dias:
- Mesmo gasto de R$ 5.000
- 400 leads (menos, porém mais qualificados)
- 52 compraram (13%)

O quiz filtrou os curiosos e priorizou os compradores.

Quer fazer o mesmo?

👉 [LINK: Criar Meu Quiz]

[ASSINATURA]
```

#### Email 5 - Oferta (Dia 10)

```
Assunto: ⚡ Hora de fazer upgrade?

Olá [NOME],

Você está no MasterQuizz há 10 dias.

Se já testou a plataforma, provavelmente percebeu que:
✅ É fácil criar quizzes
✅ Os leads são mais qualificados
✅ O CRM ajuda a priorizar

Mas no plano Free, você está limitado a:
- 3 quizzes
- 100 respostas/mês
- 5 gerações de IA

No plano Pro (R$ 97/mês), você tem:
- 20 quizzes
- 2.000 respostas/mês
- 50 gerações de IA
- Analytics avançados
- Integrações ilimitadas

E como você é um early adopter, tenho um código especial:

🎁 Use PRIMEIROLAB20 para 20% OFF no primeiro mês.

👉 [LINK: Fazer Upgrade]

Válido até [DATA].

[ASSINATURA]
```

---

### 🤝 Parcerias Estratégicas

| Tipo | Exemplos | Abordagem | Benefício |
|------|----------|-----------|-----------|
| **Gestores de Tráfego** | Comunidades de tráfego | Oferecer plano Partner gratuito | Indicações recorrentes |
| **Agências** | Agências de marketing digital | White-label / Comissão | Receita recorrente |
| **Infoprodutores** | Hotmart, Kiwify creators | Afiliação mútua | Cross-promotion |
| **Ferramentas** | Zapier, HubSpot, RD Station | Integração destacada | Tráfego qualificado |
| **Influencers** | Marketing no YouTube/Instagram | Permuta ou comissão | Awareness |
| **Cursos** | Cursos de marketing digital | Desconto para alunos | Leads qualificados |

---

### 📅 Calendário de Lançamento Sugerido

| Semana | Ação | Canal | Custo |
|--------|------|-------|-------|
| 1 | Soft launch para lista de espera | Email | R$ 0 |
| 1 | Convite para beta testers | WhatsApp | R$ 0 |
| 2 | Posts orgânicos LinkedIn/Instagram | Social | R$ 0 |
| 2 | Threads no Twitter/X | Social | R$ 0 |
| 3 | Product Hunt launch | PH | R$ 0 |
| 3 | Primeiro artigo SEO | Blog | R$ 0 |
| 4 | Iniciar Google Ads (Search) | Pago | R$ 500 |
| 4 | Iniciar Facebook Ads | Pago | R$ 500 |
| 5 | Influencer partnership #1 | Social | R$ 1.000 |
| 5 | Guest post em blog parceiro | SEO | R$ 0 |
| 6 | Blog SEO (3 artigos) | Orgânico | R$ 0 |
| 6 | Webinar de lançamento | Email/Social | R$ 0 |
| 7 | Remarketing agressivo | Pago | R$ 800 |
| 7 | Case studies publicados | Blog/Social | R$ 0 |
| 8 | Programa de afiliados ativo | Kiwify | % vendas |
| 8 | Avaliação e otimização | - | - |

---

### 📊 Métricas de Acompanhamento

| Métrica | Meta Semana 1-4 | Meta Mês 2 | Meta Mês 3 |
|---------|-----------------|------------|------------|
| Cadastros | 200 | 500 | 1.000 |
| Quizzes Criados | 50 | 150 | 400 |
| Quizzes Publicados | 30 | 100 | 300 |
| Respostas Coletadas | 500 | 2.000 | 8.000 |
| Conversão Free→Paid | 5% | 8% | 10% |
| MRR | R$ 2.000 | R$ 8.000 | R$ 20.000 |
| CAC | R$ 50 | R$ 40 | R$ 30 |
| NPS | 50+ | 60+ | 70+ |

---

## ✅ Conclusão

Este checklist cobre **100% dos fluxos críticos** do MasterQuizz.

**Prioridade de validação:**

1. 🔴 **Crítico**: Fluxos 1-5 (público, auth, criação, publicação, leads)
2. 🟠 **Importante**: Fluxos 6-9 (CRM, analytics, integrações, pagamentos)
3. 🟡 **Desejável**: Fluxos 10-15 (admin, responsividade, segurança)

Após completar o checklist, o produto está pronto para **soft launch**.

---

**Última atualização:** 04/02/2025  
**Versão do checklist:** 2.0

---

## 📚 Links Relacionados

- [README.md](README.md) - Visão geral do projeto
- [PRD.md](PRD.md) - Requisitos do produto
- [ROADMAP.md](ROADMAP.md) - Planejamento de releases
- [PENDENCIAS.md](PENDENCIAS.md) - Histórico de versões
- [STYLE_GUIDE.md](STYLE_GUIDE.md) - Padrões de código
