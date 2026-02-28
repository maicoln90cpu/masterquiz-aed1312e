-- Atomic increment function for blog post views
CREATE OR REPLACE FUNCTION public.increment_blog_views(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE blog_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE slug = p_slug
    AND status = 'published';
END;
$$;