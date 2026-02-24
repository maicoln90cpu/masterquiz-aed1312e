
# Plano: Dados do usuario nos tickets + Badge de tickets abertos + Analise de telefones

## Parte 1: Mostrar dados do usuario que abriu o ticket

### Problema
Atualmente o `SupportTicketsManager` faz `select('*')` na tabela `support_tickets` mas nao busca dados do perfil do usuario (nome, email, WhatsApp).

### Solucao
- Na funcao `loadTickets`, apos buscar os tickets, fazer uma query paralela na tabela `profiles` com os `user_id` dos tickets para obter `full_name`, `email` e `whatsapp`
- Atualizar a interface `Ticket` para incluir os dados do usuario
- Exibir nome, email e telefone do usuario no header do ticket selecionado (abaixo do titulo, ao lado de Categoria/Prioridade)
- Tambem mostrar o nome do usuario na lista de tickets (coluna esquerda)

### Detalhes tecnicos
**Arquivo: `src/components/admin/SupportTicketsManager.tsx`**
- Apos `loadTickets`, buscar `profiles` com `.in('id', userIds)` e fazer join em memoria
- Exibir na area do ticket selecionado: Nome, Email, WhatsApp com icones (User, Mail, Phone)
- Na lista lateral, mostrar o nome do usuario abaixo do titulo do ticket

## Parte 2: Badge vermelho na aba "Sistema" quando ha tickets abertos

### Problema
Nao ha indicacao visual de tickets pendentes na navegacao.

### Solucao
- Criar um state/query no `AdminDashboard` que conta tickets com status `open`
- Adicionar uma badge vermelha (circulo com numero) na aba "Sistema" do TabsTrigger
- Tambem adicionar badge na sub-aba "Suporte" dentro de Sistema
- Usar realtime subscription para atualizar automaticamente quando novos tickets chegam

### Detalhes tecnicos
**Arquivo: `src/pages/AdminDashboard.tsx`**
- Adicionar query para contar tickets abertos: `supabase.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'open')`
- Realtime channel em `support_tickets` para re-fetch quando INSERT acontece
- Renderizar badge vermelha no TabsTrigger de "Sistema" e na sub-tab "Suporte"

**Arquivo: `src/components/admin/AdminSubTabs.tsx`**
- Adicionar suporte a prop `badge` (numero) nos tabs para exibir contagem

## Parte 3: Diagnostico dos numeros com erro na fila de envio

### Causa raiz identificada

Analisei os dados do banco e o componente `PhoneInput`:

1. **Numeros faltando digito** (ex: `55981061137` com 11 digitos): O `PhoneInput` tem `maxLength: 11` para Brasil, permitindo que o usuario digite apenas 9 digitos (celular sem DDD). O componente concatena `55` + `981061137` = `55981061137`. O correto seria `55` + DDD(2) + celular(9) = 13 digitos. O campo nao valida se o numero tem o tamanho minimo esperado.

2. **Numeros com HTTP 400** (ex: `5599984801966`, `5531942110698` com 13 digitos): Estes numeros parecem corretos em formato (13 digitos). O erro `HTTP 400: Bad Request` provavelmente vem da Evolution API rejeitando numeros que nao existem no WhatsApp (o numero pode ser valido como telefone mas nao ter WhatsApp ativo).

3. **Numeros sem DDI na fila** (ex: `11999136884`): Sao numeros antigos que foram inseridos na fila antes da normalizacao. O trigger `trigger_welcome_on_whatsapp_update` passa `NEW.whatsapp` direto para `recovery_contacts.phone_number`, e a normalizacao so acontece na Edge Function `send-welcome-message`. Porem, se o envio falha antes de normalizar, o numero fica cru na tabela.

### Solucao proposta
- Adicionar validacao minima no `PhoneInput`: para Brasil, exigir exatamente 11 digitos (2 DDD + 9 celular) ou 10 digitos (fixo)
- Adicionar validacao no `handleRegister` (Login.tsx): se whatsapp preenchido, verificar que tem tamanho minimo esperado
- Normalizar o numero no trigger do banco ANTES de salvar na fila (nao depender da Edge Function)

### Detalhes tecnicos
**Arquivo: `src/components/ui/phone-input.tsx`**
- Adicionar prop `minLength` por pais (BR: 10, para aceitar fixo e celular)
- Adicionar validacao visual (borda vermelha) quando numero incompleto
- Exportar funcao `isValidPhone(country, localNumber)` para uso externo

**Arquivo: `src/pages/Login.tsx`**
- No `handleRegister`, validar que se whatsapp preenchido, `localNumber.length >= minLength` do pais selecionado

## Arquivos modificados

| Arquivo | Alteracao |
|---------|----------|
| `src/components/admin/SupportTicketsManager.tsx` | Buscar e exibir dados do usuario (nome, email, whatsapp) |
| `src/pages/AdminDashboard.tsx` | Query + realtime para contar tickets abertos, badge na aba Sistema |
| `src/components/admin/AdminSubTabs.tsx` | Suporte a prop `badge` nos tabs |
| `src/components/ui/phone-input.tsx` | Validacao de tamanho minimo por pais |
| `src/pages/Login.tsx` | Validacao de whatsapp no registro |

## Arquivos NAO tocados
- Edge Functions (normalizacao ja funciona la)
- Tabelas do banco (schema nao muda)
- Contexto de auth
