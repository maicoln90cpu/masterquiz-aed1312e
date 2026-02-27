import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogCard } from './BlogCard';
import { useTranslation } from 'react-i18next';

interface RelatedPostsProps {
  currentSlug: string;
  categories: string[];
}

export const RelatedPosts = ({ currentSlug, categories }: RelatedPostsProps) => {
  const { t } = useTranslation();

  const { data: posts } = useQuery({
    queryKey: ['related-posts', currentSlug, categories],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, featured_image_url, categories, reading_time_min, published_at, views_count')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .neq('slug', currentSlug)
        .order('published_at', { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t('blog.relatedPosts', 'Artigos Relacionados')}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            featuredImageUrl={post.featured_image_url}
            categories={post.categories || []}
            readingTimeMin={post.reading_time_min || 5}
            publishedAt={post.published_at!}
            viewsCount={post.views_count || 0}
          />
        ))}
      </div>
    </section>
  );
};
