import type { SupabaseClient } from "@supabase/supabase-js";

/** Échappe `%` et `_` pour un motif ILIKE « exact ». */
function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function normalizeDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/** SIRET canonique : 14 chiffres, espaces retirés (aligné LeadB2BInsertSchema). */
function collectValidNormalizedSirets(...raw: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const r of raw) {
    const n = (r ?? "").replace(/\s/g, "");
    if (/^\d{14}$/.test(n)) {
      set.add(n);
    }
  }
  return [...set];
}

/** Variantes courantes (FR) pour matcher le téléphone stocké différemment. */
function phoneSearchVariants(phone: string | null | undefined): string[] {
  const t = phone?.trim();
  if (!t) {
    return [];
  }
  const d = normalizeDigits(t);
  const variants = new Set<string>([t]);
  if (d) {
    variants.add(d);
  }
  if (d.length === 10 && d.startsWith("0")) {
    variants.add(`+33${d.slice(1)}`);
    variants.add(`33${d.slice(1)}`);
  }
  if (d.length === 11 && d.startsWith("33")) {
    variants.add(`+${d}`);
    variants.add(`0${d.slice(2)}`);
  }
  return [...variants];
}

export type DuplicateLeadMatch = {
  id: string;
  reason: "company" | "email" | "phone" | "siret";
};

async function findActiveLeadIdByB2BSiret(
  supabase: SupabaseClient,
  sirets: string[],
): Promise<string | null> {
  if (sirets.length === 0) {
    return null;
  }

  const orParts = sirets.flatMap((s) => [
    `siret.eq.${s}`,
    `head_office_siret.eq.${s}`,
    `worksite_siret.eq.${s}`,
  ]);

  const { data: b2bRows, error } = await supabase
    .from("leads_b2b")
    .select("lead_id")
    .or(orParts.join(","))
    .is("archived_at", null)
    .limit(50);

  if (error || !b2bRows?.length) {
    return null;
  }

  const leadIds = [...new Set(b2bRows.map((r) => r.lead_id))];
  const { data: activeLeads } = await supabase
    .from("leads")
    .select("id")
    .in("id", leadIds)
    .is("deleted_at", null)
    .limit(1);

  return activeLeads?.[0]?.id ?? null;
}

/**
 * Détecte un lead actif déjà présent : même e-mail, même téléphone (normalisé), même raison sociale (sans tenir compte de la casse), ou même SIRET sur une extension `leads_b2b` active.
 */
export async function findDuplicateLead(
  supabase: SupabaseClient,
  input: {
    company_name: string;
    email?: string | null;
    phone?: string | null;
    siret?: string | null;
    head_office_siret?: string | null;
    worksite_siret?: string | null;
  },
): Promise<DuplicateLeadMatch | null> {
  const company = input.company_name.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const normalizedSirets = collectValidNormalizedSirets(
    input.siret,
    input.head_office_siret,
    input.worksite_siret,
  );

  if (!company && !email && !phone && normalizedSirets.length === 0) {
    return null;
  }

  const [emailId, companyId, siretId] = await Promise.all([
    (async (): Promise<string | null> => {
      if (!email) return null;
      const { data } = await supabase
        .from("leads")
        .select("id")
        .is("deleted_at", null)
        .ilike("email", escapeIlike(email))
        .limit(1);
      return data?.[0]?.id ?? null;
    })(),
    (async (): Promise<string | null> => {
      if (!company) return null;
      const { data } = await supabase
        .from("leads")
        .select("id")
        .is("deleted_at", null)
        .ilike("company_name", escapeIlike(company))
        .limit(1);
      return data?.[0]?.id ?? null;
    })(),
    (async (): Promise<string | null> => {
      if (normalizedSirets.length === 0) return null;
      return findActiveLeadIdByB2BSiret(supabase, normalizedSirets);
    })(),
  ]);

  if (emailId) {
    return { id: emailId, reason: "email" };
  }
  if (companyId) {
    return { id: companyId, reason: "company" };
  }
  if (siretId) {
    return { id: siretId, reason: "siret" };
  }

  for (const v of phoneSearchVariants(phone)) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .is("deleted_at", null)
      .eq("phone", v)
      .limit(1);
    const row = data?.[0];
    if (row?.id) {
      return { id: row.id, reason: "phone" };
    }
  }

  const digits = normalizeDigits(phone ?? "");
  if (digits.length >= 8) {
    const { data: rows } = await supabase
      .from("leads")
      .select("id, phone")
      .is("deleted_at", null)
      .not("phone", "is", null)
      .limit(2000);

    for (const row of rows ?? []) {
      if (row.phone && normalizeDigits(row.phone) === digits) {
        return { id: row.id, reason: "phone" };
      }
    }
  }

  return null;
}
