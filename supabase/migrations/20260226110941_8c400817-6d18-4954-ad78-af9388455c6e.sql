
-- 1. Create dedicated function for express slug (numeric random)
CREATE OR REPLACE FUNCTION public.generate_express_slug()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_slug TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate random 8-digit numeric slug with 'exp-' prefix
    new_slug := 'exp-' || lpad(floor(random() * 100000000)::text, 8, '0');
    
    -- Check uniqueness
    EXIT WHEN NOT EXISTS (SELECT 1 FROM quizzes WHERE slug = new_slug);
    
    attempts := attempts + 1;
    IF attempts > 20 THEN
      -- Ultimate fallback: add md5 fragment
      new_slug := 'exp-' || substring(md5(random()::text || clock_timestamp()::text), 1, 12);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_slug;
END;
$function$;

-- 2. Update set_quiz_slug to use express slug for express_auto quizzes
CREATE OR REPLACE FUNCTION public.set_quiz_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    IF COALESCE(NEW.creation_source, 'manual') = 'express_auto' THEN
      NEW.slug := public.generate_express_slug();
    ELSE
      NEW.slug := public.generate_slug(NEW.title);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Ensure trigger fires on INSERT + UPDATE
DROP TRIGGER IF EXISTS set_quiz_slug_trigger ON quizzes;
CREATE TRIGGER set_quiz_slug_trigger
  BEFORE INSERT OR UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION set_quiz_slug();

-- 4. Backfill express_auto quizzes with NULL or empty slug
UPDATE quizzes 
SET slug = public.generate_express_slug() 
WHERE creation_source = 'express_auto' 
  AND (slug IS NULL OR slug = '');

-- 5. Backfill remaining quizzes with NULL slug (manual ones)
UPDATE quizzes 
SET slug = public.generate_slug(title) 
WHERE slug IS NULL OR slug = '';
