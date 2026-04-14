/**
 * Client Airtable — Réalisations (cas clients / chantiers).
 *
 * Table (VITE_AIRTABLE_REALISATIONS_TABLE, défaut : Realisations) :
 *   Title, Slug, Excerpt, Content, CoverImage, Gallery, Category, Status, PublishedAt,
 *   ClientType, Sector, City, Surface, Problem, Solution, Results, KeyFigures (JSON),
 *   SeoTitle, MetaDescription, Keywords,
 *   CTA_Title, CTA_Description, CTA_Button_Label, CTA_Button_Link
 *   CoverImageAlt (optionnel, même logique que le blog)
 *
 * Status attendu pour publication : Published (comme le blog).
 */

import {
  normalizeBlogCoverFromAirtableFields,
  normalizeAirtableGalleryField,
  getBestBlogImageUrl,
  hasUsableImage,
} from '@/lib/blogImages';

const TOKEN          = import.meta.env.VITE_AIRTABLE_TOKEN;
const BASE_ID        = import.meta.env.VITE_AIRTABLE_BASE_ID;
const REALISATIONS_TABLE =
  import.meta.env.VITE_AIRTABLE_REALISATIONS_TABLE || 'Realisations';

const API_BASE = `https://api.airtable.com/v0/${BASE_ID}`;

function parseKeyFigures(raw) {
  if (raw == null || raw === '') return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && item.label != null && item.value != null)
      .map((item) => ({
        label: String(item.label).trim(),
        value: String(item.value).trim(),
      }))
      .filter((item) => item.label && item.value);
  } catch {
    return [];
  }
}

function resolveCoverWithGalleryFallback(f, title, category) {
  let coverImage = normalizeBlogCoverFromAirtableFields(f, { title, category });
  const galleryRaw = f.Gallery ?? f.GalleryImages ?? f.Images ?? null;
  let galleryImages = normalizeAirtableGalleryField(galleryRaw, { title, category });

  if (!hasUsableImage(coverImage) && galleryImages.length > 0) {
    coverImage = { ...galleryImages[0] };
    galleryImages = galleryImages.slice(1);
  }

  return { coverImage, galleryImages };
}

function transformRecord(record) {
  const f       = record.fields || {};
  const title   = f.Title || '';
  const category = f.Category || null;
  const { coverImage, galleryImages } = resolveCoverWithGalleryFallback(f, title, category);

  const content = f.Content || '';

  return {
    id:               record.id,
    title,
    slug:             f.Slug || '',
    excerpt:          f.Excerpt || '',
    content,
    coverImage,
    galleryImages,
    cover_image_url:  getBestBlogImageUrl(coverImage, 'og'),
    category,
    status:           f.Status || 'Draft',
    published_at:     f.PublishedAt || null,
    client_type:      f.ClientType || null,
    sector:           f.Sector || null,
    city:             f.City || null,
    surface:          f.Surface != null && f.Surface !== '' ? String(f.Surface) : null,
    problem:          f.Problem || null,
    solution:         f.Solution || null,
    results:          f.Results || null,
    key_figures:      parseKeyFigures(f.KeyFigures),
    seo_title:        f.SeoTitle || title,
    seo_description:  f.MetaDescription || f.Excerpt || '',
    keywords:         f.Keywords
      ? String(f.Keywords)
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [],
    cta: {
      title:        f.CTA_Title || null,
      description:  f.CTA_Description || null,
      button_label: f.CTA_Button_Label || null,
      button_link:  f.CTA_Button_Link || '/contact',
    },
  };
}

async function fetchAirtable(params = '') {
  if (!TOKEN || !BASE_ID) {
    console.warn('[Réalisations] VITE_AIRTABLE_TOKEN ou VITE_AIRTABLE_BASE_ID manquants.');
    return { records: [] };
  }

  const url = `${API_BASE}/${encodeURIComponent(REALISATIONS_TABLE)}${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable réalisations ${res.status}: ${err}`);
  }

  return res.json();
}

export async function getRealisations() {
  try {
    const filter = encodeURIComponent(`{Status}="Published"`);
    const data   = await fetchAirtable(
      `?filterByFormula=${filter}&sort%5B0%5D%5Bfield%5D=PublishedAt&sort%5B0%5D%5Bdirection%5D=desc`,
    );

    return (data.records || [])
      .map(transformRecord)
      .filter((r) => r.slug && r.title);
  } catch (err) {
    console.error('[Réalisations] getRealisations:', err);
    return [];
  }
}

export async function getRealisationBySlug(slug) {
  if (!slug) return null;
  try {
    const esc = slug.replace(/"/g, '\\"');
    const filter = encodeURIComponent(`AND({Status}="Published",{Slug}="${esc}")`);
    const data   = await fetchAirtable(`?filterByFormula=${filter}&maxRecords=1`);
    const recs   = data.records || [];
    if (!recs.length) return null;
    return transformRecord(recs[0]);
  } catch (err) {
    console.error('[Réalisations] getRealisationBySlug:', err);
    return null;
  }
}

export async function getRealisationCategories() {
  const posts = await getRealisations();
  return [...new Set(posts.map((p) => p.category).filter(Boolean))].sort();
}

export async function getRealisationSectors() {
  const posts = await getRealisations();
  return [...new Set(posts.map((p) => p.sector).filter(Boolean))].sort();
}

/**
 * Réalisations liées : même catégorie d’abord, puis complément.
 */
export async function getRelatedRealisations(currentSlug, category = null, limit = 3) {
  try {
    const all = await getRealisations();
    const others = all.filter((p) => p.slug !== currentSlug);
    const sameCat = category ? others.filter((p) => p.category === category) : [];
    const otherCat = others.filter((p) => !category || p.category !== category);
    return [...sameCat, ...otherCat].slice(0, limit);
  } catch (err) {
    console.error('[Réalisations] getRelatedRealisations:', err);
    return [];
  }
}
