import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import type { MappedApifyStockRow } from "./map-google-maps-item";

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

function formatAddressFromNested(addr: Record<string, unknown>): {
  line: string | null;
  postal: string | null;
  city: string | null;
} {
  const street = pickString(addr.street, addr.streetAddress, addr.line1);
  const postal = pickString(addr.postalCode, addr.zipCode, addr.postcode, addr.cp);
  const city = pickString(addr.city, addr.town, addr.locality);
  const parts = [street, postal && city ? `${postal} ${city}` : postal || city].filter(Boolean);
  const line = parts.length > 0 ? parts.join(", ") : null;
  return { line, postal, city };
}

function pickPhone(item: Record<string, unknown>): string | null {
  return pickString(
    item.telephone,
    item.phone,
    item.phoneNumber,
    item.phoneUnformatted,
    item.tel,
    item.tel_fixe,
    item.telephonePrincipal,
    item.mobile,
  );
}

function pickEmail(item: Record<string, unknown>): string | null {
  const direct = pickString(item.email);
  if (direct) return direct;
  const emails = item.emails;
  if (Array.isArray(emails)) {
    for (const e of emails) {
      if (typeof e === "string" && e.trim()) return e.trim();
    }
  }
  return null;
}

function pickWebsite(item: Record<string, unknown>): string | null {
  const direct = pickString(item.website, item.site_web, item.siteWeb, item.web, item.site);
  if (direct) return direct;
  const u = pickString(item.url);
  if (u && !u.includes("pagesjaunes.fr/pros")) return u;
  return null;
}

function pickBasicInfoNestedName(item: Record<string, unknown>): string | null {
  const bi = item.basicInfo;
  if (!isRecord(bi)) return null;
  const place = bi.place;
  if (isRecord(place)) {
    return pickString(place.name, place.title, place.displayName, place.text);
  }
  return pickString(bi.name, bi.title, bi.denomination);
}

/** Champs plats type `basicInfo_place_*` (export table Apify). */
function pickMemo23FlatBusinessName(item: Record<string, unknown>): string | null {
  return pickString(
    item.basicInfo_place_name,
    item.basicInfo_place_title,
    item.basicInfo_place_displayName,
    item.basicInfo_place_display_name,
  );
}

/**
 * Dernier recours : slug après l’ID dans une URL fiche `/pros/12345-nom-de-l-entreprise`.
 */
function companyNameFromPagesJaunesProsUrl(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  let s = raw.trim();
  try {
    if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
    const u = new URL(s);
    if (!u.hostname.includes("pagesjaunes.fr")) return null;
    const m = u.pathname.match(/\/pros\/[0-9]+-(.+)$/);
    if (!m?.[1]) return null;
    const slug = decodeURIComponent(m[1].replace(/\+/g, " "));
    const words = slug.replace(/-/g, " ").trim();
    return words.length >= 1 ? words : null;
  } catch {
    return null;
  }
}

function splitFrenchAddressLine(line: string | null): {
  line: string | null;
  postal: string | null;
  city: string | null;
} {
  if (!line?.trim()) return { line: null, postal: null, city: null };
  const full = line.trim();
  const m = full.match(/\b(\d{5})\s+([^,]+?)\s*$/);
  if (m) {
    const postal = m[1];
    const city = m[2].trim();
    const addrPart = full.slice(0, m.index).replace(/[,\s]+$/u, "").trim();
    return { line: addrPart || full, postal, city };
  }
  return { line: full, postal: null, city: null };
}

function pickExternalId(item: Record<string, unknown>): string | null {
  const code = pickString(item.code_etablissement, item.codeEtablissement);
  if (code) return code;
  const lid = item.listingId;
  if (typeof lid === "number" && Number.isFinite(lid)) return String(Math.trunc(lid));
  if (typeof lid === "string" && lid.trim()) return lid.trim();
  const fromUrl = pickString(item.url, item.detailUrl, item.profileUrl, item.ficheUrl);
  if (fromUrl) {
    const m = fromUrl.match(/\/pros\/(\d+)/);
    if (m?.[1]) return m[1];
  }
  return pickString(item.id, item.placeId, item.url, item.detailUrl);
}

/**
 * Mappe un item dataset « Pages Jaunes » / annuaire (champs variables selon l’actor).
 */
export function mapYellowPagesApifyItem(item: unknown, _lineIndex: number): MappedApifyStockRow {
  if (!isRecord(item)) {
    return { ok: false, reason: "item_non_objet" };
  }

  const company_name = pickString(
    item.denomination,
    item.enseigne,
    item.raison_sociale,
    item.raisonSociale,
    item.nom_commercial,
    item.title,
    item.name,
    item.companyName,
    item.businessName,
    item.listingTitle,
    pickBasicInfoNestedName(item),
    pickMemo23FlatBusinessName(item),
    companyNameFromPagesJaunesProsUrl(pickString(item.url, item.detailUrl, item.link, item.listingUrl)),
  );
  if (!company_name) {
    return { ok: false, reason: "sans_nom" };
  }

  let address = pickString(
    item.adresse_full_long,
    item.address,
    item.adresse,
    item.street,
    item.fullAddress,
  );
  let postal_code = pickString(
    item.postalCode,
    item.zipCode,
    item.postcode,
    item.cp,
    item.code_postal,
    item.basicInfo_place_postalCode,
    item.basicInfo_place_postal_code,
  );
  let city = pickString(
    item.city,
    item.cityName,
    item.ville,
    item.commune,
    item.town,
    item.locality,
    item.basicInfo_place_city,
  );

  if (address) {
    const split = splitFrenchAddressLine(address);
    if (!postal_code && split.postal) postal_code = split.postal;
    if (!city && split.city) city = split.city;
  }

  const addrObj = item.address;
  if (isRecord(addrObj)) {
    const nested = formatAddressFromNested(addrObj);
    if (!address && nested.line) address = nested.line;
    if (!postal_code && nested.postal) postal_code = nested.postal;
    if (!city && nested.city) city = nested.city;
  }

  const row: LeadGenerationRawStockInput = {
    source: "apify_yellow_pages",
    source_external_id: pickExternalId(item),
    company_name,
    phone: pickPhone(item),
    email: pickEmail(item),
    website: pickWebsite(item),
    address,
    postal_code,
    city,
    category: pickString(item.activite_libelle, item.category, item.activity, item.sector),
    sub_category: pickString(item.subCategory, item.subcategory),
    siret: pickString(item.siret, item.siretNumber),
    decision_maker_name: pickString(item.contactName, item.managerName, item.ownerName),
    decision_maker_role: pickString(item.contactRole, item.jobTitle),
    extra_payload: {
      apify_yellow_pages_item: item,
    },
  };

  return { ok: true, row };
}
