
-- Rewrite generate_slug() with robust retry loop (matching generate_express_slug() pattern)
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  attempts INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'quiz';
  END IF;
  
  final_slug := base_slug;
  
  -- Try counter-based suffixes up to 5 times
  WHILE EXISTS (SELECT 1 FROM quizzes WHERE slug = final_slug) AND counter < 5 LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  -- If still colliding, enter random suffix loop (up to 20 attempts)
  WHILE EXISTS (SELECT 1 FROM quizzes WHERE slug = final_slug) AND attempts < 20 LOOP
    final_slug := base_slug || '-' || substring(md5(random()::text || clock_timestamp()::text), 1, 6);
    attempts := attempts + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;
