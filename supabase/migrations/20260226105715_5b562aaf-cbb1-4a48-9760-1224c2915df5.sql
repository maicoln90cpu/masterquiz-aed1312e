
-- 1. Improve generate_slug with anti-race-condition random suffix fallback
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Fallback for empty slug
  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'quiz';
  END IF;
  
  final_slug := base_slug;
  
  -- Try counter-based suffixes up to 5 times
  WHILE EXISTS (SELECT 1 FROM quizzes WHERE slug = final_slug) AND counter < 5 LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  -- If still colliding after 5 attempts, add random suffix to guarantee uniqueness
  IF EXISTS (SELECT 1 FROM quizzes WHERE slug = final_slug) THEN
    final_slug := base_slug || '-' || substring(md5(random()::text), 1, 6);
  END IF;
  
  RETURN final_slug;
END;
$function$;

-- 2. Drop and recreate trigger to fire on INSERT + UPDATE
DROP TRIGGER IF EXISTS set_quiz_slug_trigger ON quizzes;
CREATE TRIGGER set_quiz_slug_trigger
  BEFORE INSERT OR UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION set_quiz_slug();

-- 3. Backfill all quizzes with NULL slug
UPDATE quizzes SET slug = public.generate_slug(title) WHERE slug IS NULL;
