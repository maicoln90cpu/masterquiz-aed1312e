import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Rss } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/ui/page-container';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSEOHead } from '@/components/blog/BlogSEOHead';
import { LandingHeader } from '@/components/landing/LandingHeader';

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, featured_image_url, categories, tags, reading_time_min, published_at, views_count')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Extract unique categories
  const allCategories = useMemo(() => {
    if (!posts) return [];
    const cats = new Set<string>();
    posts.forEach(p => (p.categories || []).forEach((c: string) => cats.add(c)));
    return Array.from(cats).sort();
  }, [posts]);

  // Filter
  const filtered = useMemo(() => {
    if (!posts) return [];
    let result = posts;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter(p => (p.categories || []).includes(selectedCategory));
    }

    return result;
  }, [posts, search, selectedCategory]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const baseUrl = window.location.origin;

  return (
    <>
      <BlogSEOHead
        title="Blog MasterQuiz - Dicas de Marketing Digital, Funis e Quizzes"
        description="Aprenda sobre marketing digital, funis de vendas, copywriting e como usar quizzes interativos para qualificar leads e aumentar suas conversões."
        keywords={['quiz', 'marketing digital', 'funil de vendas', 'leads', 'copywriting', 'quiz interativo']}
        canonicalUrl={`${baseUrl}/blog`}
        type="blog"
      />

      <LandingHeader />

      <main className="min-h-screen bg-background pt-20">
        <PageContainer maxWidth="7xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t('blog.title', 'Blog MasterQuiz')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('blog.subtitle', 'Estratégias de marketing digital, funis de vendas e como usar quizzes para converter mais leads.')}
            </p>
            <a
              href={`${baseUrl.replace('://masterquiz.lovable.app', '://kmmdzwoidakmbekqvkmq.supabase.co')}/functions/v1/blog-sitemap?format=rss`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
            >
              <Rss className="h-4 w-4" />
              RSS Feed
            </a>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('blog.searchPlaceholder', 'Buscar artigos...')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category filters */}
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge
                variant={selectedCategory === null ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => { setSelectedCategory(null); setPage(1); }}
              >
                {t('common.all', 'Todos')}
              </Badge>
              {allCategories.map(cat => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => { setSelectedCategory(cat); setPage(1); }}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                {t('blog.noPosts', 'Nenhum artigo encontrado.')}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((post) => (
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                {t('common.previous', 'Anterior')}
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {t('common.next', 'Próximo')}
              </Button>
            </div>
          )}
        </PageContainer>
      </main>
    </>
  );
};

export default Blog;
