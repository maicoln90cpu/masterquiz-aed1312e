
-- Blog Posts
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  meta_title TEXT,
  meta_description TEXT,
  seo_keywords TEXT[] DEFAULT '{}',
  featured_image_url TEXT,
  og_image_url TEXT,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_name TEXT DEFAULT 'MasterQuiz',
  reading_time_min INTEGER DEFAULT 5,
  views_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  generation_cost_usd NUMERIC DEFAULT 0,
  image_generation_cost_usd NUMERIC DEFAULT 0,
  model_used TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  internal_links JSONB DEFAULT '[]',
  faq_schema JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts (status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts (published_at DESC);
CREATE INDEX idx_blog_posts_categories ON public.blog_posts USING GIN (categories);
CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING GIN (tags);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at <= now());

CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Blog Settings
CREATE TABLE public.blog_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cron_schedule TEXT DEFAULT 'weekly',
  ai_model TEXT DEFAULT 'gpt-4o',
  image_model TEXT DEFAULT 'google/gemini-2.5-flash-image',
  auto_publish BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  default_author TEXT DEFAULT 'MasterQuiz',
  system_prompt TEXT,
  image_prompt_template TEXT,
  categories_list JSONB DEFAULT '[]'::jsonb,
  topics_pool JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage blog settings"
  ON public.blog_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

CREATE TRIGGER update_blog_settings_updated_at
  BEFORE UPDATE ON public.blog_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Blog Generation Logs
CREATE TABLE public.blog_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  model_used TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  text_cost_usd NUMERIC DEFAULT 0,
  image_cost_usd NUMERIC DEFAULT 0,
  total_cost_usd NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  generation_type TEXT DEFAULT 'article' CHECK (generation_type IN ('article', 'image', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_generation_logs_created_at ON public.blog_generation_logs (created_at DESC);
CREATE INDEX idx_blog_generation_logs_post_id ON public.blog_generation_logs (post_id);

ALTER TABLE public.blog_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view blog generation logs"
  ON public.blog_generation_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Service can insert blog generation logs"
  ON public.blog_generation_logs FOR INSERT
  WITH CHECK (true);
