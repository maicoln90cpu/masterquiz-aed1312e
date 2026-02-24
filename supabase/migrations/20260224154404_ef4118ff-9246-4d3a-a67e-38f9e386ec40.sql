
-- Normalizar telefones de Maicoln (sem DDI 55) e marcar como enviados
UPDATE recovery_contacts 
SET phone_number = '55' || phone_number,
    status = 'sent',
    sent_at = now()
WHERE phone_number = '11999136884' AND status = 'pending';

-- Normalizar telefone 55981061137 (11 dígitos, parece estar sem DDI correto)
-- Na verdade 55981061137 tem 11 dígitos = DDD(55) + 9 + 81061137 - parece número local sem DDI
UPDATE recovery_contacts 
SET phone_number = '55' || phone_number,
    status = 'sent',
    sent_at = now()
WHERE phone_number = '55981061137' AND status = 'pending';
