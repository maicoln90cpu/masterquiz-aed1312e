import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://masterquiz.lovable.app';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'sitemap';

  // Fetch published posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, updated_at, published_at, featured_image_url, categories, author_name')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (format === 'rss') {
    return buildRSS(posts || []);
  }

  return buildSitemap(posts || []);
});

function buildSitemap(posts: any[]): Response {
  const now = new Date().toISOString();

  const staticPages = [
    { loc: '', priority: '1.0', changefreq: 'weekly' },
    { loc: '/blog', priority: '0.9', changefreq: 'daily' },
    { loc: '/compare', priority: '0.9', changefreq: 'monthly' },
    { loc: '/precos', priority: '0.8', changefreq: 'monthly' },
    { loc: '/faq', priority: '0.7', changefreq: 'monthly' },
  ];

  const staticEntries = staticPages.map(p => `
  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const postEntries = posts.map(post => {
    const imageTag = post.featured_image_url
      ? `
    <image:image>
      <image:loc>${escapeXml(post.featured_image_url)}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>`
      : '';

    return `
  <url>
    <loc>${BASE_URL}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${post.updated_at || post.published_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${imageTag}
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticEntries}
${postEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders,
    },
  });
}

function buildRSS(posts: any[]): Response {
  const now = new Date().toUTCString();

  const items = posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${escapeXml(post.slug)}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${escapeXml(post.slug)}</guid>
      <description>${escapeXml(post.excerpt || '')}</description>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <author>${escapeXml(post.author_name || 'MasterQuiz')}</author>
      ${(post.categories || []).map((c: string) => `<category>${escapeXml(c)}</category>`).join('\n      ')}
      ${post.featured_image_url ? `<enclosure url="${escapeXml(post.featured_image_url)}" type="image/webp" />` : ''}
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MasterQuiz Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>Artigos sobre quizzes interativos, marketing digital e funis de vendas</description>
    <language>pt-BR</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${BASE_URL}/functions/v1/blog-sitemap?format=rss" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/og-image.png</url>
      <title>MasterQuiz Blog</title>
      <link>${BASE_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders,
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
