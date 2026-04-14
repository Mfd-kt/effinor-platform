/** Doit correspondre exactement au nom du bucket Storage (ex. créé dans le dashboard). */
export const LEAD_MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_LEAD_MEDIA_BUCKET?.trim() || "Lads_fichiers";

export type LeadMediaKind = "aerial" | "cadastral" | "recording" | "study";

export const LEAD_MEDIA_KINDS: LeadMediaKind[] = ["aerial", "cadastral", "recording", "study"];

export const LEAD_MEDIA_MAX_BYTES = 50 * 1024 * 1024;

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
}

/** Extrait l’extension (avec le point), ex. `.png`, ou chaîne vide. */
function extensionFromOriginalName(originalName: string): string {
  const base = originalName.trim().split("?")[0] ?? "";
  const i = base.lastIndexOf(".");
  if (i <= 0 || i === base.length - 1) return "";
  const ext = base.slice(i + 1).toLowerCase();
  if (!/^[a-z0-9]{1,12}$/.test(ext)) return "";
  return `.${ext}`;
}

function defaultExtensionForKind(kind: LeadMediaKind): string {
  if (kind === "recording") return ".mp3";
  return ".jpg";
}

/**
 * Nom d’objet Storage : Effinor_{date}_lead-{uuid}_{type}_{unique}.{ext}
 * Ex. `Effinor_2026-04-01_lead-550e8400-..._parcelle-cadastrale_1712345678901_0.webp`
 */
export function buildLeadMediaObjectFileName(
  leadId: string,
  kind: LeadMediaKind,
  originalFileName: string,
  uniqueSuffix: string,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const typeSlug =
    kind === "aerial"
      ? "photo-aerienne"
      : kind === "cadastral"
        ? "parcelle-cadastrale"
        : kind === "recording"
          ? "enregistrement"
          : "etude-media";
  const ext = extensionFromOriginalName(originalFileName) || defaultExtensionForKind(kind);
  const raw = `Effinor_${date}_lead-${leadId}_${typeSlug}_${uniqueSuffix}${ext}`;
  return sanitizeFileName(raw);
}

/** Parse une URL publique Supabase `/storage/v1/object/public/{bucket}/...`. */
export function parseLeadMediaPublicStorageUrl(url: string): {
  bucket: string;
  objectPath: string;
} | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { bucket: m[1], objectPath: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

/** Extrait le chemin objet dans le bucket depuis une URL publique Supabase. */
export function storagePathFromLeadMediaPublicUrl(url: string): string | null {
  return parseLeadMediaPublicStorageUrl(url)?.objectPath ?? null;
}

export function isLeadMediaKind(v: string): v is LeadMediaKind {
  return LEAD_MEDIA_KINDS.includes(v as LeadMediaKind);
}
