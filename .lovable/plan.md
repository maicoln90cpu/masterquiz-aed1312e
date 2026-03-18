
Objetivo: eliminar o erro persistente do envio de teste de email, validar com simulações reais para `maicoln90@hotmail.com` (template boas-vindas) até retornar sucesso, e corrigir também o fluxo automático da fila para não falhar pelo mesmo motivo.

Diagnóstico da auditoria (já confirmado):
1) Reproduzi o erro diretamente na Edge Function:
- Chamada: `send-test-email` com `to=maicoln90@hotmail.com` e template welcome.
- Retorno: `400 {"error":"E-goi: Required request body is missing"}`.

2) Logs da função confirmam o mesmo erro repetidamente:
- `E-goi error: Required request body is missing`.

3) Causa raiz técnica encontrada:
- O código atual envia para `.../v2/email/messages/action/send`.
- A documentação atual da E-goi v2 indica endpoints explícitos:
  - `.../action/send/single` (email único)
  - `.../action/send/bulk` (múltiplos)
- O payload atual também está fora do contrato:
  - usa `to: [email]` no teste (deveria ser string no single),
  - usa `options.trackOpens/trackClicks` (deveria ser `openTracking`/`clickTracking`),
  - não envia `senderId` (campo requerido no single).

4) O mesmo problema existe no envio automático:
- `process-email-recovery-queue` usa endpoint/payload no padrão antigo, então a fila também vai falhar quando houver contatos pendentes.

Plano de implementação (correção completa):
1) Corrigir `send-test-email` para contrato oficial E-goi v2:
- Endpoint: `POST /v2/email/messages/action/send/single`.
- Payload compatível (`senderId`, `to` string, `subject`, `htmlBody`, `openTracking`, `clickTracking`, etc.).

2) Resolver `senderId` automaticamente antes de enviar:
- Consultar `GET /v2/email/senders`.
- Tentar casar por `sender_email` configurado no admin.
- Se não encontrar, usar fallback seguro para primeiro sender válido e registrar warning detalhado.
- Se não existir sender válido, retornar erro claro para o admin (sem mensagem genérica).

3) Corrigir `process-email-recovery-queue` com o mesmo contrato:
- Mesmo mecanismo de resolução de sender.
- Envio por single por contato (mantendo a lógica atual de retries/limites).
- Atualizar parsing de resposta para capturar `messageId` corretamente.

4) Melhorar rastreabilidade de erro:
- Logar status HTTP, endpoint usado, sender resolvido e corpo de erro bruto da E-goi.
- Retornar erro amigável no frontend mantendo detalhe técnico no log.

Plano de simulação (até sucesso):
1) Deploy das funções corrigidas (`send-test-email` e `process-email-recovery-queue`).
2) Rodar simulação real do teste com:
- destinatário: `maicoln90@hotmail.com`
- template: `Boas-vindas ao MasterQuizz (welcome)`.
3) Se falhar, auditar imediatamente logs e ajustar (sender/contrato) no mesmo ciclo.
4) Repetir a simulação até retorno 2xx com `messageId`.
5) Validar também o caminho da fila (uma execução manual do processador) para garantir que o bug foi removido nos dois fluxos.

Critérios de aceite:
- Envio de teste retorna sucesso (2xx) e gera `messageId`.
- Não aparece mais `Required request body is missing`.
- Fluxo automático de fila usa o mesmo contrato corrigido e não falha pelo payload antigo.
- Admin continua podendo escolher qualquer template e visualizar o resultado na caixa de entrada.

Detalhes técnicos (seção dedicada):
- Arquivos a ajustar:
  - `supabase/functions/send-test-email/index.ts`
  - `supabase/functions/process-email-recovery-queue/index.ts`
- Mudanças de contrato E-goi:
  - `.../action/send` -> `.../action/send/single`
  - `to: [email]` -> `to: email` (single)
  - `options.trackOpens/trackClicks` -> `openTracking/clickTracking`
  - incluir `senderId` (obtido via API de senders)
- Sem alteração obrigatória de UI para resolver o bug atual (a UI já envia destinatário + template corretamente).
