/**
 * Générateur de sitemap.xml pour Effinor.
 *
 * Exécuté à chaque build (`node tools/generate-sitemap.mjs`).
 * Récupère les articles publiés depuis Airtable, combine avec les pages
 * statiques, et écrit public/sitemap.xml.
 *
 * Token Airtable :
 *   - Priorité 1 : AIRTABLE_BLOG_TOKEN (token read-only dédié — sans VITE_)
 *   - Priorité 2 : VITE_AIRTABLE_TOKEN (fallback)
 *   Le token AIRTABLE_BLOG_TOKEN n'est JAMAIS inclus dans le bundle Vite.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ─── Parse .env ──────────────────────────────────────────────────────────────

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = val;
  }
  return out;
}

const env        = parseEnvFile(path.join(ROOT, '.env'));
const SITE_URL   = (env.VITE_SITE_URL || 'https://effinor.fr').replace(/\/$/, '');
const TOKEN      = env.AIRTABLE_BLOG_TOKEN || env.VITE_AIRTABLE_TOKEN;
const BASE_ID    = env.VITE_AIRTABLE_BASE_ID;
const BLOG_TABLE = env.VITE_AIRTABLE_BLOG_TABLE || 'Articles';
const REALISATIONS_TABLE = env.VITE_AIRTABLE_REALISATIONS_TABLE || 'Realisations';

// ─── Pages statiques ─────────────────────────────────────────────────────────

const STATIC_PAGES = [
  { loc: '/',                              changefreq: 'weekly',  priority: '1.0' },
  { loc: '/pompe-a-chaleur',               changefreq: 'weekly',  priority: '0.95' },
  { loc: '/pompe-a-chaleur/residentiel',   changefreq: 'monthly', priority: '0.85' },
  { loc: '/pompe-a-chaleur/tertiaire',     changefreq: 'monthly', priority: '0.85' },
  { loc: '/destratification',             changefreq: 'weekly',  priority: '0.95' },
  { loc: '/destratification/tertiaire',   changefreq: 'monthly', priority: '0.85' },
  { loc: '/destratification/industriel',  changefreq: 'monthly', priority: '0.85' },
  { loc: '/equilibrage-hydraulique',       changefreq: 'weekly',  priority: '0.90' },
  { loc: '/cee',                           changefreq: 'monthly', priority: '0.80' },
  { loc: '/secteurs-activite',             changefreq: 'weekly',  priority: '0.80' },
  { loc: '/services-accompagnement',       changefreq: 'weekly',  priority: '0.80' },
  { loc: '/realisations',                  changefreq: 'weekly',  priority: '0.70' },
  { loc: '/ressources',                    changefreq: 'weekly',  priority: '0.60' },
  { loc: '/blog',                          changefreq: 'daily',   priority: '0.70' },
  { loc: '/contact',                       changefreq: 'monthly', priority: '0.60' },
  { loc: '/a-propos',                      changefreq: 'monthly', priority: '0.50' },
  { loc: '/mentions-legales',              changefreq: 'yearly',  priority: '0.20' },
  { loc: '/cgv',                           changefreq: 'yearly',  priority: '0.20' },
  { loc: '/politique-confidentialite',     changefreq: 'yearly',  priority: '0.20' },
];

// ─── Fetch articles Airtable ─────────────────────────────────────────────────

async function fetchBlogArticles() {
  if (!TOKEN || !BASE_ID) {
    console.warn('[sitemap] AIRTABLE_BLOG_TOKEN / VITE_AIRTABLE_TOKEN non défini — articles ignorés.');
    return [];
  }

  const filter = encodeURIComponent(`{Status}="Published"`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(BLOG_TABLE)}` +
              `?filterByFormula=${filter}&fields%5B%5D=Slug&fields%5B%5D=PublishedAt`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!res.ok) {
      console.error('[sitemap] Airtable réponse:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const articles = (data.records || [])
      .filter(r => r.fields?.Slug)
      .map(r => ({
        slug:        r.fields.Slug,
        publishedAt: r.fields.PublishedAt || null,
      }));

    console.log(`[sitemap] ${articles.length} article(s) trouvé(s) dans Airtable.`);
    return articles;

  } catch (err) {
    console.error('[sitemap] Erreur réseau Airtable:', err.message);
    return [];
  }
}

async function fetchRealisations() {
  if (!TOKEN || !BASE_ID) {
    console.warn('[sitemap] Token / base manquants — réalisations ignorées.');
    return [];
  }

  const filter = encodeURIComponent(`{Status}="Published"`);
  const url =
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(REALISATIONS_TABLE)}` +
    `?filterByFormula=${filter}&fields%5B%5D=Slug&fields%5B%5D=PublishedAt`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!res.ok) {
      console.error('[sitemap] Airtable réalisations:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const rows = (data.records || [])
      .filter((r) => r.fields?.Slug)
      .map((r) => ({
        slug: r.fields.Slug,
        publishedAt: r.fields.PublishedAt || null,
      }));

    console.log(`[sitemap] ${rows.length} réalisation(s) trouvée(s) dans Airtable.`);
    return rows;
  } catch (err) {
    console.error('[sitemap] Erreur réseau Airtable (réalisations):', err.message);
    return [];
  }
}

// ─── Génération XML ───────────────────────────────────────────────────────────

function escapeXml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function buildXml(urls) {
  const entries = urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[sitemap] Génération du sitemap…');

  const today    = new Date().toISOString().split('T')[0];
  const [articles, realisations] = await Promise.all([
    fetchBlogArticles(),
    fetchRealisations(),
  ]);

  const urls = [
    ...STATIC_PAGES.map(p => ({
      loc:        `${SITE_URL}${p.loc}`,
      lastmod:    today,
      changefreq: p.changefreq,
      priority:   p.priority,
    })),
    ...articles.map(a => ({
      loc:        `${SITE_URL}/blog/${a.slug}`,
      lastmod:    a.publishedAt ? a.publishedAt.split('T')[0] : today,
      changefreq: 'monthly',
      priority:   '0.65',
    })),
    ...realisations.map((r) => ({
      loc:        `${SITE_URL}/realisations/${r.slug}`,
      lastmod:    r.publishedAt ? r.publishedAt.split('T')[0] : today,
      changefreq: 'monthly',
      priority:   '0.68',
    })),
  ];

  const xml     = buildXml(urls);
  const outPath = path.join(ROOT, 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');

  console.log(
    `[sitemap] ✓ ${STATIC_PAGES.length} pages statiques + ${articles.length} articles + ${realisations.length} réalisations`,
  );
  console.log(`[sitemap] ✓ Écrit dans ${outPath}`);
}

main().catch(err => {
  console.error('[sitemap] Erreur fatale:', err);
  process.exit(1);
});
