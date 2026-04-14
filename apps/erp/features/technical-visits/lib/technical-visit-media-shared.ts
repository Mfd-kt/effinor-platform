import {
  LEAD_MEDIA_BUCKET,
  LEAD_MEDIA_MAX_BYTES,
  parseLeadMediaPublicStorageUrl,
  sanitizeFileName,
} from "@/features/leads/lib/lead-media-shared";

/** Même bucket public que les leads (`Lads_fichiers`). */
export const TECHNICAL_VISIT_MEDIA_BUCKET = LEAD_MEDIA_BUCKET;
export const TECHNICAL_VISIT_MEDIA_MAX_BYTES = LEAD_MEDIA_MAX_BYTES;

export type TechnicalVisitMediaKind = "visit_photos" | "report_pdfs" | "sketches";

export const TECHNICAL_VISIT_MEDIA_KINDS: TechnicalVisitMediaKind[] = [
  "visit_photos",
  "report_pdfs",
  "sketches",
];

export function isTechnicalVisitMediaKind(v: string): v is TechnicalVisitMediaKind {
  return TECHNICAL_VISIT_MEDIA_KINDS.includes(v as TechnicalVisitMediaKind);
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

function defaultExtensionForKind(kind: TechnicalVisitMediaKind): string {
  if (kind === "report_pdfs") return ".pdf";
  return ".jpg";
}

export function buildTechnicalVisitMediaObjectFileName(
  visitId: string,
  kind: TechnicalVisitMediaKind,
  originalFileName: string,
  uniqueSuffix: string,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const typeSlug =
    kind === "visit_photos" ? "photo-visite" : kind === "report_pdfs" ? "rapport-pdf" : "croquis";
  const ext = extensionFromOriginalName(originalFileName) || defaultExtensionForKind(kind);
  const raw = `Effinor_${date}_vt-${visitId}_${typeSlug}_${uniqueSuffix}${ext}`;
  return sanitizeFileName(raw);
}

export { parseLeadMediaPublicStorageUrl as parseTechnicalVisitMediaPublicStorageUrl };

export function storagePathFromTechnicalVisitMediaPublicUrl(url: string): string | null {
  return parseLeadMediaPublicStorageUrl(url)?.objectPath ?? null;
}
