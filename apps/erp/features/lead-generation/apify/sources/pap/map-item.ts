import { PAP_SOURCE_CODE } from "./config";
import { papItemSchema, type PapItem } from "./actor-output";
import { computeClimateZone, type ClimateZone } from "./compute-climate-zone";
import { normalizePhone } from "@/features/lead-generation/lib/normalize-phone";

// =============================================================================
// CIBLE CEE — Critères élargis pour maximiser le volume.
// Modifier ces constantes pour changer le ciblage de l'import.
// Toute annonce hors cible est rejetée à l'ingestion (cf. `mapPapItem`).
// =============================================================================

/** Zones climatiques cibles : toute la France. */
const TARGET_ZONES: readonly ClimateZone[] = ["H1", "H2", "H3"];

/** DPE éligibles : B à G (toutes classes rénovables ; A exclu = neuf performant). */
const ELIGIBLE_DPE: readonly string[] = ["b", "c", "d", "e", "f", "g"];

/** Surface habitable (m²) — fenêtre large pour inclure les grandes maisons. */
const MIN_SURFACE_M2 = 90;
const MAX_SURFACE_M2 = 250;

/** Bornes de prix affiché (€) — élargi 100 k € → 1 M € pour couvrir IDF. */
const MIN_PRICE_EUR = 100_000;
const MAX_PRICE_EUR = 1_000_000;

/** Nombre max de lignes rejetées stockées dans `metadata_json` pour inspection UI. */
export const PAP_REJECT_INSPECT_LIMIT = 500;

export type PapRejectInspectEntry = {
  stage: "zod" | "cee_filter";
  external_id: string | null;
  url: string | null;
  titre: string | null;
  reason: string;
};

// =============================================================================

/**
 * Format "stock row" prêt à être inséré dans `lead_generation_stock`.
 * Aligné sur le schéma de `LbcImmobilierStockRow` pour rester compatible
 * avec le pipeline existant (qualification, dispatch, conversion).
 */
/** Type d'annonce immobilière (vente ou location). */
export type ListingKind = "sale" | "rental";

export type PapStockRow = {
  source_external_id: string;
  source: typeof PAP_SOURCE_CODE;
  source_url: string | null;
  title: string | null;
  /** PAP = particuliers uniquement → company_name = libellé local utile pour l'UI. */
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
  price_eur: number | null;
  published_at: string | null;
  /** "sale" (vente) ou "rental" (location) — détecté depuis l'URL PAP. */
  listing_kind: ListingKind | null;
  raw_payload: Record<string, unknown>;
};

/**
 * Détecte vente/location depuis une URL PAP.
 * - `/annonce/vente-…` → `sale`
 * - `/annonce/location-…` → `rental`
 * - Autre / null → `null`
 */
export function detectListingKind(url: string | null | undefined): ListingKind | null {
  if (!url) return null;
  if (/\/annonce\/location-/i.test(url)) return "rental";
  if (/\/annonce\/vente-/i.test(url)) return "sale";
  return null;
}

/**
 * Normalise un numéro de téléphone FR au format E.164 (+33...).
 * Tolère les espaces, tirets, points, parenthèses et préfixes internationaux.
 */
export function normalizePhoneFr(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.startsWith("33") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+33${digits.slice(1)}`;
  if (digits.length === 9) return `+33${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Parse un prix au format français PAP : "510.000 €" → 510000.
 * Le séparateur de milliers est le point ; on accepte aussi l'espace
 * insécable et les centimes (virgule). Retourne null si non parsable.
 */
export function parsePrixEur(prix: string | null | undefined): number | null {
  if (!prix) return null;
  // Supprimer tout sauf chiffres, point, virgule et tirets (cas "510.000 - 520.000")
  const firstSegment = prix.split(/[-—–]/)[0] ?? prix;
  const cleaned = firstSegment.replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;
  // PAP utilise le point comme séparateur de milliers et la virgule pour les centimes.
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
}

/**
 * Extrait la surface en m² depuis le champ `caracteristiques` (texte libre).
 * Exemple : "Maison 5 pièces · 120 m² · jardin" → 120.
 */
export function extractSurfaceM2(carac: string | null | undefined): number | null {
  if (!carac) return null;
  const match = carac.match(/(\d{1,5})\s*m²/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Dictionnaire mois français → numéro 0-indexé (Date.UTC). */
const FR_MONTHS: Record<string, number> = {
  janvier: 0,
  février: 1,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
  decembre: 11,
};

/**
 * Convertit une date française "31 janvier 2026" en ISO 8601 (UTC).
 * Retourne null si non parsable. Tolère "1er janvier 2026".
 */
export function parseDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const trimmed = date.trim().toLowerCase().replace(/^le\s+/, "");
  const match = trimmed.match(/^(\d{1,2})\s*(?:er)?\s+([a-zûéèêà]+)\s+(\d{4})/i);
  if (!match) return null;
  const day = Number(match[1]);
  const monthName = match[2].normalize("NFC");
  const year = Number(match[3]);
  const month = FR_MONTHS[monthName];
  if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  const ts = Date.UTC(year, month, day);
  return new Date(ts).toISOString();
}

/**
 * Parse "Le Vésinet (78110)" → { city: "Le Vésinet", postal_code: "78110" }.
 * Accepte aussi un code département seul : "Bordeaux (33)" → "33"
 * (PAP renvoie parfois juste le département). Le calcul de zone climatique
 * n'utilise de toute façon que les 2 premiers chiffres.
 * Tolère l'absence de code postal.
 */
export function parseTitre(titre: string | null | undefined): {
  city: string | null;
  postal_code: string | null;
} {
  if (!titre) return { city: null, postal_code: null };
  const match = titre.match(/^(.*?)\s*\((\d{2,5})\)\s*$/);
  if (match) {
    return { city: match[1].trim() || null, postal_code: match[2] };
  }
  return { city: titre.trim() || null, postal_code: null };
}

/** Mappe le typebien PAP vers la valeur normalisée du stock. */
function mapPropertyType(typebien: string | null | undefined): "house" | "apartment" | string | null {
  if (!typebien) return null;
  const normalized = typebien.toLowerCase();
  if (normalized.includes("maison")) return "house";
  if (normalized.includes("appartement")) return "apartment";
  return normalized;
}

/** Normalise une lettre DPE/GES en majuscule (filtre les valeurs invalides). */
function normalizeEnergyClass(letter: string | null | undefined): string | null {
  if (!letter || typeof letter !== "string") return null;
  const upper = letter.trim().toUpperCase();
  return /^[A-G]$/.test(upper) ? upper : null;
}

/**
 * Erreur typée levée par `mapPapItem` quand une annonce est rejetée
 * (filtre CEE non satisfait ou identifiant manquant).
 *
 * `sync-import.ts` capture ces erreurs pour comptabiliser les rejets sans
 * faire planter le batch entier.
 */
export class PapFilterRejectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PapFilterRejectError";
  }
}

function loosePapQuickRef(raw: unknown): Pick<PapRejectInspectEntry, "external_id" | "url" | "titre"> {
  if (!raw || typeof raw !== "object") return { external_id: null, url: null, titre: null };
  const o = raw as Record<string, unknown>;
  const url = typeof o.url === "string" ? o.url : null;
  const id = o.id;
  const externalId =
    id != null ? String(id) : url ? (url.split("/").pop() ?? null) : null;
  const titre = typeof o.titre === "string" ? o.titre.slice(0, 240) : null;
  return { external_id: externalId, url, titre };
}

function papItemQuickRef(item: PapItem): Pick<PapRejectInspectEntry, "external_id" | "url" | "titre"> {
  const externalId =
    item.id != null ? String(item.id) : item.url ? (item.url.split("/").pop() ?? null) : null;
  return {
    external_id: externalId,
    url: item.url ?? null,
    titre: item.titre ? item.titre.slice(0, 240) : null,
  };
}

/**
 * Mappe un item brut de l'acteur Apify PAP vers une ligne prête pour `lead_generation_stock`.
 *
 * Throw `PapFilterRejectError` si :
 *   - l'item n'a pas d'identifiant (id / url) ;
 *   - la zone climatique n'est pas dans `TARGET_ZONES` ;
 *   - le DPE n'est pas dans `ELIGIBLE_DPE` ;
 *   - la surface est hors `[MIN_SURFACE_M2, MAX_SURFACE_M2]` ;
 *   - le prix est hors `[MIN_PRICE_EUR, MAX_PRICE_EUR]`.
 */
export function mapPapItem(item: PapItem): PapStockRow {
  // 1. Identifiant
  const externalId =
    item.id != null ? String(item.id) : item.url ? item.url.split("/").pop() ?? null : null;
  if (!externalId) {
    throw new PapFilterRejectError("identifiant manquant (id et url absents)");
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
  const prix = parsePrixEur(item.prix);
  const zone = computeClimateZone(finalPostalCode);

  // 3. Filtrage strict CEE
  if (!TARGET_ZONES.includes(zone)) {
    throw new PapFilterRejectError(
      `${externalId} ${finalCity ?? "?"} (${finalPostalCode ?? "?"}) — zone ${zone} hors cible (besoin: ${TARGET_ZONES.join(",")})`,
    );
  }

  if (!dpeLower || !ELIGIBLE_DPE.includes(dpeLower)) {
    throw new PapFilterRejectError(
      `${externalId} ${finalCity ?? "?"} — DPE ${dpe ?? "absent"} non éligible (cible: ${ELIGIBLE_DPE.join(",").toUpperCase()})`,
    );
  }

  if (!surface || surface < MIN_SURFACE_M2 || surface > MAX_SURFACE_M2) {
    throw new PapFilterRejectError(
      `${externalId} ${finalCity ?? "?"} — surface ${surface ?? "?"}m² hors cible (${MIN_SURFACE_M2}-${MAX_SURFACE_M2}m²)`,
    );
  }

  if (!prix || prix < MIN_PRICE_EUR || prix > MAX_PRICE_EUR) {
    throw new PapFilterRejectError(
      `${externalId} ${finalCity ?? "?"} — prix ${prix ?? "?"}€ hors budget (${MIN_PRICE_EUR}-${MAX_PRICE_EUR}€)`,
    );
  }

  // 4. Détection vente / location depuis l'URL PAP
  const listingKind = detectListingKind(item.url);
  const kindLabel = listingKind === "rental" ? "LOCATION" : listingKind === "sale" ? "VENTE" : "??";

  console.log(
    `[map-pap] ✅ ${externalId}: ${finalCity ?? "?"} (${finalPostalCode ?? "?"}) zone ${zone}, ${surface}m², DPE ${dpe}, ${kindLabel}, ${prix}€`,
  );

  // 5. Construction de la ligne stock
  const phoneRaw = item.telephones?.[0] ?? null;
  const phone = normalizePhoneFr(phoneRaw); // E.164 (+33XXXXXXXXX) — colonne `phone`
  const normalizedPhone = normalizePhone(phoneRaw); // Digits nationaux (0XXXXXXXXX) — clé de dédup
  const lat = item.marker?.lat ?? item.latitude ?? null;
  const lng = item.marker?.lng ?? item.longitude ?? null;
  const companyName = `Particulier — ${finalCity ?? "PAP"}`;

  return {
    source_external_id: externalId,
    source: PAP_SOURCE_CODE,
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
    price_eur: prix,
    published_at: parseDate(item.date),
    listing_kind: listingKind,
    raw_payload: {
      ...(item as Record<string, unknown>),
      _climate_zone: zone,
      _listing_kind: listingKind,
    },
  };
}

/**
 * Parcourt le dataset brut Apify : validation Zod puis filtre CEE.
 * Retient un échantillon de rejets pour inspection UI (`metadata_json`).
 */
export function processPapRawDatasetItems(rawItems: unknown[]): {
  rows: PapStockRow[];
  rejectInspect: PapRejectInspectEntry[];
  zodRejected: number;
  filterRejected: number;
} {
  const rows: PapStockRow[] = [];
  const rejectInspect: PapRejectInspectEntry[] = [];
  let zodRejected = 0;
  let filterRejected = 0;

  for (const raw of rawItems) {
    const parsed = papItemSchema.safeParse(raw);
    if (!parsed.success) {
      zodRejected += 1;
      if (rejectInspect.length < PAP_REJECT_INSPECT_LIMIT) {
        rejectInspect.push({
          stage: "zod",
          ...loosePapQuickRef(raw),
          reason: parsed.error.issues.map((i) => i.message).join("; ").slice(0, 400),
        });
      }
      continue;
    }

    try {
      rows.push(mapPapItem(parsed.data));
    } catch (err) {
      filterRejected += 1;
      if (rejectInspect.length < PAP_REJECT_INSPECT_LIMIT) {
        const message = err instanceof Error ? err.message : "raison inconnue";
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

/**
 * Mapping batch sur items déjà conformes au schéma (ex. tests / chemins internes).
 */
export function mapPapItems(items: PapItem[]): {
  rows: PapStockRow[];
  rejected: number;
  rejectionReasons: string[];
} {
  const r = processPapRawDatasetItems(items);
  return {
    rows: r.rows,
    rejected: r.zodRejected + r.filterRejected,
    rejectionReasons: r.rejectInspect.map((e) => e.reason),
  };
}
