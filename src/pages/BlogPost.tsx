import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Clock, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/ui/page-container';
import { BlogSEOHead } from '@/components/blog/BlogSEOHead';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { LandingHeader } from '@/components/landing/LandingHeader';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Increment view count (fire and forget)
  useEffect(() => {
    if (!post?.id) return;
    supabase
      .from('blog_posts')
      .update({ views_count: (post.views_count || 0) + 1 })
      .eq('id', post.id)
      .then();
  }, [post?.id]);

  // Process content: add IDs to headings for TOC
  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    let content = post.content;
    let idx = 0;
    content = content.replace(/<(h[23])(.*?)>(.*?)<\/h[23]>/gi, (match, tag, attrs, text) => {
      const id = `heading-${idx++}`;
      return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
    });
    return DOMPurify.sanitize(content);
  }, [post?.content]);

  const baseUrl = window.location.origin;
  const postUrl = `${baseUrl}/blog/${slug}`;

  const faqSchema = useMemo(() => {
    if (!post?.faq_schema || !Array.isArray(post.faq_schema)) return [];
    return (post.faq_schema as Array<{ question: string; answer: string }>).filter(
      f => f.question && f.answer
    );
  }, [post?.faq_schema]);

  if (isLoading) {
    return (
      <>
        <LandingHeader />
        <main className="min-h-screen bg-background pt-20">
          <PageContainer maxWidth="md">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="aspect-video w-full rounded-xl mb-8" />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </PageContainer>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <LandingHeader />
        <main className="min-h-screen bg-background pt-20">
          <PageContainer maxWidth="md" className="text-center py-20">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('blog.notFound', 'Artigo não encontrado')}
            </h1>
            <Link to="/blog" className="text-primary hover:underline">
              {t('blog.backToBlog', 'Voltar ao Blog')}
            </Link>
          </PageContainer>
        </main>
      </>
    );
  }

  return (
    <>
      <BlogSEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || ''}
        keywords={post.seo_keywords || []}
        ogImage={post.og_image_url || post.featured_image_url || undefined}
        canonicalUrl={postUrl}
        type="article"
        publishedAt={post.published_at || undefined}
        updatedAt={post.updated_at}
        authorName={post.author_name || 'MasterQuiz'}
        faqSchema={faqSchema}
      />

      <LandingHeader />

      <main className="min-h-screen bg-background pt-20">
        <PageContainer maxWidth="md">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
          </nav>

          {/* Back */}
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('blog.backToBlog', 'Voltar ao Blog')}
          </Link>

          {/* Header */}
          <header className="mb-8">
            {/* Categories */}
            {(post.categories || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {(post.categories as string[]).map(cat => (
                  <Badge key={cat} variant="secondary">{cat}</Badge>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author_name || 'MasterQuiz'}
              </span>
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.reading_time_min || 5} min de leitura
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {post.views_count || 0} visualizações
              </span>
            </div>

            {/* Share */}
            <ShareButtons url={postUrl} title={post.title} />
          </header>

          {/* Featured Image */}
          {post.featured_image_url && (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full rounded-xl mb-8 aspect-video object-cover"
              loading="eager"
            />
          )}

          {/* Table of Contents */}
          <TableOfContents contentHtml={processedContent} />

          {/* CTA (mid) */}
          <BlogCTA />

          {/* Article Content */}
          <article
            className="prose prose-lg dark:prose-invert max-w-none mb-8
              prose-headings:text-foreground prose-headings:scroll-mt-20
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:mx-auto"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* FAQ Section */}
          {faqSchema.length > 0 && (
            <section className="mt-8 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Perguntas Frequentes</h2>
              <div className="space-y-4">
                {faqSchema.map((faq, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA (bottom) */}
          <BlogCTA />

          {/* Share */}
          <div className="flex items-center justify-between border-t pt-6 mt-8">
            <span className="text-sm text-muted-foreground font-medium">Compartilhe este artigo:</span>
            <ShareButtons url={postUrl} title={post.title} />
          </div>

          {/* Tags */}
          {(post.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {(post.tags as string[]).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
            </div>
          )}

          {/* Related Posts */}
          <RelatedPosts currentSlug={slug!} categories={post.categories || []} />
        </PageContainer>
      </main>
    </>
  );
};

export default BlogPost;
