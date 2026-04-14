import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Normalisation des visuels blog (Airtable attachments, URL texte, alt SEO).
 *
 * @typedef {Object} NormalizedCoverImage
 * @property {string|null} url
 * @property {string|null} largeUrl
 * @property {string|null} smallUrl
 * @property {string} alt
 * @property {number|null} width
 * @property {number|null} height
 * @property {string|null} filename
 * @property {string|null} mimeType
 */

export const BLOG_COVER_FALLBACK_PATH = '/images/blog-cover-fallback.svg';

/** Chemin public correct même avec `base` Vite non « / » (déploiement sous-dossier). */
export function getBlogCoverFallbackPublicPath() {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}images/blog-cover-fallback.svg`.replace(/\/{2,}/g, '/');
}

const CATEGORY_ALT_PHRASE = {
  PAC: 'Pompe à chaleur en bâtiment tertiaire',
  'pompe à chaleur': 'Pompe à chaleur en bâtiment tertiaire',
  Déstratification: "Déstratification d'un bâtiment professionnel",
  déstratification: "Déstratification d'un bâtiment professionnel",
  destratification: "Déstratification d'un bâtiment professionnel",
  Équilibrage: "Équilibrage hydraulique d'un réseau de chauffage",
  équilibrage: "Équilibrage hydraulique d'un réseau de chauffage",
  equilibrage: "Équilibrage hydraulique d'un réseau de chauffage",
  CEE: 'Certificats CEE et financement des travaux',
  cee: 'Certificats CEE et financement des travaux',
  Général: 'Efficacité énergétique des bâtiments professionnels',
  général: 'Efficacité énergétique des bâtiments professionnels',
};

function safeString(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

/** @returns {NormalizedCoverImage} */
export function buildEmptyCoverImage({ title = '', category = null, explicitAlt = null } = {}) {
  return {
    url: null,
    largeUrl: null,
    smallUrl: null,
    alt: getBlogImageAlt({ title, category, explicitAlt }),
    width: null,
    height: null,
    filename: null,
    mimeType: null,
  };
}

/**
 * Alt SEO : champ explicite Airtable > motif catégorie > titre > défaut marque.
 */
export function getBlogImageAlt({ title = '', category = null, explicitAlt = null }) {
  const ex = safeString(explicitAlt);
  if (ex) return ex;

  const cat = safeString(category);
  if (cat) {
    const phrase = CATEGORY_ALT_PHRASE[cat] || CATEGORY_ALT_PHRASE[cat.toLowerCase()];
    if (phrase) return `${phrase} – Effinor`;
  }

  const t = safeString(title);
  if (t) return `${t} – Effinor`;

  return 'Article Effinor — efficacité énergétique des bâtiments';
}

/** Une URL exploitable pour l'affichage existe-t-elle ? */
export function hasUsableImage(cover) {
  if (!cover || typeof cover !== 'object') return false;
  return Boolean(
    safeString(cover.smallUrl) || safeString(cover.largeUrl) || safeString(cover.url),
  );
}

/**
 * @param {NormalizedCoverImage | null | undefined} cover
 * @param {'listing'|'hero'|'og'} context
 *   - listing : cartes blog & articles liés (zone ~300–800px) → éviter thumbnails.small Airtable (~70px), flou si étiré
 *   - hero / og : pleine largeur article & Open Graph
 */
export function getBestBlogImageUrl(cover, context = 'listing') {
  if (!cover || typeof cover !== 'object') return null;
  const main = safeString(cover.url);
  const large = safeString(cover.largeUrl);
  const small = safeString(cover.smallUrl);

  if (context === 'hero' || context === 'og') {
    return large || main || small || null;
  }
  /* listing : même ordre que hero — large / fichier principal avant tiny thumbnail */
  return large || main || small || null;
}

export function getAbsoluteBlogImageUrl(href, siteOrigin) {
  const u = safeString(href);
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const origin = (siteOrigin || getSiteUrl()).replace(/\/$/, '');
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${origin}${path}`;
}

/**
 * Normalise un attachment Airtable (objet fichier unique).
 * @param {Object} att
 * @returns {NormalizedCoverImage}
 */
export function normalizeAirtableAttachment(att, meta = {}) {
  const { title = '', category = null, explicitAlt = null } = meta;

  if (!att || typeof att !== 'object') {
    return buildEmptyCoverImage({ title, category, explicitAlt });
  }

  const mainUrl = safeString(att.url);
  const largeUrl = safeString(att.thumbnails?.large?.url);
  const smallUrl = safeString(att.thumbnails?.small?.url);

  const url = mainUrl || largeUrl || smallUrl;
  const width = typeof att.width === 'number' && att.width > 0 ? att.width : null;
  const height = typeof att.height === 'number' && att.height > 0 ? att.height : null;
  const filename = safeString(att.filename);
  const mimeType = safeString(att.type);

  return {
    url: mainUrl || url,
    largeUrl: largeUrl || mainUrl || url,
    smallUrl: smallUrl || largeUrl || mainUrl || url,
    alt: getBlogImageAlt({ title, category, explicitAlt }),
    width,
    height,
    filename,
    mimeType,
  };
}

function firstAttachment(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.find((x) => x && typeof x === 'object' && safeString(x.url)) || raw[0] || null;
}

/**
 * Lit les champs Airtable possibles et produit une couverture normalisée.
 * Gère : pièce jointe[], URL texte, objet fichier unique (rare).
 */
/**
 * Galerie Airtable : plusieurs pièces jointes ou une URL texte unique.
 * Chaque entrée a la même forme que la couverture (url / largeUrl / smallUrl / alt).
 */
export function normalizeAirtableGalleryField(raw, meta = {}) {
  const { title = '', category = null } = meta;
  if (raw == null || raw === '') return [];

  if (typeof raw === 'string') {
    const u = raw.trim();
    if (/^https?:\/\//i.test(u)) {
      const alt = title ? `${title} — Galerie Effinor` : 'Réalisation Effinor — galerie';
      return [
        {
          url: u,
          largeUrl: u,
          smallUrl: u,
          alt,
          width: null,
          height: null,
          filename: null,
          mimeType: null,
        },
      ];
    }
    return [];
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .map((att, i) => {
      if (!att || typeof att !== 'object') return null;
      if (!safeString(att.url)) return null;
      const fileAlt = safeString(att.alt) || safeString(att.title);
      const alt =
        fileAlt ||
        (title ? `${title} — Photo ${i + 1}` : `Photo ${i + 1} — Effinor`);
      return normalizeAirtableAttachment(att, { title, category, explicitAlt: alt });
    })
    .filter(Boolean);
}

export function normalizeBlogCoverFromAirtableFields(fields = {}, articleMeta = {}) {
  const { title = '', category = null } = articleMeta;
  const explicitAlt =
    safeString(fields.CoverImageAlt) ||
    safeString(fields.ImageAlt) ||
    safeString(fields.cover_image_alt);

  /* Noms de champs variables (bases FR, espaces, synonymes) */
  const raw =
    fields.CoverImage ??
    fields.cover_image ??
    fields.Cover_Image ??
    fields.Cover ??
    fields.Photo ??
    fields.MainImage ??
    fields.CoverPhoto ??
    fields['Cover image'] ??
    fields['Image de couverture'] ??
    fields['Photo de couverture'];

  if (typeof raw === 'string' && raw.trim()) {
    const u = raw.trim();
    return {
      url: u,
      largeUrl: u,
      smallUrl: u,
      alt: getBlogImageAlt({ title, category, explicitAlt }),
      width: null,
      height: null,
      filename: null,
      mimeType: null,
    };
  }

  if (Array.isArray(raw)) {
    const att = firstAttachment(raw);
    if (!att) {
      return buildEmptyCoverImage({ title, category, explicitAlt });
    }
    return normalizeAirtableAttachment(att, { title, category, explicitAlt });
  }

  if (raw && typeof raw === 'object' && safeString(raw.url)) {
    return normalizeAirtableAttachment(raw, { title, category, explicitAlt });
  }

  return buildEmptyCoverImage({ title, category, explicitAlt });
}
