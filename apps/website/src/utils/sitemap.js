import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Génère un sitemap.xml dynamique basé sur les données de la base
 * @returns {string} - Contenu XML du sitemap
 */
export const generateSitemap = async () => {
  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : getSiteUrl();

  const urls = [];

  try {
    // 1. Pages SEO indexables
    const { data: pagesSEO, error: pagesError } = await supabase
      .from('pages_seo')
      .select('slug')
      .eq('is_indexable', true);

    if (!pagesError && pagesSEO) {
      pagesSEO.forEach(page => {
        urls.push({
          loc: `${baseUrl}${page.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: page.slug === '/' ? '1.0' : '0.8'
        });
      });
    }

    // 2. Posts publiés
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (!postsError && posts) {
      posts.forEach(post => {
        urls.push({
          loc: `${baseUrl}/blog/${post.slug}`,
          lastmod: post.updated_at || new Date().toISOString(),
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    }

    // 3. Réalisations publiées
    const { data: realisations, error: realError } = await supabase
      .from('realisations')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (!realError && realisations) {
      realisations.forEach(real => {
        urls.push({
          loc: `${baseUrl}/realisations/${real.slug}`,
          lastmod: real.updated_at || new Date().toISOString(),
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    }

  } catch (err) {
    logger.error('[generateSitemap] Error generating sitemap:', err);
  }

  // Générer le XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
};














