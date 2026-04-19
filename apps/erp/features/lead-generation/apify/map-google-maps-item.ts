import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import { combinedSourceSignalScore } from "../lib/source-signal-score";

export type MappedApifyStockRow =
  | { ok: true; row: LeadGenerationRawStockInput }
  | { ok: false; reason: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c.trim();
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
  }
  return null;
}

function pickEmail(item: Record<string, unknown>): string | null {
  const direct = pickString(item.email);
  if (direct) return direct;
  const emails = item.emails;
  if (Array.isArray(emails)) {
    for (const e of emails) {
      if (typeof e === "string" && e.trim()) return e.trim();
      if (isRecord(e)) {
        const s = pickString(e.email, e.value);
        if (s) return s;
      }
    }
  }
  return null;
}

function pickPhone(item: Record<string, unknown>): string | null {
  return pickString(
    item.phone,
    item.phoneNumber,
    item.phoneUnformatted,
    item.phoneNumberUnformatted,
    item.internationalPhoneNumber,
    item.mobile,
  );
}

function pickWebsite(item: Record<string, unknown>): string | null {
  return pickString(item.website, item.url, item.domain);
}

function pickCategory(item: Record<string, unknown>): string | null {
  const c = pickString(item.categoryName, item.category, item.mainCategory);
  if (c) return c;
  const cats = item.categories;
  if (Array.isArray(cats) && cats.length > 0) {
    const first = cats[0];
    if (typeof first === "string") return first;
    if (isRecord(first)) return pickString(first.name, first.title);
  }
  return null;
}

function pickSubCategory(item: Record<string, unknown>): string | null {
  const cats = item.categories;
  if (Array.isArray(cats) && cats.length > 1) {
    const second = cats[1];
    if (typeof second === "string") return second;
    if (isRecord(second)) return pickString(second.name, second.title);
  }
  return pickString(item.subCategory, item.subcategory, item.secondaryCategory);
}

function pickSiret(item: Record<string, unknown>): string | null {
  return pickString(item.siret, item.siretNumber, item.registrationNumber);
}

function pickExternalId(item: Record<string, unknown>): string | null {
  return pickString(item.placeId, item.place_id, item.placeid, item.cid, item.locationId, item.id);
}

/**
 * Mappe un item brut du dataset Google Maps (Apify) vers une ligne d’ingestion.
 * Variantes de champs tolérées ; aucune donnée inventée.
 */
export function mapGoogleMapsApifyItem(item: unknown, _lineIndex: number): MappedApifyStockRow {
  if (!isRecord(item)) {
    return { ok: false, reason: "item_non_objet" };
  }

  const company_name = pickString(
    item.title,
    item.name,
    item.placeName,
    item.placeTitle,
    item.businessName,
  );
  if (!company_name) {
    return { ok: false, reason: "sans_nom" };
  }

  const row: LeadGenerationRawStockInput = {
    source: "apify_google_maps",
    source_channels: ["google_maps"],
    source_signal_score: combinedSourceSignalScore(["google_maps"]),
    source_external_id: pickExternalId(item),
    company_name,
    phone: pickPhone(item),
    email: pickEmail(item),
    website: pickWebsite(item),
    address: pickString(item.address, item.fullAddress, item.street),
    postal_code: pickString(item.postalCode, item.zipCode, item.postcode),
    city: pickString(item.city, item.cityName, item.locality),
    category: pickCategory(item),
    sub_category: pickSubCategory(item),
    siret: pickSiret(item),
    extra_payload: {
      apify_google_maps_item: item,
    },
  };

  return { ok: true, row };
}
