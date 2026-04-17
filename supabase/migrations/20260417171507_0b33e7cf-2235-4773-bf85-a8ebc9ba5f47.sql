-- Corrigir Security Definer View
ALTER VIEW public.v_evolution_webhook_health SET (security_invoker = true);