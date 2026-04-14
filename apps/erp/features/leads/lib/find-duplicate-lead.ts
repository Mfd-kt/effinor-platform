import type { SupabaseClient } from "@supabase/supabase-js";

/** Échappe `%` et `_` pour un motif ILIKE « exact ». */
function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function normalizeDigits(s: string): string {
  return s.replace(/\D/g, "");
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
  reason: "company" | "email" | "phone";
};

/**
 * Détecte un lead actif déjà présent : même e-mail, même téléphone (normalisé) ou même raison sociale (sans tenir compte de la casse).
 */
export async function findDuplicateLead(
  supabase: SupabaseClient,
  input: {
    company_name: string;
    email?: string | null;
    phone?: string | null;
  },
): Promise<DuplicateLeadMatch | null> {
  const company = input.company_name.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();

  if (!company && !email && !phone) {
    return null;
  }

  if (email) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .is("deleted_at", null)
      .ilike("email", escapeIlike(email))
      .limit(1);
    const row = data?.[0];
    if (row?.id) {
      return { id: row.id, reason: "email" };
    }
  }

  if (company) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .is("deleted_at", null)
      .ilike("company_name", escapeIlike(company))
      .limit(1);
    const row = data?.[0];
    if (row?.id) {
      return { id: row.id, reason: "company" };
    }
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
