import type { LeadGenerationRawStockInput, LeadGenerationSourceChannel } from "../domain/raw-input";
import { normalizeCompanyNameForMatching } from "../dedup/normalize-company-name-for-matching";
import { normalizePostalCodeForDedup } from "../dedup/normalize-postal-for-dedup";
import { combinedSourceSignalScore } from "./multi-source-source-signal";

function normCity(c: string | null | undefined): string {
  if (c == null || !String(c).trim()) return "";
  return String(c)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Clé de fusion prudente : nom rapproché + ville (+ CP si disponible). */
export function multiSourceMergeKey(row: LeadGenerationRawStockInput): string {
  const name = normalizeCompanyNameForMatching(row.company_name) ?? "";
  const city = normCity(row.city);
  const pc = normalizePostalCodeForDedup(row.postal_code) ?? "";
  return `${name}|${city}|${pc}`;
}

function preferNonEmpty(a: string | null | undefined, b: string | null | undefined): string | null {
  const ta = a?.trim();
  if (ta) return ta;
  const tb = b?.trim();
  return tb || null;
}

function longerNonEmpty(a: string | null | undefined, b: string | null | undefined): string | null {
  const ta = a?.trim() ?? "";
  const tb = b?.trim() ?? "";
  if (tb.length > ta.length) return tb || null;
  return ta || null;
}

/** Fusionne deux couches brutes (ex. fiche stock + ligne Pages Jaunes). */
export function mergeRawStockPair(
  a: LeadGenerationRawStockInput,
  b: LeadGenerationRawStockInput,
): LeadGenerationRawStockInput {
  return {
    source: "apify_multi_source",
    source_external_id: preferNonEmpty(a.source_external_id, b.source_external_id),
    company_name: longerNonEmpty(a.company_name, b.company_name) ?? a.company_name,
    phone: preferNonEmpty(a.phone, b.phone) ?? preferNonEmpty(b.phone, a.phone),
    email: preferNonEmpty(a.email, b.email) ?? preferNonEmpty(b.email, a.email),
    website: preferNonEmpty(a.website, b.website) ?? preferNonEmpty(b.website, a.website),
    address: preferNonEmpty(a.address, b.address) ?? preferNonEmpty(b.address, a.address),
    postal_code: preferNonEmpty(a.postal_code, b.postal_code) ?? preferNonEmpty(b.postal_code, a.postal_code),
    city: preferNonEmpty(a.city, b.city) ?? preferNonEmpty(b.city, a.city),
    category: preferNonEmpty(a.category, b.category) ?? preferNonEmpty(b.category, a.category),
    sub_category: preferNonEmpty(a.sub_category, b.sub_category) ?? preferNonEmpty(b.sub_category, a.sub_category),
    siret: preferNonEmpty(a.siret, b.siret) ?? preferNonEmpty(b.siret, a.siret),
    headcount_range: preferNonEmpty(a.headcount_range, b.headcount_range) ?? preferNonEmpty(b.headcount_range, a.headcount_range),
    decision_maker_name: preferNonEmpty(a.decision_maker_name, b.decision_maker_name) ?? preferNonEmpty(b.decision_maker_name, a.decision_maker_name),
    decision_maker_role: preferNonEmpty(a.decision_maker_role, b.decision_maker_role) ?? preferNonEmpty(b.decision_maker_role, a.decision_maker_role),
    linkedin_url: preferNonEmpty(a.linkedin_url, b.linkedin_url) ?? preferNonEmpty(b.linkedin_url, a.linkedin_url),
    has_linkedin: Boolean(a.has_linkedin || b.has_linkedin || a.linkedin_url || b.linkedin_url),
    extra_payload: {
      ...(typeof a.extra_payload === "object" && a.extra_payload ? a.extra_payload : {}),
      ...(typeof b.extra_payload === "object" && b.extra_payload ? b.extra_payload : {}),
    },
  };
}

type Acc = {
  row: LeadGenerationRawStockInput;
  channels: Set<LeadGenerationSourceChannel>;
};

/**
 * Fusionne Maps + Pages Jaunes par entreprise + ville.
 * Les fiches uniquement Pages Jaunes sont conservées ; idem pour Maps seul si YP vide.
 */
export function mergeMultiSourceRows(
  mapsRows: LeadGenerationRawStockInput[],
  yellowPagesRows: LeadGenerationRawStockInput[],
): LeadGenerationRawStockInput[] {
  const byKey = new Map<string, Acc>();

  for (const row of mapsRows) {
    const key = multiSourceMergeKey(row);
    if (!normalizeCompanyNameForMatching(row.company_name)) continue;
    const cur = byKey.get(key);
    if (!cur) {
      byKey.set(key, { row: { ...row, source_channels: ["google_maps"] }, channels: new Set(["google_maps"]) });
    } else {
      cur.channels.add("google_maps");
      cur.row = mergeRawStockPair(cur.row, row);
    }
  }

  for (const row of yellowPagesRows) {
    const key = multiSourceMergeKey(row);
    if (!normalizeCompanyNameForMatching(row.company_name)) continue;
    const cur = byKey.get(key);
    if (!cur) {
      byKey.set(key, { row: { ...row, source_channels: ["yellow_pages"] }, channels: new Set(["yellow_pages"]) });
    } else {
      cur.channels.add("yellow_pages");
      cur.row = mergeRawStockPair(cur.row, row);
    }
  }

  const out: LeadGenerationRawStockInput[] = [];
  for (const { row, channels } of byKey.values()) {
    const ch = [...channels];
    const source_signal_score = combinedSourceSignalScore(ch);
    const dm = row.decision_maker_name?.trim();
    out.push({
      ...row,
      source: "apify_multi_source",
      source_channels: ch,
      source_signal_score,
      has_decision_maker: Boolean(dm),
      extra_payload: {
        ...(row.extra_payload ?? {}),
        _multi_source_merge: { channels: ch, source_signal_score },
      },
    });
  }
  return out;
}
