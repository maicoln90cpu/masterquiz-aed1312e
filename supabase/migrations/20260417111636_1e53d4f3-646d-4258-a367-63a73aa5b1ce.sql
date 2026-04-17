UPDATE public.profiles
SET 
  company_slug = public.generate_company_slug(email, id),
  updated_at = now()
WHERE (company_slug IS NULL OR company_slug = '')
  AND email IS NOT NULL
  AND email != '';