-- Table for weekly tips history
CREATE TABLE IF NOT EXISTS public.email_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  subject text,
  html_content text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view email_tips" ON public.email_tips
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- Add included_in_digest column to blog_posts
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS included_in_digest boolean DEFAULT false;