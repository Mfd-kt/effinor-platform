import type { DropcontactEnrichmentPostBody } from "./build-dropcontact-request";

function safeCallbackHost(callbackUrl: string): string {
  try {
    return new URL(callbackUrl).host;
  } catch {
    return "(url invalide)";
  }
}

/** Aperçu non sensible pour les logs (pas de téléphone / email complets). */
export function summarizeDropcontactPayloadForLog(body: DropcontactEnrichmentPostBody): Record<string, unknown> {
  return {
    callbackHost: safeCallbackHost(body.custom_callback_url),
    siren: body.siren,
    language: body.language,
    rowCount: body.data.length,
    rows: body.data.map((row) => {
      const r = row as Record<string, unknown>;
      const cf = r.custom_fields;
      const cfObj = cf && typeof cf === "object" && !Array.isArray(cf) ? (cf as Record<string, unknown>) : null;
      const leadId = cfObj?.lead_id != null ? String(cfObj.lead_id) : undefined;
      return {
        company: typeof r.company === "string" ? r.company : undefined,
        hasWebsite: Boolean(r.website),
        hasPhone: Boolean(r.phone),
        leadId,
      };
    }),
  };
}
