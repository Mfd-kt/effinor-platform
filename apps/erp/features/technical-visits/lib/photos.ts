import type { Json } from "@/types/database.types";

/** Structure stockée en jsonb `technical_visits.photos` (remplace l’ancien tableau plat). */
export type TechnicalVisitPhotosGrouped = {
  visit_photos: string[];
  report_pdfs: string[];
  sketches: string[];
};

export const EMPTY_TECHNICAL_VISIT_PHOTOS: TechnicalVisitPhotosGrouped = {
  visit_photos: [],
  report_pdfs: [],
  sketches: [],
};

function filterUrlStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

/** Ancien format : tableau d’URLs → tout va dans `visit_photos`. */
export function normalizePhotosFromDb(photos: Json | null | undefined): TechnicalVisitPhotosGrouped {
  if (photos == null) {
    return { ...EMPTY_TECHNICAL_VISIT_PHOTOS };
  }
  if (Array.isArray(photos)) {
    return {
      visit_photos: filterUrlStrings(photos),
      report_pdfs: [],
      sketches: [],
    };
  }
  if (typeof photos === "object" && photos !== null) {
    const o = photos as Record<string, unknown>;
    return {
      visit_photos: filterUrlStrings(o.visit_photos),
      report_pdfs: filterUrlStrings(o.report_pdfs),
      sketches: filterUrlStrings(o.sketches),
    };
  }
  return { ...EMPTY_TECHNICAL_VISIT_PHOTOS };
}

/** Pour persistance Supabase (jsonb). */
export function photosGroupedToJson(data: TechnicalVisitPhotosGrouped | undefined): Json {
  const v = data ?? EMPTY_TECHNICAL_VISIT_PHOTOS;
  const clean: TechnicalVisitPhotosGrouped = {
    visit_photos: v.visit_photos.map((s) => s.trim()).filter(Boolean),
    report_pdfs: v.report_pdfs.map((s) => s.trim()).filter(Boolean),
    sketches: v.sketches.map((s) => s.trim()).filter(Boolean),
  };
  return clean as unknown as Json;
}

/** @deprecated Utiliser `normalizePhotosFromDb`. */
export function photosJsonToStrings(photos: Json | null | undefined): string[] {
  return normalizePhotosFromDb(photos).visit_photos;
}

/** @deprecated */
export function photosStringsToText(lines: string[]): string {
  return lines.join("\n");
}

/** @deprecated */
export function photosTextToStrings(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
