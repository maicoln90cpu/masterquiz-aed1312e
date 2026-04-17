DELETE FROM public.client_error_logs
WHERE created_at > now() - interval '24 hours'
  AND (
    error_message ILIKE '%Object Not Found Matching Id%'
    OR error_message ILIKE '%MethodName:update%'
    OR error_message ILIKE '%ResizeObserver loop%'
    OR url ILIKE '%node_modules/.vite/deps%'
    OR (url ILIKE '%?t=%' AND url ILIKE '%lovableproject.com%')
    OR (error_message ILIKE '%error loading dynamically imported module%' AND url ILIKE '%lovableproject.com%')
    OR (error_message ILIKE '%Failed to fetch dynamically imported module%' AND url ILIKE '%lovableproject.com%')
  );