

## Plano: Correções no Sistema de Recuperação (SAIR, Histórico, Campanhas)

### Diagnóstico

**1. "SAIR" não funciona automaticamente**
- **Causa principal**: A Edge Function `evolution-webhook` **não tem logs** — não está recebendo eventos da Evolution API. O webhook provavelmente não está deployed ou o URL configurado na Evolution API está incorreto.
- **Causa secundária**: O código verifica `messageText.trim().toUpperCase() === 'SAIR'` (match exato). Se o usuário escrever "Sair da lista", "quero sair", etc., **não é detectado**. Precisa usar `.includes('SAIR')` ou similar.
- Confirmado: a blacklist entry para `5511967561784` foi adicionada manualmente às 14:03 hoje (não pelo webhook).

**2. Usuário não encontrado no histórico**
- O contato `5511967561784` **existe no banco** com status `sent` e `message_sent` preenchida. O problema é provavelmente o formato de busca — o usuário pode estar buscando "11 96756-1784" ou "+55 11 96756-1784", mas o banco armazena "5511967561784". A busca client-side faz `includes()` simples sem normalizar.

**3. Detalhes da campanha não visíveis**
- O campo `target_criteria` é salvo no banco mas **nunca é renderizado** no card da campanha. Não há seção mostrando template usado, filtros de audiência, etc.

**4. Novos usuários não são adicionados automaticamente**
- O sistema **captura usuários apenas no momento do `startCampaign`** via `check-inactive-users`. Não há mecanismo para adicionar dinamicamente novos usuários que passem a atender os critérios após o início da campanha.

---

### Correções Propostas

#### 1. SAIR mais flexível + deploy do webhook
- Mudar a verificação de `=== 'SAIR'` para detectar "SAIR" em qualquer posição do texto: `messageText.trim().toUpperCase().includes('SAIR')`
- Garantir que o `evolution-webhook` está deployed (redeployar)
- Verificar na Evolution API se o webhook URL está configurado corretamente

#### 2. Busca no histórico com normalização de telefone
- Normalizar o termo de busca removendo caracteres não numéricos antes de comparar com `phone_number`
- Assim "11 96756-1784", "+55 11 96756-1784", "967561784" todos encontram "5511967561784"

#### 3. Exibir detalhes da campanha no card
- Renderizar `target_criteria` no card: template usado, filtros de plano, estágio, objetivos, dias de inatividade
- Adicionar uma seção colapsável "Regras da Campanha" no card

#### 4. Adicionar nota sobre novos usuários
- Esclarecer na UI que campanhas capturam usuários no momento da execução
- Opcionalmente: adicionar botão "Recarregar Alvos" que re-executa `check-inactive-users` para a campanha em andamento, adicionando novos usuários que passaram a atender os critérios

---

### Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/evolution-webhook/index.ts` | SAIR: `includes('SAIR')` em vez de `=== 'SAIR'` |
| `src/components/admin/recovery/RecoveryHistory.tsx` | Normalizar busca por telefone (strip non-digits) |
| `src/components/admin/recovery/RecoveryCampaigns.tsx` | Exibir `target_criteria` no card + template name; botão "Recarregar Alvos" |
| Deploy | Redeployar `evolution-webhook` |

