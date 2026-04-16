-- Adicionar coluna para número de encaminhamento
ALTER TABLE public.recovery_settings
ADD COLUMN IF NOT EXISTS forward_to_phone TEXT DEFAULT NULL;