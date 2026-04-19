import type { Json } from "../domain/json";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import type { DropcontactEmailEntry, DropcontactEnrichedContact } from "./types";

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function digitsPhone(s: string): string {
  return s.replace(/\D/g, "");
}

function scoreEmailQualification(q: string | undefined): number {
  if (!q) return 0;
  const lower = q.toLowerCase();
  if (lower.includes("nominative") && lower.includes("pro")) return 100;
  if (lower.includes("generic") && lower.includes("pro")) return 70;
  if (lower.includes("catch_all")) return 40;
  if (lower.includes("invalid")) return -100;
  return 30;
}

export function pickBestDropcontactEmail(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }
  let best: { email: string; score: number } | null = null;
  for (const item of raw) {
    const e = item as DropcontactEmailEntry;
    if (!e?.email || typeof e.email !== "string") continue;
    const em = e.email.trim();
    if (!em) continue;
    const sc = scoreEmailQualification(e.qualification);
    if (sc < 0) continue;
    if (!best || sc > best.score) {
      best = { email: em, score: sc };
    }
  }
  return best?.email ?? null;
}

function normalizeWebsite(w: string): string {
  const t = w.trim();
  if (!t) return t;
  return t.includes("://") ? t : `https://${t.replace(/^\/\//, "")}`;
}

export type DropcontactMergeResult = {
  patch: Record<string, unknown>;
  hasUsefulData: boolean;
  /** Réponse brute pour traçabilité (metadata). */
  rawForMetadata: Json;
};

/**
 * Produit les champs SQL à mettre à jour à partir de la première fiche enrichie Dropcontact.
 * Ne crée pas de prénom / nom : uniquement si présents dans la réponse API.
 */
export function mergeDropcontactIntoStock(
  row: LeadGenerationStockRow,
  contactRaw: Record<string, unknown>,
): DropcontactMergeResult {
  const c = contactRaw as unknown as DropcontactEnrichedContact;
  const patch: Record<string, unknown> = {};
  let touched = 0;

  const bestEmail = pickBestDropcontactEmail(c.email);
  if (bestEmail) {
    if (!hasText(row.email)) {
      patch.email = bestEmail;
      patch.email_status = "found";
      touched += 1;
    } else if (
      row.email &&
      row.email.trim().toLowerCase() !== bestEmail.toLowerCase() &&
      !hasText(row.enriched_email)
    ) {
      patch.enriched_email = bestEmail;
      touched += 1;
    }
  }

  const apiPhone = c.phone?.trim() || c.mobile_phone?.trim();
  if (apiPhone) {
    const cur = row.phone?.trim() || "";
    const curD = digitsPhone(cur);
    const apiD = digitsPhone(apiPhone);
    if (!cur || (apiD.length >= 10 && apiD !== curD)) {
      patch.phone = apiPhone;
      patch.phone_status = "found";
      touched += 1;
    }
  }

  const apiWeb = c.website?.trim();
  if (apiWeb) {
    const normalized = normalizeWebsite(apiWeb);
    const cur = row.website?.trim() || "";
    if (!cur || normalized.replace(/^https?:\/\//i, "") !== cur.replace(/^https?:\/\//i, "")) {
      patch.website = normalized;
      patch.website_status = "found";
      const host = normalized.replace(/^https?:\/\//i, "").split("/")[0]?.toLowerCase() ?? null;
      if (host) {
        patch.normalized_domain = host;
      }
      touched += 1;
    }
  }

  const li = c.linkedin?.trim();
  if (li && !hasText(row.linkedin_url)) {
    patch.linkedin_url = li;
    patch.has_linkedin = true;
    touched += 1;
  }

  const siretApi = c.siret?.replace(/\s/g, "") ?? "";
  const siretClean = siretApi.replace(/\D/g, "");
  if (siretClean.length >= 9 && !hasText(row.siret)) {
    patch.siret = siretClean;
    touched += 1;
  }

  const addrParts = [c.siret_address, [c.siret_zip, c.siret_city].filter(Boolean).join(" ")].filter(
    (x) => typeof x === "string" && x.trim().length > 0,
  ) as string[];
  const addrLine = addrParts[0]?.trim();
  if (addrLine && !hasText(row.address)) {
    patch.address = addrLine;
    touched += 1;
  }
  const zip = c.siret_zip?.trim();
  if (zip && !hasText(row.postal_code)) {
    patch.postal_code = zip;
    touched += 1;
  }
  const city = c.siret_city?.trim();
  if (city && !hasText(row.city)) {
    patch.city = city;
    touched += 1;
  }

  const nb = c.nb_employees?.trim();
  if (nb && !hasText(row.headcount_range)) {
    patch.headcount_range = nb;
    touched += 1;
  }

  const fn = c.first_name?.trim();
  const ln = c.last_name?.trim();
  const dmName =
    fn || ln
      ? [fn, ln].filter(Boolean).join(" ").trim()
      : c.full_name?.trim() && !fn && !ln
        ? c.full_name.trim()
        : "";
  if (dmName && !hasText(row.decision_maker_name)) {
    patch.decision_maker_name = dmName;
    patch.has_decision_maker = true;
    patch.decision_maker_source = "dropcontact";
    touched += 1;
  }

  const job = c.job?.trim();
  if (job && !hasText(row.decision_maker_role)) {
    patch.decision_maker_role = job;
    if (!patch.decision_maker_source) {
      patch.decision_maker_source = "dropcontact";
    }
    touched += 1;
  }

  const prevMeta =
    row.enrichment_metadata && typeof row.enrichment_metadata === "object" && !Array.isArray(row.enrichment_metadata)
      ? { ...(row.enrichment_metadata as Record<string, Json>) }
      : {};

  const dropMeta: Record<string, Json> = {
    ...(typeof prevMeta.dropcontact === "object" && prevMeta.dropcontact !== null && !Array.isArray(prevMeta.dropcontact)
      ? (prevMeta.dropcontact as Record<string, Json>)
      : {}),
    last_response_at: new Date().toISOString(),
    company_linkedin: c.company_linkedin?.trim() || null,
    naf5_code: c.naf5_code?.trim() || null,
    naf5_des: c.naf5_des?.trim() || null,
    vat: c.vat?.trim() || null,
    raw: contactRaw as Json,
  };

  prevMeta.dropcontact = dropMeta as Json;

  patch.enrichment_metadata = prevMeta as Json;

  if (touched === 0) {
    return {
      patch: {
        enrichment_metadata: prevMeta as Json,
        enrichment_source: "dropcontact",
        enrichment_status: "failed",
        enrichment_error: "Dropcontact n’a pas trouvé de données exploitables.",
        updated_at: new Date().toISOString(),
      },
      hasUsefulData: false,
      rawForMetadata: contactRaw as Json,
    };
  }

  const nominativePro =
    Array.isArray(c.email) &&
    c.email.some((e) => {
      const q = (e as DropcontactEmailEntry).qualification?.toLowerCase() ?? "";
      return q.includes("nominative") && q.includes("pro");
    });

  patch.enrichment_source = "dropcontact";
  patch.enrichment_confidence = nominativePro ? "high" : bestEmail ? "medium" : "low";
  patch.enrichment_status = "completed";
  patch.enrichment_error = null;
  patch.enriched_at = new Date().toISOString();

  return {
    patch,
    hasUsefulData: true,
    rawForMetadata: contactRaw as Json,
  };
}
