import type { LeadRow } from "@/features/leads/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Doublon probable : même raison sociale (exacte après trim) + même email OU même téléphone.
 * Si email et téléphone sont absents, pas de détection heuristique (création autorisée).
 */
export async function findProbableDuplicateBeneficiaryId(
  supabase: SupabaseClient,
  lead: LeadRow,
): Promise<string | null> {
  const company = lead.company_name.trim();
  const email = lead.email?.trim();
  const phone = lead.phone?.trim();

  if (!company) {
    return null;
  }

  if (email) {
    const { data } = await supabase
      .from("beneficiaries")
      .select("id")
      .is("deleted_at", null)
      .eq("company_name", company)
      .eq("email", email)
      .maybeSingle();
    if (data?.id) {
      return data.id;
    }
  }

  if (phone) {
    const { data } = await supabase
      .from("beneficiaries")
      .select("id")
      .is("deleted_at", null)
      .eq("company_name", company)
      .eq("phone", phone)
      .maybeSingle();
    if (data?.id) {
      return data.id;
    }
  }

  return null;
}
