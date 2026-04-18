import type { LeadGenerationPreparedStockRow } from "../domain/prepared-row";
import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import { normalizeCompanyNameForMatching } from "../dedup/normalize-company-name-for-matching";
import { normalizeCompanyNameForDedup, trimCollapseCompanyName } from "./normalize-company-name";
import { normalizeDomain } from "./normalize-domain";
import { normalizeEmail } from "./normalize-email";
import { normalizePhone, stripPhoneDisplayNoise } from "./normalize-phone";
import { normalizePostalCodeForStock } from "./normalize-postal-code-for-stock";
import { normalizeSiret } from "./normalize-siret";

function clampSourceSignal(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Construit une fiche enrichie (champs normalisés + statuts de présence).
 * `target_score` est initialisé depuis `source_signal_score` quand présent (priorisation stock).
 */
export function prepareLeadGenerationStockRow(
  raw: LeadGenerationRawStockInput,
): LeadGenerationPreparedStockRow {
  const company_name = trimCollapseCompanyName(raw.company_name);
  const normalized_company_name = normalizeCompanyNameForDedup(raw.company_name);
  const matching_company_key = normalizeCompanyNameForMatching(raw.company_name);

  const phone = stripPhoneDisplayNoise(raw.phone);
  const normalized_phone = normalizePhone(raw.phone);

  const emailTrimmed = raw.email?.trim() || null;
  const email = emailTrimmed ? emailTrimmed.toLowerCase() : null;
  const normalized_email = normalizeEmail(raw.email);

  const website = raw.website?.trim() ? raw.website.trim() : null;
  const normalized_domain = normalizeDomain(raw.website);

  const normalized_siret = normalizeSiret(raw.siret);
  const siret = normalized_siret;

  const signal = clampSourceSignal(raw.source_signal_score ?? 0);
  const channels = (raw.source_channels ?? []).map((c) => String(c));
  const linkedinUrl = raw.linkedin_url?.trim() || null;
  const dmName = raw.decision_maker_name?.trim() || null;
  const dmRole = raw.decision_maker_role?.trim() || null;
  const hasLi = Boolean(raw.has_linkedin) || Boolean(linkedinUrl);
  const hasDm = raw.has_decision_maker === true || Boolean(dmName);

  return {
    source: raw.source.trim(),
    source_external_id: raw.source_external_id?.trim() || null,
    company_name: company_name || "",
    normalized_company_name,
    matching_company_key,
    phone,
    normalized_phone,
    email,
    normalized_email,
    website,
    normalized_domain,
    address: raw.address?.trim() || null,
    postal_code: normalizePostalCodeForStock(raw.postal_code),
    city: raw.city?.trim() || null,
    category: raw.category?.trim() || null,
    sub_category: raw.sub_category?.trim() || null,
    siret,
    normalized_siret,
    headcount_range: raw.headcount_range?.trim() || null,
    phone_status: normalized_phone ? "found" : "missing",
    email_status: normalized_email ? "found" : "missing",
    website_status: normalized_domain ? "found" : "missing",
    target_score: signal,
    has_linkedin: hasLi,
    has_decision_maker: hasDm,
    source_signal_score: signal,
    source_channels: channels,
    linkedin_url: linkedinUrl,
    decision_maker_name: dmName,
    decision_maker_role: dmRole,
  };
}
