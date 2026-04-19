import type { LeadGenerationStockRow } from "../domain/stock-row";

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Règle métier stricte : société + site (saisi ou déjà suggéré) pour éviter les appels inutiles.
 */
export function isEligibleForDropcontactEnrichment(
  row: LeadGenerationStockRow,
): { ok: true } | { ok: false; reason: string } {
  if (!hasText(row.company_name)) {
    return { ok: false, reason: "Impossible de lancer l’enrichissement : données insuffisantes." };
  }
  const hasSite = hasText(row.website) || hasText(row.enriched_website);
  if (!hasSite) {
    return { ok: false, reason: "Impossible de lancer l’enrichissement : données insuffisantes." };
  }
  return { ok: true };
}

/**
 * URL complète du webhook, ou base publique + chemin par défaut.
 * Priorité : `DROPCONTACT_WEBHOOK_CALLBACK_URL` (URL finale), sinon `NEXT_PUBLIC_APP_URL` / `APP_URL`, sinon `VERCEL_URL`.
 */
export function resolveDropcontactWebhookCallbackUrl(): string | null {
  const full = process.env.DROPCONTACT_WEBHOOK_CALLBACK_URL?.trim();
  if (full) {
    return full.replace(/\/$/, "");
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (base) {
    return `${base.replace(/\/$/, "")}/api/dropcontact/webhook`;
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}/api/dropcontact/webhook`;
  }
  return null;
}

function buildDataEntry(row: LeadGenerationStockRow): Record<string, unknown> {
  const website =
    (hasText(row.website) ? row.website!.trim() : "") ||
    (hasText(row.enriched_website) ? row.enriched_website!.trim() : "") ||
    "";
  const entry: Record<string, unknown> = {
    company: row.company_name.trim(),
    custom_fields: {
      lead_id: row.id,
      source: "erp_lead_generation",
    },
  };
  if (website) {
    entry.website = website;
  }
  const phone = row.phone?.trim() || row.normalized_phone?.trim();
  if (phone) {
    entry.phone = phone;
  }
  return entry;
}

export type DropcontactEnrichmentPostBody = {
  data: Record<string, unknown>[];
  siren: boolean;
  language: string;
  custom_callback_url: string;
};

export function buildDropcontactEnrichmentPayload(
  row: LeadGenerationStockRow,
): { ok: true; body: DropcontactEnrichmentPostBody } | { ok: false; reason: string } {
  const elig = isEligibleForDropcontactEnrichment(row);
  if (!elig.ok) {
    return { ok: false, reason: elig.reason };
  }
  const callback = resolveDropcontactWebhookCallbackUrl();
  if (!callback) {
    return {
      ok: false,
      reason:
        "Impossible de déterminer l’URL du webhook Dropcontact : renseignez NEXT_PUBLIC_APP_URL (ex. http://localhost:3001) ou DROPCONTACT_WEBHOOK_CALLBACK_URL (URL complète vers /api/dropcontact/webhook). En production, l’URL doit être accessible depuis Internet pour recevoir le résultat.",
    };
  }
  return {
    ok: true,
    body: {
      data: [buildDataEntry(row)],
      siren: true,
      language: "fr",
      custom_callback_url: callback,
    },
  };
}
