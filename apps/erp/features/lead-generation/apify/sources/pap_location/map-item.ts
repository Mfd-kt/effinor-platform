import { PAP_LOCATION_SOURCE_CODE } from "./config";
import { papLocationItemSchema, type PapLocationItem } from "./actor-output";
import { computeClimateZone, type ClimateZone } from "./compute-climate-zone";

// =============================================================================
// CIBLE CEE — annonces PAP **LOCATION** (loyer mensuel).
// Critères élargis pour maximiser le volume.
// =============================================================================

/** Zones climatiques cibles : toute la France. */
const TARGET_ZONES: readonly ClimateZone[] = ["H1", "H2", "H3"];

/** DPE éligibles : B à G (toutes classes rénovables ; A exclu = neuf performant). */
const ELIGIBLE_DPE: readonly string[] = ["b", "c", "d", "e", "f", "g"];

/** Surface habitable élargie (m²). */
const MIN_SURFACE_M2 = 70;
const MAX_SURFACE_M2 = 200;

/**
 * Bornes de loyer mensuel (€/mois). PAP renvoie le prix au format français
 * "1.250 €" — pour une location c'est un loyer mensuel, pas un prix d'achat.
 */
const MIN_RENT_EUR_PER_MONTH = 500;
const MAX_RENT_EUR_PER_MONTH = 3_500;

/** Nombre max de lignes rejetées stockées dans `metadata_json` pour inspection UI. */
export const PAP_LOCATION_REJECT_INSPECT_LIMIT = 500;

export type PapLocationRejectInspectEntry = {
  stage: "zod" | "cee_filter";
  external_id: string | null;
  url: string | null;
  titre: string | null;
  reason: string;
};

// =============================================================================

/** Réutilise les helpers exportés par la source `pap` (ne pas dupliquer la logique). */
import {
  extractSurfaceM2,
  normalizePhoneFr,
  parseDate,
  parsePrixEur,
  parseTitre,
} from "@/features/lead-generation/apify/sources/pap/map-item";
import { normalizePhone } from "@/features/lead-generation/lib/normalize-phone";

/**
 * Format "stock row" prêt à être inséré dans `lead_generation_stock`.
 * `listing_kind` toujours "rental" pour cette source.
 */
export type PapLocationStockRow = {
  source_external_id: string;
  source: typeof PAP_LOCATION_SOURCE_CODE;
  source_url: string | null;
  title: string | null;
  /** PAP = particuliers uniquement. Pour une location : « Locataire » + ville. */
  company_name: string;
  contact_name: string | null;
  is_professional: false;
  siret: null;
  phone: string | null;
  /** Téléphone normalisé (digits, format national 0XXXXXXXXX) — clé de dédup. */
  normalized_phone: string | null;
  email: null;
  address: null;
  city: string | null;
  postal_code: string | null;
  department_name: null;
  region_name: null;
  latitude: number | null;
  longitude: number | null;
  property_type: "house" | "apartment" | string | null;
  surface_m2: number | null;
  land_surface_m2: null;
  rooms: number | null;
  bedrooms: number | null;
  dpe_class: string | null;
  ges_class: string | null;
  /** Pour une location : c’est le loyer mensuel (€/mois). */
  price_eur: number | null;
  published_at: string | null;
  listing_kind: "rental";
  raw_payload: Record<string, unknown>;
};

function mapPropertyType(typebien: string | null | undefined): "house" | "apartment" | string | null {
  if (!typebien) return null;
  const normalized = typebien.toLowerCase();
  if (normalized.includes("maison")) return "house";
  if (normalized.includes("appartement")) return "apartment";
  return normalized;
}

function normalizeEnergyClass(letter: string | null | undefined): string | null {
  if (!letter || typeof letter !== "string") return null;
  const upper = letter.trim().toUpperCase();
  return /^[A-G]$/.test(upper) ? upper : null;
}

export class PapLocationFilterRejectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PapLocationFilterRejectError";
  }
}

function loosePapQuickRef(raw: unknown): Pick<PapLocationRejectInspectEntry, "external_id" | "url" | "titre"> {
  if (!raw || typeof raw !== "object") return { external_id: null, url: null, titre: null };
  const o = raw as Record<string, unknown>;
  const url = typeof o.url === "string" ? o.url : null;
  const id = o.id;
  const externalId =
    id != null ? String(id) : url ? (url.split("/").pop() ?? null) : null;
  const titre = typeof o.titre === "string" ? o.titre.slice(0, 240) : null;
  return { external_id: externalId, url, titre };
}

function papItemQuickRef(item: PapLocationItem): Pick<PapLocationRejectInspectEntry, "external_id" | "url" | "titre"> {
  const externalId =
    item.id != null ? String(item.id) : item.url ? (item.url.split("/").pop() ?? null) : null;
  return {
    external_id: externalId,
    url: item.url ?? null,
    titre: item.titre ? item.titre.slice(0, 240) : null,
  };
}

/**
 * Mappe un item brut de l'acteur Apify PAP **location** vers une ligne prête pour `lead_generation_stock`.
 *
 * Throw `PapLocationFilterRejectError` si :
 *   - l'item n'a pas d'identifiant (id / url) ;
 *   - l'URL ne pointe pas vers une location PAP ;
 *   - la zone climatique n'est pas dans `TARGET_ZONES` ;
 *   - le DPE n'est pas dans `ELIGIBLE_DPE` ;
 *   - la surface est hors `[MIN_SURFACE_M2, MAX_SURFACE_M2]` ;
 *   - le loyer est hors `[MIN_RENT_EUR_PER_MONTH, MAX_RENT_EUR_PER_MONTH]`.
 */
export function mapPapLocationItem(item: PapLocationItem): PapLocationStockRow {
  // 1. Identifiant
  const externalId =
    item.id != null ? String(item.id) : item.url ? (item.url.split("/").pop() ?? null) : null;
  if (!externalId) {
    throw new PapLocationFilterRejectError("identifiant manquant (id et url absents)");
  }

  // 1b. Vérifie que c'est bien une URL location (cas où un item de vente serait
  // glissé dans le dataset par erreur)
  if (item.url && !/\/annonce\/location-/i.test(item.url)) {
    throw new PapLocationFilterRejectError(
      `${externalId} — URL non-location détectée (${item.url}) : item ignoré dans la source pap_location.`,
    );
  }

  // 2. Extractions de base
  const { city, postal_code } = parseTitre(item.titre);
  const finalPostalCode = postal_code ?? item.cp ?? null;
  const finalCity = city ?? item.ville ?? null;
  const dpe = normalizeEnergyClass(item.classe_energie?.lettre);
  const dpeLower = dpe ? dpe.toLowerCase() : null;
  const surfaceFromCarac = extractSurfaceM2(item.caracteristiques);
  const surfaceFromField =
    typeof item.surface === "number"
      ? item.surface
      : typeof item.surface === "string"
        ? extractSurfaceM2(item.surface)
        : null;
  const surface = surfaceFromCarac ?? surfaceFromField ?? null;
  const rent = parsePrixEur(item.prix);
  const zone = computeClimateZone(finalPostalCode);

  // 3. Filtrage strict CEE
  if (!TARGET_ZONES.includes(zone)) {
    throw new PapLocationFilterRejectError(
      `${externalId} ${finalCity ?? "?"} (${finalPostalCode ?? "?"}) — zone ${zone} hors cible (besoin: ${TARGET_ZONES.join(",")})`,
    );
  }

  if (!dpeLower || !ELIGIBLE_DPE.includes(dpeLower)) {
    throw new PapLocationFilterRejectError(
      `${externalId} ${finalCity ?? "?"} — DPE ${dpe ?? "absent"} non éligible (cible: ${ELIGIBLE_DPE.join(",").toUpperCase()})`,
    );
  }

  if (!surface || surface < MIN_SURFACE_M2 || surface > MAX_SURFACE_M2) {
    throw new PapLocationFilterRejectError(
      `${externalId} ${finalCity ?? "?"} — surface ${surface ?? "?"}m² hors cible (${MIN_SURFACE_M2}-${MAX_SURFACE_M2}m²)`,
    );
  }

  if (!rent || rent < MIN_RENT_EUR_PER_MONTH || rent > MAX_RENT_EUR_PER_MONTH) {
    throw new PapLocationFilterRejectError(
      `${externalId} ${finalCity ?? "?"} — loyer ${rent ?? "?"}€/mois hors cible (${MIN_RENT_EUR_PER_MONTH}-${MAX_RENT_EUR_PER_MONTH}€/mois)`,
    );
  }

  console.log(
    `[map-pap-location] ✅ ${externalId}: ${finalCity ?? "?"} (${finalPostalCode ?? "?"}) zone ${zone}, ${surface}m², DPE ${dpe}, LOCATION ${rent}€/mois`,
  );

  // 4. Construction de la ligne stock
  const phoneRaw = item.telephones?.[0] ?? null;
  const phone = normalizePhoneFr(phoneRaw); // E.164 (+33…)
  const normalizedPhone = normalizePhone(phoneRaw); // Digits nationaux (0…) pour dédup
  const lat = item.marker?.lat ?? item.latitude ?? null;
  const lng = item.marker?.lng ?? item.longitude ?? null;
  const companyName = `Locataire — ${finalCity ?? "PAP"}`;

  return {
    source_external_id: externalId,
    source: PAP_LOCATION_SOURCE_CODE,
    source_url: item.url ?? null,
    title: item.titre ?? null,
    company_name: companyName,
    contact_name: null,
    is_professional: false,
    siret: null,
    phone,
    normalized_phone: normalizedPhone,
    email: null,
    address: null,
    city: finalCity,
    postal_code: finalPostalCode,
    department_name: null,
    region_name: null,
    latitude: typeof lat === "number" ? lat : null,
    longitude: typeof lng === "number" ? lng : null,
    property_type: mapPropertyType(item.typebien),
    surface_m2: surface,
    land_surface_m2: null,
    rooms: item.nb_pieces ?? null,
    bedrooms: item.nb_chambres_max ?? null,
    dpe_class: dpe,
    ges_class: normalizeEnergyClass(item.classe_ges?.lettre),
    price_eur: rent,
    published_at: parseDate(item.date),
    listing_kind: "rental",
    raw_payload: {
      ...(item as Record<string, unknown>),
      _climate_zone: zone,
      _listing_kind: "rental",
    },
  };
}

/**
 * Parcourt le dataset brut Apify : validation Zod puis filtre CEE location.
 */
export function processPapLocationRawDatasetItems(rawItems: unknown[]): {
  rows: PapLocationStockRow[];
  rejectInspect: PapLocationRejectInspectEntry[];
  zodRejected: number;
  filterRejected: number;
} {
  const rows: PapLocationStockRow[] = [];
  const rejectInspect: PapLocationRejectInspectEntry[] = [];
  let zodRejected = 0;
  let filterRejected = 0;

  for (const raw of rawItems) {
    const parsed = papLocationItemSchema.safeParse(raw);
    if (!parsed.success) {
      zodRejected += 1;
      if (rejectInspect.length < PAP_LOCATION_REJECT_INSPECT_LIMIT) {
        rejectInspect.push({
          stage: "zod",
          ...loosePapQuickRef(raw),
          reason: parsed.error.issues
            .map((i) => i.message)
            .join("; ")
            .slice(0, 400),
        });
      }
      continue;
    }

    try {
      rows.push(mapPapLocationItem(parsed.data));
    } catch (err) {
      filterRejected += 1;
      const message = err instanceof Error ? err.message : "Rejet inconnu";
      if (rejectInspect.length < PAP_LOCATION_REJECT_INSPECT_LIMIT) {
        rejectInspect.push({
          stage: "cee_filter",
          ...papItemQuickRef(parsed.data),
          reason: message.slice(0, 400),
        });
      }
    }
  }

  return { rows, rejectInspect, zodRejected, filterRejected };
}
