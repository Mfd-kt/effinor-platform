import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessBeneficiary } from "@/lib/auth/data-scope";

import type { BeneficiaryRow } from "@/features/beneficiaries/types";

export async function getBeneficiaryById(id: string, access?: AccessContext): Promise<BeneficiaryRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beneficiaries")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger le bénéficiaire : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  if (access?.kind === "authenticated") {
    const ok = await canAccessBeneficiary(supabase, id, access);
    if (!ok) {
      return null;
    }
  }

  return data;
}
