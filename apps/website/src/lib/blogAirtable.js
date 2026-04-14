/**
 * Client Airtable pour le blog Effinor.
 *
 * Table Airtable attendue (nom configurable via VITE_AIRTABLE_BLOG_TABLE) :
 *   Title           — Texte court       — Titre de l'article
 *   Slug            — Texte court       — URL slug (ex: pompe-a-chaleur-tertiaire)
 *   Excerpt         — Texte long        — Chapeau / résumé
 *   Content         — Texte long        — Corps de l'article en Markdown
 *   CoverImage      — Pièce jointe (recommandé) ou URL texte — Image principale
 *   CoverImageAlt   — Texte court (facultatif) — Texte alternatif SEO pour la couverture
 *   Category        — Sélection unique  — Ex: PAC | Déstratification | Équilibrage | CEE | Général
 *   Status          — Sélection unique  — Published | Draft
 *   PublishedAt     — Date              — Date de publication
 *   SeoTitle        — Texte court       — Balise <title> SEO (facultatif)
 *   MetaDescription — Texte long        — Meta description SEO (facultatif)
 *   Keywords        — Texte court       — Mots-clés séparés par des virgules
 *   FAQ             — Texte long        — JSON : [{"q":"...","a":"..."}]
 *   CTA_Title       — Texte court       — Titre du bloc CTA (facultatif)
 *   CTA_Description — Texte long        — Description du CTA (facultatif)
 *   CTA_Button_Label— Texte court       — Libellé bouton CTA (facultatif)
 *   CTA_Button_Link — Texte court       — Lien bouton CTA (facultatif, ex: /contact)
 *   Author          — Texte court       — Nom de l'auteur (facultatif)
 *   ReadingTime     — Nombre            — Temps de lecture en minutes (facultatif, auto-calculé si absent)
 */

import { normalizeBlogCoverFromAirtableFields, getBestBlogImageUrl } from '@/lib/blogImages';

const TOKEN      = import.meta.env.VITE_AIRTABLE_TOKEN;
const BASE_ID    = import.meta.env.VITE_AIRTABLE_BASE_ID;
const BLOG_TABLE = import.meta.env.VITE_AIRTABLE_BLOG_TABLE || 'Articles';

const API_BASE = `https://api.airtable.com/v0/${BASE_ID}`;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Nombre de mots estimé → minutes de lecture */
function estimateReadingTime(text = '') {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Parse le champ FAQ (JSON array) de façon défensive */
function parseFAQ(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item) => item && typeof item.q === 'string' && typeof item.a === 'string'
    );
  } catch {
    return null;
  }
}

/** Transforme un enregistrement Airtable brut en article normalisé */
function transformRecord(record) {
  const f = record.fields || {};
  const content = f.Content || '';
  const title = f.Title || '';
  const category = f.Category || null;
  const coverImage = normalizeBlogCoverFromAirtableFields(f, { title, category });
  const cover_image_url = getBestBlogImageUrl(coverImage, 'og');

  return {
    id:              record.id,
    title,
    slug:            f.Slug            || '',
    excerpt:         f.Excerpt         || '',
    content,
    coverImage,
    cover_image_url,
    category:        category,
    status:          f.Status          || 'Draft',
    published_at:    f.PublishedAt     || null,
    seo_title:       f.SeoTitle        || f.Title || '',
    seo_description: f.MetaDescription || f.Excerpt || '',
    keywords:        f.Keywords        ? f.Keywords.split(',').map((k) => k.trim()) : [],
    faq:             parseFAQ(f.FAQ),
    cta: {
      title:        f.CTA_Title        || null,
      description:  f.CTA_Description  || null,
      button_label: f.CTA_Button_Label || null,
      button_link:  f.CTA_Button_Link  || '/contact',
    },
    author:       f.Author       || null,
    reading_time: f.ReadingTime  || estimateReadingTime(content),
    tags:         f.Keywords     ? f.Keywords.split(',').map((k) => k.trim()) : [],
  };
}

/** Appel générique à l'API Airtable */
async function fetchAirtable(params = '') {
  if (!TOKEN || !BASE_ID) {
    console.warn('[Blog] VITE_AIRTABLE_TOKEN ou VITE_AIRTABLE_BASE_ID manquants.');
    return { records: [] };
  }

  const url = `${API_BASE}/${encodeURIComponent(BLOG_TABLE)}${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable blog error ${res.status}: ${err}`);
  }

  return res.json();
}

// ─── API publique ────────────────────────────────────────────────────────────

/**
 * Récupère tous les articles publiés, triés par date décroissante.
 * @returns {Promise<Array>} Liste d'articles normalisés
 */
export async function getBlogPosts() {
  try {
    const filter = encodeURIComponent(`{Status}="Published"`);
    const sort   = encodeURIComponent(JSON.stringify([{ field: 'PublishedAt', direction: 'desc' }]));
    const data   = await fetchAirtable(`?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=PublishedAt&sort%5B0%5D%5Bdirection%5D=desc`);

    return (data.records || [])
      .map(transformRecord)
      .filter((a) => a.slug && a.title);
  } catch (err) {
    console.error('[Blog] getBlogPosts error:', err);
    return [];
  }
}

/**
 * Récupère un article par son slug.
 * @param {string} slug
 * @returns {Promise<Object|null>} Article normalisé ou null
 */
export async function getBlogPostBySlug(slug) {
  try {
    const filter = encodeURIComponent(`AND({Status}="Published",{Slug}="${slug}")`);
    const data   = await fetchAirtable(`?filterByFormula=${filter}&maxRecords=1`);

    const records = data.records || [];
    if (!records.length) return null;

    return transformRecord(records[0]);
  } catch (err) {
    console.error('[Blog] getBlogPostBySlug error:', err);
    return null;
  }
}

/**
 * Récupère les catégories uniques des articles publiés.
 * @returns {Promise<string[]>}
 */
export async function getBlogCategories() {
  const posts = await getBlogPosts();
  const cats  = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  return cats.sort();
}

/**
 * Récupère les articles liés à un article donné (même catégorie, slug différent).
 * @param {string} currentSlug - Slug de l'article courant (à exclure)
 * @param {string|null} category - Catégorie à filtrer (si null, retourne n'importe quelle catégorie)
 * @param {number} limit - Nombre d'articles à retourner
 * @returns {Promise<Array>}
 */
export async function getRelatedPosts(currentSlug, category = null, limit = 3) {
  try {
    const all = await getBlogPosts();
    const filtered = all.filter(
      (p) => p.slug !== currentSlug && (category ? p.category === category : true)
    );
    if (filtered.length < limit && category) {
      const fallback = all.filter((p) => p.slug !== currentSlug && !filtered.includes(p));
      return [...filtered, ...fallback].slice(0, limit);
    }
    return filtered.slice(0, limit);
  } catch (err) {
    console.error('[Blog] getRelatedPosts error:', err);
    return [];
  }
}
