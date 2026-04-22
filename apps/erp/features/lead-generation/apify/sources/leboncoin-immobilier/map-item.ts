import type { LeboncoinImmobilierItem } from "./actor-output";

/**
 * Format "stock row" prêt à être inséré dans lead_generation_stock.
 * On restreint aux champs consommés par le pipeline existant.
 */
export type LbcImmobilierStockRow = {
  source_external_id: string; // list_id LBC (unique)
  source: "leboncoin_immobilier";
  source_url: string | null; // URL de l'annonce
  title: string | null;
  company_name: string | null; // seller_name (si pro ou particulier)
  contact_name: string | null; // = company_name si particulier
  is_professional: boolean;
  siret: string | null;
  phone: string | null; // normalisé +33
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  department_name: string | null;
  region_name: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string | null; // "Maison", "Appartement", etc.
  surface_m2: number | null;
  land_surface_m2: number | null;
  rooms: number | null;
  bedrooms: number | null;
  dpe_class: string | null; // A à G
  ges_class: string | null;
  price_eur: number | null; // entier (€), centimes tronqués
  published_at: string | null; // ISO date
  raw_payload: Record<string, unknown>; // Item complet pour debug / future évolution
};

/** Normalise un numéro de téléphone FR au format E.164 (+33...). */
function normalizePhoneFr(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;
  // Cas : +33612345678 → 33612345678
  if (digits.startsWith("33") && digits.length === 11) return `+${digits}`;
  // Cas : 0612345678 → +33612345678
  if (digits.startsWith("0") && digits.length === 10) return `+33${digits.slice(1)}`;
  // Cas : 612345678 (9 chiffres) → +33612345678
  if (digits.length === 9) return `+33${digits}`;
  // Autres formats : retourner tel quel avec + si pas déjà
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/** Convertit un seller_type LBC en bool is_professional. */
function isProSeller(sellerType: string | undefined): boolean {
  return sellerType === "pro";
}

/**
 * Mappe un item brut de l'acteur Apify vers une ligne prête pour lead_generation_stock.
 * Retourne null si l'item n'a pas le minimum vital (list_id).
 */
export function mapLeboncoinImmobilierItem(
  item: LeboncoinImmobilierItem,
): LbcImmobilierStockRow | null {
  const externalId = item.list_id != null ? String(item.list_id) : null;
  if (!externalId) return null;

  const phone = normalizePhoneFr(item.phone);
  const isPro = isProSeller(item.seller_type);

  return {
    source_external_id: externalId,
    source: "leboncoin_immobilier",
    source_url: item.url ?? null,
    title: item.title ?? null,
    company_name: isPro ? item.seller_name ?? null : null,
    contact_name: !isPro ? item.seller_name ?? null : null,
    is_professional: isPro,
    siret: item.seller_siren ?? null,
    phone,
    email: null, // LBC ne fournit pas d'email
    address: null, // LBC ne fournit pas l'adresse exacte (seulement ville)
    city: item.city ?? null,
    postal_code: item.zipcode ?? null,
    department_name: item.department_name ?? null,
    region_name: item.region_name ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    property_type: item.real_estate_type ?? null,
    surface_m2: item.square ?? null,
    land_surface_m2: item.land_square ?? null,
    rooms: item.rooms ?? null,
    bedrooms: item.bedrooms ?? null,
    dpe_class: item.energy_rate ? item.energy_rate.toUpperCase() : null,
    ges_class: item.ges ? item.ges.toUpperCase() : null,
    price_eur: item.price != null ? Math.round(item.price) : null,
    published_at: item.first_publication_date ?? null,
    raw_payload: item as Record<string, unknown>,
  };
}

/** Mapping batch : filtre les items invalides (sans list_id). */
export function mapLeboncoinImmobilierItems(
  items: LeboncoinImmobilierItem[],
): LbcImmobilierStockRow[] {
  return items
    .map((item) => mapLeboncoinImmobilierItem(item))
    .filter((row): row is LbcImmobilierStockRow => row !== null);
}
