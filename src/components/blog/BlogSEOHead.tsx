import { useEffect } from 'react';

interface BlogSEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl: string;
  type?: 'article' | 'blog';
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  faqSchema?: Array<{ question: string; answer: string }>;
}

export const BlogSEOHead = ({
  title,
  description,
  keywords = [],
  ogImage,
  canonicalUrl,
  type = 'blog',
  publishedAt,
  updatedAt,
  authorName = 'MasterQuiz',
  faqSchema = [],
}: BlogSEOHeadProps) => {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta tags
    const metaTags: Record<string, string> = {
      description,
      keywords: keywords.join(', '),
      'og:title': title,
      'og:description': description,
      'og:type': type === 'article' ? 'article' : 'website',
      'og:url': canonicalUrl,
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      robots: 'index, follow',
    };

    if (ogImage) {
      metaTags['og:image'] = ogImage;
      metaTags['twitter:image'] = ogImage;
    }

    if (publishedAt) {
      metaTags['article:published_time'] = publishedAt;
    }
    if (updatedAt) {
      metaTags['article:modified_time'] = updatedAt;
    }
    if (authorName) {
      metaTags['article:author'] = authorName;
    }

    // Set meta tags
    Object.entries(metaTags).forEach(([key, value]) => {
      if (!value) return;
      const isOg = key.startsWith('og:');
      const isTwitter = key.startsWith('twitter:');
      const isArticle = key.startsWith('article:');
      
      let selector: string;
      if (isOg || isArticle) {
        selector = `meta[property="${key}"]`;
      } else if (isTwitter) {
        selector = `meta[name="${key}"]`;
      } else {
        selector = `meta[name="${key}"]`;
      }

      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        if (isOg || isArticle) {
          el.setAttribute('property', key);
        } else {
          el.setAttribute('name', key);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    });

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // RSS Feed link
    let rssLink = document.querySelector('link[type="application/rss+xml"]') as HTMLLinkElement;
    if (!rssLink) {
      rssLink = document.createElement('link');
      rssLink.setAttribute('rel', 'alternate');
      rssLink.setAttribute('type', 'application/rss+xml');
      rssLink.setAttribute('title', 'Blog MasterQuiz RSS Feed');
      rssLink.setAttribute('href', 'https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/blog-sitemap?format=rss');
      document.head.appendChild(rssLink);
    }

    // hreflang for pt-BR
    let hreflang = document.querySelector('link[hreflang="pt-BR"]') as HTMLLinkElement;
    if (!hreflang) {
      hreflang = document.createElement('link');
      hreflang.setAttribute('rel', 'alternate');
      hreflang.setAttribute('hreflang', 'pt-BR');
      hreflang.setAttribute('href', canonicalUrl);
      document.head.appendChild(hreflang);
    } else {
      hreflang.setAttribute('href', canonicalUrl);
    }

    // x-default hreflang
    let xdefault = document.querySelector('link[hreflang="x-default"]') as HTMLLinkElement;
    if (!xdefault) {
      xdefault = document.createElement('link');
      xdefault.setAttribute('rel', 'alternate');
      xdefault.setAttribute('hreflang', 'x-default');
      xdefault.setAttribute('href', canonicalUrl);
      document.head.appendChild(xdefault);
    } else {
      xdefault.setAttribute('href', canonicalUrl);
    }

    // JSON-LD Schema
    const existingSchemas = document.querySelectorAll('script[data-blog-schema]');
    existingSchemas.forEach(el => el.remove());

    if (type === 'article') {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image: ogImage,
        author: { '@type': 'Organization', name: authorName },
        publisher: {
          '@type': 'Organization',
          name: 'MasterQuiz',
          logo: { '@type': 'ImageObject', url: `${window.location.origin}/favicon.ico` },
        },
        datePublished: publishedAt,
        dateModified: updatedAt || publishedAt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      };
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-blog-schema', 'article');
      script.textContent = JSON.stringify(articleSchema);
      document.head.appendChild(script);
    }

    // Breadcrumb schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${window.location.origin}/blog` },
        ...(type === 'article'
          ? [{ '@type': 'ListItem', position: 3, name: title, item: canonicalUrl }]
          : []),
      ],
    };
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.setAttribute('data-blog-schema', 'breadcrumb');
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(breadcrumbScript);

    // FAQ Schema
    if (faqSchema.length > 0) {
      const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqSchema.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      };
      const faqScript = document.createElement('script');
      faqScript.type = 'application/ld+json';
      faqScript.setAttribute('data-blog-schema', 'faq');
      faqScript.textContent = JSON.stringify(faqJsonLd);
      document.head.appendChild(faqScript);
    }

    return () => {
      document.querySelectorAll('script[data-blog-schema]').forEach(el => el.remove());
    };
  }, [title, description, keywords, ogImage, canonicalUrl, type, publishedAt, updatedAt, authorName, faqSchema]);

  return null;
};
